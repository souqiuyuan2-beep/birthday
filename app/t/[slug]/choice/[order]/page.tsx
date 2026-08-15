// 多択スポットの選択画面(サーバー側)
// - 挑戦中の番目が多択で、まだ写真をアップしていなければ入れる(選び直し可能)
// - 写真アップ済み(達成)なら確定なのでホームへ戻す
// - 選択肢の名前は reveal_name に従って伏せる(選ぶ楽しみを残す)
import { notFound, redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabase/server";
import { buildSpotGroups, currentGroupIndex } from "@/lib/spot-groups";
import ChoiceCards from "@/components/girlfriend/ChoiceCards";
import type { Progress, Spot, Trip } from "@/lib/supabase/types";

export const dynamic = "force-dynamic";

export default async function ChoicePage({
  params,
}: {
  params: Promise<{ slug: string; order: string }>;
}) {
  const { slug, order } = await params;
  const sortOrder = Number(order);
  if (!Number.isInteger(sortOrder)) notFound();

  const supabase = createServerClient();
  // 1往復でまとめて取る(trip を待ってから取り直すと表示が遅れる)
  const { data: tripRow } = (await supabase
    .from("trips")
    .select("id, spots!spots_trip_id_fkey(*), progress(*)")
    .eq("slug", slug)
    .single()) as {
    data: (Pick<Trip, "id"> & { spots: Spot[]; progress: Progress[] }) | null;
  };
  if (!tripRow) notFound();

  const spots = [...(tripRow.spots ?? [])].sort(
    (a, b) => a.sort_order - b.sort_order
  );
  const groups = buildSpotGroups(spots, tripRow.progress ?? []);
  const index = groups.findIndex((g) => g.sortOrder === sortOrder);
  const group = index >= 0 ? groups[index] : null;

  // 多択でない・達成済み(写真アップ済みで確定)・まだ順番が来ていない → ホームへ
  if (
    !group ||
    group.options.length < 2 ||
    group.done ||
    index !== currentGroupIndex(groups)
  ) {
    redirect(`/t/${slug}`);
  }

  // スペシャル演出の画像(選ぶ前にプレゼントのように見せる)
  const specialPath = group.options.find((o) => o.special_image_path)
    ?.special_image_path;
  let specialImageUrl: string | null = null;
  if (specialPath) {
    const { data } = await supabase.storage
      .from("special")
      .createSignedUrl(specialPath, 60 * 60);
    specialImageUrl = data?.signedUrl ?? null;
  }

  return (
    <ChoiceCards
      initialSelectedId={group.effective?.id ?? null}
      specialImageUrl={specialImageUrl}
      options={group.options.map((spot) => ({
        id: spot.id,
        // シークレットは中身を完全に伏せる(選ぶまで分からない)
        secret: spot.is_secret,
        displayName: spot.is_secret
          ? "???"
          : spot.reveal_name
            ? spot.name
            : "???",
        mission: spot.is_secret ? "" : spot.mission,
        message: spot.is_secret ? null : spot.message,
      }))}
    />
  );
}
