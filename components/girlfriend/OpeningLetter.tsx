// G2: オープニング演出(クライアント側)
// - 封筒のフラップが3Dで開き、中の手紙がすっと持ち上がる → 手紙画面へ
// - 「開く」タップを起点にBGM再生開始(iOS Safariの自動再生制限対策)
// - 手紙本文は段落ごとにふわっと表示 → 「旅を始める」でホームへ
// - 表示済みフラグを保存し、2回目以降の入場ではスキップされる(読み返しは可能)
"use client";

import { useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { markOpeningSeen } from "@/lib/opening";
import Sparkles from "@/components/girlfriend/Sparkles";

type Stage = "sealed" | "opening" | "letter";

export default function OpeningLetter({
  letter,
  bgmUrl,
}: {
  letter: string;
  bgmUrl: string | null;
}) {
  const { slug } = useParams<{ slug: string }>();
  const router = useRouter();
  const audioRef = useRef<HTMLAudioElement>(null);
  const [stage, setStage] = useState<Stage>("sealed");

  const paragraphs = letter
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean);

  function open() {
    if (stage !== "sealed") return;
    // タップを起点に再生(自動再生制限対策)。失敗しても手紙は進める
    audioRef.current?.play().catch(() => {});
    setStage("opening");
    markOpeningSeen(slug);
    // フラップが開く(0.9s)→手紙が持ち上がる(0.8s)→手紙画面へ
    setTimeout(() => setStage("letter"), 1900);
  }

  function start() {
    router.replace(`/t/${slug}`);
  }

  return (
    <main className="relative mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center px-8 py-12">
      <Sparkles count={16} />
      {bgmUrl && <audio ref={audioRef} src={bgmUrl} loop preload="auto" />}

      {stage !== "letter" ? (
        <div className="relative z-10 flex w-full flex-col items-center">
          {/* 封筒(3D開封) */}
          <motion.button
            onClick={open}
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, ease: "easeOut" }}
            className="relative w-full max-w-xs"
            aria-label="手紙を開く"
            style={{ perspective: 900, animation: stage === "sealed" ? "floaty 3.6s ease-in-out infinite" : "none" }}
          >
            <div className="relative aspect-[4/3] w-full">
              {/* 封筒の本体 */}
              <div className="absolute inset-0 overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-lg">
                {/* 中の手紙(開封で持ち上がる) */}
                <motion.div
                  animate={stage === "opening" ? { y: -110 } : { y: 0 }}
                  transition={{ delay: 0.75, duration: 0.8, ease: "easeOut" }}
                  className="absolute inset-x-5 bottom-2 top-4 rounded-lg border border-neutral-100 bg-paper shadow-sm"
                >
                  <div className="mx-auto mt-5 h-1.5 w-2/3 rounded bg-neutral-200/70" />
                  <div className="mx-auto mt-2 h-1.5 w-1/2 rounded bg-neutral-200/60" />
                  <div className="mx-auto mt-2 h-1.5 w-3/5 rounded bg-neutral-200/50" />
                </motion.div>
                {/* 封筒の前面ポケット */}
                <div
                  className="absolute inset-x-0 bottom-0 h-3/5"
                  style={{
                    background:
                      "linear-gradient(to top right, #f7f3ea 49.6%, transparent 50%) left / 50.5% 100% no-repeat, linear-gradient(to top left, #f7f3ea 49.6%, transparent 50%) right / 50.5% 100% no-repeat",
                    filter: "drop-shadow(0 -1px 1px rgba(0,0,0,0.04))",
                  }}
                />
              </div>
              {/* フラップ(3Dで開く) */}
              <motion.div
                animate={stage === "opening" ? { rotateX: 180 } : { rotateX: 0 }}
                transition={{ duration: 0.9, ease: [0.65, 0, 0.35, 1] }}
                className="absolute inset-x-0 top-0 z-10 h-[52%] origin-top"
                style={{ transformStyle: "preserve-3d", backfaceVisibility: "hidden" }}
              >
                <div
                  className="h-full w-full"
                  style={{
                    clipPath: "polygon(0 0, 100% 0, 50% 100%)",
                    background: "linear-gradient(180deg, #f3eee2, #ece4d2)",
                    borderRadius: "12px 12px 0 0",
                  }}
                />
                {/* 封蝋 */}
                <motion.div
                  animate={
                    stage === "sealed"
                      ? { scale: [1, 1.08, 1] }
                      : { scale: 1, opacity: 0.9 }
                  }
                  transition={
                    stage === "sealed"
                      ? { repeat: Infinity, duration: 2.4, ease: "easeInOut" }
                      : { duration: 0.3 }
                  }
                  className="absolute -bottom-6 left-1/2 flex h-14 w-14 -translate-x-1/2 items-center justify-center rounded-full bg-theme text-xl text-white shadow-md"
                >
                  ✉
                </motion.div>
              </motion.div>
            </div>
          </motion.button>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: stage === "sealed" ? 1 : 0 }}
            transition={{ delay: stage === "sealed" ? 0.9 : 0, duration: 0.8 }}
            className="mt-10 font-serif text-sm tracking-wider text-neutral-500"
          >
            あなたへの手紙が届いています
          </motion.p>
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: stage === "sealed" ? 1 : 0 }}
            transition={{ delay: stage === "sealed" ? 1.4 : 0, duration: 0.8 }}
            onClick={open}
            className="mt-6 w-full max-w-xs rounded-2xl bg-theme py-4 text-base font-medium text-white shadow-md transition-transform active:scale-[0.98]"
          >
            開く
          </motion.button>
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 40, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="relative z-10 w-full"
        >
          <div className="rounded-2xl border border-neutral-200 bg-white/95 p-7 shadow-lg">
            <motion.div
              initial="hidden"
              animate="visible"
              variants={{
                visible: { transition: { staggerChildren: 0.9, delayChildren: 0.4 } },
              }}
            >
              {paragraphs.map((paragraph, i) => (
                <motion.p
                  key={i}
                  variants={{
                    hidden: { opacity: 0, y: 10 },
                    visible: { opacity: 1, y: 0, transition: { duration: 0.9 } },
                  }}
                  className="whitespace-pre-wrap font-serif leading-loose text-neutral-800 [&:not(:first-child)]:mt-5"
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
                  onClick={start}
                  className="w-full rounded-2xl bg-theme py-4 text-base font-medium text-white shadow-md transition-transform active:scale-[0.98]"
                >
                  旅を始める
                </button>
              </motion.div>
            </motion.div>
          </div>
        </motion.div>
      )}
    </main>
  );
}
