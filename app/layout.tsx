import type { Metadata } from "next";
import { Shippori_Mincho, Zen_Kaku_Gothic_New } from "next/font/google";
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

export const metadata: Metadata = {
  title: "旅の記録",
  description: "",
  robots: { index: false, follow: false }, // 検索エンジンに載せない
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja" className={`${serifJp.variable} ${sansJp.variable}`}>
      <body className="font-sans">{children}</body>
    </html>
  );
}
