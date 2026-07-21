// G6: エンディング演出(クライアント側)
// 1. 表紙: 本の表紙が現れ、「ひらく」タップでBGM再生開始
// 2. スライドショー: 黒背景でKen Burns風ズーム+クロスフェード。スポット名・日時を添える
// 3. 最後の手紙: 段落ごとにふわっと表示
// 4. 「アルバムを見る」で自由閲覧モードへ。いつでも再生し直せる
"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";

const SLIDE_MS = 5200;

type EndingPhoto = { url: string; spotName: string; takenAt: string };

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
  const [stage, setStage] = useState<"cover" | "show" | "letter">("cover");
  const [index, setIndex] = useState(0);

  const paragraphs = letter
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean);

  function openBook() {
    audioRef.current?.play().catch(() => {});
    setStage(photos.length > 0 ? "show" : "letter");
  }

  function goNext() {
    if (index + 1 < photos.length) setIndex(index + 1);
    else setStage("letter");
  }
  function goPrev() {
    if (index > 0) setIndex(index - 1);
  }

  // スライドを自動で進め、最後まで来たら手紙へ(手動送りでもindex変化でタイマーは張り直す)
  useEffect(() => {
    if (stage !== "show") return;
    const timer = setTimeout(goNext, SLIDE_MS);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage, index, photos.length]);

  return (
    <main className="fixed inset-0 overflow-y-auto bg-[#0d1117] text-white">
      {bgmUrl && <audio ref={audioRef} src={bgmUrl} loop preload="auto" />}

      {stage === "cover" && (
        <div className="flex min-h-dvh flex-col items-center justify-center px-10">
          <motion.button
            onClick={openBook}
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.1, ease: "easeOut" }}
            className="w-full max-w-[280px]"
            aria-label="本をひらく"
            style={{ animation: "floaty 4s ease-in-out infinite" }}
          >
            {/* 本の表紙 */}
            <div className="rounded-r-lg rounded-l-sm border border-gold/60 bg-gradient-to-br from-[#1b2a3a] to-[#101b28] p-2 shadow-[0_10px_40px_rgba(0,0,0,0.6)]">
              <div className="flex aspect-[3/4] flex-col items-center justify-center rounded-r-md rounded-l-sm border border-gold/40 px-6 text-center">
                <span aria-hidden className="text-gold">
                  ✦
                </span>
                <h1 className="mt-5 font-serif text-xl font-semibold leading-relaxed tracking-[0.15em] text-[#f2e9d8]">
                  {title}
                </h1>
                <p className="mt-3 font-serif text-xs tracking-[0.3em] text-gold/80">
                  ふたりの旅の記録
                </p>
                <span aria-hidden className="mt-5 text-gold">
                  ✦
                </span>
              </div>
            </div>
          </motion.button>
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2, duration: 0.9 }}
            onClick={openBook}
            className="mt-10 rounded-full border border-gold/60 px-10 py-3 font-serif text-sm tracking-[0.25em] text-gold transition-transform active:scale-[0.97]"
          >
            ひらく
          </motion.button>
        </div>
      )}

      {stage === "show" && (
        <div className="relative h-dvh overflow-hidden">
          {photos.map((photo, i) => (
            <motion.div
              key={i}
              initial={false}
              animate={{ opacity: i === index ? 1 : 0 }}
              transition={{ duration: 1.6, ease: "easeInOut" }}
              className="absolute inset-0"
              style={{ pointerEvents: "none" }}
            >
              {/* ぼかした背景で黒い余白を埋める(シネマティック) */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={photo.url}
                alt=""
                aria-hidden
                className="absolute inset-0 h-full w-full scale-110 object-cover opacity-40 blur-2xl"
              />
              {/* 主役の写真(パン+ズーム) */}
              <div className="absolute inset-0 flex items-center justify-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={photo.url}
                  alt={photo.spotName}
                  className="max-h-full max-w-full object-contain shadow-2xl"
                  style={
                    i === index
                      ? {
                          animation: `${i % 2 === 0 ? "kenburns-a" : "kenburns-b"} ${SLIDE_MS + 1800}ms ease-out forwards`,
                        }
                      : undefined
                  }
                />
              </div>
            </motion.div>
          ))}

          {/* ビネット(周辺減光) */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0"
            style={{ boxShadow: "inset 0 0 160px 50px rgba(0,0,0,0.75)" }}
          />

          {/* 淡い光の粒 */}
          <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
            {[
              { left: "12%", delay: "0s", dur: "7s" },
              { left: "33%", delay: "2.5s", dur: "9s" },
              { left: "58%", delay: "1s", dur: "8s" },
              { left: "78%", delay: "3.5s", dur: "10s" },
              { left: "90%", delay: "0.8s", dur: "7.5s" },
            ].map((p, i) => (
              <span
                key={i}
                className="absolute bottom-24 text-gold/70"
                style={{
                  left: p.left,
                  fontSize: 10 + (i % 3) * 4,
                  animation: `drift ${p.dur} ease-in-out ${p.delay} infinite`,
                }}
              >
                ✦
              </span>
            ))}
          </div>

          {/* 左右タップで手動送り/戻し(中央は自動再生のまま) */}
          <button
            aria-label="前の写真"
            onClick={goPrev}
            className="absolute inset-y-0 left-0 z-10 w-1/4"
          />
          <button
            aria-label="次の写真"
            onClick={goNext}
            className="absolute inset-y-0 right-0 z-10 w-1/4"
          />

          {/* キャプション: ◯枚目の思い出 + スポット名 + 日付 */}
          <motion.div
            key={`caption-${index}`}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7, duration: 1 }}
            className="absolute inset-x-0 bottom-12 z-20 text-center"
          >
            <p className="font-serif text-[11px] tracking-[0.35em] text-gold/80">
              {index + 1}枚目の思い出
            </p>
            <p className="mt-2 font-serif text-base tracking-widest text-white/90">
              {photos[index]?.spotName}
            </p>
            <p className="mt-1 text-xs text-white/40">
              {photos[index] &&
                new Date(photos[index].takenAt).toLocaleDateString("ja-JP")}
            </p>
          </motion.div>

          {/* 時間で満ちる進行バー */}
          <div className="absolute inset-x-0 top-6 z-20 flex items-center justify-center gap-1.5 px-10">
            {photos.map((_, i) => (
              <span
                key={i}
                className="h-1 max-w-10 flex-1 overflow-hidden rounded-full bg-white/20"
              >
                {i < index && <span className="block h-full w-full bg-white/70" />}
                {i === index && (
                  <motion.span
                    key={index}
                    initial={{ width: "0%" }}
                    animate={{ width: "100%" }}
                    transition={{ duration: SLIDE_MS / 1000, ease: "linear" }}
                    className="block h-full bg-white/80"
                  />
                )}
              </span>
            ))}
          </div>
          <button
            onClick={() => setStage("letter")}
            className="absolute right-5 top-12 z-20 text-xs text-white/40"
          >
            とばす →
          </button>
        </div>
      )}

      {stage === "letter" && (
        <div className="flex min-h-dvh flex-col items-center justify-center px-7 py-14">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, ease: "easeOut" }}
            className="w-full max-w-md"
          >
            {paragraphs.length > 0 ? (
              <div className="rounded-2xl bg-paper p-7 text-neutral-800 shadow-[0_10px_50px_rgba(0,0,0,0.5)]">
                <motion.div
                  initial="hidden"
                  animate="visible"
                  variants={{
                    visible: {
                      transition: { staggerChildren: 0.9, delayChildren: 0.5 },
                    },
                  }}
                >
                  {paragraphs.map((paragraph, i) => (
                    <motion.p
                      key={i}
                      variants={{
                        hidden: { opacity: 0, y: 10 },
                        visible: {
                          opacity: 1,
                          y: 0,
                          transition: { duration: 0.9 },
                        },
                      }}
                      className="whitespace-pre-wrap font-serif leading-loose [&:not(:first-child)]:mt-5"
                    >
                      {paragraph}
                    </motion.p>
                  ))}
                  <motion.div
                    variants={{
                      hidden: { opacity: 0 },
                      visible: { opacity: 1, transition: { duration: 1.2 } },
                    }}
                    className="mt-8"
                  >
                    <button
                      onClick={() => router.push(`/t/${slug}/album`)}
                      className="w-full rounded-2xl bg-theme py-4 text-base font-medium text-white shadow-md transition-transform active:scale-[0.98]"
                    >
                      アルバムを見る
                    </button>
                  </motion.div>
                </motion.div>
              </div>
            ) : (
              <div className="text-center">
                <p className="font-serif tracking-[0.3em] text-white/80">
                  おしまい
                </p>
                <button
                  onClick={() => router.push(`/t/${slug}/album`)}
                  className="mt-8 w-full rounded-2xl bg-theme py-4 text-base font-medium text-white shadow-md transition-transform active:scale-[0.98]"
                >
                  アルバムを見る
                </button>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </main>
  );
}
