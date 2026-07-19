// 2択スポットの選択画面(サーバー側)
// - 挑戦中の番目が2択で未選択のときだけ入れる。それ以外はホームへ戻す
// - 選択肢の名前は reveal_name に従って伏せる
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
  const { data: trip } = (await supabase
    .from("trips")
    .select("id")
    .eq("slug", slug)
    .single()) as { data: Pick<Trip, "id"> | null };
  if (!trip) notFound();

  const [{ data: spots }, { data: progress }] = (await Promise.all([
    supabase
      .from("spots")
      .select("*")
      .eq("trip_id", trip.id)
      .order("sort_order", { ascending: true }),
    supabase.from("progress").select("*").eq("trip_id", trip.id),
  ])) as [{ data: Spot[] | null }, { data: Progress[] | null }];

  const groups = buildSpotGroups(spots ?? [], progress ?? []);
  const index = groups.findIndex((g) => g.sortOrder === sortOrder);
  const group = index >= 0 ? groups[index] : null;

  // 2択でない・選択済み・まだ順番が来ていない → ホームへ
  if (
    !group ||
    group.options.length < 2 ||
    group.effective ||
    index !== currentGroupIndex(groups)
  ) {
    redirect(`/t/${slug}`);
  }

  return (
    <ChoiceCards
      options={group.options.map((spot) => ({
        id: spot.id,
        displayName: spot.reveal_name ? spot.name : "???",
        mission: spot.mission,
        message: spot.message,
      }))}
    />
  );
}
