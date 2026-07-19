-- MVP動作確認用のシードデータ(本番プランは管理画面から作成)
insert into trips (slug, title, date, passphrase, opening_letter, ending_letter)
values (
  'test-trip-0000000000',
  'テストの旅',
  '2026-08-01',
  'test',
  'これはテスト用のオープニングの手紙です。',
  'これはテスト用のエンディングの手紙です。'
);

insert into spots (trip_id, sort_order, name, reveal_name, mission, hint, message)
select id, s.ord, s.name, s.reveal, s.mission, s.hint, s.msg
from trips, (values
  (1, 'カフェ',   true,  'ここで二人のツーショットを撮ろう', 'ヒント: 窓際の席', 'はじまりの一枚'),
  (2, '公園',     true,  '好きな景色を1枚撮ろう',           null,               null),
  (3, '???',      false, '到着したら分かるよ',               'ヒント: 高いところ', '最後のサプライズ')
) as s(ord, name, reveal, mission, hint, msg)
where trips.slug = 'test-trip-0000000000';
