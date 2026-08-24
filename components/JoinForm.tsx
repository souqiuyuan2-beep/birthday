// タグ(+必要ならパスワード)を入力して旅に参加する
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

export default function JoinForm() {
  const router = useRouter();
  const [tag, setTag] = useState("");
  const [password, setPassword] = useState("");
  const [needPassword, setNeedPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy || tag.trim() === "") return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tag, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        // パスワードが必要な旅なら、入力欄を出して再挑戦してもらう
        if (data.needPassword) setNeedPassword(true);
        setError(data.error ?? "参加できませんでした");
        setBusy(false);
        return;
      }
      router.replace(`/t/${data.slug}`);
    } catch {
      setError("通信エラーが起きました");
      setBusy(false);
    }
  }

  const inputCls =
    "w-full rounded-2xl border bg-white/90 px-5 py-4 text-center outline-none transition-all";

  return (
    <motion.form
      onSubmit={submit}
      animate={error ? { x: [0, -8, 8, -6, 6, 0] } : {}}
      transition={{ duration: 0.4 }}
      className="space-y-3"
    >
      <input
        type="text"
        value={tag}
        onChange={(e) => {
          setTag(e.target.value);
          setError(null);
        }}
        placeholder="タグ(例: A3K9PZ7M)"
        autoCapitalize="characters"
        autoCorrect="off"
        spellCheck={false}
        className={
          inputCls +
          " text-lg tracking-[0.3em] " +
          (error ? "border-red-300" : "border-neutral-200 focus:border-theme")
        }
      />
      {needPassword && (
        <input
          type="password"
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            setError(null);
          }}
          placeholder="パスワード"
          className={inputCls + " border-neutral-200 focus:border-theme"}
        />
      )}
      {error && <p className="text-center text-sm text-red-400">{error}</p>}
      <button
        type="submit"
        disabled={busy || tag.trim() === ""}
        className="w-full rounded-2xl bg-theme py-4 text-base font-medium text-white shadow-md transition-transform active:scale-[0.98] disabled:opacity-40"
      >
        {busy ? "確認しています…" : "旅に参加する"}
      </button>
    </motion.form>
  );
}
