// Supabase Edge Function: 写真アップロード時のメール通知
// トリガー: Database Webhook(photos テーブルへの INSERT)
// 処理: trip の notify_email を取得し、Resend API でメール送信
//   件名例: 「📸 ミッション達成: {スポット名}」
//   本文: スポット名 + 達成時刻(+ 可能なら写真の署名付きURL)
// 彼女側には通知の存在を一切見せない
// TODO(実装順序5): Resend実装 + Webhook設定
Deno.serve(async (_req) => {
  return new Response("not implemented", { status: 501 });
});
