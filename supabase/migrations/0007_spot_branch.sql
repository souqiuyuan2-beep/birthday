-- 分岐型スポット:
-- 「熱海を選んだら次は 海を堪能 or 美術館」のように、前の選択によって
-- 次に出るスポット(グループ)を変えられるようにする。
--
-- parent_spot_id が入っているスポットは「その親が選ばれた時だけ出る」。
-- null なら今まで通り、常に出る(分岐しない)。
alter table spots add column parent_spot_id uuid references spots(id) on delete cascade;

create index spots_parent_idx on spots(parent_spot_id);
