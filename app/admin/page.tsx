// A2: 旅行一覧
// - 旅行の作成・複製・削除、QR用URL(/t/[slug])の表示・コピー
"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { adminFetch, clearAdminToken } from "@/lib/admin-client";
import type { Trip } from "@/lib/supabase/types";

export default function AdminTripsPage() {
  const router = useRouter();
  const [trips, setTrips] = useState<Trip[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const load = useCallback(async () => {
    const res = await adminFetch("/api/admin/trips");
    if (res.ok) setTrips((await res.json()).trips);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function createTrip() {
    setBusy(true);
    await adminFetch("/api/admin/trips", { method: "POST" });
    await load();
    setBusy(false);
  }

  async function duplicateTrip(id: string) {
    setBusy(true);
    await adminFetch(`/api/admin/trips/${id}/duplicate`, { method: "POST" });
    await load();
    setBusy(false);
  }

  async function deleteTrip(trip: Trip) {
    if (!confirm(`「${trip.title}」を削除しますか?写真もすべて消えます。`)) return;
    setBusy(true);
    await adminFetch(`/api/admin/trips/${trip.id}`, { method: "DELETE" });
    await load();
    setBusy(false);
  }

  async function copyUrl(trip: Trip) {
    const url = `${window.location.origin}/t/${trip.slug}`;
    await navigator.clipboard.writeText(url);
    setCopiedId(trip.id);
    setTimeout(() => setCopiedId(null), 1500);
  }

  return (
    <main className="mx-auto min-h-dvh max-w-md px-5 py-8">
      <header className="mb-6 flex items-center justify-between">
        <h1 className="text-lg font-semibold">旅行一覧</h1>
        <button
          onClick={createTrip}
          disabled={busy}
          className="rounded-lg bg-neutral-800 px-4 py-2 text-sm font-medium text-white disabled:opacity-40"
        >
          + 新規作成
        </button>
      </header>

      {trips !== null && (
        <button
          onClick={() => {
            clearAdminToken();
            router.replace("/admin/login");
          }}
          className="mb-4 text-xs text-neutral-400 underline underline-offset-4"
        >
          ログアウト
        </button>
      )}

      {trips === null ? (
        <p className="text-sm text-neutral-400">読み込み中…</p>
      ) : trips.length === 0 ? (
        <p className="text-sm text-neutral-400">まだ旅行がありません</p>
      ) : (
        <ul className="space-y-3">
          {trips.map((trip) => (
            <li key={trip.id} className="rounded-xl border border-neutral-200 bg-white p-4">
              <Link href={`/admin/trips/${trip.id}`} className="block">
                <p className="font-medium">{trip.title}</p>
                <p className="mt-1 text-xs text-neutral-400">
                  {trip.date ?? "日付未定"} ・ /t/{trip.slug}
                </p>
              </Link>
              <div className="mt-3 flex gap-2 text-xs">
                <button
                  onClick={() => copyUrl(trip)}
                  className="rounded-md border border-neutral-300 px-3 py-1.5"
                >
                  {copiedId === trip.id ? "コピーした!" : "URLコピー"}
                </button>
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
    </main>
  );
}
