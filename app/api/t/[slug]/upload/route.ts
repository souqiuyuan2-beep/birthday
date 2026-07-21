// 写真アップロードAPI(G5の裏側)
// POST multipart/form-data { file, spotId } + Authorization: Bearer <合言葉トークン>
// 1. トークン検証(サーバー側) 2. photosバケットへ保存 3. photos INSERT
// 4. 1枚目なら progress 記録(=ミッション達成) → { completedNow } で演出を出し分け
// storage_path はバケット内パス {trip_id}/{spot_id}/{ts}.jpg(バケット名: photos)
import { NextResponse, after } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { verifyTripToken } from "@/lib/auth";
import { sendPhotoNotification } from "@/lib/email";
import type { Photo, Spot, Trip } from "@/lib/supabase/types";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const token = (req.headers.get("authorization") ?? "").replace(/^Bearer /, "");

  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  const spotId = form?.get("spotId");
  if (!(file instanceof File) || typeof spotId !== "string") {
    return NextResponse.json({ error: "bad request" }, { status: 400 });
  }

  const supabase = createServerClient();
  const { data: trip } = (await supabase
    .from("trips")
    .select("id, title, notify_email")
    .eq("slug", slug)
    .single()) as {
    data: Pick<Trip, "id" | "title" | "notify_email"> | null;
  };
  if (!trip) return NextResponse.json({ error: "not found" }, { status: 404 });
  if (!token || !verifyTripToken(trip.id, token)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { data: spot } = (await supabase
    .from("spots")
    .select("id, name")
    .eq("id", spotId)
    .eq("trip_id", trip.id)
    .single()) as { data: Pick<Spot, "id" | "name"> | null };
  if (!spot) return NextResponse.json({ error: "spot not found" }, { status: 404 });

  const path = `${trip.id}/${spot.id}/${Date.now()}.jpg`;
  const { error: uploadError } = await supabase.storage
    .from("photos")
    .upload(path, file, { contentType: file.type || "image/jpeg" });
  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 });
  }

  const { data: photo, error: insertError } = (await supabase
    .from("photos")
    .insert({ trip_id: trip.id, spot_id: spot.id, storage_path: path })
    .select()
    .single()) as { data: Photo | null; error: { message: string } | null };
  if (insertError || !photo) {
    return NextResponse.json(
      { error: insertError?.message ?? "insert failed" },
      { status: 500 }
    );
  }

  // 1枚目のアップロードでミッション達成
  const { data: existing } = await supabase
    .from("progress")
    .select("spot_id")
    .eq("trip_id", trip.id)
    .eq("spot_id", spot.id)
    .maybeSingle();
  let completedNow = false;
  if (!existing) {
    const { error: progressError } = await supabase
      .from("progress")
      .insert({ trip_id: trip.id, spot_id: spot.id });
    completedNow = !progressError;
  }

  const { data: signed } = await supabase.storage
    .from("photos")
    .createSignedUrl(path, 60 * 60);

  // ミッション達成(=そのスポットの1枚目)のときだけ管理者へメール通知。
  // after() でレスポンス後に実行するのでアップロードの体感速度に影響しない。
  // 複数枚アップしても達成時の1通だけ届く(通知が氾濫しない)
  if (completedNow && trip.notify_email) {
    const notifyEmail = trip.notify_email;
    const tripTitle = trip.title;
    const spotName = spot.name;
    const takenAt = photo.created_at;
    after(async () => {
      // メール本文のリンクは後から開けるよう長め(7日)の署名付きURLにする
      const { data: mailSigned } = await supabase.storage
        .from("photos")
        .createSignedUrl(path, 60 * 60 * 24 * 7);
      await sendPhotoNotification({
        to: notifyEmail,
        tripTitle,
        spotName,
        takenAt,
        photoUrl: mailSigned?.signedUrl ?? null,
      });
    });
  }

  return NextResponse.json({
    photoId: photo.id,
    signedUrl: signed?.signedUrl ?? null,
    completedNow,
  });
}
