// G7: アルバム(旅行後の閲覧)
// - 写真グリッド(署名付きURL・遅延読み込み)、タップ拡大
// - MVPではグリッド+簡易拡大のみ(実装順序3)
// TODO(実装順序7): スワイプ移動、ページめくりモード、スライドショー再生し直し
import { notFound } from "next/navigation";
import Link from "next/link";
import { createServerClient } from "@/lib/supabase/server";
import PhotoGrid from "@/components/girlfriend/PhotoGrid";
import JournalHeader from "@/components/ui/JournalHeader";
import Icon from "@/components/ui/Icon";
import type { Photo, Spot, Trip } from "@/lib/supabase/types";

export const dynamic = "force-dynamic";

export default async function AlbumPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = createServerClient();

  // 1往復でまとめて取る(trip を待ってから取り直すと表示が遅れる)
  const { data: tripRow } = (await supabase
    .from("trips")
    .select("id, title, spots!spots_trip_id_fkey(*), photos(*)")
    .eq("slug", slug)
    .single()) as {
    data:
      | (Pick<Trip, "id" | "title"> & { spots: Spot[]; photos: Photo[] })
      | null;
  };
  if (!tripRow) notFound();

  const trip = tripRow;
  const spots = tripRow.spots ?? [];
  const photoList = [...(tripRow.photos ?? [])].sort((a, b) =>
    a.created_at.localeCompare(b.created_at),
  );
  const { data: signed } =
    photoList.length > 0
      ? await supabase.storage.from("photos").createSignedUrls(
          photoList.map((p) => p.storage_path),
          60 * 60,
        )
      : { data: [] };

  const spotName = new Map((spots ?? []).map((s) => [s.id, s.name]));
  const items = photoList.flatMap((photo, i) => {
    const url = signed?.[i]?.signedUrl;
    if (!url) return [];
    return [
      {
        id: photo.id,
        url,
        spotName: spotName.get(photo.spot_id) ?? "",
        createdAt: photo.created_at,
      },
    ];
  });

  return (
    <main className="journal-page journey-page">
      <JournalHeader
        eyebrow="OUR PHOTO ALBUM"
        title={trip.title}
        description="何度でも、あの日に戻れる。"
      />

      {items.length === 0 ? (
        <p className="mt-16 text-center text-sm text-neutral-400">
          まだ写真がありません
        </p>
      ) : (
        <PhotoGrid items={items} />
      )}

      <div className="mt-10 flex items-center justify-center gap-6 text-center">
        <Link href={`/t/${slug}/ending`} className="text-link">
          <Icon name="book" width="16" height="16" />
          思い出の本を開く
        </Link>
        <Link href={`/t/${slug}`} className="text-link">
          ホームへ戻る
        </Link>
      </div>
    </main>
  );
}
