// A3の裏側: 旅行の取得(スポット・達成状況込み)・更新・削除
import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { isAdminRequest } from "@/lib/admin-api";

type Ctx = { params: Promise<{ tripId: string }> };

export async function GET(req: Request, { params }: Ctx) {
  if (!isAdminRequest(req)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const { tripId } = await params;
  const supabase = createServerClient();
  const [{ data: trip }, { data: spots }, { data: progress }] =
    await Promise.all([
      supabase.from("trips").select("*").eq("id", tripId).single(),
      supabase
        .from("spots")
        .select("*")
        .eq("trip_id", tripId)
        .order("sort_order", { ascending: true }),
      supabase.from("progress").select("spot_id").eq("trip_id", tripId),
    ]);
  if (!trip) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json({
    trip,
    spots: spots ?? [],
    doneSpotIds: (progress ?? []).map((p) => p.spot_id),
  });
}

// 許可するカラムだけ更新(任意カラム上書きを防ぐ)
const EDITABLE = [
  "title",
  "date",
  "passphrase",
  "opening_letter",
  "ending_letter",
  "notify_email",
  "theme_color",
] as const;

export async function PATCH(req: Request, { params }: Ctx) {
  if (!isAdminRequest(req)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const { tripId } = await params;
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const update: Record<string, unknown> = {};
  for (const key of EDITABLE) {
    if (key in body) update[key] = body[key];
  }
  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: "no fields" }, { status: 400 });
  }
  const supabase = createServerClient();
  const { data: trip, error } = await supabase
    .from("trips")
    .update(update)
    .eq("id", tripId)
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ trip });
}

export async function DELETE(req: Request, { params }: Ctx) {
  if (!isAdminRequest(req)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const { tripId } = await params;
  const supabase = createServerClient();

  // Storageの実ファイルも掃除(ベストエフォート)。DB行はcascadeで消える
  const { data: photos } = await supabase
    .from("photos")
    .select("storage_path")
    .eq("trip_id", tripId);
  if (photos?.length) {
    await supabase.storage.from("photos").remove(photos.map((p) => p.storage_path));
  }
  const { data: bgmFiles } = await supabase.storage.from("bgm").list(tripId);
  if (bgmFiles?.length) {
    await supabase.storage
      .from("bgm")
      .remove(bgmFiles.map((f) => `${tripId}/${f.name}`));
  }

  const { error } = await supabase.from("trips").delete().eq("id", tripId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
