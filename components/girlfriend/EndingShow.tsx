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

  // スライドを進め、最後まで来たら手紙へ
  useEffect(() => {
    if (stage !== "show") return;
    const timer = setTimeout(() => {
      if (index + 1 < photos.length) {
        setIndex(index + 1);
      } else {
        setStage("letter");
      }
    }, SLIDE_MS);
    return () => clearTimeout(timer);
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
        <div className="relative min-h-dvh">
          {photos.map((photo, i) => (
            <motion.div
              key={i}
              initial={false}
              animate={{ opacity: i === index ? 1 : 0 }}
              transition={{ duration: 1.4, ease: "easeInOut" }}
              className="absolute inset-0 flex items-center justify-center overflow-hidden"
              style={{ pointerEvents: "none" }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={photo.url}
                alt={photo.spotName}
                className="h-full w-full object-contain"
                style={
                  i === index
                    ? {
                        animation: `kenburns ${SLIDE_MS + 1600}ms ease-out forwards`,
                        transformOrigin: i % 2 === 0 ? "30% 40%" : "70% 60%",
                      }
                    : undefined
                }
              />
            </motion.div>
          ))}

          {/* キャプション */}
          <motion.div
            key={`caption-${index}`}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.9 }}
            className="absolute inset-x-0 bottom-10 text-center"
          >
            <p className="font-serif text-sm tracking-widest text-white/85">
              {photos[index]?.spotName}
            </p>
            <p className="mt-1 text-xs text-white/40">
              {photos[index] &&
                new Date(photos[index].takenAt).toLocaleDateString("ja-JP")}
            </p>
          </motion.div>

          {/* 進行ドット+とばす */}
          <div className="absolute inset-x-0 top-6 flex items-center justify-center gap-1.5">
            {photos.map((_, i) => (
              <span
                key={i}
                className={
                  "h-1 rounded-full transition-all duration-500 " +
                  (i === index ? "w-4 bg-white/80" : "w-1 bg-white/25")
                }
              />
            ))}
          </div>
          <button
            onClick={() => setStage("letter")}
            className="absolute right-5 top-12 text-xs text-white/35"
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
