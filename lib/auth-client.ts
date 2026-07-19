// 合言葉トークンの localStorage 保持(クライアント専用)
// トークンの発行・検証はサーバー側(lib/auth.ts)。ここは保存と取り出しのみ
const key = (slug: string) => `trip-token:${slug}`;

export function getTripToken(slug: string): string | null {
  try {
    return localStorage.getItem(key(slug));
  } catch {
    return null;
  }
}

export function saveTripToken(slug: string, token: string): void {
  try {
    localStorage.setItem(key(slug), token);
  } catch {
    // プライベートブラウズ等で保存できなくても致命的ではない(再入力になるだけ)
  }
}

export function clearTripToken(slug: string): void {
  try {
    localStorage.removeItem(key(slug));
  } catch {}
}
