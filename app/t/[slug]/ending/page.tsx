// G6: エンディング(思い出振り返り)のサーバー側
// - 全ミッション達成後のみ解放。未達成ならホームへ戻す
// - 写真(署名付きURL)・最後の手紙・BGM(エンディング曲→無ければオープニング曲)を渡す
import { notFound, redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabase/server";
import { buildSpotGroups } from "@/lib/spot-groups";
import EndingShow from "@/components/girlfriend/EndingShow";
import type { Photo, Progress, Spot, Trip } from "@/lib/supabase/types";

export const dynamic = "force-dynamic";

export default async function EndingPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = createServerClient();

  // 1往復でまとめて取る(trip を待ってから取り直すと表示が遅れる)
  const { data: tripRow } = (await supabase
    .from("trips")
    .select("*, spots!spots_trip_id_fkey(*), progress(*), photos(*)")
    .eq("slug", slug)
    .single()) as {
    data:
      | (Trip & { spots: Spot[]; progress: Progress[]; photos: Photo[] })
      | null;
  };
  if (!tripRow) notFound();

  const trip = tripRow;
  const spots = [...(tripRow.spots ?? [])].sort(
    (a, b) => a.sort_order - b.sort_order
  );
  const progress = tripRow.progress ?? [];
  const photos = [...(tripRow.photos ?? [])].sort((a, b) =>
    a.created_at.localeCompare(b.created_at)
  );

  const groups = buildSpotGroups(spots, progress);
  const allDone = groups.length > 0 && groups.every((g) => g.done);
  if (!allDone) redirect(`/t/${slug}`);

  const photoList = photos ?? [];
  const { data: signed } =
    photoList.length > 0
      ? await supabase.storage.from("photos").createSignedUrls(
          photoList.map((p) => p.storage_path),
          60 * 60 * 2
        )
      : { data: [] };
  const spotName = new Map((spots ?? []).map((s) => [s.id, s.name]));
  const endingPhotos = photoList.flatMap((photo, i) => {
    const url = signed?.[i]?.signedUrl;
    if (!url) return [];
    return [
      {
        url,
        spotName: spotName.get(photo.spot_id) ?? "",
        takenAt: photo.created_at,
      },
    ];
  });

  const bgmPath = trip.ending_bgm_path ?? trip.opening_bgm_path;
  let bgmUrl: string | null = null;
  if (bgmPath) {
    const { data } = await supabase.storage
      .from("bgm")
      .createSignedUrl(bgmPath, 60 * 60 * 2);
    bgmUrl = data?.signedUrl ?? null;
  }

  return (
    <EndingShow
      title={trip.title}
      letter={trip.ending_letter}
      photos={endingPhotos}
      bgmUrl={bgmUrl}
    />
  );
}
