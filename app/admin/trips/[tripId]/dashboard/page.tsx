// A5: 進捗ダッシュボード(リアルタイム)
// - ◯/◯達成・現在挑戦中のミッションを表示
// - 写真が届いた順にフィード表示(タップ拡大)
// - Supabase Realtime(progress / photos のINSERT購読)で自動更新
//   +保険として30秒ごとのポーリング(Realtime未設定でも動く)
"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { supabase } from "@/lib/supabase/client";
import { adminFetch } from "@/lib/admin-client";

type FeedPhoto = {
  id: string;
  url: string;
  spotName: string;
  createdAt: string;
};

type Dashboard = {
  total: number;
  doneCount: number;
  allDone: boolean;
  currentName: string | null;
  photos: FeedPhoto[];
};

export default function DashboardPage() {
  const { tripId } = useParams<{ tripId: string }>();
  const [data, setData] = useState<Dashboard | null>(null);
  const [openPhoto, setOpenPhoto] = useState<FeedPhoto | null>(null);
  const [live, setLive] = useState(false);

  const load = useCallback(async () => {
    const res = await adminFetch(`/api/admin/trips/${tripId}/dashboard`);
    if (res.ok) setData(await res.json());
  }, [tripId]);

  useEffect(() => {
    void load();

    // Realtime購読: 写真・進捗が増えたら即リロード
    const channel = supabase
      .channel(`dashboard-${tripId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "photos",
          filter: `trip_id=eq.${tripId}`,
        },
        () => void load()
      )
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "progress",
          filter: `trip_id=eq.${tripId}`,
        },
        () => void load()
      )
      .subscribe((status) => setLive(status === "SUBSCRIBED"));

    // 保険のポーリング(Realtimeが未設定・切断でも追従できるように)
    const timer = setInterval(() => void load(), 30_000);
    return () => {
      clearInterval(timer);
      void supabase.removeChannel(channel);
    };
  }, [tripId, load]);

  return (
    <main className="mx-auto min-h-dvh max-w-md px-5 py-8">
      <header className="mb-6 flex items-center justify-between">
        <Link href={`/admin/trips/${tripId}`} className="text-sm text-neutral-400">
          ← 旅行編集
        </Link>
        <span
          className={
            "rounded-full px-2.5 py-1 text-xs " +
            (live ? "bg-green-100 text-green-700" : "bg-neutral-200 text-neutral-500")
          }
        >
          {live ? "● リアルタイム更新中" : "30秒ごとに更新"}
        </span>
      </header>

      {data === null ? (
        <p className="text-sm text-neutral-400">読み込み中…</p>
      ) : (
        <>
          <section className="rounded-2xl border border-neutral-200 bg-white p-5">
            <p className="text-3xl font-semibold">
              {data.doneCount}
              <span className="text-lg font-normal text-neutral-400">
                {" "}
                / {data.total} 達成
              </span>
            </p>
            <p className="mt-2 text-sm text-neutral-600">
              {data.allDone
                ? "全ミッション達成!🎉"
                : data.currentName
                  ? `挑戦中: ${data.currentName}`
                  : "まだ始まっていません"}
            </p>
          </section>

          <h2 className="mb-3 mt-8 text-sm font-semibold text-neutral-500">
            届いた写真({data.photos.length}枚)
          </h2>
          {data.photos.length === 0 ? (
            <p className="text-sm text-neutral-400">まだ写真は届いていません</p>
          ) : (
            <ul className="space-y-3">
              {data.photos.map((photo) => (
                <li key={photo.id}>
                  <button
                    onClick={() => setOpenPhoto(photo)}
                    className="flex w-full items-center gap-3 rounded-xl border border-neutral-200 bg-white p-3 text-left"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={photo.url}
                      alt={photo.spotName}
                      loading="lazy"
                      className="h-16 w-16 shrink-0 rounded-lg object-cover"
                    />
                    <span>
                      <span className="block text-sm font-medium">
                        {photo.spotName}
                      </span>
                      <span className="mt-0.5 block text-xs text-neutral-400">
                        {new Date(photo.createdAt).toLocaleString("ja-JP")}
                      </span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </>
      )}

      <AnimatePresence>
        {openPhoto && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/90"
            onClick={() => setOpenPhoto(null)}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={openPhoto.url}
              alt={openPhoto.spotName}
              className="max-h-[80dvh] w-full object-contain"
            />
            <p className="mt-4 text-sm text-white/70">
              {openPhoto.spotName}
              <span className="ml-3 text-white/40">
                {new Date(openPhoto.createdAt).toLocaleString("ja-JP")}
              </span>
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
