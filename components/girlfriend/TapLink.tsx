// タップした瞬間に反応を返すリンク
// 画面の切り替えはサーバーからの応答を待つため、その間「押せていない」ように
// 見えてしまう。押した瞬間に少し沈ませて、待っていることを伝える
"use client";

import { useState } from "react";
import Link from "next/link";

export default function TapLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  const [tapped, setTapped] = useState(false);

  return (
    <Link
      href={href}
      onClick={() => setTapped(true)}
      className={
        "block transition-all duration-150 " +
        (tapped ? "scale-[0.98] opacity-60" : "active:scale-[0.99]")
      }
    >
      {children}
    </Link>
  );
}
