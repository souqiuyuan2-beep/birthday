// スペシャル演出: 選択画面を開いたとき、選ぶ前にプレゼントのように画像を見せる
// 1. リボンのかかった箱が現れる
// 2. タップすると蓋が開き、光とともに中身(画像)がせり上がる
// 3. 「進む」で選択画面へ
"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Confetti from "@/components/girlfriend/Confetti";

export default function SpecialGift({
  imageUrl,
  onDone,
}: {
  imageUrl: string;
  onDone: () => void;
}) {
  const [opened, setOpened] = useState(false);

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#0d1117]/95 px-8">
      {opened && <Confetti count={36} />}

      {/* 暖かい光 */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-1/2 h-[60vmin] w-[60vmin] -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{
          background:
            "radial-gradient(circle, rgba(217,180,91,0.28) 0%, rgba(217,180,91,0.07) 45%, transparent 70%)",
          animation: "glow-breath 8s ease-in-out infinite",
        }}
      />

      {!opened ? (
        <div className="relative z-10 flex flex-col items-center">
          {/* プレゼント箱 */}
          <motion.button
            onClick={() => setOpened(true)}
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 1, ease: "easeOut" }}
            aria-label="プレゼントを開ける"
            style={{ animation: "floaty 3.4s ease-in-out infinite" }}
          >
            <div className="relative h-40 w-44">
              {/* 箱の本体 */}
              <div className="absolute inset-x-0 bottom-0 h-28 rounded-md bg-gradient-to-b from-[#2a3b50] to-[#1a2634] shadow-[0_18px_40px_rgba(0,0,0,0.55)]" />
              {/* 縦のリボン */}
              <div className="absolute bottom-0 left-1/2 h-28 w-6 -translate-x-1/2 bg-gold/80" />
              {/* 蓋 */}
              <div className="absolute inset-x-0 top-6 h-10 rounded-md bg-gradient-to-b from-[#35485f] to-[#243346] shadow-md" />
              <div className="absolute left-1/2 top-6 h-10 w-6 -translate-x-1/2 bg-gold" />
              {/* リボンの結び目 */}
              <div className="absolute left-1/2 top-1 h-8 w-8 -translate-x-1/2 rotate-45 rounded-sm border-4 border-gold" />
            </div>
          </motion.button>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1, duration: 1.2 }}
            className="mt-10 font-serif text-sm tracking-[0.25em] text-white/70"
          >
            プレゼントが届きました
          </motion.p>
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.8, duration: 1 }}
            onClick={() => setOpened(true)}
            className="mt-6 rounded-full border border-gold/50 px-10 py-3 font-serif text-sm tracking-[0.3em] text-gold transition-transform active:scale-[0.97]"
          >
            あける
          </motion.button>
        </div>
      ) : (
        <div className="relative z-10 flex w-full max-w-sm flex-col items-center">
          {/* 中身がせり上がる */}
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 1.1, ease: [0.22, 0.61, 0.36, 1] }}
            className="w-full rounded-2xl bg-white p-3 shadow-[0_20px_60px_rgba(0,0,0,0.6)]"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imageUrl}
              alt="プレゼント"
              className="max-h-[60dvh] w-full rounded-xl object-contain"
            />
          </motion.div>

          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.6, duration: 1 }}
            onClick={onDone}
            className="mt-8 w-full rounded-2xl bg-theme py-4 text-base font-medium text-white shadow-md transition-transform active:scale-[0.98]"
          >
            すすむ
          </motion.button>
        </div>
      )}
    </div>
  );
}
