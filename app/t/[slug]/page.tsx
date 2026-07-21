// G3: ホーム画面(スタンプラリー風の進行状況)
// - 点線の道でつながったスタンプの並び。達成=撮った写真がスタンプになる
// - 挑戦中=脈打つリングで強調 / 未来=??? ロック
// - 2択の番目: 選ぶまで「どっちに行く?」カード → 選択画面へ
// - ヘッダーはきらめく進捗バー。全達成でアルバムへの導線を解放
import Link from "next/link";
import { notFound } from "next/navigation";
import { createServerClient } from "@/lib/supabase/server";
import { buildSpotGroups, currentGroupIndex } from "@/lib/spot-groups";
import LogoutLink from "@/components/girlfriend/LogoutLink";
import Sparkles from "@/components/girlfriend/Sparkles";
import type { Photo, Progress, Spot, Trip } from "@/lib/supabase/types";

export const dynamic = "force-dynamic";

export default async function HomePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = createServerClient();

  const { data: trip } = (await supabase
    .from("trips")
    .select("*")
    .eq("slug", slug)
    .single()) as { data: Trip | null };

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
        .eq("trip_id", trip.id)
        .order("created_at", { ascending: true }),
    ])) as [
      { data: Spot[] | null },
      { data: Progress[] | null },
      { data: Photo[] | null },
    ];

  const groups = buildSpotGroups(spots ?? [], progress ?? []);
  const doneCount = groups.filter((g) => g.done).length;
  const allDone = groups.length > 0 && doneCount === groups.length;
  const currentIdx = currentGroupIndex(groups);

  // 各スポットの1枚目の写真を「スタンプ」として使う
  const firstPhoto = new Map<string, Photo>();
  for (const photo of photos ?? []) {
    if (!firstPhoto.has(photo.spot_id)) firstPhoto.set(photo.spot_id, photo);
  }
  const stampPaths = [...firstPhoto.values()].map((p) => p.storage_path);
  const { data: signed } =
    stampPaths.length > 0
      ? await supabase.storage.from("photos").createSignedUrls(stampPaths, 60 * 60)
      : { data: [] };
  const stampUrl = new Map<string, string>();
  [...firstPhoto.entries()].forEach(([spotId], i) => {
    const url = signed?.[i]?.signedUrl;
    if (url) stampUrl.set(spotId, url);
  });

  return (
    <main className="relative mx-auto min-h-dvh max-w-md px-6 py-10">
      <Sparkles count={12} />

      <header className="relative z-10 mb-10 text-center">
        <h1 className="font-serif text-2xl font-semibold tracking-[0.15em]">
          {trip.title}
        </h1>
        <div
          className="relative mx-auto mt-5 h-2.5 max-w-60 overflow-hidden rounded-full bg-white shadow-inner"
          role="progressbar"
          aria-valuenow={doneCount}
          aria-valuemax={groups.length}
        >
          <div
            className="relative h-full overflow-hidden rounded-full bg-theme transition-all duration-700"
            style={{
              width: `${groups.length > 0 ? (doneCount / groups.length) * 100 : 0}%`,
            }}
          >
            <span
              className="absolute inset-y-0 w-1/2 bg-white/40 blur-[2px]"
              style={{ animation: "shimmer 2.6s ease-in-out infinite" }}
            />
          </div>
        </div>
      </header>

      <ol className="relative z-10">
        {groups.map((group, i) => {
          const state = group.done ? "done" : i === currentIdx ? "current" : "locked";
          const isLast = i === groups.length - 1;
          const spot = group.effective;
          // 多択から選んだスポットは選んだ時点で名前を見せる(reveal_name off でも)
          const chosenFromChoice = group.options.length > 1 && !!spot;
          const showName =
            state === "done" ||
            (state === "current" && (spot?.reveal_name || chosenFromChoice));
          const pendingChoice = state === "current" && !spot;
          const stamp = spot ? stampUrl.get(spot.id) : undefined;

          // スタンプノード(丸)
          const node =
            state === "done" ? (
              stamp ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={stamp}
                  alt=""
                  className="h-14 w-14 -rotate-6 rounded-full border-[3px] border-theme object-cover shadow-md"
                />
              ) : (
                <span className="flex h-14 w-14 -rotate-6 items-center justify-center rounded-full border-[3px] border-theme bg-white text-lg text-theme-deep shadow-md">
                  ✓
                </span>
              )
            ) : state === "current" ? (
              <span
                className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-theme bg-white font-serif text-lg font-semibold text-theme-deep shadow"
                style={{ animation: "pulse-ring 2.2s ease-out infinite" }}
              >
                {i + 1}
              </span>
            ) : (
              <span className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-dashed border-neutral-300 bg-white/60 text-neutral-300">
                ?
              </span>
            );

          // 横のカード
          const card = pendingChoice ? (
            <div className="rounded-2xl border-2 border-theme bg-white p-4 shadow-md">
              <div className="flex items-center justify-between">
                <span className="text-base font-medium">どっちに行く?</span>
                <span className="text-xs text-theme-deep">選んでね ✦</span>
              </div>
              <p className="mt-2 text-sm text-neutral-600">
                2つの場所から好きな方を選ぼう
              </p>
            </div>
          ) : (
            <div
              className={
                "rounded-2xl border bg-white p-4 transition-shadow " +
                (state === "current"
                  ? "border-theme shadow-md"
                  : state === "done"
                    ? "border-neutral-200 shadow-sm"
                    : "border-neutral-200/70 opacity-60")
              }
            >
              <div className="flex items-center justify-between">
                <span className="text-base font-medium">
                  {showName ? spot!.name : "???"}
                </span>
                <span
                  className={
                    "text-xs " +
                    (state === "done" ? "text-theme-deep" : "text-neutral-400")
                  }
                >
                  {state === "done" ? "達成 ✓" : state === "current" ? "挑戦中" : "ロック"}
                </span>
              </div>
              {state === "current" && (
                <p className="mt-2 text-sm text-neutral-600">{spot!.mission}</p>
              )}
            </div>
          );

          // ロック中の多択グループは effective が null(まだ選べない)。
          // その場合はリンクにしないので href は使われないが、null.id で落ちないよう保護する
          const href = pendingChoice
            ? `/t/${slug}/choice/${group.sortOrder}`
            : spot
              ? `/t/${slug}/mission/${spot.id}`
              : `/t/${slug}`;

          return (
            <li key={group.options[0].id} className="relative flex gap-4 pb-8">
              {/* スタンプをつなぐ点線の道 */}
              {!isLast && (
                <span
                  aria-hidden
                  className={
                    "absolute left-7 top-14 h-[calc(100%-3.5rem)] w-0 -translate-x-1/2 border-l-2 border-dashed " +
                    (state === "done" ? "border-theme" : "border-neutral-300/70")
                  }
                />
              )}
              <div className="relative shrink-0">{node}</div>
              <div className="min-w-0 flex-1">
                {state === "locked" ? card : <Link href={href}>{card}</Link>}
              </div>
            </li>
          );
        })}
      </ol>

      {allDone && (
        <div className="relative z-10 mt-4 rounded-2xl border border-theme/60 bg-white/90 p-6 text-center shadow-md">
          <p className="font-serif text-base text-neutral-700">
            ✦ すべてのミッションを達成しました ✦
          </p>
          <Link
            href={`/t/${slug}/ending`}
            className="mt-4 inline-block w-full rounded-2xl bg-theme py-4 text-base font-medium text-white shadow-md transition-transform active:scale-[0.98]"
          >
            旅の結末をひらく
          </Link>
          <Link
            href={`/t/${slug}/album`}
            className="mt-3 inline-block text-sm text-neutral-400 underline underline-offset-4"
          >
            アルバムを見る
          </Link>
        </div>
      )}

      <footer className="relative z-10 mt-12 flex items-center justify-center gap-6 text-center">
        {trip.opening_letter.trim() !== "" && (
          <Link
            href={`/t/${slug}/opening`}
            className="text-xs text-neutral-400 underline underline-offset-4"
          >
            手紙を読み返す
          </Link>
        )}
        <LogoutLink />
      </footer>
    </main>
  );
}
