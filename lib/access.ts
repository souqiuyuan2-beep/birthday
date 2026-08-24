// 誰がどの旅に何をできるかを判定する(サーバー専用)
//
// - 作成者(owner): プランの編集・削除・進捗の閲覧。すべての操作ができる
// - 参加者(member): 旅を体験する。写真の投稿・選択・達成ができるが、プランは変更できない
//
// 全APIでこのチェックを通すことで、他人のデータに触れないようにする
import { createServerClient } from "@/lib/supabase/server";
import { currentUserId } from "@/lib/supabase/auth-server";

export type Access = {
  userId: string;
  tripId: string;
  isOwner: boolean;
  isMember: boolean;
};

// 旅に対する権限を調べる。未ログインや無関係なユーザーなら null
export async function getAccess(tripId: string): Promise<Access | null> {
  const userId = await currentUserId();
  if (!userId) return null;

  const supabase = createServerClient();
  const { data: trip } = await supabase
    .from("trips")
    .select("id, owner_id")
    .eq("id", tripId)
    .single();
  if (!trip) return null;

  const isOwner = trip.owner_id === userId;

  const { data: member } = await supabase
    .from("trip_members")
    .select("user_id")
    .eq("trip_id", tripId)
    .eq("user_id", userId)
    .maybeSingle();

  return { userId, tripId, isOwner, isMember: isOwner || !!member };
}

// slug から権限を調べる(彼女側の画面用)
export async function getAccessBySlug(slug: string): Promise<Access | null> {
  const supabase = createServerClient();
  const { data: trip } = await supabase
    .from("trips")
    .select("id")
    .eq("slug", slug)
    .single();
  if (!trip) return null;
  return getAccess(trip.id);
}

// 参加用タグを作る(推測されにくい英数字8文字)
export function generateTag(): string {
  // 紛らわしい文字(0/O, 1/I/l)を除く
  const chars = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";
  let tag = "";
  for (let i = 0; i < 8; i++) {
    tag += chars[Math.floor(Math.random() * chars.length)];
  }
  return tag;
}
