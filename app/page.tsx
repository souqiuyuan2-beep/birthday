// 「参加」タブ: タグを入力して旅に参加する / 参加中の旅の一覧
// 合言葉の代わりに、管理者が作った旅に自動で振られるタグを使う
import Link from "next/link";
import { redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabase/server";
import { currentUserId } from "@/lib/supabase/auth-server";
import TabBar from "@/components/TabBar";
import JoinForm from "@/components/JoinForm";
import Sparkles from "@/components/girlfriend/Sparkles";
import type { Trip } from "@/lib/supabase/types";

export const dynamic = "force-dynamic";

export default async function JoinPage() {
  const userId = await currentUserId();
  if (!userId) redirect("/login");

  const supabase = createServerClient();
  // 参加中の旅(自分が作った旅は「作る」タブに出るのでここでは除く)
  const { data: members } = await supabase
    .from("trip_members")
    .select("trips(*)")
    .eq("user_id", userId);
  const joined = ((members ?? [])
    .map((m) => (m as unknown as { trips: Trip }).trips)
    .filter(Boolean) as Trip[]).filter((t) => t.owner_id !== userId);

  return (
    <main className="relative mx-auto min-h-dvh max-w-md px-6 pb-24 pt-10">
      <Sparkles count={12} />

      <header className="relative z-10 text-center">
        <h1 className="font-serif text-xl font-semibold tracking-[0.2em]">
          旅に参加する
        </h1>
        <p className="mt-3 text-sm text-neutral-500">
          受け取ったタグを入力してください
        </p>
      </header>

      <div className="relative z-10 mt-8">
        <JoinForm />
      </div>

      {joined.length > 0 && (
        <section className="relative z-10 mt-12">
          <h2 className="mb-3 text-sm font-medium text-neutral-500">
            参加中の旅
          </h2>
          <ul className="space-y-3">
            {joined.map((trip) => (
              <li key={trip.id}>
                <Link
                  href={`/t/${trip.slug}`}
                  className="block rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm"
                >
                  <p className="font-medium">{trip.title}</p>
                  {trip.date && (
                    <p className="mt-1 text-xs text-neutral-400">{trip.date}</p>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <TabBar />
    </main>
  );
}
