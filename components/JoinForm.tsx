// タグ(+必要ならパスワード)を入力して旅に参加する
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Icon from "@/components/ui/Icon";

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

  return (
    <form onSubmit={submit} className="space-y-4">
      <div>
        <label htmlFor="join-code" className="field-label">
          旅の参加コード
        </label>
        <input
          id="join-code"
          type="text"
          value={tag}
          onChange={(e) => {
            setTag(e.target.value);
            setError(null);
          }}
          placeholder="例：A3K9PZ7M"
          autoCapitalize="characters"
          autoCorrect="off"
          spellCheck={false}
          aria-invalid={!!error}
          aria-describedby={error ? "join-error" : undefined}
          className="field font-mono tracking-[0.2em]"
        />
      </div>
      {needPassword && (
        <div>
          <label htmlFor="join-password" className="field-label">
            旅のパスワード
          </label>
          <input
            id="join-password"
            type="password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setError(null);
            }}
            placeholder="パスワード"
            className="field"
          />
        </div>
      )}
      {error && (
        <p id="join-error" role="alert" className="error-note">
          {error}
        </p>
      )}
      <button
        type="submit"
        disabled={busy || tag.trim() === ""}
        className="button-primary w-full justify-between"
      >
        {busy ? "確認しています…" : "旅に参加する"}
        <Icon name="arrow" />
      </button>
    </form>
  );
}
