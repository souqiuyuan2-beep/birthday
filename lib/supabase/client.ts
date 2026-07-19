// ブラウザ用 Supabaseクライアント(anonキー)
// 注意: 書き込み系はRoute Handler経由を基本とし、クライアント直書きは最小限に
import { createClient } from "@supabase/supabase-js";

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);
