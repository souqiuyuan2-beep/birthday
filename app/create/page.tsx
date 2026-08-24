// 「作る」タブ: 自分が作った旅の一覧・新規作成
// 相手に渡すタグをここで確認できる
"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import TabBar from "@/components/TabBar";
import type { Trip } from "@/lib/supabase/types";

export default function CreatePage() {
  const router = useRouter();
  const [trips, setTrips] = useState<Trip[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const load = useCallback(async () => {
    const res = await fetch("/api/admin/trips");
    if (res.status === 401) {
      router.replace("/login");
      return;
    }
    if (res.ok) setTrips((await res.json()).trips);
  }, [router]);

  useEffect(() => {
    void load();
  }, [load]);

  async function createTrip() {
    setBusy(true);
    await fetch("/api/admin/trips", { method: "POST" });
    await load();
    setBusy(false);
  }

  async function duplicateTrip(id: string) {
    setBusy(true);
    await fetch(`/api/admin/trips/${id}/duplicate`, { method: "POST" });
    await load();
    setBusy(false);
  }

  async function deleteTrip(trip: Trip) {
    if (!confirm(`「${trip.title}」を削除しますか?写真もすべて消えます。`)) return;
    setBusy(true);
    await fetch(`/api/admin/trips/${trip.id}`, { method: "DELETE" });
    await load();
    setBusy(false);
  }

  async function copyTag(trip: Trip) {
    if (!trip.tag) return;
    await navigator.clipboard.writeText(trip.tag);
    setCopiedId(trip.id);
    setTimeout(() => setCopiedId(null), 1500);
  }

  return (
    <main className="mx-auto min-h-dvh max-w-md px-5 pb-24 pt-8">
      <header className="mb-6 flex items-center justify-between">
        <h1 className="font-serif text-lg font-semibold tracking-wider">
          作った旅
        </h1>
        <button
          onClick={createTrip}
          disabled={busy}
          className="rounded-lg bg-neutral-800 px-4 py-2 text-sm font-medium text-white disabled:opacity-40"
        >
          + 新しい旅
        </button>
      </header>

      {trips === null ? (
        <p className="text-sm text-neutral-400">読み込み中…</p>
      ) : trips.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-neutral-300 p-8 text-center">
          <p className="text-sm text-neutral-500">まだ旅がありません</p>
          <button
            onClick={createTrip}
            disabled={busy}
            className="mt-4 rounded-lg bg-neutral-800 px-5 py-2.5 text-sm font-medium text-white disabled:opacity-40"
          >
            最初の旅を作る
          </button>
        </div>
      ) : (
        <ul className="space-y-3">
          {trips.map((trip) => (
            <li
              key={trip.id}
              className="rounded-2xl border border-neutral-200 bg-white p-4"
            >
              <Link href={`/create/${trip.id}`} className="block">
                <p className="font-medium">{trip.title}</p>
                <p className="mt-1 text-xs text-neutral-400">
                  {trip.date ?? "日付未定"}
                </p>
              </Link>

              {/* 相手に渡すタグ */}
              <button
                onClick={() => copyTag(trip)}
                className="mt-3 flex w-full items-center justify-between rounded-xl bg-neutral-100 px-4 py-2.5"
              >
                <span className="text-xs text-neutral-500">参加タグ</span>
                <span className="font-mono text-sm tracking-[0.2em] text-neutral-800">
                  {copiedId === trip.id ? "コピーしました" : (trip.tag ?? "—")}
                </span>
              </button>

              <div className="mt-3 flex gap-2 text-xs">
                <button
                  onClick={() => duplicateTrip(trip.id)}
                  disabled={busy}
                  className="rounded-md border border-neutral-300 px-3 py-1.5"
                >
                  複製
                </button>
                <button
                  onClick={() => deleteTrip(trip)}
                  disabled={busy}
                  className="ml-auto rounded-md border border-red-200 px-3 py-1.5 text-red-500"
                >
                  削除
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <TabBar />
    </main>
  );
}
