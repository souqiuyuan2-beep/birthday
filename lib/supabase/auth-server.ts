// サーバー用: ログイン中のユーザーを取得する
// Route Handler / Server Component から使う。Cookie のセッションを読む
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

export async function createAuthClient() {
  const store = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => store.getAll(),
        setAll: (list) => {
          try {
            list.forEach(({ name, value, options }) =>
              store.set(name, value, options)
            );
          } catch {
            // Server Component からは書き込めないが、middleware が更新するので問題ない
          }
        },
      },
    }
  );
}

// ログイン中のユーザーID。未ログインなら null
export async function currentUserId(): Promise<string | null> {
  const supabase = await createAuthClient();
  const { data } = await supabase.auth.getUser();
  return data.user?.id ?? null;
}
