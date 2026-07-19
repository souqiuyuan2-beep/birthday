-- 管理ダッシュボードのリアルタイム更新用(実装順序5)
-- progress / photos のINSERTを購読できるよう publication に追加
alter publication supabase_realtime add table progress;
alter publication supabase_realtime add table photos;

-- Realtime(postgres_changes)はRLSを尊重するため、購読側(anonキー)に読み取りを許可する。
-- 写真の実体は非公開バケット+署名付きURLのままなので、ここで見えるのは行メタデータのみ。
-- trips / spots(合言葉・手紙・ミッション内容)はこれまで通り全面拒否
create policy "anon can read progress" on progress for select using (true);
create policy "anon can read photos" on photos for select using (true);
