// 旅の画面の共通レイアウト
// ログインしていて、かつこの旅の参加者でなければ入れない
import { redirect } from "next/navigation";
import { getAccessBySlug } from "@/lib/access";
import { currentUserId } from "@/lib/supabase/auth-server";

export default async function TripLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const userId = await currentUserId();
  if (!userId) redirect("/login");

  const access = await getAccessBySlug(slug);
  // 参加していない旅は見られない(タグを入力して参加してもらう)
  if (!access?.isMember) redirect("/");

  return <>{children}</>;
}
