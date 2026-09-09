// 「作る」タブ: 自分が作った旅の一覧・新規作成
// 相手に渡すタグをここで確認できる
"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import JournalHeader from "@/components/ui/JournalHeader";
import Icon from "@/components/ui/Icon";
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
    if (!confirm(`「${trip.title}」を削除しますか?写真もすべて消えます。`))
      return;
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
    <main className="journal-page">
      <JournalHeader
        eyebrow="PLAN A JOURNEY"
        title="旅を、贈ろう。"
        description="行き先も、手紙も。相手を思い浮かべながら。"
      />
      <div className="mb-7 flex items-center justify-between gap-4">
        <h2 className="text-sm">
          作った旅
          {trips && (
            <span className="ml-3 font-mono text-xs text-muted">
              {String(trips.length).padStart(2, "0")}
            </span>
          )}
        </h2>
        <button onClick={createTrip} disabled={busy} className="button-primary">
          <Icon name="plus" width="16" height="16" /> 新しい旅
        </button>
      </div>

      {trips === null ? (
        <p className="text-sm text-neutral-400">読み込み中…</p>
      ) : trips.length === 0 ? (
        <div className="empty-note">
          <p className="font-serif text-xl text-ink">どんな一日にしよう。</p>
          <p className="mt-3">
            まずは旅の名前を決めるところから。
            <br />
            行き先や手紙は、後から少しずつ追加できます。
          </p>
          <button
            onClick={createTrip}
            disabled={busy}
            className="text-link mt-3 underline"
          >
            最初の旅を作る
          </button>
        </div>
      ) : (
        <ul className="journey-list">
          {trips.map((trip, index) => (
            <li key={trip.id} className="create-item">
              <Link
                href={`/create/${trip.id}`}
                className="flex items-center gap-5"
              >
                <span className="journey-number">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="journey-title">{trip.title}</p>
                  <p className="date-label">
                    {trip.date?.replaceAll("-", ".") ?? "日付未定"}
                  </p>
                </div>
                <Icon name="arrow" className="shrink-0 text-muted" />
              </Link>

              {/* 相手に渡すタグ */}
              <button
                onClick={() => copyTag(trip)}
                className="tag-strip"
                aria-label={`「${trip.title}」の参加コードをコピー`}
              >
                <span>参加コード</span>
                <span className="flex items-center gap-3">
                  <code>
                    {copiedId === trip.id
                      ? "コピーしました"
                      : (trip.tag ?? "—")}
                  </code>
                  <Icon
                    name={copiedId === trip.id ? "check" : "copy"}
                    width="15"
                    height="15"
                  />
                </span>
              </button>

              <div className="item-actions">
                <button
                  onClick={() => duplicateTrip(trip.id)}
                  disabled={busy}
                  className="text-link"
                >
                  複製
                </button>
                <button
                  onClick={() => deleteTrip(trip)}
                  disabled={busy}
                  className="text-link text-[#965143]"
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
