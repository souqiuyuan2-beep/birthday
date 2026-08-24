// ログイン / 新規登録
// メールアドレスとパスワードで認証する(Supabase Auth)
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/browser";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setMessage(null);
    const supabase = createClient();

    if (mode === "signup") {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) {
        setMessage(
          error.message.includes("already")
            ? "このメールアドレスは登録済みです"
            : "登録できませんでした。入力を確認してください"
        );
        setBusy(false);
        return;
      }
      setMessage("確認メールを送りました。メール内のリンクを開いてください");
      setBusy(false);
      return;
    }

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setMessage("メールアドレスかパスワードが違います");
      setBusy(false);
      return;
    }
    router.replace("/");
    router.refresh();
  }

  const inputCls =
    "w-full rounded-2xl border border-neutral-200 bg-white/90 px-5 py-4 outline-none transition-all focus:border-theme";

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-8">
      <h1 className="text-center font-serif text-xl font-semibold tracking-[0.2em] text-neutral-700">
        ふたりの旅
      </h1>
      <p className="mt-3 text-center text-sm text-neutral-500">
        {mode === "login" ? "ログインしてはじめる" : "アカウントを作る"}
      </p>

      <form onSubmit={submit} className="mt-8 space-y-3">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="メールアドレス"
          autoComplete="email"
          required
          className={inputCls}
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="パスワード(6文字以上)"
          autoComplete={mode === "login" ? "current-password" : "new-password"}
          minLength={6}
          required
          className={inputCls}
        />
        {message && (
          <p className="text-center text-sm text-neutral-600">{message}</p>
        )}
        <button
          type="submit"
          disabled={busy}
          className="w-full rounded-2xl bg-theme py-4 text-base font-medium text-white shadow-md transition-transform active:scale-[0.98] disabled:opacity-40"
        >
          {busy ? "確認しています…" : mode === "login" ? "ログイン" : "登録する"}
        </button>
      </form>

      <button
        onClick={() => {
          setMode(mode === "login" ? "signup" : "login");
          setMessage(null);
        }}
        className="mt-8 text-center text-sm text-neutral-400 underline underline-offset-4"
      >
        {mode === "login"
          ? "アカウントをお持ちでない方はこちら"
          : "すでにアカウントをお持ちの方はこちら"}
      </button>
    </main>
  );
}
