// 認証まわりのヘルパー(サーバー専用。クライアントからは import しないこと)
// - 合言葉: サーバー側で照合し、成功トークンを localStorage に保持(彼女用)
// - 管理者: ADMIN_PASSWORD と照合(自分用)。彼女用の合言葉とは完全に別系統
import { createHmac, timingSafeEqual } from "node:crypto";

// トークンの署名鍵。サーバーにしか無い値なのでクライアントでは偽造できない
function secret(): string {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) throw new Error("SUPABASE_SERVICE_ROLE_KEY が未設定です");
  return key;
}

// 合言葉認証成功時に発行するトークン(trip単位・ステートレス)
export function createTripToken(tripId: string): string {
  return createHmac("sha256", secret()).update(`trip:${tripId}`).digest("hex");
}

export function verifyTripToken(tripId: string, token: string): boolean {
  return safeEqual(token, createTripToken(tripId));
}

// 管理者認証。パスワードを変えると既存トークンも無効になる
function adminPassword(): string {
  const pw = process.env.ADMIN_PASSWORD;
  if (!pw) throw new Error(".env.local に ADMIN_PASSWORD を設定してください");
  return pw;
}

export function verifyAdminPassword(password: string): boolean {
  return safeEqual(password, adminPassword());
}

export function createAdminToken(): string {
  return createHmac("sha256", secret())
    .update(`admin:${adminPassword()}`)
    .digest("hex");
}

export function verifyAdminToken(token: string): boolean {
  return safeEqual(token, createAdminToken());
}

function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  return timingSafeEqual(Buffer.from(a), Buffer.from(b));
}
