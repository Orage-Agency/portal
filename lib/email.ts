import nodemailer, { type Transporter } from "nodemailer"

/**
 * Server-only Gmail SMTP client. Requires a Gmail App Password (NOT the
 * account password) — generate one at https://myaccount.google.com/apppasswords
 * with 2FA enabled on team@orage.agency.
 *
 * Env vars:
 *   GMAIL_USER           e.g. team@orage.agency
 *   GMAIL_APP_PASSWORD   16-char app password
 *   EMAIL_FROM           Optional friendly From header, defaults to GMAIL_USER
 *   EMAIL_REPLY_TO       Optional Reply-To, defaults to GMAIL_USER
 */

const TEAM_EMAIL = "team@orage.agency"

let cached: Transporter | null = null

function transport(): Transporter {
  if (cached) return cached
  const user = process.env.GMAIL_USER || TEAM_EMAIL
  const pass = process.env.GMAIL_APP_PASSWORD
  if (!pass) {
    throw new Error(
      "GMAIL_APP_PASSWORD is not set. Generate a Gmail App Password for " +
        user +
        " at https://myaccount.google.com/apppasswords and add it to your environment.",
    )
  }
  cached = nodemailer.createTransport({
    service: "gmail",
    auth: { user, pass },
  })
  return cached
}

export interface SendArgs {
  to: string
  subject: string
  html: string
  text?: string
  bcc?: string
  replyTo?: string
}

export async function sendEmail(args: SendArgs): Promise<void> {
  const from = process.env.EMAIL_FROM || `Orage AI Agency <${process.env.GMAIL_USER || TEAM_EMAIL}>`
  const replyTo = args.replyTo || process.env.EMAIL_REPLY_TO || TEAM_EMAIL
  await transport().sendMail({
    from,
    to: args.to,
    bcc: args.bcc,
    replyTo,
    subject: args.subject,
    html: args.html,
    text: args.text || stripHtml(args.html),
  })
}

function stripHtml(html: string): string {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, "")
    .replace(/\s+/g, " ")
    .trim()
}

const GOLD = "#B68039"

function shell(bodyHtml: string): string {
  return `<!DOCTYPE html>
<html><head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/></head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;color:#fff;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0a;padding:24px 0;">
    <tr><td align="center">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;background:#111;border:1px solid ${GOLD};border-radius:12px;overflow:hidden;">
        <tr><td style="padding:32px;color:#fff;">
          ${bodyHtml}
          <hr style="border:none;border-top:1px solid #333;margin:32px 0 16px;"/>
          <p style="font-size:12px;color:#888;margin:0;">Orage AI Agency · ${TEAM_EMAIL}</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`
}

export function invitationEmail(args: {
  recipientName: string
  businessName: string
  signUrl: string
}): { subject: string; html: string } {
  const subject = `Your Orage AI Agency agreement is ready to sign`
  const html = shell(`
    <h1 style="color:${GOLD};font-size:24px;margin:0 0 16px;">Welcome, ${escapeHtml(args.recipientName || args.businessName)}.</h1>
    <p style="font-size:16px;line-height:1.6;margin:0 0 16px;">Your Master Service Agreement with Orage AI Agency is ready. Click the button below to review and sign — it takes about a minute.</p>
    <p style="margin:24px 0;">
      <a href="${args.signUrl}" style="display:inline-block;background:${GOLD};color:#0a0a0a;font-weight:700;text-decoration:none;padding:14px 28px;border-radius:8px;font-size:16px;">Review &amp; Sign</a>
    </p>
    <p style="font-size:14px;color:#bbb;line-height:1.6;margin:0 0 8px;">Or paste this link into your browser:</p>
    <p style="font-size:13px;color:${GOLD};word-break:break-all;margin:0 0 16px;">${args.signUrl}</p>
    <p style="font-size:14px;color:#bbb;line-height:1.6;margin:16px 0 0;">After you sign, you'll receive your client portal login and a short onboarding intake to get your agents built.</p>
  `)
  return { subject, html }
}

export function welcomeEmail(args: {
  recipientName: string
  businessName: string
  clientId: string
  clientEmail: string
  portalLoginUrl: string
  intakeUrl: string
}): { subject: string; html: string } {
  const subject = `Welcome to Orage AI Agency — your portal access`
  const html = shell(`
    <h1 style="color:${GOLD};font-size:24px;margin:0 0 16px;">Signed and sealed, ${escapeHtml(args.recipientName || args.businessName)}.</h1>
    <p style="font-size:16px;line-height:1.6;margin:0 0 16px;">Thank you for signing your agreement. Here is everything you need to get started.</p>

    <div style="background:#0a0a0a;border:1px solid ${GOLD};border-radius:8px;padding:20px;margin:24px 0;">
      <p style="margin:0 0 8px;color:${GOLD};font-size:12px;text-transform:uppercase;letter-spacing:1px;">Your portal login</p>
      <p style="margin:0 0 6px;font-size:14px;"><strong>Login URL:</strong> <a href="${args.portalLoginUrl}" style="color:${GOLD};">${args.portalLoginUrl}</a></p>
      <p style="margin:0 0 6px;font-size:14px;"><strong>Client ID:</strong> ${escapeHtml(args.clientId)}</p>
      <p style="margin:0;font-size:14px;"><strong>Email:</strong> ${escapeHtml(args.clientEmail)}</p>
    </div>

    <h2 style="color:#fff;font-size:18px;margin:24px 0 12px;">One more step — build your agents</h2>
    <p style="font-size:15px;line-height:1.6;margin:0 0 16px;">Three minutes of voice + a few quick taps. We turn your answers into a phone agent and chat agent tuned to your business — live in 48 hours.</p>
    <p style="margin:24px 0;">
      <a href="${args.intakeUrl}" style="display:inline-block;background:${GOLD};color:#0a0a0a;font-weight:700;text-decoration:none;padding:14px 28px;border-radius:8px;font-size:16px;">Continue to Agent Setup</a>
    </p>

    <p style="font-size:14px;color:#bbb;line-height:1.6;margin:24px 0 0;">Questions? Reply to this email — it goes straight to our team.</p>
  `)
  return { subject, html }
}

export function signedNotificationEmail(args: {
  businessName: string
  clientName: string
  clientEmail: string
  clientId: string
  reviewUrl: string
}): { subject: string; html: string } {
  const subject = `Signed: ${args.businessName} completed onboarding`
  const html = shell(`
    <h1 style="color:${GOLD};font-size:22px;margin:0 0 16px;">New signed agreement</h1>
    <p style="font-size:15px;line-height:1.6;margin:0 0 8px;"><strong>Business:</strong> ${escapeHtml(args.businessName)}</p>
    <p style="font-size:15px;line-height:1.6;margin:0 0 8px;"><strong>Contact:</strong> ${escapeHtml(args.clientName)} &lt;${escapeHtml(args.clientEmail)}&gt;</p>
    <p style="font-size:15px;line-height:1.6;margin:0 0 16px;"><strong>Client ID:</strong> ${escapeHtml(args.clientId)}</p>
    <p style="margin:24px 0;">
      <a href="${args.reviewUrl}" style="display:inline-block;background:${GOLD};color:#0a0a0a;font-weight:700;text-decoration:none;padding:12px 24px;border-radius:8px;font-size:15px;">Review &amp; Countersign</a>
    </p>
  `)
  return { subject, html }
}

function escapeHtml(v: string): string {
  return (v || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
}

export const TEAM_NOTIFY_EMAIL = TEAM_EMAIL
