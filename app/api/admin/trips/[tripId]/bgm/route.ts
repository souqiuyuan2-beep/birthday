// A3の裏側: BGMアップロード・削除
// POST form-data { file, kind: "opening" | "ending" } → bgm/{tripId}/{kind}-{ts} に保存し
// trips.opening_bgm_path / ending_bgm_path を更新。DELETE { kind } で解除
import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { isAdminRequest } from "@/lib/admin-api";

type Ctx = { params: Promise<{ tripId: string }> };

const COLUMN = {
  opening: "opening_bgm_path",
  ending: "ending_bgm_path",
} as const;

export async function POST(req: Request, { params }: Ctx) {
  if (!isAdminRequest(req)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const { tripId } = await params;
  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  const kind = form?.get("kind");
  if (!(file instanceof File) || (kind !== "opening" && kind !== "ending")) {
    return NextResponse.json({ error: "bad request" }, { status: 400 });
  }

  const supabase = createServerClient();
  const ext = file.name.split(".").pop()?.toLowerCase() || "mp3";
  const path = `${tripId}/${kind}-${Date.now()}.${ext}`;
  const { error: uploadError } = await supabase.storage
    .from("bgm")
    .upload(path, file, { contentType: file.type || "audio/mpeg" });
  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 });
  }

  // 古いファイルは削除してから差し替え
  const { data: trip } = await supabase
    .from("trips")
    .select("opening_bgm_path, ending_bgm_path")
    .eq("id", tripId)
    .single();
  const old = trip?.[COLUMN[kind]];
  if (old) await supabase.storage.from("bgm").remove([old]);

  const { error } = await supabase
    .from("trips")
    .update({ [COLUMN[kind]]: path })
    .eq("id", tripId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ path });
}

export async function DELETE(req: Request, { params }: Ctx) {
  if (!isAdminRequest(req)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const { tripId } = await params;
  const { kind } = (await req.json().catch(() => ({}))) as { kind?: string };
  if (kind !== "opening" && kind !== "ending") {
    return NextResponse.json({ error: "bad request" }, { status: 400 });
  }
  const supabase = createServerClient();
  const { data: trip } = await supabase
    .from("trips")
    .select("opening_bgm_path, ending_bgm_path")
    .eq("id", tripId)
    .single();
  const old = trip?.[COLUMN[kind]];
  if (old) await supabase.storage.from("bgm").remove([old]);
  const { error } = await supabase
    .from("trips")
    .update({ [COLUMN[kind]]: null })
    .eq("id", tripId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
