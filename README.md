# birthday-web

誕生日サプライズWebサイト。詳細は `CLAUDE.md` と `docs/` を参照。

## セットアップ

1. `npm install`
2. Supabaseプロジェクト作成 → SQL Editorで `supabase/migrations/` を番号順に実行
   (0001 スキーマ / 0002 動作確認用シード / 0003 2択スポット / 0004 Realtime)
3. Storageに非公開バケット `photos` / `bgm` を作成
4. `.env.local.example` をコピーして `.env.local` を作成し、各値を設定
5. `npm run dev`

## デプロイ(Vercel)

1. GitHubにリポジトリを作成してpush(`.env.local` は含めない。gitignore済み)
2. [vercel.com](https://vercel.com) → Add New Project → リポジトリをImport
3. Environment Variables に以下を設定(値は `.env.local` と同じ):
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`(サーバー専用。クライアントに出さない)
   - `ADMIN_PASSWORD`
   - `RESEND_API_KEY`(メール通知を使う段階で設定)
4. Deploy → `https://<プロジェクト名>.vercel.app` が本番URL
5. 本番URLで通しプレイ(合言葉→ミッション→写真→エンディング)を一度リハーサル

## QRコード

本番URLのトップページ(合言葉入口)をQRコードにして印刷する:

```bash
npx qrcode "https://<本番URL>" -o qr.png -w 600
```

## 運用メモ

- プランは `/admin`(管理者パスワード)から作成・編集
- 旅行ごとの合言葉は別々にする(トップページの合言葉入場が旅を判別するため)
- メール通知: Supabase Database Webhook → Edge Function `notify-email` → Resend(未実装。実装順序の最後)
