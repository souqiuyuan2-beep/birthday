-- 誕生日サプライズWeb 初期スキーマ
create extension if not exists "pgcrypto";

create table trips (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,            -- 推測されにくいランダムURL用
  title text not null,
  date date,
  passphrase text not null,             -- 合言葉(記念日)
  opening_letter text not null default '',
  ending_letter text not null default '',
  opening_bgm_path text,                -- Storage: bgm/{trip_id}/...
  ending_bgm_path text,
  notify_email text,                    -- 写真アップ時の通知先
  theme_color text not null default '#A8D8EA',
  created_at timestamptz not null default now()
);

create table spots (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references trips(id) on delete cascade,
  sort_order int not null,
  name text not null,
  reveal_name boolean not null default true,  -- false なら到着まで名前を伏せる
  mission text not null,
  hint text,
  message text
);

create table progress (
  trip_id uuid not null references trips(id) on delete cascade,
  spot_id uuid not null references spots(id) on delete cascade,
  completed_at timestamptz not null default now(),
  primary key (trip_id, spot_id)
);

create table photos (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references trips(id) on delete cascade,
  spot_id uuid not null references spots(id) on delete cascade,
  storage_path text not null,           -- photos/{trip_id}/{spot_id}/{ts}.jpg
  created_at timestamptz not null default now()
);

-- RLS: クライアント(anonキー)からの直接アクセスは全面拒否。
-- 読み書きはすべて service_role を使う Route Handler 経由で行う。
alter table trips enable row level security;
alter table spots enable row level security;
alter table progress enable row level security;
alter table photos enable row level security;

-- Storage バケット(非公開)は Supabase ダッシュボード or CLI で作成:
--   photos(非公開), bgm(非公開)。表示は署名付きURLで行う。

-- Realtime: progress / photos を publication に追加(ダッシュボードの
-- Database > Replication で有効化)→ 管理画面のリアルタイム更新に使用。
