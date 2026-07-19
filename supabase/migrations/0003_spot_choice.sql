-- 2択スポット機能:
-- 同じ trip_id + sort_order を持つスポットは「彼女がどちらか選ぶ」選択肢グループになる。
-- chosen = グループの中で彼女が選んだ方(スポットが1つだけの番目では使わない)
alter table spots add column chosen boolean not null default false;
