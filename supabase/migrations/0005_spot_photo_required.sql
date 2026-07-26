-- スポットごとに「写真の追加が必須か」を選べるようにする
-- true (既定) = 今まで通り、写真を1枚アップすると達成
-- false        = 行き先を選ぶ/スポットを開くだけで次のステップに進める(写真は任意)
alter table spots add column photo_required boolean not null default true;
