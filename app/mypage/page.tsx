// 「マイページ」タブ: アカウント情報とログアウト
import { redirect } from "next/navigation";
import { createAuthClient } from "@/lib/supabase/auth-server";
import TabBar from "@/components/TabBar";
import LogoutButton from "@/components/LogoutButton";
import JournalHeader from "@/components/ui/JournalHeader";

export const dynamic = "force-dynamic";

export default async function MyPage() {
  const supabase = await createAuthClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) redirect("/login");

  return (
    <main className="journal-page">
      <JournalHeader
        eyebrow="YOUR ACCOUNT"
        title="マイページ"
        description="旅をつなぐ、あなたのアカウント。"
      />

      <section className="account-details">
        <p className="field-label">ログイン中のメールアドレス</p>
        <p className="mt-3 break-all text-base">{data.user.email}</p>
      </section>

      <div className="mt-8">
        <LogoutButton />
      </div>

      <p className="account-note fine-print">
        写真や手紙は、旅に参加している人だけが見られます
      </p>

      <TabBar />
    </main>
  );
}
