// 写真の削除API(彼女側・撮り直し用)
// DELETE + Authorization: Bearer <合言葉トークン>
// Storageの実ファイルとDB行を削除する。達成状態(progress)はそのまま残す
import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { verifyTripToken } from "@/lib/auth";
import type { Photo, Trip } from "@/lib/supabase/types";

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ slug: string; photoId: string }> }
) {
  const { slug, photoId } = await params;
  const token = (req.headers.get("authorization") ?? "").replace(/^Bearer /, "");

  const supabase = createServerClient();
  const { data: trip } = (await supabase
    .from("trips")
    .select("id")
    .eq("slug", slug)
    .single()) as { data: Pick<Trip, "id"> | null };
  if (!trip) return NextResponse.json({ error: "not found" }, { status: 404 });
  if (!token || !verifyTripToken(trip.id, token)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { data: photo } = (await supabase
    .from("photos")
    .select("id, storage_path")
    .eq("id", photoId)
    .eq("trip_id", trip.id)
    .single()) as { data: Pick<Photo, "id" | "storage_path"> | null };
  if (!photo) return NextResponse.json({ error: "photo not found" }, { status: 404 });

  await supabase.storage.from("photos").remove([photo.storage_path]);
  const { error } = await supabase.from("photos").delete().eq("id", photo.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
