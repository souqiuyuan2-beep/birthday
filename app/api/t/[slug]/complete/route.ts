// 写真なしでミッションを達成にするAPI(photo_required = false のスポット専用)
// POST { spotId } + Authorization: Bearer <合言葉トークン>
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
    .select("id, photo_required")
    .eq("id", spotId)
    .eq("trip_id", trip.id)
    .single()) as { data: Pick<Spot, "id" | "photo_required"> | null };
  if (!spot) return NextResponse.json({ error: "spot not found" }, { status: 404 });
  if (spot.photo_required) {
    return NextResponse.json(
      { error: "このスポットは写真が必要です" },
      { status: 409 }
    );
  }

  // 既に達成済みでも成功扱い(二重タップで壊れないように)
  const { data: existing } = await supabase
    .from("progress")
    .select("spot_id")
    .eq("trip_id", trip.id)
    .eq("spot_id", spot.id)
    .maybeSingle();
  if (!existing) {
    const { error } = await supabase
      .from("progress")
      .insert({ trip_id: trip.id, spot_id: spot.id });
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  }

  return NextResponse.json({ ok: true, completedNow: !existing });
}
