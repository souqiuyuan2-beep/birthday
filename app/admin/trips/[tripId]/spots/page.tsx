// A4: スポット・ミッション編集
// - 追加・編集・削除・並び替え(上下ボタン、番目グループ単位)。sort_order を更新
// - 「選択肢を追加」で同じ番目に2つ目のスポット → 彼女がどちらか選ぶ2択になる
// - 番目グループに「旅行先」チェックを付けると、その選択肢がドロワーに並び、
//   旅行先ごとの分岐スポットだけを集めて編集できる(複数の行き先でも見やすい)
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
  // ドロワーの開閉と、いま編集している旅行先(null = 旅全体)
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [viewSpotId, setViewSpotId] = useState<string | null>(null);
  // 開いて編集中のスポット。普段は一覧をコンパクトに見せ、必要な1件だけ開く
  const [openSpotId, setOpenSpotId] = useState<string | null>(null);

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

  // 同じ sort_order + 同じ親 のスポットを「番目グループ」にまとめる。
  // 分岐(親つき)は親ごとに別グループとして並べる
  const groups = useMemo(() => {
    const byKey = new Map<string, Spot[]>();
    for (const s of spots ?? []) {
      const key = `${s.sort_order}:${s.parent_spot_id ?? ""}`;
      const list = byKey.get(key) ?? [];
      list.push(s);
      byKey.set(key, list);
    }
    return [...byKey.values()].sort(
      (a, b) => a[0].sort_order - b[0].sort_order
    );
  }, [spots]);

  // 分岐の見出し用に、スポットidから名前を引けるようにする
  const spotName = useMemo(
    () => new Map((spots ?? []).map((s) => [s.id, s.name])),
    [spots]
  );

  // 「旅行先」チェックが付いたグループの選択肢 = ドロワーに並ぶ行き先
  const destinations = useMemo(
    () => (spots ?? []).filter((s) => s.is_destination),
    [spots]
  );

  // 表示するグループ:
  //   旅全体ビュー → 分岐でないグループ(旅の骨格)
  //   旅行先ビュー → その行き先にぶら下がる分岐だけ
  const visibleGroups = useMemo(() => {
    if (viewSpotId) {
      return groups.filter((g) => g[0].parent_spot_id === viewSpotId);
    }
    return groups.filter((g) => !g[0].parent_spot_id);
  }, [groups, viewSpotId]);

  // 選択中の旅行先が消えたら旅全体ビューに戻す
  useEffect(() => {
    if (viewSpotId && !destinations.some((d) => d.id === viewSpotId)) {
      setViewSpotId(null);
    }
  }, [viewSpotId, destinations]);

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

  // 番目グループを「旅行先を選ぶステップ」にする / 解除する
  async function toggleDestination(sortOrder: number, isDestination: boolean) {
    setBusy(true);
    const res = await adminFetch(`/api/admin/trips/${tripId}/destination`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sortOrder, isDestination }),
    });
    if (!res.ok) alert("変更できませんでした");
    await load();
    setBusy(false);
  }

  // このスポットが選ばれた時だけ出る「次の質問」を足す
  async function addBranch(parentSpotId: string) {
    setBusy(true);
    const res = await adminFetch(`/api/admin/trips/${tripId}/spots`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ parentSpotId }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      alert(data.error ?? "分岐を追加できませんでした");
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
        photo_required: spot.photo_required,
        complete_label: spot.complete_label || null,
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

  // 並び替えは全体の並び(groups)に対して行う。
  // 画面には絞り込んだグループを出しているので、まず全体での位置に直す
  async function moveGroup(visibleIndex: number, dir: -1 | 1) {
    const target0 = visibleGroups[visibleIndex];
    const index = groups.findIndex((g) => g[0].id === target0[0].id);
    const target = index + dir;
    if (index < 0 || target < 0 || target >= groups.length) return;
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

  const viewingName = viewSpotId ? spotName.get(viewSpotId) : null;

  return (
    <main className="mx-auto min-h-dvh max-w-md px-5 py-8">
      <header className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {/* 旅行先の切り替え(ドロワー) */}
          <button
            onClick={() => setDrawerOpen(true)}
            className="flex items-center gap-1.5 rounded-lg border border-neutral-300 px-3 py-2 text-sm"
          >
            ☰ <span className="text-xs">切替</span>
          </button>
          <Link
            href={`/admin/trips/${tripId}`}
            className="text-sm text-neutral-400"
          >
            ← 旅行編集
          </Link>
        </div>
        <button
          onClick={addGroup}
          disabled={busy}
          className="rounded-lg bg-neutral-800 px-4 py-2 text-sm font-medium text-white disabled:opacity-40"
        >
          + スポット追加
        </button>
      </header>

      {/* いまどこを編集しているか */}
      <div className="mb-5 rounded-xl bg-neutral-100 px-4 py-2.5 text-sm">
        {viewingName ? (
          <span className="text-violet-700">
            「{viewingName}」を選んだ時のスポット
          </span>
        ) : (
          <span className="text-neutral-600">旅全体の流れ</span>
        )}
      </div>

      {/* ドロワー */}
      {drawerOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/30"
          onClick={() => setDrawerOpen(false)}
        >
          <div
            className="h-full w-72 overflow-y-auto bg-white p-5 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="mb-4 text-sm font-semibold text-neutral-700">
              編集する場所
            </p>
            <button
              onClick={() => {
                setViewSpotId(null);
                setDrawerOpen(false);
              }}
              className={
                "mb-2 w-full rounded-lg px-3 py-2.5 text-left text-sm " +
                (viewSpotId === null
                  ? "bg-neutral-800 text-white"
                  : "border border-neutral-200 text-neutral-700")
              }
            >
              旅全体の流れ
            </button>

            {destinations.length > 0 && (
              <>
                <p className="mb-2 mt-5 text-xs text-neutral-400">
                  旅行先ごとの分岐
                </p>
                <ul className="space-y-2">
                  {destinations.map((d) => (
                    <li key={d.id}>
                      <button
                        onClick={() => {
                          setViewSpotId(d.id);
                          setDrawerOpen(false);
                        }}
                        className={
                          "w-full rounded-lg px-3 py-2.5 text-left text-sm " +
                          (viewSpotId === d.id
                            ? "bg-violet-600 text-white"
                            : "border border-violet-200 text-violet-700")
                        }
                      >
                        {d.name}
                      </button>
                    </li>
                  ))}
                </ul>
              </>
            )}

            {destinations.length === 0 && (
              <p className="mt-5 text-xs leading-relaxed text-neutral-400">
                番目グループの「旅行先」にチェックを入れると、
                ここに行き先が並びます。
              </p>
            )}
          </div>
        </div>
      )}

      {spots === null ? (
        <p className="text-sm text-neutral-400">読み込み中…</p>
      ) : visibleGroups.length === 0 ? (
        <p className="text-sm text-neutral-400">
          {viewSpotId
            ? "この行き先の分岐はまだありません。旅全体の流れから「↳ これを選んだ時の質問を追加」で作れます。"
            : "まだスポットがありません"}
        </p>
      ) : (
        <ol className="space-y-6">
          {visibleGroups.map((options, gi) => {
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
                    {options[0].parent_spot_id ? (
                      <span className="text-violet-700">
                        ↳「{spotName.get(options[0].parent_spot_id) ?? "?"}
                        」を選んだ時
                      </span>
                    ) : (
                      `${gi + 1}番目`
                    )}
                    {isPair && (
                      <span className="ml-2 rounded bg-sky-100 px-1.5 py-0.5 text-xs font-medium text-sky-700">
                        {options.length}択{" "}
                        {chosenSpot ? `(「${chosenSpot.name}」を選択済み)` : "(未選択)"}
                      </span>
                    )}
                  </span>
                  <div className="flex items-center gap-2">
                    {/* このグループを「旅行先を選ぶステップ」にする */}
                    <label className="flex items-center gap-1 text-xs text-neutral-500">
                      <input
                        type="checkbox"
                        checked={options[0].is_destination}
                        disabled={busy}
                        onChange={(e) =>
                          toggleDestination(
                            options[0].sort_order,
                            e.target.checked
                          )
                        }
                      />
                      旅行先
                    </label>
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
                        disabled={gi === visibleGroups.length - 1 || busy}
                        className="rounded-md border border-neutral-300 px-2.5 py-1 text-sm disabled:opacity-30"
                        aria-label="下へ"
                      >
                        ↓
                      </button>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  {options.map((spot, oi) => (
                    <div
                      key={spot.id}
                      className="overflow-hidden rounded-xl border border-neutral-200 bg-white"
                    >
                      {/* 見出し行。タップで詳細を開閉する(普段は畳んで一覧を見やすく) */}
                      <button
                        onClick={() =>
                          setOpenSpotId((id) => (id === spot.id ? null : spot.id))
                        }
                        className="flex w-full items-center gap-2 px-4 py-3 text-left"
                      >
                        <span className="text-xs text-neutral-400">
                          {openSpotId === spot.id ? "▾" : "▸"}
                        </span>
                        {isPair && (
                          <span className="text-xs font-medium text-neutral-400">
                            {String.fromCharCode(65 + oi)}
                          </span>
                        )}
                        <span className="min-w-0 flex-1 truncate text-sm font-medium text-neutral-800">
                          {spot.name || "(名前なし)"}
                        </span>
                        {doneIds.has(spot.id) && (
                          <span className="shrink-0 rounded bg-amber-100 px-1.5 py-0.5 text-xs text-amber-700">
                            達成済み
                          </span>
                        )}
                        {isPair && spot.chosen && (
                          <span className="shrink-0 rounded bg-sky-100 px-1.5 py-0.5 text-xs text-sky-700">
                            選択中
                          </span>
                        )}
                        {spot.is_destination && (
                          <span className="shrink-0 rounded bg-violet-100 px-1.5 py-0.5 text-xs text-violet-700">
                            旅行先
                          </span>
                        )}
                      </button>

                      {openSpotId === spot.id && (
                      <div className="space-y-2.5 border-t border-neutral-100 p-4">
                        <input
                          className={inputCls}
                          placeholder="スポット名"
                          value={spot.name}
                          onChange={(e) => setField(spot.id, "name", e.target.value)}
                        />
                        <div className="flex flex-wrap gap-x-4 gap-y-1.5">
                          <label className="flex items-center gap-1.5 text-xs text-neutral-600">
                            <input
                              type="checkbox"
                              checked={spot.reveal_name}
                              onChange={(e) =>
                                setField(spot.id, "reveal_name", e.target.checked)
                              }
                            />
                            名前を先に見せる
                          </label>
                          <label className="flex items-center gap-1.5 text-xs text-neutral-600">
                            <input
                              type="checkbox"
                              checked={spot.photo_required}
                              onChange={(e) =>
                                setField(spot.id, "photo_required", e.target.checked)
                              }
                            />
                            写真を必須にする
                          </label>
                        </div>
                        {/* 写真不要のときだけ、達成ボタンの文言を自由に決められる */}
                        {!spot.photo_required && (
                          <input
                            className={inputCls}
                            placeholder="達成ボタンの文言(既定: ここに来た!)"
                            value={spot.complete_label ?? ""}
                            onChange={(e) =>
                              setField(spot.id, "complete_label", e.target.value)
                            }
                          />
                        )}
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

                        <div className="flex justify-between pt-1">
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

                        {/* 旅行先の選択肢には、その行き先だけの分岐を足せる */}
                        {spot.is_destination && (
                          <button
                            onClick={() => addBranch(spot.id)}
                            disabled={busy}
                            className="w-full rounded-lg border border-dashed border-violet-300 py-2 text-xs text-violet-700 disabled:opacity-40"
                          >
                            ↳「{spot.name}」を選んだ時の質問を追加
                          </button>
                        )}
                      </div>
                      )}
                    </div>
                  ))}
                </div>

                {options.length < 5 && (
                  <button
                    onClick={() => addOption(options[0].sort_order)}
                    disabled={busy}
                    className="mt-2 w-full rounded-xl border border-dashed border-neutral-300 py-2.5 text-sm text-neutral-500 disabled:opacity-40"
                  >
                    {isPair ? "+ 選択肢を追加" : "+ 選択肢を追加(選ばせる)"}
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
