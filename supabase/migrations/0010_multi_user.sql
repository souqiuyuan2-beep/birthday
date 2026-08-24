-- 一般公開に向けた複数ユーザー対応
--
-- これまでは「管理者パスワード1つ = 全データ触れる」という個人用の作りだった。
-- 公開するにあたり、Supabase Auth のユーザーごとにデータを分ける。

-- ① 旅に所有者を持たせる(作成したユーザー)
alter table trips add column owner_id uuid references auth.users(id) on delete cascade;

-- ② 参加用のタグ(英数字)。合言葉の代わりに、これを入力して旅に参加する
alter table trips add column tag text unique;

-- ③ 参加時に追加で要求するパスワード(管理画面で任意設定。null なら不要)
alter table trips add column join_password text;

-- ④ 誰がどの旅に参加しているか
create table trip_members (
  trip_id uuid not null references trips(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (trip_id, user_id)
);

create index trips_owner_idx on trips(owner_id);
create index trips_tag_idx on trips(tag);
create index trip_members_user_idx on trip_members(user_id);

alter table trip_members enable row level security;
