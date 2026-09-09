// 画面下のタブバー(参加 / 作る / マイページ)
// 利用者ページと管理者ページを1つのアプリに統合するための導線
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Icon from "@/components/ui/Icon";

const TABS = [
  { href: "/", label: "参加", icon: "route" },
  { href: "/create", label: "作る", icon: "edit" },
  { href: "/mypage", label: "マイページ", icon: "user" },
] as const;

export default function TabBar() {
  const pathname = usePathname() ?? "/";

  return (
    <nav aria-label="メインメニュー" className="tab-bar">
      <ul>
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
                className="tab-link"
              >
                <Icon name={tab.icon} />
                {tab.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
