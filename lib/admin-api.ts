// 管理APIルート共通: Authorizationヘッダの管理者トークン検証(サーバー専用)
import { verifyAdminToken } from "@/lib/auth";

export function isAdminRequest(req: Request): boolean {
  const token = (req.headers.get("authorization") ?? "").replace(/^Bearer /, "");
  if (!token) return false;
  try {
    return verifyAdminToken(token);
  } catch {
    return false;
  }
}
