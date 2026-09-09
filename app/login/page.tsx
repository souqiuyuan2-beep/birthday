// ログイン / 新規登録
// メールアドレスとパスワードで認証する(Supabase Auth)
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/browser";
import { Wordmark } from "@/components/ui/JournalHeader";
import Icon from "@/components/ui/Icon";

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
            : "登録できませんでした。入力を確認してください",
        );
        setBusy(false);
        return;
      }
      setMessage("確認メールを送りました。メール内のリンクを開いてください");
      setBusy(false);
      return;
    }

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) {
      setMessage("メールアドレスかパスワードが違います");
      setBusy(false);
      return;
    }
    router.replace("/");
    router.refresh();
  }

  return (
    <main className="journal-page login-page">
      <header className="masthead">
        <Wordmark />
        <span className="edition">A JOURNAL FOR TWO</span>
        <a href="#login-title" className="login-jump">
          {mode === "login" ? "ログインへ" : "登録へ"} →
        </a>
      </header>
      <div className="login-layout">
        <section className="login-intro">
          <p className="eyebrow">旅を贈る、思い出を残す。</p>
          <h1>
            いつか思い出す、
            <br />
            今日をふたりで。
          </h1>
          <figure>
            {/* 公開用の風景写真。利用者の個人写真は入口に使用しない。 */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/images/train-window.jpg"
              alt="列車の窓の向こうに広がる、穏やかな海"
              width="1400"
              height="933"
              className="travel-photo"
              fetchPriority="high"
            />
            <figcaption className="photo-caption">
              <span>車窓から、旅が始まる。</span>
              <a
                href="https://unsplash.com/photos/E401NBqwIGg"
                target="_blank"
                rel="noreferrer"
              >
                PHOTO / REALFISH
              </a>
            </figcaption>
          </figure>
          <p className="description">
            行き先を選ぶ時間も、何気なく撮った一枚も。
            <br />
            大切な人との旅を、ひとつの記録に。
          </p>
        </section>
        <section className="login-form-panel" aria-labelledby="login-title">
          <p className="eyebrow">
            {mode === "login" ? "WELCOME BACK" : "YOUR FIRST PAGE"}
          </p>
          <h2 id="login-title">
            {mode === "login" ? "旅の続きを、ここから。" : "最初の一ページを。"}
          </h2>
          <form onSubmit={submit} className="space-y-5">
            <div>
              <label htmlFor="email" className="field-label">
                メールアドレス
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                autoComplete="email"
                required
                className="field"
              />
            </div>
            <div>
              <label htmlFor="password" className="field-label">
                パスワード
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={
                  mode === "signup" ? "6文字以上で入力" : "パスワードを入力"
                }
                autoComplete={
                  mode === "login" ? "current-password" : "new-password"
                }
                minLength={6}
                required
                className="field"
              />
            </div>
            {message && (
              <p role="status" className="text-sm text-neutral-600">
                {message}
              </p>
            )}
            <button
              type="submit"
              disabled={busy}
              className="button-primary w-full justify-between"
            >
              {busy
                ? "確認しています…"
                : mode === "login"
                  ? "ログイン"
                  : "登録する"}
              <Icon name="arrow" />
            </button>
          </form>

          <button
            onClick={() => {
              setMode(mode === "login" ? "signup" : "login");
              setMessage(null);
            }}
            className="text-link mt-5"
          >
            {mode === "login"
              ? "初めての方は、アカウントを作成"
              : "アカウントをお持ちの方は、ログイン"}
          </button>
          <p className="fine-print mt-8 border-t border-rule pt-5">
            旅を作る人も、招待された人も、
            <br />
            同じアカウントで利用できます。
          </p>
        </section>
      </div>
      <footer className="login-footer">
        <span>計画する。巡る。振り返る。</span>
        <span>ふたりの旅</span>
      </footer>
    </main>
  );
}
