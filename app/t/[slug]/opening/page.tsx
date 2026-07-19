// G2: オープニング(手紙演出)のサーバー側
// 手紙本文とBGM(署名付きURL)を取得して演出コンポーネントへ渡す
// 手紙が未設定の旅ではホームへ直行
import { notFound, redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabase/server";
import OpeningLetter from "@/components/girlfriend/OpeningLetter";
import type { Trip } from "@/lib/supabase/types";

export const dynamic = "force-dynamic";

export default async function OpeningPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = createServerClient();
  const { data: trip } = (await supabase
    .from("trips")
    .select("id, title, opening_letter, opening_bgm_path")
    .eq("slug", slug)
    .single()) as {
    data: Pick<Trip, "id" | "title" | "opening_letter" | "opening_bgm_path"> | null;
  };
  if (!trip) notFound();
  if (trip.opening_letter.trim() === "") redirect(`/t/${slug}`);

  let bgmUrl: string | null = null;
  if (trip.opening_bgm_path) {
    const { data } = await supabase.storage
      .from("bgm")
      .createSignedUrl(trip.opening_bgm_path, 60 * 60 * 12);
    bgmUrl = data?.signedUrl ?? null;
  }

  return <OpeningLetter letter={trip.opening_letter} bgmUrl={bgmUrl} />;
}
