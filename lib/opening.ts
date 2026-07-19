// オープニングを見たかどうかの記録(クライアント専用)
// 初回だけオープニングへ誘導し、2回目以降はスキップ(読み返しは任意)
const key = (slug: string) => `opening-seen:${slug}`;

export function hasSeenOpening(slug: string): boolean {
  try {
    return localStorage.getItem(key(slug)) === "1";
  } catch {
    return true; // 保存できない環境では毎回オープニングになるのを避ける
  }
}

export function markOpeningSeen(slug: string): void {
  try {
    localStorage.setItem(key(slug), "1");
  } catch {}
}
