// トップページ: 合言葉だけで入場できる入口(招待状の入り口の世界観)
// 合言葉から旅を逆引き(/api/enter)し、一致したら /t/[slug] へ。
// 旅の情報は合言葉が合うまで一切出さない
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { saveTripToken } from "@/lib/auth-client";
import { hasSeenOpening } from "@/lib/opening";
import Sparkles from "@/components/girlfriend/Sparkles";

export default function EntryPage() {
  const router = useRouter();
  const [passphrase, setPassphrase] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy || passphrase === "") return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/enter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ passphrase }),
      });
      if (!res.ok) {
        setError("合言葉が違うみたい");
        return;
      }
      const { slug, token, hasOpening } = (await res.json()) as {
        slug: string;
        token: string;
        hasOpening: boolean;
      };
      saveTripToken(slug, token);
      // 初回だけオープニング(手紙)へ。2回目以降はホームへ直行
      if (hasOpening && !hasSeenOpening(slug)) {
        router.replace(`/t/${slug}/opening`);
      } else {
        router.replace(`/t/${slug}`);
      }
    } catch {
      setError("通信エラーが起きたみたい。もう一度試してね");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="relative mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center px-8">
      <Sparkles count={18} />

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, ease: "easeOut" }}
        className="relative z-10 flex w-full flex-col items-center"
      >
        <span
          aria-hidden
          className="mb-6 text-4xl"
          style={{ animation: "floaty 3.2s ease-in-out infinite" }}
        >
          ✉️
        </span>
        <h1 className="font-serif text-xl font-semibold tracking-[0.2em] text-neutral-700">
          ふたりの旅へ
        </h1>
        <p className="mt-3 text-center text-sm leading-relaxed text-neutral-500">
          二人だけの合言葉を入力してください
        </p>

        <motion.form
          onSubmit={submit}
          className="mt-8 w-full"
          animate={error ? { x: [0, -8, 8, -6, 6, 0] } : {}}
          transition={{ duration: 0.4 }}
        >
          <input
            type="text"
            value={passphrase}
            onChange={(e) => {
              setPassphrase(e.target.value);
              setError(null);
            }}
            autoFocus
            autoComplete="off"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            className={
              "w-full rounded-2xl border bg-white/90 px-5 py-4 text-center text-lg tracking-widest shadow-sm outline-none transition-all " +
              (error
                ? "border-red-300"
                : "border-neutral-200 focus:border-theme focus:shadow-[0_0_0_4px_rgba(168,216,234,0.25)]")
            }
          />
          {error && (
            <p className="mt-3 text-center text-sm text-red-400">{error}</p>
          )}
          <button
            type="submit"
            disabled={busy || passphrase === ""}
            className="mt-6 w-full rounded-2xl bg-theme py-4 text-base font-medium text-white shadow-md transition-all active:scale-[0.98] disabled:opacity-40"
          >
            {busy ? "確かめています…" : "扉を開く"}
          </button>
        </motion.form>
      </motion.div>
    </main>
  );
}
