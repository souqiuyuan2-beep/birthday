// アルバムの写真グリッド+タップ拡大+ページめくりモード(クライアント側)
// - 一覧: 3列グリッド(遅延読み込み)。タップでオーバーレイ拡大、左右タップで前後移動
// - ページ: 本のように1枚ずつ横スワイプでめくって見るモード(scroll-snap)
// - 拡大表示から写真を削除できる(達成状態はそのまま)
"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { getTripToken } from "@/lib/auth-client";

type Item = {
  id: string;
  url: string;
  spotName: string;
  createdAt: string;
};

export default function PhotoGrid({ items }: { items: Item[] }) {
  const { slug } = useParams<{ slug: string }>();
  const router = useRouter();
  const [photos, setPhotos] = useState<Item[]>(items);
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [mode, setMode] = useState<"grid" | "book">("grid");
  const open = openIndex !== null ? photos[openIndex] : null;

  // 拡大表示から写真を削除する(達成状態は変わらない)
  async function deletePhoto(photo: Item) {
    if (!confirm("この写真を削除する?")) return;
    const token = getTripToken(slug);
    if (!token) return;
    const res = await fetch(`/api/t/${slug}/photos/${photo.id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      setPhotos((list) => list.filter((p) => p.id !== photo.id));
      setOpenIndex(null);
      router.refresh();
    } else {
      alert("削除できませんでした");
    }
  }

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
          {photos.map((item, i) => (
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
          {photos.map((item) => (
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
            <button
              onClick={(e) => {
                e.stopPropagation();
                void deletePhoto(open);
              }}
              className="mt-5 rounded-full border border-white/25 px-5 py-2 text-xs text-white/60"
            >
              この写真を削除
            </button>

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
            {openIndex < photos.length - 1 && (
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
