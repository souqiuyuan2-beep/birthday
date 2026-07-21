// 2択スポットの選択UI(クライアント側)
// - 2枚のカードからタップで選ぶ(選んだ方に丸が付く)→「ここにする!」で確定
// - 確定後は選んだスポットのミッションへ。一度確定したら選び直せない
"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { getTripToken } from "@/lib/auth-client";
import Sparkles from "@/components/girlfriend/Sparkles";

type Option = {
  id: string;
  displayName: string;
  mission: string;
  message: string | null;
};

export default function ChoiceCards({
  options,
  initialSelectedId = null,
}: {
  options: Option[];
  initialSelectedId?: string | null;
}) {
  const { slug } = useParams<{ slug: string }>();
  const router = useRouter();
  const [selectedId, setSelectedId] = useState<string | null>(initialSelectedId);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);

  async function confirm() {
    if (!selectedId || busy) return;
    const token = getTripToken(slug);
    if (!token) {
      router.replace("/");
      return;
    }
    setBusy(true);
    setError(false);
    try {
      const res = await fetch(`/api/t/${slug}/choose`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ spotId: selectedId }),
      });
      if (!res.ok) {
        setError(true);
        return;
      }
      router.replace(`/t/${slug}/mission/${selectedId}`);
    } catch {
      setError(true);
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="relative mx-auto flex min-h-dvh max-w-md flex-col px-6 py-8">
      <Sparkles count={10} />
      <button
        onClick={() => router.push(`/t/${slug}`)}
        className="relative z-10 mb-6 self-start text-sm text-neutral-400"
      >
        ← 戻る
      </button>

      <h1 className="relative z-10 text-center font-serif text-xl font-semibold tracking-widest">
        どっちに行く?
      </h1>
      <p className="mt-2 text-center text-sm text-neutral-500">
        好きな方を選んでね
      </p>

      <div className="relative z-10 mt-8 space-y-4">
        {options.map((option) => {
          const selected = option.id === selectedId;
          return (
            <button
              key={option.id}
              onClick={() => setSelectedId(option.id)}
              className={
                "relative w-full rounded-3xl border-2 bg-white p-6 text-left transition-all active:scale-[0.99] " +
                (selected
                  ? "border-theme shadow-[0_4px_20px_rgba(168,216,234,0.45)]"
                  : "border-neutral-200 shadow-sm")
              }
            >
              <span className="block font-serif text-lg font-semibold tracking-wide">
                {option.displayName}
              </span>
              <span className="mt-2 block text-sm leading-relaxed text-neutral-600">
                {option.mission}
              </span>
              {option.message && (
                <span className="mt-2 block text-xs leading-relaxed text-neutral-400">
                  {option.message}
                </span>
              )}
              {selected && (
                <motion.span
                  initial={{ scale: 1.6, opacity: 0, rotate: -12 }}
                  animate={{ scale: 1, opacity: 1, rotate: -6 }}
                  transition={{ type: "spring", stiffness: 300, damping: 16 }}
                  className="absolute -right-2 -top-2 flex h-10 w-10 items-center justify-center rounded-full border-[3px] border-theme bg-white text-lg"
                >
                  ✓
                </motion.span>
              )}
            </button>
          );
        })}
      </div>

      {error && (
        <p className="mt-4 text-center text-sm text-red-400">
          うまく選べなかったみたい。もう一度試してね
        </p>
      )}

      <div className="mt-auto pt-8">
        <button
          onClick={confirm}
          disabled={!selectedId || busy}
          className="w-full rounded-2xl bg-theme py-4 text-base font-medium text-white transition-opacity disabled:opacity-40"
        >
          {busy ? "決めています…" : "ここにする!"}
        </button>
      </div>
    </main>
  );
}
