// 「参加」タブ: タグを入力して旅に参加する / 参加中の旅の一覧
// 合言葉の代わりに、管理者が作った旅に自動で振られるタグを使う
import Link from "next/link";
import { redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabase/server";
import { currentUserId } from "@/lib/supabase/auth-server";
import TabBar from "@/components/TabBar";
import JoinForm from "@/components/JoinForm";
import JournalHeader from "@/components/ui/JournalHeader";
import Icon from "@/components/ui/Icon";
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
  const joined = (
    (members ?? [])
      .map((m) => (m as unknown as { trips: Trip }).trips)
      .filter(Boolean) as Trip[]
  ).filter((t) => t.owner_id !== userId);

  return (
    <main className="journal-page">
      <JournalHeader
        eyebrow="YOUR JOURNEYS"
        title="次の思い出を、ふたりで。"
        description="届いた招待から、旅を始めよう。"
      />
      <section className="invitation" aria-label="旅への招待">
        <div className="invitation-title">
          <h2>旅への招待状</h2>
          <Icon name="route" className="text-theme" />
        </div>
        <JoinForm />
        <p className="fine-print mt-4">
          旅を作った人から届いた、英数字のコードを入力。
        </p>
      </section>

      <section className="mt-12">
        <h2 className="section-label">
          参加中の旅
          <span>{String(joined.length).padStart(2, "0")} JOURNEYS</span>
        </h2>
        {joined.length === 0 ? (
          <p className="empty-note">
            まだ参加中の旅はありません。
            <br />
            招待された旅は、ここに並びます。
          </p>
        ) : (
          <ul className="journey-list">
            {joined.map((trip, index) => (
              <li key={trip.id}>
                <Link href={`/t/${trip.slug}`} className="journey-row">
                  <span className="journey-number">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="journey-title">{trip.title}</p>
                    {trip.date && (
                      <p className="date-label">
                        {trip.date.replaceAll("-", ".")}
                      </p>
                    )}
                  </div>
                  <Icon name="arrow" className="shrink-0 text-muted" />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <TabBar />
    </main>
  );
}
