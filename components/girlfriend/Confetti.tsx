// 紙吹雪エフェクト: 達成演出用。上から色とりどりの紙片が舞い落ちる
"use client";

import { useEffect, useState } from "react";

const COLORS = ["#a8d8ea", "#f7c8c9", "#f9e2ae", "#c8e6c9", "#d9b45b", "#cbb9e8"];

type Piece = {
  left: number;
  delay: number;
  duration: number;
  width: number;
  height: number;
  color: string;
  rotate: number;
};

export default function Confetti({ count = 40 }: { count?: number }) {
  const [pieces, setPieces] = useState<Piece[]>([]);

  useEffect(() => {
    setPieces(
      Array.from({ length: count }, () => ({
        left: Math.random() * 100,
        delay: Math.random() * 0.9,
        duration: 2.4 + Math.random() * 1.8,
        width: 6 + Math.random() * 6,
        height: 4 + Math.random() * 5,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        rotate: Math.random() * 360,
      }))
    );
  }, [count]);

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 overflow-hidden">
      {pieces.map((piece, i) => (
        <span
          key={i}
          className="absolute rounded-[2px]"
          style={{
            left: `${piece.left}%`,
            top: 0,
            width: piece.width,
            height: piece.height,
            backgroundColor: piece.color,
            transform: `rotate(${piece.rotate}deg)`,
            animation: `confetti-fall ${piece.duration}s ease-in ${piece.delay}s forwards`,
            opacity: 0,
          }}
        />
      ))}
    </div>
  );
}
