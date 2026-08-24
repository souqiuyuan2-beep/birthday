// 旅の一覧取得・新規作成
// 一覧は「自分が作った旅」だけを返す(他人の旅は見えない)
import { randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { currentUserId } from "@/lib/supabase/auth-server";
import { generateTag } from "@/lib/access";

export async function GET() {
  const userId = await currentUserId();
  if (!userId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const supabase = createServerClient();
  const { data: trips, error } = await supabase
    .from("trips")
    .select("*")
    .eq("owner_id", userId)
    .order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ trips });
}

export async function POST() {
  const userId = await currentUserId();
  if (!userId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const supabase = createServerClient();

  // タグは重複しないものを発行する
  let tag = generateTag();
  for (let i = 0; i < 5; i++) {
    const { data: exists } = await supabase
      .from("trips")
      .select("id")
      .eq("tag", tag)
      .maybeSingle();
    if (!exists) break;
    tag = generateTag();
  }

  const { data: trip, error } = await supabase
    .from("trips")
    .insert({
      slug: randomBytes(10).toString("hex"),
      tag,
      owner_id: userId,
      title: "新しい旅",
      passphrase: "",
    })
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ trip });
}
