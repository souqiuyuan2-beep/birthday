// A4: スポット・ミッション編集
// - 追加・編集・削除・並び替え(上下ボタン、番目グループ単位)。sort_order を更新
// - 「選択肢を追加」で同じ番目に2つ目のスポット → 彼女がどちらか選ぶ2択になる
// - 保存すると彼女側に即反映。達成済みスポットの編集は警告を表示
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { adminFetch } from "@/lib/admin-client";
import type { Spot } from "@/lib/supabase/types";

export default function SpotsEditPage() {
  const { tripId } = useParams<{ tripId: string }>();
  const [spots, setSpots] = useState<Spot[] | null>(null);
  const [doneIds, setDoneIds] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);
  const [savedId, setSavedId] = useState<string | null>(null);

  const load = useCallback(async () => {
    const res = await adminFetch(`/api/admin/trips/${tripId}`);
    if (res.ok) {
      const data = await res.json();
      setSpots(data.spots);
      setDoneIds(new Set(data.doneSpotIds));
    }
  }, [tripId]);

  useEffect(() => {
    void load();
  }, [load]);

  // 同じ sort_order のスポットを「番目グループ」にまとめる
  const groups = useMemo(() => {
    const byOrder = new Map<number, Spot[]>();
    for (const s of spots ?? []) {
      const list = byOrder.get(s.sort_order) ?? [];
      list.push(s);
      byOrder.set(s.sort_order, list);
    }
    return [...byOrder.entries()]
      .sort((a, b) => a[0] - b[0])
      .map(([, options]) => options);
  }, [spots]);

  function setField<K extends keyof Spot>(id: string, key: K, value: Spot[K]) {
    setSpots((list) =>
      (list ?? []).map((s) => (s.id === id ? { ...s, [key]: value } : s))
    );
  }

  async function addGroup() {
    setBusy(true);
    await adminFetch(`/api/admin/trips/${tripId}/spots`, { method: "POST" });
    await load();
    setBusy(false);
  }

  async function addOption(sortOrder: number) {
    setBusy(true);
    const res = await adminFetch(`/api/admin/trips/${tripId}/spots`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sortOrder }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      alert(data.error ?? "選択肢を追加できませんでした");
    }
    await load();
    setBusy(false);
  }

  async function saveSpot(spot: Spot) {
    if (
      doneIds.has(spot.id) &&
      !confirm("このスポットは達成済みです。編集すると彼女側の表示も変わりますが保存しますか?")
    ) {
      return;
    }
    setBusy(true);
    const res = await adminFetch(`/api/admin/spots/${spot.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: spot.name,
        reveal_name: spot.reveal_name,
        mission: spot.mission,
        hint: spot.hint || null,
        message: spot.message || null,
      }),
    });
    if (res.ok) {
      setSavedId(spot.id);
      setTimeout(() => setSavedId(null), 1500);
    }
    setBusy(false);
  }

  async function deleteSpot(spot: Spot, isPair: boolean) {
    const warn = doneIds.has(spot.id)
      ? "このスポットは達成済みで写真もあります。削除すると写真も消えます。削除しますか?"
      : isPair
        ? `選択肢「${spot.name}」を削除しますか?(残った方が通常スポットになります)`
        : `「${spot.name}」を削除しますか?`;
    if (!confirm(warn)) return;
    setBusy(true);
    await adminFetch(`/api/admin/spots/${spot.id}`, { method: "DELETE" });
    await load();
    setBusy(false);
  }

  async function moveGroup(index: number, dir: -1 | 1) {
    const target = index + dir;
    if (target < 0 || target >= groups.length) return;
    const next = [...groups];
    [next[index], next[target]] = [next[target], next[index]];
    // 楽観的更新: sort_orderを振り直したspots配列を作る
    setSpots(
      next.flatMap((options, i) =>
        options.map((s) => ({ ...s, sort_order: i + 1 }))
      )
    );
    await adminFetch(`/api/admin/trips/${tripId}/spots`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderedGroups: next.map((g) => g.map((s) => s.id)) }),
    });
  }

  const inputCls =
    "w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm outline-none focus:border-neutral-500";

  return (
    <main className="mx-auto min-h-dvh max-w-md px-5 py-8">
      <header className="mb-6 flex items-center justify-between">
        <Link href={`/admin/trips/${tripId}`} className="text-sm text-neutral-400">
          ← 旅行編集
        </Link>
        <button
          onClick={addGroup}
          disabled={busy}
          className="rounded-lg bg-neutral-800 px-4 py-2 text-sm font-medium text-white disabled:opacity-40"
        >
          + スポット追加
        </button>
      </header>

      {spots === null ? (
        <p className="text-sm text-neutral-400">読み込み中…</p>
      ) : groups.length === 0 ? (
        <p className="text-sm text-neutral-400">まだスポットがありません</p>
      ) : (
        <ol className="space-y-6">
          {groups.map((options, gi) => {
            const isPair = options.length > 1;
            const chosenSpot = isPair ? options.find((o) => o.chosen) : null;
            return (
              <li
                key={options[0].id}
                className={
                  "rounded-2xl p-3 " +
                  (isPair ? "border-2 border-dashed border-neutral-300" : "")
                }
              >
                <div className="mb-2 flex items-center justify-between px-1">
                  <span className="text-sm font-semibold text-neutral-500">
                    {gi + 1}番目
                    {isPair && (
                      <span className="ml-2 rounded bg-sky-100 px-1.5 py-0.5 text-xs font-medium text-sky-700">
                        2択 {chosenSpot ? `(「${chosenSpot.name}」を選択済み)` : "(未選択)"}
                      </span>
                    )}
                  </span>
                  <div className="flex gap-1">
                    <button
                      onClick={() => moveGroup(gi, -1)}
                      disabled={gi === 0 || busy}
                      className="rounded-md border border-neutral-300 px-2.5 py-1 text-sm disabled:opacity-30"
                      aria-label="上へ"
                    >
                      ↑
                    </button>
                    <button
                      onClick={() => moveGroup(gi, 1)}
                      disabled={gi === groups.length - 1 || busy}
                      className="rounded-md border border-neutral-300 px-2.5 py-1 text-sm disabled:opacity-30"
                      aria-label="下へ"
                    >
                      ↓
                    </button>
                  </div>
                </div>

                <div className="space-y-3">
                  {options.map((spot, oi) => (
                    <div
                      key={spot.id}
                      className="rounded-xl border border-neutral-200 bg-white p-4"
                    >
                      <div className="mb-2 flex items-center gap-2 text-xs font-medium text-neutral-400">
                        {isPair && <span>選択肢{String.fromCharCode(65 + oi)}</span>}
                        {doneIds.has(spot.id) && (
                          <span className="rounded bg-amber-100 px-1.5 py-0.5 text-amber-700">
                            達成済み
                          </span>
                        )}
                        {isPair && spot.chosen && (
                          <span className="rounded bg-sky-100 px-1.5 py-0.5 text-sky-700">
                            彼女が選択
                          </span>
                        )}
                      </div>

                      <div className="space-y-2.5">
                        <input
                          className={inputCls}
                          placeholder="スポット名"
                          value={spot.name}
                          onChange={(e) => setField(spot.id, "name", e.target.value)}
                        />
                        <label className="flex items-center gap-2 text-sm text-neutral-600">
                          <input
                            type="checkbox"
                            checked={spot.reveal_name}
                            onChange={(e) =>
                              setField(spot.id, "reveal_name", e.target.checked)
                            }
                          />
                          スポット名を事前に見せる
                        </label>
                        <textarea
                          className={inputCls}
                          rows={2}
                          placeholder="ミッション本文"
                          value={spot.mission}
                          onChange={(e) => setField(spot.id, "mission", e.target.value)}
                        />
                        <input
                          className={inputCls}
                          placeholder="ヒント(任意)"
                          value={spot.hint ?? ""}
                          onChange={(e) => setField(spot.id, "hint", e.target.value)}
                        />
                        <input
                          className={inputCls}
                          placeholder="一言メッセージ(任意)"
                          value={spot.message ?? ""}
                          onChange={(e) => setField(spot.id, "message", e.target.value)}
                        />
                      </div>

                      <div className="mt-3 flex justify-between">
                        <button
                          onClick={() => deleteSpot(spot, isPair)}
                          disabled={busy}
                          className="text-xs text-red-500"
                        >
                          削除
                        </button>
                        <button
                          onClick={() => saveSpot(spot)}
                          disabled={busy}
                          className="rounded-lg bg-neutral-800 px-4 py-1.5 text-sm font-medium text-white disabled:opacity-40"
                        >
                          {savedId === spot.id ? "保存した!" : "保存"}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {!isPair && (
                  <button
                    onClick={() => addOption(options[0].sort_order)}
                    disabled={busy}
                    className="mt-2 w-full rounded-xl border border-dashed border-neutral-300 py-2.5 text-sm text-neutral-500 disabled:opacity-40"
                  >
                    + 選択肢を追加(2択にする)
                  </button>
                )}
              </li>
            );
          })}
        </ol>
      )}
    </main>
  );
}
