// 手紙を「手で書いているように」1文字ずつ表示する
// - 全文をあらかじめ描いておき、CSSで文字ごとに表示を切り替える(描き直しが軽い)
// - 句読点・改行では少し間を置く(書く人の呼吸)
// - 末尾にペン先の光をそっと置く。タップすると最後まで一気に表示
"use client";

import { useEffect, useMemo, useRef, useState } from "react";

const CHAR_MS = 55; // 1文字あたり
const PAUSE_PUNCT = 200; // 。、のあとの間
const PAUSE_NEWLINE = 320; // 改行のあとの間

export default function Handwriting({
  text,
  onDone,
  className = "",
}: {
  text: string;
  onDone?: () => void;
  className?: string;
}) {
  const [count, setCount] = useState(0);
  const doneRef = useRef(false);
  const finished = count >= text.length;
  // onDone は呼び出し側で毎回作られることがあるので、最新版を ref に保持して
  // 依存配列から外す(タイマーが張り直されて進まなくなるのを防ぐ)
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;

  // 各文字が現れる時刻をあらかじめ決めておく
  const schedule = useMemo(() => {
    const times: number[] = [];
    let t = 0;
    for (const ch of text) {
      t +=
        ch === "\n"
          ? PAUSE_NEWLINE
          : ch === "。" || ch === "、"
            ? PAUSE_PUNCT
            : CHAR_MS;
      times.push(t);
    }
    return times;
  }, [text]);

  useEffect(() => {
    if (finished) {
      if (!doneRef.current) {
        doneRef.current = true;
        onDoneRef.current?.();
      }
      return;
    }
    const timer = setTimeout(
      () => setCount((c) => c + 1),
      schedule[count] - (schedule[count - 1] ?? 0)
    );
    return () => clearTimeout(timer);
  }, [count, schedule, finished]);

  return (
    <p
      onClick={() => setCount(text.length)} // タップで最後まで表示
      className={"relative whitespace-pre-wrap " + className}
    >
      {/* 書き終えた分だけを描き、直後にペン先の光を置く。
          まだの分は見えない文字で場所だけ確保して、行のガタつきを防ぐ */}
      <span>{text.slice(0, count)}</span>
      {!finished && (
        <span
          aria-hidden
          className="mx-[1px] inline-block h-[1em] w-[2px] translate-y-[0.15em] rounded-full bg-theme-deep/70 align-baseline"
          style={{ animation: "pen-blink 1.1s ease-in-out infinite" }}
        />
      )}
      <span aria-hidden className="opacity-0">
        {text.slice(count)}
      </span>
    </p>
  );
}
