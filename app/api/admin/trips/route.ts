// A2の裏側: 旅行一覧の取得・新規作成
import { randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { isAdminRequest } from "@/lib/admin-api";

export async function GET(req: Request) {
  if (!isAdminRequest(req)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const supabase = createServerClient();
  const { data: trips, error } = await supabase
    .from("trips")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ trips });
}

export async function POST(req: Request) {
  if (!isAdminRequest(req)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const supabase = createServerClient();
  const { data: trip, error } = await supabase
    .from("trips")
    .insert({
      slug: randomBytes(10).toString("hex"), // 20文字の推測されにくいURL
      title: "新しい旅",
      passphrase: "",
    })
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ trip });
}
