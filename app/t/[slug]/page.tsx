// 旅のホーム。番号・罫線・写真で旅程と進行状況を伝える。
// 名前の公開、分岐、写真追加、エンディングの解放条件はサーバー側で維持する。
import Link from "next/link";
import { notFound } from "next/navigation";
import { createServerClient } from "@/lib/supabase/server";
import { buildSpotGroups, currentGroupIndex } from "@/lib/spot-groups";
import HomePhotoAdd from "@/components/girlfriend/HomePhotoAdd";
import TapLink from "@/components/girlfriend/TapLink";
import JournalHeader from "@/components/ui/JournalHeader";
import Icon from "@/components/ui/Icon";
import type { Photo, Progress, Spot, Trip } from "@/lib/supabase/types";

export const dynamic = "force-dynamic";

export default async function HomePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = createServerClient();
  // 往復を増やさないよう、旅と関連データをまとめて取得する。
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
    (a, b) => a.sort_order - b.sort_order,
  );
  const photos = [...(tripRow.photos ?? [])].sort((a, b) =>
    a.created_at.localeCompare(b.created_at),
  );
  const groups = buildSpotGroups(spots, tripRow.progress ?? []);
  const doneCount = groups.filter((g) => g.done).length;
  const allDone = groups.length > 0 && doneCount === groups.length;
  const currentIdx = currentGroupIndex(groups);
  const firstPhoto = new Map<string, Photo>();
  for (const photo of photos) {
    if (!firstPhoto.has(photo.spot_id)) firstPhoto.set(photo.spot_id, photo);
  }
  const stampPaths = [...firstPhoto.values()].map((p) => p.storage_path);
  const { data: signed } =
    stampPaths.length > 0
      ? await supabase.storage
          .from("photos")
          .createSignedUrls(stampPaths, 60 * 60)
      : { data: [] };
  const stampUrl = new Map<string, string>();
  [...firstPhoto.entries()].forEach(([spotId], i) => {
    const url = signed?.[i]?.signedUrl;
    if (url) stampUrl.set(spotId, url);
  });

  return (
    <main className="journal-page journey-page">
      <JournalHeader
        eyebrow="OUR TRAVEL JOURNAL"
        title={trip.title}
        description={
          trip.date?.replaceAll("-", ".") ?? "ふたりで巡る、旅の記録。"
        }
      />
      <div className="trip-progress">
        <div className="section-label">
          <span>旅の歩み</span>
          <span>
            {allDone ? "旅の思い出が揃いました" : "ひとつずつ、思い出に。"}
          </span>
        </div>
        <div
          className="trip-progress-track"
          role="progressbar"
          aria-label="ミッションの達成状況"
          aria-valuemin={0}
          aria-valuenow={doneCount}
          aria-valuemax={Math.max(groups.length, 1)}
        >
          <div
            className="trip-progress-fill"
            style={{
              width: `${groups.length > 0 ? (doneCount / groups.length) * 100 : 0}%`,
            }}
          />
        </div>
      </div>
      <h2 className="section-label">
        旅のしおり<span>ITINERARY</span>
      </h2>
      {groups.length === 0 && (
        <p className="empty-note">
          旅の準備をしています。
          <br />
          行き先が追加されるまで、もう少しお待ちください。
        </p>
      )}
      <ol className="itinerary">
        {groups.map((group, i) => {
          const state = group.done
            ? "done"
            : i === currentIdx
              ? "current"
              : "locked";
          const spot = group.effective;
          const chosenFromChoice = group.options.length > 1 && !!spot;
          const showName =
            state === "done" ||
            (state === "current" && (spot?.reveal_name || chosenFromChoice));
          const pendingChoice = state === "current" && !spot;
          const stamp = spot ? stampUrl.get(spot.id) : undefined;
          const href = pendingChoice
            ? `/t/${slug}/choice/${group.sortOrder}`
            : spot
              ? `/t/${slug}/mission/${spot.id}`
              : `/t/${slug}`;
          const content = (
            <div className="itinerary-content">
              <span className="itinerary-marker">
                {state === "done" ? (
                  stamp ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={stamp}
                      alt=""
                      className="h-11 w-10 object-cover"
                    />
                  ) : (
                    <Icon name="check" />
                  )
                ) : state === "locked" ? (
                  <Icon name="lock" width="16" height="16" />
                ) : (
                  String(i + 1).padStart(2, "0")
                )}
              </span>
              <div className="min-w-0 flex-1">
                <span className="itinerary-status">
                  {state === "done"
                    ? "思い出になった場所"
                    : state === "current"
                      ? "次の行き先"
                      : `この先の楽しみ / ${String(i + 1).padStart(2, "0")}`}
                </span>
                <h3 className="itinerary-title">
                  {pendingChoice
                    ? group.options.length >= 3
                      ? "どこに行く？"
                      : "どっちに行く？"
                    : showName
                      ? spot!.name
                      : "まだ秘密の場所"}
                </h3>
                {pendingChoice ? (
                  <p className="itinerary-text">
                    {group.options.length}つの場所から、
                    {group.options.length >= 3 ? "好きな場所" : "好きな方"}
                    を選ぼう。
                  </p>
                ) : (
                  state === "current" && (
                    <p className="itinerary-text">{spot!.mission}</p>
                  )
                )}
              </div>
              {state !== "locked" && (
                <Icon
                  name="arrow"
                  width="17"
                  height="17"
                  className="mt-6 shrink-0 text-muted"
                />
              )}
            </div>
          );
          return (
            <li
              key={group.options[0].id}
              className="itinerary-item"
              data-state={state}
            >
              {state === "locked" ? (
                content
              ) : (
                <TapLink href={href}>{content}</TapLink>
              )}
            </li>
          );
        })}
      </ol>
      <HomePhotoAdd
        targets={groups.flatMap((g, i) => {
          const spot = g.effective;
          if (!spot || (!g.done && i !== currentIdx)) return [];
          return [{ id: spot.id, name: spot.name }];
        })}
      />
      {allDone && (
        <section className="memory-invitation">
          <p className="eyebrow">A DAY TO REMEMBER</p>
          <h2 className="mt-3 font-serif text-2xl">今日が、一冊の思い出に。</h2>
          <p className="description">
            集めた写真と一緒に、ふたりの旅を振り返ろう。
          </p>
          <Link
            href={`/t/${slug}/ending`}
            className="button-primary mt-6 w-full"
          >
            旅の思い出を開く
            <Icon name="book" />
          </Link>
          <Link href={`/t/${slug}/album`} className="text-link mt-2">
            アルバムを見る
            <Icon name="arrow" width="15" height="15" />
          </Link>
        </section>
      )}
      {trip.opening_letter.trim() !== "" && (
        <footer className="mt-7 text-center">
          <Link href={`/t/${slug}/opening`} className="text-link">
            手紙を読み返す
            <Icon name="arrow" width="15" height="15" />
          </Link>
        </footer>
      )}
    </main>
  );
}
