// G4+G5: ミッション詳細 + 写真撮影・アップロード(サーバー側)
// - スポット・達成状態・アップ済み写真(署名付きURL)を取得して MissionCard に渡す
// - ロック中(順番が先)・2択で選ばれなかった側はホームへ戻す(ネタバレ防止)
// - スポット名は reveal_name に従い、達成までは「???」で伏せる
import { notFound, redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabase/server";
import { buildSpotGroups, currentGroupIndex } from "@/lib/spot-groups";
import MissionCard from "@/components/girlfriend/MissionCard";
import type { Photo, Progress, Spot, Trip } from "@/lib/supabase/types";

export const dynamic = "force-dynamic";

export default async function MissionPage({
  params,
}: {
  params: Promise<{ slug: string; spotId: string }>;
}) {
  const { slug, spotId } = await params;
  const supabase = createServerClient();

  const { data: trip } = (await supabase
    .from("trips")
    .select("id")
    .eq("slug", slug)
    .single()) as { data: Pick<Trip, "id"> | null };
  if (!trip) notFound();

  const [{ data: spots }, { data: progress }, { data: photos }] =
    (await Promise.all([
      supabase
        .from("spots")
        .select("*")
        .eq("trip_id", trip.id)
        .order("sort_order", { ascending: true }),
      supabase.from("progress").select("*").eq("trip_id", trip.id),
      supabase
        .from("photos")
        .select("*")
        .eq("spot_id", spotId)
        .order("created_at", { ascending: true }),
    ])) as [
      { data: Spot[] | null },
      { data: Progress[] | null },
      { data: Photo[] | null },
    ];

  const groups = buildSpotGroups(spots ?? [], progress ?? []);
  const groupIndex = groups.findIndex((g) =>
    g.options.some((o) => o.id === spotId)
  );
  if (groupIndex === -1) notFound();
  const group = groups[groupIndex];

  // 2択で未選択なら選択画面へ。選ばれなかった側・順番前のスポットは見せない
  if (!group.effective) redirect(`/t/${slug}/choice/${group.sortOrder}`);
  if (group.effective.id !== spotId) redirect(`/t/${slug}`);
  if (!group.done && groupIndex !== currentGroupIndex(groups)) {
    redirect(`/t/${slug}`);
  }
  const spot = group.effective;
  const done = group.done;

  const photoList = photos ?? [];
  const { data: signed } =
    photoList.length > 0
      ? await supabase.storage.from("photos").createSignedUrls(
          photoList.map((p) => p.storage_path),
          60 * 60
        )
      : { data: [] };
  const initialPhotos = photoList.flatMap((photo, i) => {
    const url = signed?.[i]?.signedUrl;
    return url ? [{ id: photo.id, url }] : [];
  });

  const showName = spot.reveal_name || done;

  return (
    <MissionCard
      spotId={spot.id}
      displayName={showName ? spot.name : "???"}
      mission={spot.mission}
      hint={spot.hint}
      message={spot.message}
      done={done}
      initialPhotos={initialPhotos}
    />
  );
}
