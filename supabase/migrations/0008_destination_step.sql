-- 旅行先を選ぶステップの印:
-- 「3番目のグループ(千葉/熱海/埼玉)は旅行先を選ぶステップ」のように、
-- 番目グループ単位でチェックを付ける。同じ sort_order のスポット全部に立てる。
--
-- true が立っているグループの各選択肢が、管理画面のドロワーに旅行先として並び、
-- そこから旅行先ごとの分岐スポットを編集できる。
alter table spots add column is_destination boolean not null default false;
