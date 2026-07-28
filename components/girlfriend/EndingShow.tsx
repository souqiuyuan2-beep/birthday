// G6: エンディング演出「一日の思い出を、一冊の魔法のフォトブックとして振り返る」
//
// 流れ:
//  1. fade    : 画面がゆっくり暗転(BGMはタップ起点で再生 → iOS Safari対策)
//  2. appear  : 高級感のあるフォトブックが中央に静かに現れる
//  3. book    : 本が開き、見開きページを1枚ずつめくって思い出を振り返る
//               (写真ごとにレイアウトを変える / 紙の厚み・影・立体感)
//  4. finale  : 最後の特別ページ(Happy Birthday + メッセージ)
//  5. closing : 本が静かに閉じ、閉じた表紙だけが残る
//  6. end     : ゆっくりフェードアウト → アルバムへの導線だけ残す
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Handwriting from "@/components/girlfriend/Handwriting";

type EndingPhoto = { url: string; spotName: string; takenAt: string };

type Stage = "fade" | "appear" | "book" | "closing" | "end";

// ゆっくりしたテンポで余韻を大切にする
const PAGE_MS = 7000; // 1ページの滞在時間
const FLIP_MS = 1500; // めくりアニメーションの長さ
const COVER_MS = 2000; // 表紙を開く/閉じる時間(ゆっくり)

export default function EndingShow({
  title,
  letter,
  photos,
  bgmUrl,
}: {
  title: string;
  letter: string;
  photos: EndingPhoto[];
  bgmUrl: string | null;
}) {
  const { slug } = useParams<{ slug: string }>();
  const router = useRouter();
  const audioRef = useRef<HTMLAudioElement>(null);
  const [stage, setStage] = useState<Stage>("fade");
  // ページ番号: 0..photos.length-1 が写真、最後(= photos.length)が特別ページ
  const [page, setPage] = useState(0);
  const [flipping, setFlipping] = useState(false);
  // ページ内容のフェードイン(ページが変わるたびに 0 → 1)
  const [pageVisible, setPageVisible] = useState(false);
  // めくられていく紙の表面に描く「1つ前のページ」
  const [flippingFrom, setFlippingFrom] = useState<number | null>(null);
  // 表紙をめくっている最中か(本を開く/閉じる演出)
  const [coverOpening, setCoverOpening] = useState(false);
  // 表紙が完全に開き切ったか(開き切ったら表紙は畳んで見えなくする)
  const [coverOpened, setCoverOpened] = useState(false);

  // 中身のページを表示する場面(表紙をめくり始めてから、閉じ切るまで)
  const showPages = stage === "book" || stage === "closing" || coverOpening;
  // 表紙は開き切るまで(と閉じ直す時)描画しておく。
  // coverOpened = めくり終わって完全に開いた状態
  const showCover = !coverOpened;

  const lastPage = photos.length; // 特別ページのindex
  const isFinale = page >= lastPage;

  const paragraphs = letter
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean);

  function begin() {
    // タップを起点にBGM再生(自動再生制限対策)。静かに始める
    const audio = audioRef.current;
    if (audio) {
      audio.volume = 0;
      audio.play().catch(() => {});
      // ゆっくりフェードイン
      let v = 0;
      const fade = setInterval(() => {
        v = Math.min(0.85, v + 0.05);
        audio.volume = v;
        if (v >= 0.85) clearInterval(fade);
      }, 260);
    }
    setStage("appear");
    // 本が現れたら表紙をゆっくりめくって開く
    setTimeout(() => setCoverOpening(true), 1500);
    setTimeout(() => {
      setStage("book");
      setCoverOpened(true); // 開き切ったので表紙は畳む
    }, 1500 + COVER_MS);
  }

  // 次のページへ
  // いま見えているページを「紙ごと」めくる: めくる紙の表面に現在ページを描画したまま
  // 回転させ、その下から次のページが現れる(前の写真が残って見えないように)
  const turnPage = useCallback(() => {
    if (flipping) return;
    if (page >= lastPage) {
      // 特別ページのあとは本を閉じる
      setStage("closing");
      return;
    }
    // 下地を先に次ページへ差し替え、その上を「今見ていたページ」の紙が覆ってめくられる
    setFlippingFrom(page);
    setPage((p) => p + 1);
    setFlipping(true);
    setTimeout(() => {
      setFlipping(false);
      setFlippingFrom(null);
    }, FLIP_MS);
  }, [flipping, page, lastPage]);

  // ページが変わったら、内容をやわらかくフェードインさせる
  // (めくり中はめくる紙が覆っているので、その裏で静かに現れる)
  useEffect(() => {
    if (!showPages) return;
    setPageVisible(false);
    const timer = setTimeout(() => setPageVisible(true), 60);
    return () => clearTimeout(timer);
  }, [showPages, page]);

  // 自動でページを進める
  useEffect(() => {
    if (stage !== "book") return;
    // 最後のページは、手書きが終わるまで待ってから余韻を置く
    // (1文字約90ms + 句読点の間。おおよその総文字数から見積もる)
    const finaleText =
      paragraphs.join("") +
      "今日は一緒に最高の思い出を作ってくれてありがとう。これからもたくさん思い出を作ろうね。";
    const writingMs = 3400 + finaleText.length * 130;
    const wait = isFinale ? writingMs + 6000 : PAGE_MS;
    const timer = setTimeout(turnPage, wait);
    return () => clearTimeout(timer);
  }, [stage, page, isFinale, turnPage, paragraphs.length]);

  // 本を閉じたら(表紙が戻る)、閉じた表紙を見せてから余韻を残してフェードアウト
  useEffect(() => {
    if (stage !== "closing") return;
    // 表紙を開いた状態(-172°)から再び描画し、ゆっくり0°へ戻して閉じる
    setCoverOpened(false);
    const close = setTimeout(() => setCoverOpening(false), 50);
    const timer = setTimeout(() => setStage("end"), COVER_MS + 3000);
    return () => {
      clearTimeout(close);
      clearTimeout(timer);
    };
  }, [stage]);

  // BGMを静かに絞る
  useEffect(() => {
    if (stage !== "end") return;
    const audio = audioRef.current;
    if (!audio) return;
    const fade = setInterval(() => {
      audio.volume = Math.max(0, audio.volume - 0.04);
      if (audio.volume <= 0.01) {
        audio.pause();
        clearInterval(fade);
      }
    }, 220);
    return () => clearInterval(fade);
  }, [stage]);

  const showBook = stage === "appear" || stage === "book" || stage === "closing";

  return (
    <main className="fixed inset-0 overflow-hidden bg-[#0b0d12] text-white">
      {bgmUrl && <audio ref={audioRef} src={bgmUrl} loop preload="auto" />}

      {/* 暖かい光(控えめ。本より後ろに置く) */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-1/2 z-0 h-[70vmin] w-[70vmin] -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{
          background:
            "radial-gradient(circle, rgba(217,180,91,0.22) 0%, rgba(217,180,91,0.06) 45%, transparent 70%)",
          animation: "glow-breath 9s ease-in-out infinite",
        }}
      />

      {/* 1. 暗転からの導入 */}
      {stage === "fade" && (
        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center px-10">
          <p
            className="text-center font-serif text-sm leading-loose tracking-[0.3em] text-white/70"
            style={{ animation: "page-in 2.4s ease-in-out 1.2s both" }}
          >
            今日の思い出を
            <br />
            一冊の本にしました
          </p>
          <button
            onClick={begin}
            className="mt-12 rounded-full border border-gold/50 px-12 py-3.5 font-serif text-sm tracking-[0.3em] text-gold transition-transform active:scale-[0.97]"
            style={{ animation: "page-in 2s ease-in-out 3s both" }}
          >
            ひらく
          </button>
        </div>
      )}

      {/* 2-5. フォトブック */}
      {showBook && (
        <motion.div
          initial={{ opacity: 0, scale: 0.88, y: 16 }}
          animate={
            stage === "closing"
              ? { opacity: 1, scale: 0.9, y: 0 }
              : { opacity: 1, scale: 1, y: 0 }
          }
          transition={{ duration: 2.2, ease: [0.22, 0.61, 0.36, 1] }}
          className="absolute inset-0 z-10 flex items-center justify-center px-5"
          style={{ perspective: 2000 }}
        >
          <div
            className="relative w-full max-w-md"
            style={{ perspective: 1600 }}
          >
            {/* 本体。めくられる紙が本の外へはみ出さないよう、ここで切り取る */}
            <div
              className="relative aspect-[3/4] w-full overflow-hidden rounded-r-xl rounded-l-md shadow-[0_30px_80px_rgba(0,0,0,0.75)]"
              style={{
                // 表紙をめくり始めたら、その下から中身(紙)が現れる
                background: showPages
                  ? "#f7f3ea"
                  : "linear-gradient(140deg, #1d2b3a 0%, #16212e 50%, #101823 100%)",
              }}
            >
              {/* 表紙: 本物の本のように左綴じで開く/閉じる */}
              {showCover && (
                <div
                  className="absolute inset-0 z-20 origin-left overflow-hidden rounded-r-xl rounded-l-md"
                  style={{
                    // 裏返ったら消える(表紙の裏が透けないように)
                    backfaceVisibility: "hidden",
                    WebkitBackfaceVisibility: "hidden",
                    background:
                      "linear-gradient(140deg, #1d2b3a 0%, #16212e 50%, #101823 100%)",
                    boxShadow: "8px 0 30px rgba(0,0,0,0.45)",
                    // 開く時は 0°→-172°、閉じる時は -172°→0°
                    animation:
                      stage === "closing"
                        ? `cover-close ${COVER_MS}ms cubic-bezier(0.42,0,0.3,1) both`
                        : coverOpening
                          ? `cover-open ${COVER_MS}ms cubic-bezier(0.42,0,0.3,1) both`
                          : undefined,
                  }}
                >
                  <div className="flex h-full w-full flex-col items-center justify-center px-8 text-center">
                    <div className="absolute inset-3 rounded-r-lg rounded-l-sm border border-gold/35" />
                    <span aria-hidden className="text-gold/90">
                      ✦
                    </span>
                    <h1 className="mt-6 font-serif text-xl font-semibold leading-relaxed tracking-[0.2em] text-[#f4ecdd]">
                      {title}
                    </h1>
                    <p className="mt-4 font-serif text-[11px] tracking-[0.45em] text-gold/75">
                      MEMORIES
                    </p>
                    <span aria-hidden className="mt-6 text-gold/90">
                      ✦
                    </span>
                  </div>
                  {/* 綴じ側の陰影(紙の立体感) */}
                  <span
                    aria-hidden
                    className="pointer-events-none absolute inset-y-0 left-0 w-10"
                    style={{
                      background:
                        "linear-gradient(90deg, rgba(0,0,0,0.45), transparent)",
                    }}
                  />
                </div>
              )}

              {/* 中身のページ(表紙をめくり始めた時から見えている) */}
              {showPages && (
                <div className="absolute inset-0 overflow-hidden rounded-r-xl rounded-l-md bg-[#f7f3ea]">
                  <div
                    key={page}
                    className="absolute inset-0 transition-opacity duration-700"
                    style={{ opacity: pageVisible ? 1 : 0 }}
                  >
                    {isFinale ? (
                      <FinalePage paragraphs={paragraphs} />
                    ) : (
                      <PhotoPage
                        photo={photos[page]}
                        index={page}
                        total={photos.length}
                      />
                    )}
                  </div>

                  {/* 綴じ side の影(立体感) */}
                  <div
                    aria-hidden
                    className="pointer-events-none absolute inset-y-0 left-0 w-10"
                    style={{
                      background:
                        "linear-gradient(90deg, rgba(0,0,0,0.22), rgba(0,0,0,0.06) 55%, transparent)",
                    }}
                  />

                  {/* めくられる紙: 表面に「めくる前のページ」を乗せたまま回転する */}
                  {flipping && flippingFrom !== null && (
                    <div
                      className="absolute inset-0 z-30 origin-left overflow-hidden"
                      style={{
                        // 裏返ったら見えなくする(紙の裏に写真が透けないように)
                        backfaceVisibility: "hidden",
                        WebkitBackfaceVisibility: "hidden",
                        background: "#f7f3ea",
                        boxShadow: "6px 0 24px rgba(0,0,0,0.28)",
                        borderRadius: "0 10px 10px 0",
                        animation: `page-flip ${FLIP_MS}ms cubic-bezier(0.42,0,0.35,1) both`,
                      }}
                    >
                      {/* 紙の表面にめくる前のページを描く */}
                      <div className="absolute inset-0">
                        {flippingFrom >= photos.length ? (
                          <FinalePage paragraphs={paragraphs} />
                        ) : (
                          <PhotoPage
                            photo={photos[flippingFrom]}
                            index={flippingFrom}
                            total={photos.length}
                          />
                        )}
                      </div>
                      {/* 紙のツヤと綴じ側の影 */}
                      <span
                        aria-hidden
                        className="pointer-events-none absolute inset-0"
                        style={{
                          background:
                            "linear-gradient(100deg, rgba(0,0,0,0.10) 0%, rgba(255,255,255,0.16) 45%, rgba(0,0,0,0.08) 100%)",
                        }}
                      />
                      <span
                        aria-hidden
                        className="pointer-events-none absolute inset-y-0 left-0 w-8"
                        style={{
                          background:
                            "linear-gradient(90deg, rgba(0,0,0,0.18), transparent)",
                        }}
                      />
                    </div>
                  )}
                </div>
              )}

              {/* 背表紙側の陰影 */}
              <div
                aria-hidden
                className="pointer-events-none absolute inset-y-0 left-0 z-40 w-6"
                style={{
                  background:
                    "linear-gradient(90deg, rgba(0,0,0,0.5), rgba(0,0,0,0.12) 60%, transparent)",
                }}
              />
            </div>

            {/* 本の厚み(小口) */}
            <div
              aria-hidden
              className="absolute -bottom-1.5 left-2 right-2 h-3 rounded-b-md bg-[#e8e0d0]/85 shadow-[0_16px_30px_rgba(0,0,0,0.55)]"
            />
            <div
              aria-hidden
              className="absolute -bottom-2.5 left-4 right-4 h-2 rounded-b-md bg-[#d9cfbb]/70"
            />
          </div>
        </motion.div>
      )}

      {/* 手動でページをめくる(全面タップ。演出を邪魔しない透明ボタン) */}
      {stage === "book" && (
        <button
          aria-label="次のページへ"
          onClick={turnPage}
          className="absolute inset-0 z-20"
        />
      )}

      {/* 6. 余韻のフェードアウト → アルバムへ */}
      {stage === "end" && (
        <div
          className="absolute inset-0 z-40 flex flex-col items-center justify-center bg-[#0b0d12] px-10"
          style={{ animation: "page-in 3.5s ease-in-out both" }}
        >
          <p
            className="font-serif text-xs tracking-[0.45em] text-white/45"
            style={{ animation: "page-in 2.4s ease-in-out 2.4s both" }}
          >
            ✦
          </p>
          <button
            onClick={() => router.push(`/t/${slug}/album`)}
            className="mt-10 rounded-full border border-white/20 px-10 py-3 font-serif text-xs tracking-[0.3em] text-white/60"
            style={{ animation: "page-in 2.4s ease-in-out 4s both" }}
          >
            アルバムを見る
          </button>
        </div>
      )}

      {/* とばす(演出中のみ・控えめに) */}
      {(stage === "book" || stage === "appear") && (
        <button
          onClick={() => setStage("closing")}
          className="absolute right-5 top-6 z-30 text-[10px] tracking-[0.2em] text-white/25"
        >
          とばす
        </button>
      )}
    </main>
  );
}

// 写真ページ: index に応じてレイアウトを変え、フォトブックらしさを出す
function PhotoPage({
  photo,
  index,
  total,
}: {
  photo: EndingPhoto;
  index: number;
  total: number;
}) {
  const layout = index % 3; // 0: 大きめ中央 / 1: 上寄せ+余白 / 2: 引きの小さめ
  const date = new Date(photo.takenAt).toLocaleDateString("ja-JP");

  return (
    <div className="flex h-full w-full flex-col px-8 py-9 text-neutral-800">
      {layout === 1 && (
        <p className="mb-4 font-serif text-[10px] tracking-[0.4em] text-neutral-400">
          {String(index + 1).padStart(2, "0")} / {String(total).padStart(2, "0")}
        </p>
      )}

      <div
        className={
          "relative flex-1 overflow-hidden " +
          (layout === 2 ? "mx-3 my-4" : layout === 1 ? "mb-4" : "my-2")
        }
      >
        {/* 写真は白フチ付きで、高級アルバムの台紙に貼ったように */}
        <div className="absolute inset-0 rounded-sm bg-white p-2 shadow-[0_6px_18px_rgba(0,0,0,0.12)]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={photo.url}
            alt={photo.spotName}
            className="h-full w-full rounded-[2px] object-cover"
          />
        </div>
      </div>

      <div className={layout === 2 ? "text-center" : "text-left"}>
        <p className="font-serif text-sm tracking-[0.18em] text-neutral-700">
          {photo.spotName}
        </p>
        <p className="mt-1 font-serif text-[10px] tracking-[0.25em] text-neutral-400">
          {date}
          {layout !== 1 && (
            <span className="ml-3">
              {String(index + 1).padStart(2, "0")} /{" "}
              {String(total).padStart(2, "0")}
            </span>
          )}
        </p>
      </div>
    </div>
  );
}

// 最後の特別なページ
function FinalePage({ paragraphs }: { paragraphs: string[] }) {
  // 締めの2行は必ず表示し、管理画面の手紙があればその前に添える
  const lines = [
    ...paragraphs,
    "今日は一緒に最高の思い出を作ってくれてありがとう。",
    "これからもたくさん思い出を作ろうね。",
  ];
  // 何行目まで書き終えたか
  const [writtenCount, setWrittenCount] = useState(0);

  return (
    <div className="flex h-full w-full flex-col items-center justify-center px-10 text-center text-neutral-800">
      <span
        aria-hidden
        className="font-serif text-lg text-gold"
        style={{ animation: "page-in 2.2s ease-in-out 0.6s both" }}
      >
        ✦
      </span>

      <h2
        className="mt-6 font-serif text-[26px] leading-tight tracking-[0.12em] text-neutral-800"
        style={{ animation: "page-in 2.6s ease-out 1.4s both" }}
      >
        Happy Birthday
      </h2>

      {/* 手で書いているように1行ずつ綴られる */}
      <div className="mt-9 w-full space-y-4">
        {lines.map((line, i) =>
          i <= writtenCount ? (
            <Handwriting
              key={i}
              text={line}
              onDone={() => setWrittenCount((c) => Math.max(c, i + 1))}
              className="font-serif text-[13px] leading-loose tracking-[0.08em] text-neutral-600"
            />
          ) : null
        )}
      </div>

      <div className="mt-10">
        <span
          aria-hidden
          className="font-serif text-sm text-gold/80"
          style={{
            animation: `page-in 2.4s ease-out ${3.4 + lines.length * 2.4}s both`,
          }}
        >
          ✦
        </span>
      </div>
    </div>
  );
}
