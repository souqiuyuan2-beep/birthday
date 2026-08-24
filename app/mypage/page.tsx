// 「マイページ」タブ: アカウント情報とログアウト
import { redirect } from "next/navigation";
import { createAuthClient } from "@/lib/supabase/auth-server";
import TabBar from "@/components/TabBar";
import LogoutButton from "@/components/LogoutButton";

export const dynamic = "force-dynamic";

export default async function MyPage() {
  const supabase = await createAuthClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) redirect("/login");

  return (
    <main className="mx-auto min-h-dvh max-w-md px-6 pb-24 pt-10">
      <h1 className="font-serif text-lg font-semibold tracking-wider">
        マイページ
      </h1>

      <section className="mt-6 rounded-2xl border border-neutral-200 bg-white p-5">
        <p className="text-xs text-neutral-400">ログイン中のアカウント</p>
        <p className="mt-1 break-all text-sm text-neutral-800">
          {data.user.email}
        </p>
      </section>

      <div className="mt-6">
        <LogoutButton />
      </div>

      <p className="mt-10 text-center text-xs leading-relaxed text-neutral-400">
        写真や手紙は、旅に参加している人だけが見られます
      </p>

      <TabBar />
    </main>
  );
}
