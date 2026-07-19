// A1: 管理者ログイン
// - ADMIN_PASSWORD(環境変数)とサーバー側で照合。認証状態は localStorage 保持
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { saveAdminToken } from "@/lib/admin-client";

export default function AdminLoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy || password === "") return;
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "ログインできませんでした");
        return;
      }
      saveAdminToken(data.token);
      router.replace("/admin");
    } catch {
      setError("通信エラーが起きました");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-8">
      <h1 className="mb-8 text-center text-lg font-semibold">管理者ログイン</h1>
      <form onSubmit={submit}>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="パスワード"
          autoFocus
          className="w-full rounded-xl border border-neutral-300 bg-white px-4 py-3 outline-none focus:border-neutral-500"
        />
        {error && <p className="mt-3 text-sm text-red-500">{error}</p>}
        <button
          type="submit"
          disabled={busy || password === ""}
          className="mt-5 w-full rounded-xl bg-neutral-800 py-3 font-medium text-white disabled:opacity-40"
        >
          ログイン
        </button>
      </form>
    </main>
  );
}
