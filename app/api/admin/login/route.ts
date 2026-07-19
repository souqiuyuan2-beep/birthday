// A1の裏側: 管理者パスワード検証 → 管理者トークン発行
import { NextResponse } from "next/server";
import { createAdminToken, verifyAdminPassword } from "@/lib/auth";

export async function POST(req: Request) {
  const { password } = (await req.json().catch(() => ({}))) as {
    password?: string;
  };
  if (typeof password !== "string" || password === "") {
    return NextResponse.json({ error: "パスワードを入力してください" }, { status: 400 });
  }
  if (!verifyAdminPassword(password)) {
    return NextResponse.json({ error: "パスワードが違います" }, { status: 401 });
  }
  return NextResponse.json({ token: createAdminToken() });
}
