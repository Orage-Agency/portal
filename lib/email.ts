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
const BRONZE = "#7A5A2E"
const TEXT = "#2C1A00"
const TEXT_MID = "#3D2500"
const CARD_BORDER = "#D4C4AE"
const FEATURE_FILL = "rgba(182,128,57,0.10)"
const FEATURE_BORDER = "rgba(182,128,57,0.25)"
const LOGO_URL = "https://assets.cdn.filesafe.space/651kIrlKk834C2FEl66i/media/69b0c2eebfc81fb1ab616b02.png"
const BEBAS = `'Bebas Neue', Impact, 'Anton', 'Oswald', 'Arial Narrow', 'Helvetica Neue Condensed', sans-serif`
const MONTSERRAT = `'Montserrat', -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif`

function shell(bodyHtml: string): string {
  return `<!DOCTYPE html>
<html lang="en"><head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <meta name="color-scheme" content="light dark"/>
  <meta name="supported-color-schemes" content="light dark"/>
  <link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Montserrat:wght@500;600;700&display=swap" rel="stylesheet"/>
  <style>
    :root { color-scheme: light dark; supported-color-schemes: light dark; }
    @media (prefers-color-scheme: dark) {
      body, .wrapper, .card, .mid-bg { background-color: #FFFFFF !important; }
    }
    @media (max-width: 500px) {
      .card { padding: 24px 18px !important; }
      .feature { padding: 20px 18px !important; }
      .h1 { font-size: 26px !important; letter-spacing: 4px !important; }
      .h2 { font-size: 22px !important; letter-spacing: 2px !important; }
      .cta { padding: 16px 24px !important; font-size: 14px !important; }
    }
  </style>
</head>
<body class="wrapper" style="margin:0;padding:0;background:#FFFFFF;font-family:${MONTSERRAT};color:${TEXT};">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#FFFFFF;padding:24px 12px;">
    <tr><td align="center" style="background:#FFFFFF;">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#FFFFFF;border:1px solid ${CARD_BORDER};border-radius:12px;overflow:hidden;">
        <tr><td align="center" style="padding:24px 0 16px;background:#FFFFFF;">
          <img src="${LOGO_URL}" alt="Orage AI Agency" width="88" style="display:block;width:88px;height:auto;border:0;outline:none;"/>
        </td></tr>
        <tr><td class="card" style="padding:8px 36px 36px;background:#FFFFFF;color:${TEXT};">
          ${bodyHtml}
        </td></tr>
        <tr><td style="padding:20px 36px 28px;background:#FFFFFF;border-top:2px solid ${GOLD};">
          <p style="margin:14px 0 0;font-family:${MONTSERRAT};font-size:11px;font-weight:500;line-height:1.6;color:${BRONZE};text-align:center;">Orage AI Agency · Edmond, Oklahoma · ${TEAM_EMAIL}</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`
}

function eyebrow(label: string): string {
  return `<p style="margin:0 0 8px;font-family:${BEBAS};font-size:11px;font-weight:400;letter-spacing:5px;text-transform:uppercase;color:${BRONZE};">${escapeHtml(label)}</p>`
}

function h1(text: string): string {
  return `<h1 class="h1" style="margin:0 0 18px;font-family:${BEBAS};font-size:32px;font-weight:400;letter-spacing:6px;text-transform:uppercase;color:${GOLD};line-height:1.05;text-align:center;">${escapeHtml(text)}</h1>`
}

function divider(): string {
  return `<div style="width:64px;height:2px;background:${GOLD};margin:0 auto 24px;"></div>`
}

function intro(text: string): string {
  return `<p style="margin:0 0 14px;font-family:${MONTSERRAT};font-size:15px;font-weight:600;line-height:1.7;color:${TEXT};text-align:center;">${text}</p>`
}

function primaryCta(href: string, label: string, trust?: string): string {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:8px 0 4px;">
    <a class="cta" href="${href}" style="display:inline-block;background:${GOLD};color:#FFFFFF;text-decoration:none;font-family:${BEBAS};font-size:16px;font-weight:400;letter-spacing:2px;text-transform:uppercase;padding:18px 36px;border-radius:4px;">${escapeHtml(label)}</a>
  </td></tr>${trust ? `<tr><td align="center" style="padding:10px 0 0;"><p style="margin:0;font-family:${MONTSERRAT};font-size:11px;font-weight:600;color:${BRONZE};letter-spacing:0.4px;">${escapeHtml(trust)}</p></td></tr>` : ""}</table>`
}

function featureBox(inner: string, opts?: { emphasis?: boolean }): string {
  const border = opts?.emphasis ? `2px solid ${GOLD}` : `1px solid ${FEATURE_BORDER}`
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:22px 0;"><tr><td class="feature" style="background:${FEATURE_FILL};border:${border};border-radius:12px;padding:24px 22px;">${inner}</td></tr></table>`
}

function secondaryCta(href: string, label: string): string {
  return `<a href="${href}" style="display:inline-block;background:transparent;color:${GOLD};text-decoration:none;font-family:${BEBAS};font-size:14px;font-weight:400;letter-spacing:2px;text-transform:uppercase;padding:13px 26px;border:1px solid ${GOLD};border-radius:4px;">${escapeHtml(label)} →</a>`
}

export function invitationEmail(args: {
  recipientName: string
  businessName: string
  signUrl: string
  intakeUrl: string
  connectUrl: string
}): { subject: string; html: string } {
  const subject = `Your Orage AI Agency agreement — sign, voice setup, connect tools`
  const firstName = (args.recipientName || args.businessName || "").split(" ")[0]
  const html = shell(`
    ${eyebrow("01 — Welcome")}
    ${h1(firstName ? `Welcome, ${firstName}.` : "Welcome.")}
    ${divider()}
    ${intro(`Your Master Service Agreement with Orage AI Agency is ready. Three quick steps below — sign, send us your voice, and connect the tools you use. Your STACY agent goes live within 48 hours.`)}

    ${primaryCta(args.signUrl, "Review & Sign", "Takes about a minute · secure signing link")}

    ${featureBox(`
      ${eyebrow("02 — Build your agents · 3 minutes")}
      <h2 class="h2" style="margin:0 0 10px;font-family:${BEBAS};font-size:24px;font-weight:400;letter-spacing:2px;text-transform:uppercase;color:${BRONZE};line-height:1.1;">Send us your voice.</h2>
      <p style="margin:0 0 16px;font-family:${MONTSERRAT};font-size:14px;font-weight:500;line-height:1.7;color:${TEXT_MID};">Six short questions. You talk, we listen. Your answers train the phone agent and chat agent that go live for <strong style="color:${GOLD};font-weight:700;">${escapeHtml(args.businessName)}</strong> inside 48 hours.</p>
      <p style="margin:0;">${secondaryCta(args.intakeUrl, "Start voice setup")}</p>
      <p style="margin:14px 0 0;font-family:${MONTSERRAT};font-size:11px;font-weight:600;color:${BRONZE};letter-spacing:0.4px;">Best on your phone · saves automatically</p>
    `)}

    ${featureBox(`
      ${eyebrow("03 — Connect your tools · one tap each")}
      <h2 class="h2" style="margin:0 0 10px;font-family:${BEBAS};font-size:24px;font-weight:400;letter-spacing:2px;text-transform:uppercase;color:${BRONZE};line-height:1.1;">No more back-and-forth.</h2>
      <p style="margin:0 0 16px;font-family:${MONTSERRAT};font-size:14px;font-weight:500;line-height:1.7;color:${TEXT_MID};">Tap Connect for each tool you use — Google, GoHighLevel, Stripe, Square, Calendly, WordPress. You sign in through their own login screen (we never see your password). Orage takes it from there.</p>
      <p style="margin:0;">${secondaryCta(args.connectUrl, "Connect your tools")}</p>
      <p style="margin:14px 0 0;font-family:${MONTSERRAT};font-size:11px;font-weight:600;color:${BRONZE};letter-spacing:0.4px;">Revoke any time · we never store your passwords</p>
    `)}

    <p style="margin:18px 0 0;font-family:${MONTSERRAT};font-size:13px;font-weight:500;line-height:1.7;color:${TEXT_MID};text-align:center;">Questions? Reply to this email — it goes straight to our team.</p>
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
  const firstName = (args.recipientName || args.businessName || "").split(" ")[0]
  const html = shell(`
    ${eyebrow("Signed & sealed")}
    ${h1(firstName ? `Welcome, ${firstName}.` : "Welcome.")}
    ${divider()}
    ${intro(`Thank you for signing your agreement. Your portal login is below — and one short step left to bring your agents online.`)}

    ${featureBox(`
      ${eyebrow("Your portal login")}
      <p style="margin:0 0 6px;font-family:${MONTSERRAT};font-size:14px;font-weight:600;color:${TEXT};"><strong style="color:${GOLD};font-weight:700;">URL:</strong> <a href="${args.portalLoginUrl}" style="color:${GOLD};text-decoration:none;">${args.portalLoginUrl}</a></p>
      <p style="margin:0 0 6px;font-family:${MONTSERRAT};font-size:14px;font-weight:600;color:${TEXT};"><strong style="color:${GOLD};font-weight:700;">Client ID:</strong> ${escapeHtml(args.clientId)}</p>
      <p style="margin:0;font-family:${MONTSERRAT};font-size:14px;font-weight:600;color:${TEXT};"><strong style="color:${GOLD};font-weight:700;">Email:</strong> ${escapeHtml(args.clientEmail)}</p>
    `, { emphasis: true })}

    ${eyebrow("One more step · 3 minutes")}
    <h2 class="h2" style="margin:6px 0 10px;font-family:${BEBAS};font-size:24px;font-weight:400;letter-spacing:2px;text-transform:uppercase;color:${GOLD};line-height:1.1;">Send us your voice.</h2>
    <p style="margin:0 0 18px;font-family:${MONTSERRAT};font-size:14px;font-weight:500;line-height:1.7;color:${TEXT_MID};">Six short questions. You talk, we listen. Your answers train the phone agent and chat agent — live in 48 hours.</p>

    ${primaryCta(args.intakeUrl, "Start voice setup", "Best on your phone · saves automatically")}

    <p style="margin:24px 0 0;font-family:${MONTSERRAT};font-size:13px;font-weight:500;line-height:1.7;color:${TEXT_MID};text-align:center;">Questions? Reply to this email — it goes straight to our team.</p>
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
    ${eyebrow("New signed agreement")}
    ${h1(args.businessName)}
    ${divider()}
    ${featureBox(`
      <p style="margin:0 0 8px;font-family:${MONTSERRAT};font-size:14px;font-weight:600;color:${TEXT};"><strong style="color:${GOLD};font-weight:700;">Contact:</strong> ${escapeHtml(args.clientName)} &lt;${escapeHtml(args.clientEmail)}&gt;</p>
      <p style="margin:0;font-family:${MONTSERRAT};font-size:14px;font-weight:600;color:${TEXT};"><strong style="color:${GOLD};font-weight:700;">Client ID:</strong> ${escapeHtml(args.clientId)}</p>
    `)}
    ${primaryCta(args.reviewUrl, "Review & Countersign", "Internal notice · agency action required")}
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
