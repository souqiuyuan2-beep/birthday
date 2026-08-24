// スペシャル演出(プレゼント画像)のアップロード・削除
// POST form-data { file, sortOrder } → special バケットへ保存し、
//   その番目のスポット全部に special_image_path を設定
// DELETE { sortOrder } → 画像を消して設定を解除
import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { getAccess } from "@/lib/access";
import type { Spot } from "@/lib/supabase/types";

type Ctx = { params: Promise<{ tripId: string }> };

export async function POST(req: Request, { params }: Ctx) {
  const { tripId } = await params;
  const access = await getAccess(tripId);
  if (!access?.isOwner) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  const sortOrderRaw = form?.get("sortOrder");
  const sortOrder = Number(sortOrderRaw);
  if (!(file instanceof File) || !Number.isInteger(sortOrder)) {
    return NextResponse.json({ error: "bad request" }, { status: 400 });
  }

  const supabase = createServerClient();
  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const path = `${tripId}/${sortOrder}-${Date.now()}.${ext}`;
  const { error: uploadError } = await supabase.storage
    .from("special")
    .upload(path, file, { contentType: file.type || "image/jpeg" });
  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 });
  }

  // 古い画像があれば消してから差し替える
  const { data: existing } = (await supabase
    .from("spots")
    .select("special_image_path")
    .eq("trip_id", tripId)
    .eq("sort_order", sortOrder)
    .limit(1)) as { data: Pick<Spot, "special_image_path">[] | null };
  const old = existing?.[0]?.special_image_path;
  if (old) await supabase.storage.from("special").remove([old]);

  const { error } = await supabase
    .from("spots")
    .update({ special_image_path: path })
    .eq("trip_id", tripId)
    .eq("sort_order", sortOrder);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ path });
}

export async function DELETE(req: Request, { params }: Ctx) {
  const { tripId } = await params;
  const access = await getAccess(tripId);
  if (!access?.isOwner) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const { sortOrder } = (await req.json().catch(() => ({}))) as {
    sortOrder?: number;
  };
  if (!Number.isInteger(sortOrder)) {
    return NextResponse.json({ error: "bad request" }, { status: 400 });
  }

  const supabase = createServerClient();
  const { data: existing } = (await supabase
    .from("spots")
    .select("special_image_path")
    .eq("trip_id", tripId)
    .eq("sort_order", sortOrder)
    .limit(1)) as { data: Pick<Spot, "special_image_path">[] | null };
  const old = existing?.[0]?.special_image_path;
  if (old) await supabase.storage.from("special").remove([old]);

  const { error } = await supabase
    .from("spots")
    .update({ special_image_path: null })
    .eq("trip_id", tripId)
    .eq("sort_order", sortOrder);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
