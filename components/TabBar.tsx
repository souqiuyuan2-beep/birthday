// 画面下のタブバー(参加 / 作る / マイページ)
// 利用者ページと管理者ページを1つのアプリに統合するための導線
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/", label: "参加", icon: "✈" },
  { href: "/create", label: "作る", icon: "✎" },
  { href: "/mypage", label: "マイページ", icon: "☺" },
] as const;

export default function TabBar() {
  const pathname = usePathname() ?? "/";

  return (
    <nav aria-label="メインメニュー" className="fixed inset-x-0 bottom-0 z-40 border-t border-neutral-200 bg-white/95 backdrop-blur">
      <ul className="mx-auto flex max-w-md">
        {TABS.map((tab) => {
          const active =
            tab.href === "/"
              ? pathname === "/" || pathname.startsWith("/t/")
              : pathname.startsWith(tab.href);
          return (
            <li key={tab.href} className="flex-1">
              <Link
                href={tab.href}
                aria-current={active ? "page" : undefined}
                className={
                  "flex flex-col items-center gap-0.5 py-2.5 text-[10px] tracking-wider transition-colors " +
                  (active ? "text-theme-deep" : "text-neutral-400")
                }
              >
                <span aria-hidden="true" className="text-base">{tab.icon}</span>
                {tab.label}
              </Link>
            </li>
          );
        })}
      </ul>
      {/* iPhoneのホームバーぶんの余白 */}
      <div className="h-[env(safe-area-inset-bottom)]" />
    </nav>
  );
}
