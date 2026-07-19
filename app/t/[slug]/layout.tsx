// 彼女用画面の共通レイアウト
// 役割: 合言葉未認証なら /t/[slug]/lock へリダイレクト(AuthGuard)
// TODO(実装順序6): 初回のみオープニングへ誘導する分岐
import AuthGuard from "@/components/girlfriend/AuthGuard";

export default function TripLayout({ children }: { children: React.ReactNode }) {
  return <AuthGuard>{children}</AuthGuard>;
}
