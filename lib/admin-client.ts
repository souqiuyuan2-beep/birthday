// 管理者トークンの localStorage 保持と、認証付きfetchヘルパー(クライアント専用)
const KEY = "admin-token";

export function getAdminToken(): string | null {
  try {
    return localStorage.getItem(KEY);
  } catch {
    return null;
  }
}

export function saveAdminToken(token: string): void {
  try {
    localStorage.setItem(KEY, token);
  } catch {}
}

export function clearAdminToken(): void {
  try {
    localStorage.removeItem(KEY);
  } catch {}
}

// Bearerトークンを付けてfetch。401なら未認証としてログイン画面へ
export async function adminFetch(
  path: string,
  init: RequestInit = {}
): Promise<Response> {
  const res = await fetch(path, {
    ...init,
    headers: {
      ...(init.headers ?? {}),
      Authorization: `Bearer ${getAdminToken() ?? ""}`,
    },
  });
  if (res.status === 401 && typeof window !== "undefined") {
    clearAdminToken();
    window.location.href = "/admin/login";
  }
  return res;
}
