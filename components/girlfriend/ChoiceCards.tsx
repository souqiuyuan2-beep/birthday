// 最大5択の行き先をポストカードから選ぶ。秘密の選択肢は内容を一切表示しない。
// 確定後はミッションへ。写真追加までは選び直せる。
"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Icon from "@/components/ui/Icon";
import SpecialGift from "@/components/girlfriend/SpecialGift";

type Option = {
  id: string;
  displayName: string;
  mission: string;
  message: string | null;
  secret?: boolean; // 中身を伏せて「?」で見せる
};

export default function ChoiceCards({
  options,
  initialSelectedId = null,
  specialImageUrl = null,
}: {
  options: Option[];
  initialSelectedId?: string | null;
  specialImageUrl?: string | null;
}) {
  // スペシャル演出がある場合は、選ぶ前にプレゼントを見せる
  const [giftDone, setGiftDone] = useState(false);
  const { slug } = useParams<{ slug: string }>();
  const router = useRouter();
  const [selectedId, setSelectedId] = useState<string | null>(
    initialSelectedId,
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);

  async function confirm() {
    if (!selectedId || busy) return;
    setBusy(true);
    setError(false);
    try {
      const res = await fetch(`/api/t/${slug}/choose`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ spotId: selectedId }),
      });
      if (!res.ok) {
        setError(true);
        setBusy(false);
        return;
      }
      // 画面が切り替わるまで busy のままにして、二重タップと
      // 「押したのに無反応」に見える状態を防ぐ
      router.replace(`/t/${slug}/mission/${selectedId}`);
    } catch {
      setError(true);
      setBusy(false);
    }
  }

  return (
    <main className="journal-page journey-page flex flex-col">
      {/* 選ぶ前に、プレゼントのように画像を見せる */}
      {specialImageUrl && !giftDone && (
        <SpecialGift
          imageUrl={specialImageUrl}
          onDone={() => setGiftDone(true)}
        />
      )}
      <button
        onClick={() => router.push(`/t/${slug}`)}
        className="back-link self-start"
      >
        ← 戻る
      </button>

      <p className="hand-note">Where shall we go?</p>
      <h1 className="page-title mt-3">
        {options.length >= 3 ? "どこに行く？" : "どっちに行く？"}
      </h1>
      <p className="description">
        {options.length >= 3
          ? "心が向く場所を、ひとつ。"
          : "今日は、どちらの気分？"}
      </p>

      <div className="postcard-options">
        {options.map((option, index) => {
          const selected = option.id === selectedId;
          return (
            <button
              key={option.id}
              onClick={() => setSelectedId(option.id)}
              className="choice-option"
              aria-pressed={selected}
              data-secret={!!option.secret}
            >
              <span className="postcard-topline" aria-hidden="true">
                <span className="hand-note">For our next memory</span>
                <span className="postcard-stamp">
                  {String(index + 1).padStart(2, "0")}
                </span>
              </span>
              <span className="postcard-content">
                <span className="choice-radio">
                  {selected && <Icon name="check" width="14" height="14" />}
                </span>
                <span className="min-w-0 flex-1">
                  {option.secret ? (
                    // 中身を伏せて、選ぶまで分からないようにする
                    <span className="block">
                      <span className="block font-serif text-xl">
                        選ぶまで、秘密。
                      </span>
                      <span className="mt-2 block text-xs text-muted">
                        この先に待つ、小さなサプライズ。
                      </span>
                    </span>
                  ) : (
                    <>
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
                    </>
                  )}
                </span>
              </span>
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
          className="button-primary w-full justify-between"
        >
          {busy ? "決めています…" : "ここにする"}
          <Icon name="arrow" />
        </button>
      </div>
    </main>
  );
}
