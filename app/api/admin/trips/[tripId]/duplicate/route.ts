// A2の裏側: 旅行の複製(スポット込み。進捗・写真・BGMはコピーしない)
import { randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { isAdminRequest } from "@/lib/admin-api";
import type { Spot, Trip } from "@/lib/supabase/types";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ tripId: string }> }
) {
  if (!isAdminRequest(req)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const { tripId } = await params;
  const supabase = createServerClient();

  const [{ data: trip }, { data: spots }] = (await Promise.all([
    supabase.from("trips").select("*").eq("id", tripId).single(),
    supabase.from("spots").select("*").eq("trip_id", tripId),
  ])) as [{ data: Trip | null }, { data: Spot[] | null }];
  if (!trip) return NextResponse.json({ error: "not found" }, { status: 404 });

  const { data: newTrip, error } = (await supabase
    .from("trips")
    .insert({
      slug: randomBytes(10).toString("hex"),
      title: `${trip.title} のコピー`,
      date: trip.date,
      passphrase: trip.passphrase,
      opening_letter: trip.opening_letter,
      ending_letter: trip.ending_letter,
      notify_email: trip.notify_email,
      theme_color: trip.theme_color,
    })
    .select()
    .single()) as { data: Trip | null; error: { message: string } | null };
  if (error || !newTrip) {
    return NextResponse.json(
      { error: error?.message ?? "insert failed" },
      { status: 500 }
    );
  }

  if (spots?.length) {
    const { error: spotError } = await supabase.from("spots").insert(
      spots.map((s) => ({
        trip_id: newTrip.id,
        sort_order: s.sort_order,
        name: s.name,
        reveal_name: s.reveal_name,
        mission: s.mission,
        hint: s.hint,
        message: s.message,
      }))
    );
    if (spotError) {
      return NextResponse.json({ error: spotError.message }, { status: 500 });
    }
  }
  return NextResponse.json({ trip: newTrip });
}
