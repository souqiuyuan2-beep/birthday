// 旅の画面の共通レイアウト
// ログインしていて、かつこの旅の参加者でなければ入れない
// 旅の中でも下部タブから参加一覧・作成画面へ戻れるようにする
import { redirect } from "next/navigation";
import TabBar from "@/components/TabBar";
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

  return (
    <div className="pb-[calc(4.5rem+env(safe-area-inset-bottom))]">
      {children}
      <TabBar />
    </div>
  );
}
