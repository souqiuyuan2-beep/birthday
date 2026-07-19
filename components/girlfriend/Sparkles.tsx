// 星屑エフェクト: 画面全体でゆっくり瞬く(演出用・操作を邪魔しない)
// マウント後に生成することでSSRとのズレを防ぐ
"use client";

import { useEffect, useState } from "react";

type Star = {
  left: number;
  top: number;
  delay: number;
  duration: number;
  size: number;
};

export default function Sparkles({ count = 16 }: { count?: number }) {
  const [stars, setStars] = useState<Star[]>([]);

  useEffect(() => {
    setStars(
      Array.from({ length: count }, () => ({
        left: Math.random() * 100,
        top: Math.random() * 100,
        delay: Math.random() * 4,
        duration: 2.2 + Math.random() * 2.8,
        size: 8 + Math.random() * 8,
      }))
    );
  }, [count]);

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      {stars.map((star, i) => (
        <span
          key={i}
          className="absolute text-theme-deep/70"
          style={{
            left: `${star.left}%`,
            top: `${star.top}%`,
            fontSize: star.size,
            animation: `twinkle ${star.duration}s ease-in-out ${star.delay}s infinite`,
            opacity: 0,
          }}
        >
          ✦
        </span>
      ))}
    </div>
  );
}
