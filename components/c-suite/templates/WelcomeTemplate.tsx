import type { OnboardingData } from "@/lib/types"
import { OFFER_DEFAULTS } from "@/lib/types"

/**
 * Welcome packet — first thing the client sees after signing.
 * Self-contained light-mode Orage HTML, inline styles only.
 */

const FONT_HEAD =
  "'Bebas Neue', Impact, 'Anton', 'Oswald', 'Arial Narrow', 'Helvetica Neue Condensed', sans-serif"
const FONT_BODY =
  "'Montserrat', -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif"
const GOLD = "#B68039"
const GOLD_DEEP = "#7A5A2E"
const GOLD_TERT = "#8C6830"
const INK = "#2C1A00"
const INK_2 = "#3D2500"
const PAPER = "#FFFFFF"
const FEATURE = "#F5EBDC"
const BORDER_SOFT = "#E0CFB5"
const LOGO_URL =
  "https://storage.googleapis.com/msgsndr/651kIrlKk834C2FEl66i/media/688a8bfb5a3e648018748f5e.png"

const featureBox = (eyebrow: string, title: string, bodyHtml: string) => `
  <div style="background:${FEATURE};border:1px solid ${BORDER_SOFT};border-radius:12px;padding:22px 24px;margin:14px 0;">
    <p style="margin:0 0 8px;font-family:${FONT_HEAD};font-size:11px;letter-spacing:5px;color:${GOLD_TERT};text-transform:uppercase;font-weight:400;">${eyebrow}</p>
    <h3 style="margin:0 0 12px;font-family:${FONT_HEAD};font-size:22px;letter-spacing:2px;color:${GOLD_DEEP};text-transform:uppercase;font-weight:400;line-height:1.2;">${title}</h3>
    <div style="font-family:${FONT_BODY};font-size:14px;font-weight:500;line-height:1.65;color:${INK_2};">${bodyHtml}</div>
  </div>`

const li = (html: string) => `
  <li style="margin:0 0 6px;font-family:${FONT_BODY};font-size:14px;font-weight:500;line-height:1.65;color:${INK_2};">${html}</li>`

const ul = (items: string[]) => `
  <ul style="margin:0 0 14px;padding:0 0 0 18px;list-style:disc;">${items.map(li).join("")}</ul>`

export default function WelcomeTemplate(data: OnboardingData): string {
  const offerDisplayName = OFFER_DEFAULTS[data.offer_type]?.displayName || data.offer_type

  const packageBody = (() => {
    switch (data.offer_type) {
      case "Toolkit":
        return {
          headline: "Your Toolkit is ready",
          bullets: [
            `"AI for Business" platform &amp; course (full curriculum access)`,
            `Free CRM (Customer Relationship Management system)`,
            `Library of AI tools, templates, and workflow walkthroughs`,
            `Community access for peer learning`,
            `24/7 access to AI tools for learning and experimentation`,
          ],
          note: `Self-serve. Custom one-on-one onboarding is not included — you learn and implement at your own pace. $${data.monthly_fee.toLocaleString()}/mo after the 90-day onboarding window. Upgrade to Orage 90 any time.`,
        }
      case "Orage90":
        return {
          headline: "Your 90 days start now",
          bullets: [
            `Free CRM (Customer Relationship Management system)`,
            `Custom AI voice / phone agent setup`,
            `Email / SMS AI agent implementation`,
            `Custom 90-day onboarding tailored to your business`,
            `"AI for Business" platform / course access`,
            `Integration with your existing systems and workflows`,
            `Ongoing optimization during the 90-day window`,
          ],
          note: `After the 90-day onboarding phase, services continue month-to-month at $${data.monthly_fee.toLocaleString()}/mo.`,
        }
      default:
        return {
          headline: "Your AI-Enabled engagement begins",
          bullets: [
            `Everything in Orage 90 PLUS:`,
            `Dedicated implementation team and account leadership`,
            `Multiple AI agents (voice, SMS, email, chat) tuned to your workflows`,
            `Custom tool development based on your specific operations`,
            `1-on-1 strategic consulting with agency leadership`,
            `White-glove ongoing optimization and performance monitoring`,
            `Priority access to new tools, features, and capabilities`,
            `Quarterly executive business reviews`,
          ],
          note: `90-day implementation phase followed by ongoing strategic partnership at $${data.monthly_fee.toLocaleString()}/mo.`,
        }
    }
  })()

  const nextStepsHtml =
    data.offer_type === "Toolkit"
      ? `<p style="margin:0 0 10px;font-family:${FONT_BODY};font-size:14px;font-weight:600;color:${INK};">03 — Start learning</p>
         <p style="margin:0 0 14px;font-family:${FONT_BODY};font-size:13px;font-weight:500;line-height:1.65;color:${INK_2};">Access your course materials immediately through the portal. Begin with the intro modules to get familiar with AI fundamentals and our platform.</p>
         <p style="margin:0 0 10px;font-family:${FONT_BODY};font-size:14px;font-weight:600;color:${INK};">04 — Explore your tools</p>
         <p style="margin:0;font-family:${FONT_BODY};font-size:13px;font-weight:500;line-height:1.65;color:${INK_2};">Your free CRM and AI tools are ready to use. Follow the tutorials to start experimenting.</p>`
      : `<p style="margin:0 0 10px;font-family:${FONT_BODY};font-size:14px;font-weight:600;color:${INK};">03 — Initial consultation</p>
         <p style="margin:0 0 8px;font-family:${FONT_BODY};font-size:13px;font-weight:500;line-height:1.65;color:${INK_2};">We'll reach out within a week to schedule your kickoff call. We'll cover:</p>
         ${ul([
           `Business goals and AI implementation strategy`,
           `90-day timeline and milestones`,
           `Custom onboarding process`,
           `Agent setup and configuration`,
           `Any questions you may have`,
         ])}
         <p style="margin:0 0 10px;font-family:${FONT_BODY};font-size:14px;font-weight:600;color:${INK};">04 — Let's build</p>
         <p style="margin:0;font-family:${FONT_BODY};font-size:13px;font-weight:500;line-height:1.65;color:${INK_2};">Once we've aligned on strategy, we'll begin implementing your AI agents and tools.</p>`

  const portalAccessHtml = data.client_id
    ? `<p style="margin:0 0 4px;font-family:${FONT_BODY};font-size:12px;font-weight:500;color:${INK_2};">Portal URL</p>
       <p style="margin:0 0 12px;font-family:${FONT_BODY};font-size:13px;font-weight:600;color:${GOLD};word-break:break-all;">${escapeHtml(data.portal_login_url || "https://portal.orage.agency/portal/login")}</p>
       <p style="margin:0 0 4px;font-family:${FONT_BODY};font-size:12px;font-weight:500;color:${INK_2};">Client ID</p>
       <p style="margin:0 0 12px;font-family:${FONT_BODY};font-size:13px;font-weight:600;color:${INK};">${escapeHtml(data.client_id)}</p>
       <p style="margin:0 0 4px;font-family:${FONT_BODY};font-size:12px;font-weight:500;color:${INK_2};">Email</p>
       <p style="margin:0;font-family:${FONT_BODY};font-size:13px;font-weight:600;color:${INK};">${escapeHtml(data.client_email)}</p>`
    : `<p style="margin:0 0 4px;font-family:${FONT_BODY};font-size:12px;font-weight:500;color:${INK_2};">Portal URL</p>
       <p style="margin:0 0 12px;font-family:${FONT_BODY};font-size:13px;font-weight:600;color:${GOLD};">${escapeHtml(data.portal_url || "Will be provided after activation")}</p>
       <p style="margin:0;font-family:${FONT_BODY};font-size:13px;font-weight:500;color:${INK_2};">Login credentials will be sent separately.</p>`

  return `
<div style="background:${PAPER};color:${INK};font-family:${FONT_BODY};max-width:680px;margin:0 auto;padding:40px 48px;box-sizing:border-box;">

  <!-- 01 · HEADER -->
  <div style="text-align:center;padding-bottom:24px;border-bottom:2px solid ${GOLD};margin-bottom:32px;">
    <img src="${LOGO_URL}" alt="Orage AI Agency" style="width:96px;height:auto;display:inline-block;margin:0 0 16px;" />
    <p style="margin:0 0 8px;font-family:${FONT_HEAD};font-size:11px;letter-spacing:5px;color:${GOLD_TERT};text-transform:uppercase;font-weight:400;">Welcome packet</p>
    <h1 style="margin:0;font-family:${FONT_HEAD};font-size:32px;letter-spacing:6px;color:${GOLD};text-transform:uppercase;font-weight:400;line-height:1;">Welcome aboard</h1>
  </div>

  <!-- 02 · INTRO -->
  <p style="margin:0 0 14px;font-family:${FONT_BODY};font-size:15px;font-weight:600;color:${INK};line-height:1.7;">Hi ${escapeHtml(data.contact_name || "there")},</p>
  <p style="margin:0 0 14px;font-family:${FONT_BODY};font-size:15px;font-weight:600;color:${INK};line-height:1.7;">Thank you for choosing Orage AI Agency. We're excited to help ${escapeHtml(data.business_name)} operate at <strong style="color:${GOLD};">3× capacity</strong> without adding a single hire.</p>
  <p style="margin:0 0 24px;font-family:${FONT_BODY};font-size:14px;font-weight:500;color:${INK_2};line-height:1.7;">Below is everything you need to get started. Read it once. Then start.</p>

  <!-- 03 · PORTAL ACCESS -->
  ${featureBox("01 — Your portal", "Client Portal Access", portalAccessHtml)}

  <p style="margin:14px 0 14px;font-family:${FONT_BODY};font-size:13px;font-weight:500;color:${INK_2};line-height:1.65;">Inside your portal you'll find your signed agreement, invoices, and all the paperwork in one place. Bookmark it for easy access.</p>

  <!-- 04 · YOUR PACKAGE -->
  ${featureBox(
    `02 — ${offerDisplayName}`,
    packageBody.headline,
    `<p style="margin:0 0 10px;font-family:${FONT_BODY};font-size:13px;font-weight:500;line-height:1.65;color:${INK_2};">Your package includes:</p>${ul(packageBody.bullets)}
     <p style="margin:14px 0 0;font-family:${FONT_BODY};font-size:12px;font-weight:600;color:${GOLD_DEEP};line-height:1.6;">${escapeHtml(packageBody.note)}</p>`,
  )}

  <!-- 05 · WHAT HAPPENS NEXT -->
  <div style="margin:24px 0 14px;">
    <p style="margin:0 0 6px;font-family:${FONT_HEAD};font-size:11px;letter-spacing:5px;color:${GOLD_TERT};text-transform:uppercase;">03 — Roadmap</p>
    <h2 style="margin:0 0 8px;font-family:${FONT_HEAD};font-size:22px;letter-spacing:3px;color:${GOLD};text-transform:uppercase;font-weight:400;line-height:1.1;">What happens next</h2>
    <div style="height:1px;background:rgba(182,128,57,0.25);margin:0 0 18px;"></div>
  </div>
  <p style="margin:0 0 10px;font-family:${FONT_BODY};font-size:14px;font-weight:600;color:${INK};">01 — Review your agreement</p>
  <p style="margin:0 0 14px;font-family:${FONT_BODY};font-size:13px;font-weight:500;line-height:1.65;color:${INK_2};">Your Master Service Agreement is included for your records. Keep it for your files.</p>
  <p style="margin:0 0 10px;font-family:${FONT_BODY};font-size:14px;font-weight:600;color:${INK};">02 — Log into your portal</p>
  <p style="margin:0 0 14px;font-family:${FONT_BODY};font-size:13px;font-weight:500;line-height:1.65;color:${INK_2};">Use the credentials above. Bookmark it.</p>
  ${nextStepsHtml}

  <!-- 06 · THIRD-PARTY NOTICE -->
  ${featureBox(
    "Heads up",
    "Third-party usage fees",
    `Certain AI services (voice / phone agents, SMS agents) may incur usage-based charges from third-party providers. These are billed directly by the providers and are separate from your Orage AI Agency fees. You're responsible for monitoring those costs. We'll help you optimize, but third-party pricing is outside our control.`,
  )}

  <!-- 07 · CONTACT -->
  <div style="margin:24px 0 14px;">
    <p style="margin:0 0 6px;font-family:${FONT_HEAD};font-size:11px;letter-spacing:5px;color:${GOLD_TERT};text-transform:uppercase;">04 — Stay in touch</p>
    <h2 style="margin:0 0 8px;font-family:${FONT_HEAD};font-size:22px;letter-spacing:3px;color:${GOLD};text-transform:uppercase;font-weight:400;line-height:1.1;">Contact us</h2>
    <div style="height:1px;background:rgba(182,128,57,0.25);margin:0 0 18px;"></div>
  </div>
  <p style="margin:0 0 14px;font-family:${FONT_BODY};font-size:14px;font-weight:500;line-height:1.7;color:${INK_2};">We built the Client Portal to keep your experience with us seamless and transparent. If anything comes up, reach out:</p>
  <p style="margin:0 0 4px;font-family:${FONT_BODY};font-size:13px;font-weight:500;color:${INK};">Email: <a href="mailto:team@orage.agency" style="color:${GOLD};text-decoration:none;">team@orage.agency</a></p>
  <p style="margin:0 0 24px;font-family:${FONT_BODY};font-size:13px;font-weight:500;color:${INK};">Web: <a href="https://orage.agency" style="color:${GOLD};text-decoration:none;">orage.agency</a></p>

  <!-- 08 · SIGNATURE -->
  <div style="border-top:1px solid ${BORDER_SOFT};padding-top:24px;margin-top:24px;">
    <p style="margin:0 0 10px;font-family:${FONT_BODY};font-size:14px;font-weight:500;color:${INK};">Talk soon,</p>
    <p style="margin:0 0 4px;font-family:${FONT_HEAD};font-size:22px;letter-spacing:2px;color:${GOLD};text-transform:uppercase;font-weight:400;line-height:1.2;">George Moffat</p>
    <p style="margin:0;font-family:${FONT_BODY};font-size:12px;font-weight:500;color:${INK_2};">Founder &amp; CEO · Orage AI Agency</p>
  </div>

  <!-- FOOTER -->
  <div style="margin-top:40px;padding-top:18px;border-top:2px solid ${GOLD};text-align:center;">
    <p style="margin:0;font-family:${FONT_BODY};font-size:11px;font-weight:500;color:${GOLD_TERT};letter-spacing:1px;text-transform:uppercase;">© ${new Date().getFullYear()} Orage AI Agency · Edmond, Oklahoma · orage.agency</p>
  </div>
</div>`
}

function escapeHtml(s: string): string {
  if (!s) return ""
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;")
}
