// 旅に参加する: タグ(+設定されていればパスワード)を入力して参加メンバーになる
// 合言葉の代わりの仕組み。参加後は trip_members に登録され、次回からタグ入力は不要
import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { currentUserId } from "@/lib/supabase/auth-server";

const normalize = (s: string) => s.normalize("NFKC").trim().toUpperCase();

export async function POST(req: Request) {
  const userId = await currentUserId();
  if (!userId) {
    return NextResponse.json({ error: "ログインしてください" }, { status: 401 });
  }

  const { tag, password } = (await req.json().catch(() => ({}))) as {
    tag?: string;
    password?: string;
  };
  if (typeof tag !== "string" || tag.trim() === "") {
    return NextResponse.json({ error: "タグを入力してください" }, { status: 400 });
  }

  const supabase = createServerClient();
  const { data: trip } = await supabase
    .from("trips")
    .select("id, slug, tag, join_password, title")
    .eq("tag", normalize(tag))
    .maybeSingle();

  if (!trip) {
    return NextResponse.json({ error: "タグが見つかりません" }, { status: 404 });
  }

  // パスワードが設定されている旅は、正しく入力しないと参加できない
  if (trip.join_password) {
    if (typeof password !== "string" || password === "") {
      return NextResponse.json(
        { error: "この旅にはパスワードが必要です", needPassword: true },
        { status: 401 }
      );
    }
    if (password.trim() !== trip.join_password.trim()) {
      return NextResponse.json(
        { error: "パスワードが違います", needPassword: true },
        { status: 401 }
      );
    }
  }

  // 既に参加済みでも成功として扱う
  const { error } = await supabase
    .from("trip_members")
    .upsert({ trip_id: trip.id, user_id: userId });
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ slug: trip.slug, title: trip.title });
}
