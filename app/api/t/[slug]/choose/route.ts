// 2択スポットの選択API
// POST { spotId } + Authorization: Bearer <合言葉トークン>
// 同じ番目の選択肢の中から1つを chosen にする。写真を撮り始めた後は変更不可
import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { verifyTripToken } from "@/lib/auth";
import type { Spot, Trip } from "@/lib/supabase/types";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const token = (req.headers.get("authorization") ?? "").replace(/^Bearer /, "");
  const { spotId } = (await req.json().catch(() => ({}))) as { spotId?: string };
  if (typeof spotId !== "string") {
    return NextResponse.json({ error: "bad request" }, { status: 400 });
  }

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

  const { data: spot } = (await supabase
    .from("spots")
    .select("*")
    .eq("id", spotId)
    .eq("trip_id", trip.id)
    .single()) as { data: Spot | null };
  if (!spot) return NextResponse.json({ error: "spot not found" }, { status: 404 });

  const { data: options } = (await supabase
    .from("spots")
    .select("id")
    .eq("trip_id", trip.id)
    .eq("sort_order", spot.sort_order)) as { data: Pick<Spot, "id">[] | null };
  const optionIds = (options ?? []).map((o) => o.id);

  // どれかの選択肢で進行が始まっていたら選び直し不可
  const { data: started } = await supabase
    .from("progress")
    .select("spot_id")
    .in("spot_id", optionIds);
  if (started && started.length > 0) {
    return NextResponse.json({ error: "already started" }, { status: 409 });
  }

  const { error: clearError } = await supabase
    .from("spots")
    .update({ chosen: false })
    .in("id", optionIds);
  if (clearError) {
    return NextResponse.json({ error: clearError.message }, { status: 500 });
  }
  const { error } = await supabase
    .from("spots")
    .update({ chosen: true })
    .eq("id", spot.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true, spotId: spot.id });
}
