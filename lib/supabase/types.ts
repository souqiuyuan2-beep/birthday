// DBスキーマに対応する型定義(supabase/migrations/0001_init.sql と対応)
export type Trip = {
  id: string;
  slug: string;
  title: string;
  date: string | null; // ISO date
  passphrase: string;
  opening_letter: string;
  ending_letter: string;
  opening_bgm_path: string | null;
  ending_bgm_path: string | null;
  notify_email: string | null;
  theme_color: string;
  created_at: string;
};

export type Spot = {
  id: string;
  trip_id: string;
  sort_order: number;
  name: string;
  reveal_name: boolean;
  mission: string;
  hint: string | null;
  message: string | null;
  chosen: boolean; // 2択グループ(同じsort_order)の中で彼女が選んだ方
};

export type Progress = {
  trip_id: string;
  spot_id: string;
  completed_at: string;
};

export type Photo = {
  id: string;
  trip_id: string;
  spot_id: string;
  storage_path: string;
  created_at: string;
};
