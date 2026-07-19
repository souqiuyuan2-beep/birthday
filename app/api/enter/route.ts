// トップページ用の入場API: 合言葉から旅を逆引きする
// POST { passphrase } → 一致する旅があれば { slug, token }
// 同じ合言葉の旅が複数ある場合は新しく作った方を優先
import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { createTripToken } from "@/lib/auth";
import type { Trip } from "@/lib/supabase/types";

const normalize = (s: string) => s.normalize("NFKC").trim().toLowerCase();

export async function POST(req: Request) {
  const { passphrase } = (await req.json().catch(() => ({}))) as {
    passphrase?: string;
  };
  if (typeof passphrase !== "string" || passphrase.trim() === "") {
    return NextResponse.json({ error: "合言葉を入力してね" }, { status: 400 });
  }

  const supabase = createServerClient();
  const { data: trips } = (await supabase
    .from("trips")
    .select("id, slug, passphrase, opening_letter")
    .order("created_at", { ascending: false })) as {
    data: Pick<Trip, "id" | "slug" | "passphrase" | "opening_letter">[] | null;
  };

  const input = normalize(passphrase);
  const trip = (trips ?? []).find(
    (t) => t.passphrase.trim() !== "" && normalize(t.passphrase) === input
  );
  if (!trip) {
    return NextResponse.json({ error: "合言葉が違うみたい" }, { status: 401 });
  }

  return NextResponse.json({
    slug: trip.slug,
    token: createTripToken(trip.id),
    hasOpening: trip.opening_letter.trim() !== "",
  });
}
