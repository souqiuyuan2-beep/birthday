import type { Metadata } from "next";
import { Shippori_Mincho, Zen_Kaku_Gothic_New, Yomogi } from "next/font/google";
import "./globals.css";

// 明朝(手紙・見出し)×ゴシック(本文)。next/fontがサブセット化して自動ホスティング
const serifJp = Shippori_Mincho({
  weight: ["500", "600", "700"],
  subsets: ["latin"],
  variable: "--font-serif-jp",
  display: "swap",
  preload: false,
});
const sansJp = Zen_Kaku_Gothic_New({
  weight: ["400", "500", "700"],
  subsets: ["latin"],
  variable: "--font-sans-jp",
  display: "swap",
  preload: false,
});
// 手書き書体はロゴ・日付・短い添え書きだけ。フォームと本文の読みやすさは保つ。
const handJp = Yomogi({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-hand-jp",
  display: "swap",
  preload: false,
});

export const metadata: Metadata = {
  title: "ふたりの旅",
  description: "旅を贈る。一緒に巡る。思い出を一冊に残す。",
  robots: { index: false, follow: false }, // 検索エンジンに載せない
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="ja"
      className={`${serifJp.variable} ${sansJp.variable} ${handJp.variable}`}
    >
      <body className="font-sans">{children}</body>
    </html>
  );
}
