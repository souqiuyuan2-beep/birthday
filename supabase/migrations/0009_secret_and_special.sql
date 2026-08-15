-- ① スポットのシークレット化
-- true にすると、選択画面で名前もミッションも伏せられる。
-- 「何が出てくるんだろう?」というワクワクを作るための設定。
alter table spots add column is_secret boolean not null default false;

-- ② スペシャル演出(プレゼント画像)
-- その番目の選択画面を開いたとき、選ぶ前にプレゼントのように表示する画像。
-- 番目グループ単位で使うため、同じ sort_order のスポット全部に同じパスを入れる。
-- Storage: special/{trip_id}/{ts}.jpg(非公開バケット・署名付きURLで表示)
alter table spots add column special_image_path text;
