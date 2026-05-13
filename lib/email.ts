import { Resend } from "resend";

/**
 * Resend を使ったメール送信。API キー未設定時はサイレントにスキップ。
 * メール送信失敗は致命的ではない（操作自体は通す）。
 */
const apiKey = process.env.RESEND_API_KEY;
const resend = apiKey ? new Resend(apiKey) : null;

const FROM = process.env.MAIL_FROM || "onboarding@resend.dev";
const APP_NAME = "紹介報酬管理ツール";

export function getAppOrigin(): string {
  return (
    process.env.NEXT_PUBLIC_APP_ORIGIN ||
    "https://referral-rewards-pi.vercel.app"
  );
}

async function send(opts: { to: string; subject: string; html: string }) {
  if (!resend) {
    console.warn("[email] RESEND_API_KEY not configured, skipping:", opts.subject);
    return;
  }
  try {
    const result = await resend.emails.send({
      from: FROM,
      to: opts.to,
      subject: opts.subject,
      html: opts.html,
    });
    if (result.error) {
      console.error("[email] send error:", result.error);
    }
  } catch (err) {
    console.error("[email] send failed:", err);
  }
}

/**
 * 担当者登録時のウェルカムメール（専用URL案内）
 */
export async function sendWelcomeEmail(opts: {
  to: string;
  name: string;
  accessToken: string;
}) {
  const url = `${getAppOrigin()}/r/${opts.accessToken}`;
  const html = `
    <div style="font-family: -apple-system, sans-serif; max-width: 560px; margin: 0 auto;">
      <h2 style="color: #0f172a;">${escapeHtml(opts.name)} 様</h2>
      <p>お世話になっております。<br/>${APP_NAME}に登録されたことをお知らせいたします。</p>

      <p style="margin: 24px 0;">
        ▼ ${escapeHtml(opts.name)}様 専用マイページURL<br/>
        <a href="${url}" style="display: inline-block; padding: 12px 20px; background: #0f172a; color: #fff; text-decoration: none; border-radius: 8px; margin-top: 8px;">マイページを開く</a>
      </p>

      <p style="font-size: 12px; color: #64748b;">
        または下記URLをブラウザで開いてください：<br/>
        <code style="font-size: 11px; word-break: break-all;">${url}</code>
      </p>

      <h3 style="margin-top: 32px; color: #0f172a;">最初にお願いしたいこと</h3>
      <ol>
        <li>上記URLにアクセス</li>
        <li>ページ上部の「あなたの基本受取方式」を選択</li>
        <li>「？このページの使い方ガイド」で操作を確認</li>
      </ol>

      <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 32px 0;" />

      <p style="font-size: 12px; color: #64748b;">
        このURLはあなた専用です。他の方には共有しないでください。<br/>
        万一URLを紛失・流出された場合はすぐにご連絡ください。新しいURLを再発行いたします。
      </p>
    </div>
  `;
  await send({
    to: opts.to,
    subject: `【${APP_NAME}】専用マイページのご案内`,
    html,
  });
}

/**
 * 案件確定時の配分通知
 */
export async function sendPayoutConfirmedEmail(opts: {
  to: string;
  name: string;
  accessToken: string;
  clientName: string;
  amountYen: number;
  receiptType: "taxed" | "deferred";
}) {
  const url = `${getAppOrigin()}/r/${opts.accessToken}`;
  const receipt = opts.receiptType === "deferred" ? "繰延" : "即時";
  const amountStr = `¥${opts.amountYen.toLocaleString("ja-JP")}`;
  const html = `
    <div style="font-family: -apple-system, sans-serif; max-width: 560px; margin: 0 auto;">
      <h2 style="color: #0f172a;">${escapeHtml(opts.name)} 様</h2>
      <p>案件が確定し、${escapeHtml(opts.name)}様への配分が確定いたしました。</p>

      <table style="margin: 24px 0; width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 8px 12px; background: #f8fafc; border: 1px solid #e2e8f0; font-size: 12px; color: #64748b;">紹介先</td>
          <td style="padding: 8px 12px; border: 1px solid #e2e8f0;">${escapeHtml(opts.clientName)}</td>
        </tr>
        <tr>
          <td style="padding: 8px 12px; background: #f8fafc; border: 1px solid #e2e8f0; font-size: 12px; color: #64748b;">受取方式</td>
          <td style="padding: 8px 12px; border: 1px solid #e2e8f0;">${receipt}</td>
        </tr>
        <tr>
          <td style="padding: 8px 12px; background: #f8fafc; border: 1px solid #e2e8f0; font-size: 12px; color: #64748b;">配分金額</td>
          <td style="padding: 8px 12px; border: 1px solid #e2e8f0; font-size: 18px; font-weight: bold;">${amountStr}</td>
        </tr>
      </table>

      <p style="margin: 24px 0;">
        <a href="${url}" style="display: inline-block; padding: 12px 20px; background: #0f172a; color: #fff; text-decoration: none; border-radius: 8px;">マイページで確認する</a>
      </p>

      <p style="font-size: 12px; color: #64748b;">
        支払いステータスはマイページからご確認いただけます。
      </p>
    </div>
  `;
  await send({
    to: opts.to,
    subject: `【${APP_NAME}】配分が確定しました（${opts.clientName}）`,
    html,
  });
}

/**
 * トスアップ申告時のクロージング担当者向け通知
 */
export async function sendTossUpNotificationEmail(opts: {
  to: string;
  closerName: string;
  accessToken: string;
  clientName: string;
  tosserName: string;
  expectedHeadcount: number | null;
  notes: string | null;
}) {
  const url = `${getAppOrigin()}/r/${opts.accessToken}/closing`;
  const html = `
    <div style="font-family: -apple-system, sans-serif; max-width: 560px; margin: 0 auto;">
      <h2 style="color: #0f172a;">${escapeHtml(opts.closerName)} 様</h2>
      <p>新しい案件のトスアップがありました。</p>

      <table style="margin: 24px 0; width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 8px 12px; background: #f8fafc; border: 1px solid #e2e8f0; font-size: 12px; color: #64748b;">紹介先</td>
          <td style="padding: 8px 12px; border: 1px solid #e2e8f0;">${escapeHtml(opts.clientName)}</td>
        </tr>
        <tr>
          <td style="padding: 8px 12px; background: #f8fafc; border: 1px solid #e2e8f0; font-size: 12px; color: #64748b;">トスアップ者</td>
          <td style="padding: 8px 12px; border: 1px solid #e2e8f0;">${escapeHtml(opts.tosserName)}</td>
        </tr>
        ${
          opts.expectedHeadcount != null
            ? `<tr>
                <td style="padding: 8px 12px; background: #f8fafc; border: 1px solid #e2e8f0; font-size: 12px; color: #64748b;">予定人数</td>
                <td style="padding: 8px 12px; border: 1px solid #e2e8f0;">${opts.expectedHeadcount} 名</td>
              </tr>`
            : ""
        }
        ${
          opts.notes
            ? `<tr>
                <td style="padding: 8px 12px; background: #f8fafc; border: 1px solid #e2e8f0; font-size: 12px; color: #64748b;">メモ</td>
                <td style="padding: 8px 12px; border: 1px solid #e2e8f0; white-space: pre-wrap;">${escapeHtml(opts.notes)}</td>
              </tr>`
            : ""
        }
      </table>

      <p style="margin: 24px 0;">
        <a href="${url}" style="display: inline-block; padding: 12px 20px; background: #0f172a; color: #fff; text-decoration: none; border-radius: 8px;">クロージング管理画面を開く</a>
      </p>

      <p style="font-size: 12px; color: #64748b;">
        打ち合わせ日の設定や、確定処理を行ってください。
      </p>
    </div>
  `;
  await send({
    to: opts.to,
    subject: `【${APP_NAME}】新規トスアップ（${opts.clientName}）`,
    html,
  });
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
