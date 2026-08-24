// スポット単体の更新・削除
// スポットが属する旅の所有者だけが操作できる
import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { getAccess } from "@/lib/access";

type Ctx = { params: Promise<{ spotId: string }> };

const EDITABLE = [
  "name",
  "reveal_name",
  "mission",
  "hint",
  "message",
  "photo_required",
  "complete_label",
  "parent_spot_id",
  "is_secret",
] as const;

// このスポットの持ち主かどうかを確かめる
async function ownerOf(spotId: string) {
  const supabase = createServerClient();
  const { data: spot } = await supabase
    .from("spots")
    .select("id, trip_id")
    .eq("id", spotId)
    .single();
  if (!spot) return null;
  const access = await getAccess(spot.trip_id);
  return access?.isOwner ? { supabase, spot } : null;
}

export async function PATCH(req: Request, { params }: Ctx) {
  const { spotId } = await params;
  const owned = await ownerOf(spotId);
  if (!owned) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const { supabase } = owned;

  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const update: Record<string, unknown> = {};
  for (const key of EDITABLE) {
    if (key in body) update[key] = body[key];
  }
  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: "no fields" }, { status: 400 });
  }
  const { data: spot, error } = await supabase
    .from("spots")
    .update(update)
    .eq("id", spotId)
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ spot });
}

export async function DELETE(req: Request, { params }: Ctx) {
  const { spotId } = await params;
  const owned = await ownerOf(spotId);
  if (!owned) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const { supabase } = owned;

  // スポットの写真ファイルも掃除(DB行はcascade)
  const { data: photos } = await supabase
    .from("photos")
    .select("storage_path")
    .eq("spot_id", spotId);
  if (photos?.length) {
    await supabase.storage.from("photos").remove(photos.map((p) => p.storage_path));
  }

  const { error } = await supabase.from("spots").delete().eq("id", spotId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
