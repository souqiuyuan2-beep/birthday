// ブラウザ用の Supabase クライアント(ログイン状態を Cookie で保持する)
// ログイン・ログアウト・現在のユーザー取得はこれを使う
import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
