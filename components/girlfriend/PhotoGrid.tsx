// アルバムの写真グリッド+タップ拡大+ページめくりモード(クライアント側)
// - 一覧: 3列グリッド(遅延読み込み)。タップでオーバーレイ拡大、左右タップで前後移動
// - ページ: 本のように1枚ずつ横スワイプでめくって見るモード(scroll-snap)
"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

type Item = {
  id: string;
  url: string;
  spotName: string;
  createdAt: string;
};

export default function PhotoGrid({ items }: { items: Item[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [mode, setMode] = useState<"grid" | "book">("grid");
  const open = openIndex !== null ? items[openIndex] : null;

  return (
    <>
      <div className="mb-4 flex justify-center gap-2">
        {(
          [
            { value: "grid", label: "一覧" },
            { value: "book", label: "ページめくり" },
          ] as const
        ).map((m) => (
          <button
            key={m.value}
            onClick={() => setMode(m.value)}
            className={
              "rounded-full px-4 py-1.5 text-xs transition-colors " +
              (mode === m.value
                ? "bg-theme text-white shadow-sm"
                : "border border-neutral-300 text-neutral-500")
            }
          >
            {m.label}
          </button>
        ))}
      </div>

      {mode === "grid" ? (
        <div className="grid grid-cols-3 gap-2">
          {items.map((item, i) => (
            <button key={item.id} onClick={() => setOpenIndex(i)}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={item.url}
                alt={item.spotName}
                loading="lazy"
                className="aspect-square w-full rounded-lg object-cover"
              />
            </button>
          ))}
        </div>
      ) : (
        <div className="-mx-6 flex snap-x snap-mandatory gap-5 overflow-x-auto px-6 pb-4">
          {items.map((item) => (
            <figure key={item.id} className="w-full shrink-0 snap-center">
              <div className="rounded-2xl border border-neutral-200 bg-white p-3 pb-4 shadow-md">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={item.url}
                  alt={item.spotName}
                  loading="lazy"
                  className="aspect-[3/4] w-full rounded-xl object-cover"
                />
                <figcaption className="mt-3 text-center">
                  <span className="font-serif text-sm text-neutral-700">
                    {item.spotName}
                  </span>
                  <span className="ml-3 text-xs text-neutral-400">
                    {new Date(item.createdAt).toLocaleDateString("ja-JP")}
                  </span>
                </figcaption>
              </div>
            </figure>
          ))}
        </div>
      )}

      <AnimatePresence>
        {open && openIndex !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/90"
            onClick={() => setOpenIndex(null)}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={open.url}
              alt={open.spotName}
              className="max-h-[80dvh] w-full object-contain"
            />
            <p className="mt-4 text-sm text-white/70">
              {open.spotName}
              <span className="ml-3 text-white/40">
                {new Date(open.createdAt).toLocaleDateString("ja-JP")}
              </span>
            </p>

            {/* 左右タップで前後移動(画像タップの閉じる操作と領域を分ける) */}
            {openIndex > 0 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setOpenIndex(openIndex - 1);
                }}
                className="absolute inset-y-0 left-0 w-1/5"
                aria-label="前の写真"
              />
            )}
            {openIndex < items.length - 1 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setOpenIndex(openIndex + 1);
                }}
                className="absolute inset-y-0 right-0 w-1/5"
                aria-label="次の写真"
              />
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
