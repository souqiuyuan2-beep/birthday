// G7: アルバム(旅行後の閲覧)
// - 写真グリッド(署名付きURL・遅延読み込み)、タップ拡大
// - MVPではグリッド+簡易拡大のみ(実装順序3)
// TODO(実装順序7): スワイプ移動、ページめくりモード、スライドショー再生し直し
import { notFound } from "next/navigation";
import Link from "next/link";
import { createServerClient } from "@/lib/supabase/server";
import PhotoGrid from "@/components/girlfriend/PhotoGrid";
import type { Photo, Spot, Trip } from "@/lib/supabase/types";

export const dynamic = "force-dynamic";

export default async function AlbumPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = createServerClient();

  const { data: trip } = (await supabase
    .from("trips")
    .select("id, title")
    .eq("slug", slug)
    .single()) as { data: Pick<Trip, "id" | "title"> | null };
  if (!trip) notFound();

  const [{ data: spots }, { data: photos }] = (await Promise.all([
    supabase
      .from("spots")
      .select("*")
      .eq("trip_id", trip.id)
      .order("sort_order", { ascending: true }),
    supabase
      .from("photos")
      .select("*")
      .eq("trip_id", trip.id)
      .order("created_at", { ascending: true }),
  ])) as [{ data: Spot[] | null }, { data: Photo[] | null }];

  const photoList = photos ?? [];
  const { data: signed } =
    photoList.length > 0
      ? await supabase.storage.from("photos").createSignedUrls(
          photoList.map((p) => p.storage_path),
          60 * 60
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
    <main className="mx-auto min-h-dvh max-w-md px-6 py-10">
      <header className="mb-8 text-center">
        <h1 className="text-2xl font-semibold tracking-wide">{trip.title}</h1>
        <p className="mt-2 text-sm text-neutral-500">二人のアルバム</p>
      </header>

      {items.length === 0 ? (
        <p className="mt-16 text-center text-sm text-neutral-400">
          まだ写真がありません
        </p>
      ) : (
        <PhotoGrid items={items} />
      )}

      <div className="mt-10 flex items-center justify-center gap-6 text-center">
        <Link
          href={`/t/${slug}/ending`}
          className="text-sm text-neutral-400 underline underline-offset-4"
        >
          スライドショーを見る
        </Link>
        <Link
          href={`/t/${slug}`}
          className="text-sm text-neutral-400 underline underline-offset-4"
        >
          ホームへ戻る
        </Link>
      </div>
    </main>
  );
}
