// サーバー用 Supabaseクライアント(service_role)
// Route Handler / Server Component からのみ import すること
import { createClient } from "@supabase/supabase-js";

export function createServerClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error(
      ".env.local に NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY を設定してください(.env.local.example 参照)"
    );
  }
  return createClient(url, key, { auth: { persistSession: false } });
}
