// 管理画面共通レイアウト(自分専用・モバイル対応)
// 役割: 管理者認証ガード。未認証なら /admin/login へ
import AdminGuard from "@/components/admin/AdminGuard";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <AdminGuard>{children}</AdminGuard>;
}
