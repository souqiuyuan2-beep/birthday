// 管理者へのメール通知(サーバー専用)
// Resend の REST API を fetch で叩く(SDK不要)。RESEND_API_KEY 未設定なら黙ってスキップ。
// 差出人は onboarding@resend.dev(ドメイン認証不要。ただし送信先はResend登録メール宛のみ)
const RESEND_ENDPOINT = "https://api.resend.com/emails";
const FROM = "旅の記録 <onboarding@resend.dev>";

export async function sendPhotoNotification(args: {
  to: string;
  tripTitle: string;
  spotName: string;
  takenAt: string;
  photoUrl: string | null;
}): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return; // 未設定なら通知しない(アップロード自体は成功させる)

  const time = new Date(args.takenAt).toLocaleString("ja-JP", {
    timeZone: "Asia/Tokyo",
  });
  const subject = `📸 ミッション達成: ${args.spotName}`;
  const html = `
    <div style="font-family: sans-serif; line-height: 1.7; color: #333;">
      <p>「${escapeHtml(args.tripTitle)}」で新しいミッションが達成されました。</p>
      <table style="margin-top: 12px;">
        <tr><td style="color:#888; padding-right:12px;">スポット</td><td>${escapeHtml(args.spotName)}</td></tr>
        <tr><td style="color:#888; padding-right:12px;">達成時刻</td><td>${time}</td></tr>
      </table>
      ${
        args.photoUrl
          ? `<p style="margin-top:16px;"><a href="${args.photoUrl}">📷 届いた写真を見る</a>(リンクは一定時間で無効になります)</p>`
          : ""
      }
    </div>`;

  try {
    await fetch(RESEND_ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ from: FROM, to: args.to, subject, html }),
    });
  } catch {
    // 通知失敗はアップロード体験に影響させない(ログのみでも良いが握りつぶす)
  }
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
