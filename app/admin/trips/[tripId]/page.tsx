// A3: 旅行編集
// - タイトル / 日付 / 合言葉 / オープニング・エンディングの手紙
// - BGMアップロード(Storage: bgm/{trip_id}/)/ 通知先メールアドレス
// - 保存すると彼女側の画面に即反映される
"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { adminFetch } from "@/lib/admin-client";
import type { Trip } from "@/lib/supabase/types";

export default function TripEditPage() {
  const { tripId } = useParams<{ tripId: string }>();
  const [trip, setTrip] = useState<Trip | null>(null);
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);
  const [bgmBusy, setBgmBusy] = useState<"opening" | "ending" | null>(null);

  const load = useCallback(async () => {
    const res = await adminFetch(`/api/admin/trips/${tripId}`);
    if (res.ok) setTrip((await res.json()).trip);
  }, [tripId]);

  useEffect(() => {
    void load();
  }, [load]);

  function set<K extends keyof Trip>(key: K, value: Trip[K]) {
    setTrip((t) => (t ? { ...t, [key]: value } : t));
    setSaved(false);
  }

  async function save() {
    if (!trip) return;
    setBusy(true);
    const res = await adminFetch(`/api/admin/trips/${tripId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: trip.title,
        date: trip.date || null,
        passphrase: trip.passphrase,
        opening_letter: trip.opening_letter,
        ending_letter: trip.ending_letter,
        notify_email: trip.notify_email || null,
      }),
    });
    if (res.ok) setSaved(true);
    setBusy(false);
  }

  async function uploadBgm(kind: "opening" | "ending", file: File) {
    setBgmBusy(kind);
    const form = new FormData();
    form.append("file", file);
    form.append("kind", kind);
    await adminFetch(`/api/admin/trips/${tripId}/bgm`, {
      method: "POST",
      body: form,
    });
    await load();
    setBgmBusy(null);
  }

  async function removeBgm(kind: "opening" | "ending") {
    setBgmBusy(kind);
    await adminFetch(`/api/admin/trips/${tripId}/bgm`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kind }),
    });
    await load();
    setBgmBusy(null);
  }

  if (!trip) {
    return (
      <main className="mx-auto max-w-md px-5 py-8">
        <p className="text-sm text-neutral-400">読み込み中…</p>
      </main>
    );
  }

  const inputCls =
    "w-full rounded-xl border border-neutral-300 bg-white px-4 py-3 outline-none focus:border-neutral-500";
  const labelCls = "mb-1.5 block text-sm font-medium text-neutral-600";

  return (
    <main className="mx-auto min-h-dvh max-w-md px-5 py-8">
      <header className="mb-6 flex items-center justify-between">
        <Link href="/admin" className="text-sm text-neutral-400">
          ← 一覧
        </Link>
        <div className="flex gap-2">
          <Link
            href={`/admin/trips/${tripId}/dashboard`}
            className="rounded-lg border border-neutral-300 px-4 py-2 text-sm font-medium"
          >
            ダッシュボード
          </Link>
          <Link
            href={`/admin/trips/${tripId}/spots`}
            className="rounded-lg border border-neutral-300 px-4 py-2 text-sm font-medium"
          >
            スポット編集 →
          </Link>
        </div>
      </header>

      <div className="space-y-5">
        <div>
          <label className={labelCls}>タイトル</label>
          <input
            className={inputCls}
            value={trip.title}
            onChange={(e) => set("title", e.target.value)}
          />
        </div>
        <div>
          <label className={labelCls}>旅行日</label>
          <input
            type="date"
            className={inputCls}
            value={trip.date ?? ""}
            onChange={(e) => set("date", e.target.value || null)}
          />
        </div>
        <div>
          <label className={labelCls}>合言葉</label>
          <input
            className={inputCls}
            value={trip.passphrase}
            onChange={(e) => set("passphrase", e.target.value)}
          />
        </div>
        <div>
          <label className={labelCls}>オープニングの手紙</label>
          <textarea
            className={inputCls}
            rows={6}
            value={trip.opening_letter}
            onChange={(e) => set("opening_letter", e.target.value)}
          />
        </div>
        <div>
          <label className={labelCls}>エンディングの手紙</label>
          <textarea
            className={inputCls}
            rows={6}
            value={trip.ending_letter}
            onChange={(e) => set("ending_letter", e.target.value)}
          />
        </div>
        <div>
          <label className={labelCls}>通知先メールアドレス</label>
          <input
            type="email"
            className={inputCls}
            placeholder="写真が届いたら通知します"
            value={trip.notify_email ?? ""}
            onChange={(e) => set("notify_email", e.target.value || null)}
          />
        </div>

        {(["opening", "ending"] as const).map((kind) => {
          const path = kind === "opening" ? trip.opening_bgm_path : trip.ending_bgm_path;
          const label = kind === "opening" ? "オープニングBGM" : "エンディングBGM";
          return (
            <div key={kind}>
              <label className={labelCls}>{label}</label>
              {path ? (
                <div className="flex items-center justify-between rounded-xl border border-neutral-200 bg-white px-4 py-3">
                  <span className="truncate text-sm text-neutral-600">
                    {path.split("/").pop()}
                  </span>
                  <button
                    onClick={() => removeBgm(kind)}
                    disabled={bgmBusy === kind}
                    className="ml-3 shrink-0 text-xs text-red-500"
                  >
                    削除
                  </button>
                </div>
              ) : (
                <label className="block cursor-pointer rounded-xl border border-dashed border-neutral-300 px-4 py-3 text-center text-sm text-neutral-400">
                  {bgmBusy === kind ? "アップロード中…" : "音源ファイルを選ぶ(mp3など)"}
                  <input
                    type="file"
                    accept="audio/*"
                    className="hidden"
                    disabled={bgmBusy !== null}
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      e.target.value = "";
                      if (f) void uploadBgm(kind, f);
                    }}
                  />
                </label>
              )}
              {kind === "ending" && !path && (
                <p className="mt-1 text-xs text-neutral-400">
                  未設定ならオープニング曲を流用します
                </p>
              )}
            </div>
          );
        })}
      </div>

      <div className="sticky bottom-4 mt-8">
        <button
          onClick={save}
          disabled={busy}
          className="w-full rounded-xl bg-neutral-800 py-3.5 font-medium text-white shadow-lg disabled:opacity-40"
        >
          {busy ? "保存中…" : saved ? "保存した!" : "保存する"}
        </button>
      </div>
    </main>
  );
}
