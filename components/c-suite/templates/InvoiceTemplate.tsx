import type { OnboardingData } from "@/lib/types"
import { OFFER_DEFAULTS } from "@/lib/types"

/**
 * Invoice — clean, light-mode Orage HTML. Self-contained, inline styles only.
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

export default function InvoiceTemplate(data: OnboardingData): string {
  const today = new Date()
  const invoiceDate = today.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })
  const invoiceNumber = `${(data.business_name || "ORA").substring(0, 3).toUpperCase()}-${String(today.getMonth() + 1).padStart(2, "0")}${String(today.getDate()).padStart(2, "0")}`

  const day91 = new Date(today)
  day91.setDate(day91.getDate() + 90)
  const monthlyStart = day91.toLocaleDateString("en-US", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  })
  const billingPeriodStart = today.toLocaleDateString("en-US", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  })

  const offerDisplayName = OFFER_DEFAULTS[data.offer_type]?.displayName || data.offer_type
  const subtotal = data.setup_fee

  const customServicesRow = data.custom_services
    ? `<tr>
        <td colspan="2" style="padding:14px 18px;font-family:${FONT_BODY};font-size:13px;font-weight:500;color:${INK_2};border-bottom:1px solid ${BORDER_SOFT};line-height:1.6;"><strong style="color:${GOLD_DEEP};">Additional services:</strong><br/>${escapeHtml(data.custom_services).replace(/\n/g, "<br/>")}</td>
       </tr>`
    : ""

  return `
<div style="background:${PAPER};color:${INK};font-family:${FONT_BODY};max-width:680px;margin:0 auto;padding:40px 48px;box-sizing:border-box;">

  <!-- 01 · HEADER -->
  <div style="text-align:center;padding-bottom:24px;border-bottom:2px solid ${GOLD};margin-bottom:32px;">
    <img src="${LOGO_URL}" alt="Orage AI Agency" style="width:96px;height:auto;display:inline-block;margin:0 0 16px;" />
    <p style="margin:0 0 8px;font-family:${FONT_HEAD};font-size:11px;letter-spacing:5px;color:${GOLD_TERT};text-transform:uppercase;font-weight:400;">Invoice</p>
    <h1 style="margin:0 0 6px;font-family:${FONT_HEAD};font-size:32px;letter-spacing:6px;color:${GOLD};text-transform:uppercase;font-weight:400;line-height:1;">#${invoiceNumber}</h1>
    <p style="margin:0;font-family:${FONT_BODY};font-size:12px;font-weight:500;color:${INK_2};">Date issued: ${invoiceDate}</p>
  </div>

  <!-- 02 · FROM / TO -->
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse;margin:0 0 24px;">
    <tr>
      <td style="vertical-align:top;padding:0 12px 14px 0;width:50%;">
        <p style="margin:0 0 6px;font-family:${FONT_HEAD};font-size:11px;letter-spacing:4px;color:${GOLD_TERT};text-transform:uppercase;">Invoice by</p>
        <p style="margin:0 0 2px;font-family:${FONT_HEAD};font-size:16px;letter-spacing:2px;color:${INK};text-transform:uppercase;line-height:1.2;">Orage AI Agency</p>
        <p style="margin:0;font-family:${FONT_BODY};font-size:12px;font-weight:500;color:${INK_2};line-height:1.6;">424 E 2nd St<br/>Edmond, OK 73034<br/><a href="mailto:team@orage.agency" style="color:${GOLD};text-decoration:none;">team@orage.agency</a><br/>(405) 967-9085</p>
      </td>
      <td style="vertical-align:top;padding:0 0 14px 12px;width:50%;">
        <p style="margin:0 0 6px;font-family:${FONT_HEAD};font-size:11px;letter-spacing:4px;color:${GOLD_TERT};text-transform:uppercase;">Bill to</p>
        <p style="margin:0 0 2px;font-family:${FONT_HEAD};font-size:16px;letter-spacing:2px;color:${INK};text-transform:uppercase;line-height:1.2;">${escapeHtml(data.business_name)}</p>
        <p style="margin:0;font-family:${FONT_BODY};font-size:12px;font-weight:500;color:${INK_2};line-height:1.6;">${escapeHtml(data.contact_name || "")}${data.contact_name ? "<br/>" : ""}${escapeHtml(data.client_address || "")}${data.client_address ? "<br/>" : ""}${[data.client_city, data.client_state, data.client_zip].filter(Boolean).map(escapeHtml).join(" ")}${data.client_email ? `<br/><a href=\"mailto:${escapeHtml(data.client_email)}\" style=\"color:${GOLD};text-decoration:none;\">${escapeHtml(data.client_email)}</a>` : ""}${data.client_phone ? `<br/>${escapeHtml(data.client_phone)}` : ""}</p>
      </td>
    </tr>
  </table>

  <!-- 03 · META -->
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:separate;border-spacing:0;margin:0 0 24px;background:${FEATURE};border:1px solid ${BORDER_SOFT};border-radius:10px;">
    <tr>
      <td style="padding:14px 18px;width:33%;border-right:1px solid ${BORDER_SOFT};">
        <p style="margin:0 0 4px;font-family:${FONT_HEAD};font-size:10px;letter-spacing:3px;color:${GOLD_TERT};text-transform:uppercase;">Billing period</p>
        <p style="margin:0;font-family:${FONT_BODY};font-size:12px;font-weight:600;color:${INK};">${billingPeriodStart} — ${monthlyStart}</p>
      </td>
      <td style="padding:14px 18px;width:33%;border-right:1px solid ${BORDER_SOFT};">
        <p style="margin:0 0 4px;font-family:${FONT_HEAD};font-size:10px;letter-spacing:3px;color:${GOLD_TERT};text-transform:uppercase;">Due</p>
        <p style="margin:0;font-family:${FONT_BODY};font-size:12px;font-weight:600;color:${INK};">On receipt</p>
      </td>
      <td style="padding:14px 18px;width:34%;">
        <p style="margin:0 0 4px;font-family:${FONT_HEAD};font-size:10px;letter-spacing:3px;color:${GOLD_TERT};text-transform:uppercase;">Phase</p>
        <p style="margin:0;font-family:${FONT_BODY};font-size:12px;font-weight:600;color:${INK};">90-day onboarding</p>
      </td>
    </tr>
  </table>

  <!-- 04 · LINE ITEMS -->
  <div style="margin:0 0 8px;">
    <p style="margin:0 0 6px;font-family:${FONT_HEAD};font-size:11px;letter-spacing:5px;color:${GOLD_TERT};text-transform:uppercase;">01 — Services</p>
    <h2 style="margin:0 0 14px;font-family:${FONT_HEAD};font-size:22px;letter-spacing:3px;color:${GOLD};text-transform:uppercase;font-weight:400;line-height:1.1;">${offerDisplayName} Package</h2>
  </div>
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:separate;border-spacing:0;margin:0 0 24px;border:1px solid ${BORDER_SOFT};border-radius:10px;overflow:hidden;">
    <tr>
      <td style="background:${FEATURE};padding:12px 18px;font-family:${FONT_HEAD};font-size:11px;letter-spacing:4px;color:${GOLD_TERT};text-transform:uppercase;border-bottom:1px solid ${BORDER_SOFT};">Description</td>
      <td style="background:${FEATURE};padding:12px 18px;font-family:${FONT_HEAD};font-size:11px;letter-spacing:4px;color:${GOLD_TERT};text-transform:uppercase;text-align:right;border-bottom:1px solid ${BORDER_SOFT};">Amount</td>
    </tr>
    <tr>
      <td style="padding:14px 18px;font-family:${FONT_BODY};font-size:13px;font-weight:600;color:${INK};border-bottom:1px solid ${BORDER_SOFT};line-height:1.5;">90-Day Onboarding Fee<br/><span style="font-weight:500;color:${INK_2};font-size:12px;">Monthly recurring of $${data.monthly_fee.toLocaleString()}/mo begins day 91 (${monthlyStart})</span></td>
      <td style="padding:14px 18px;font-family:${FONT_BODY};font-size:14px;font-weight:700;color:${GOLD};text-align:right;border-bottom:1px solid ${BORDER_SOFT};vertical-align:top;">$${data.setup_fee.toLocaleString()}</td>
    </tr>
    ${customServicesRow}
    <tr>
      <td style="padding:12px 18px;font-family:${FONT_BODY};font-size:13px;font-weight:500;color:${INK_2};text-align:right;">Subtotal</td>
      <td style="padding:12px 18px;font-family:${FONT_BODY};font-size:13px;font-weight:600;color:${INK};text-align:right;">$${subtotal.toLocaleString()}</td>
    </tr>
    <tr>
      <td style="padding:12px 18px;font-family:${FONT_BODY};font-size:13px;font-weight:500;color:${INK_2};text-align:right;">Tax (0%)</td>
      <td style="padding:12px 18px;font-family:${FONT_BODY};font-size:13px;font-weight:600;color:${INK};text-align:right;">$0.00</td>
    </tr>
    <tr>
      <td style="background:${FEATURE};padding:16px 18px;font-family:${FONT_HEAD};font-size:13px;letter-spacing:3px;color:${GOLD_DEEP};text-transform:uppercase;text-align:right;border-top:2px solid ${GOLD};">Amount due</td>
      <td style="background:${FEATURE};padding:16px 18px;font-family:${FONT_HEAD};font-size:22px;letter-spacing:2px;color:${GOLD};text-align:right;border-top:2px solid ${GOLD};">$${subtotal.toLocaleString()}</td>
    </tr>
  </table>

  <!-- 05 · PAYMENT METHODS -->
  <div style="margin:0 0 14px;">
    <p style="margin:0 0 6px;font-family:${FONT_HEAD};font-size:11px;letter-spacing:5px;color:${GOLD_TERT};text-transform:uppercase;">02 — Payment</p>
    <h2 style="margin:0 0 8px;font-family:${FONT_HEAD};font-size:22px;letter-spacing:3px;color:${GOLD};text-transform:uppercase;font-weight:400;line-height:1.1;">How to pay</h2>
    <div style="height:1px;background:rgba(182,128,57,0.25);margin:0 0 18px;"></div>
  </div>
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse;margin:0 0 24px;">
    <tr>
      <td style="vertical-align:top;padding:0 12px 14px 0;width:50%;">
        <p style="margin:0 0 6px;font-family:${FONT_HEAD};font-size:11px;letter-spacing:4px;color:${GOLD_TERT};text-transform:uppercase;">Bank wire / ACH</p>
        <p style="margin:0;font-family:${FONT_BODY};font-size:12px;font-weight:500;color:${INK_2};line-height:1.7;">Bank: Bank of America<br/>Account #: 305010984426<br/>Routing (Paper/Electronic): 103000017<br/>Routing (Wires): 026009593<br/>Account type: Business Adv Fundamentals — 4426<br/>Account holder: Orage AI Agency</p>
      </td>
      <td style="vertical-align:top;padding:0 0 14px 12px;width:50%;">
        <p style="margin:0 0 6px;font-family:${FONT_HEAD};font-size:11px;letter-spacing:4px;color:${GOLD_TERT};text-transform:uppercase;">Online</p>
        <p style="margin:0 0 8px;font-family:${FONT_BODY};font-size:12px;font-weight:500;color:${INK_2};line-height:1.7;">Stripe invoice link: <em style="color:${INK_2};">to be sent separately</em></p>
        <p style="margin:0;font-family:${FONT_BODY};font-size:12px;font-weight:500;color:${INK_2};line-height:1.7;">Client portal: <a href="${escapeHtml(data.portal_url || "https://portal.orage.agency")}" style="color:${GOLD};text-decoration:none;">${escapeHtml(data.portal_url || "portal.orage.agency")}</a></p>
      </td>
    </tr>
  </table>

  <!-- 06 · TERMS -->
  <div style="background:${FEATURE};border:1px solid ${BORDER_SOFT};border-radius:12px;padding:20px 22px;margin:0 0 14px;">
    <p style="margin:0 0 8px;font-family:${FONT_HEAD};font-size:11px;letter-spacing:4px;color:${GOLD_TERT};text-transform:uppercase;">Terms</p>
    <p style="margin:0 0 10px;font-family:${FONT_BODY};font-size:13px;font-weight:500;color:${INK_2};line-height:1.65;">Payment is due within 7 business days of the invoice date. Please forward remittance confirmation to <a href="mailto:team@orage.agency" style="color:${GOLD};text-decoration:none;">team@orage.agency</a>.</p>
    <p style="margin:0;font-family:${FONT_BODY};font-size:13px;font-weight:600;color:${INK};line-height:1.65;">No services will begin until payment is made and processed. All setup, implementation, and access provisions are contingent on receipt and clearance of payment.</p>
  </div>

  <!-- 07 · THIRD-PARTY NOTICE -->
  <div style="background:${FEATURE};border:1px solid ${BORDER_SOFT};border-radius:12px;padding:20px 22px;margin:0 0 32px;">
    <p style="margin:0 0 8px;font-family:${FONT_HEAD};font-size:11px;letter-spacing:4px;color:${GOLD_TERT};text-transform:uppercase;">Third-party usage fees</p>
    <p style="margin:0 0 8px;font-family:${FONT_BODY};font-size:13px;font-weight:500;color:${INK_2};line-height:1.65;">Certain AI services use third-party platforms that may charge you directly based on usage. These charges are <strong>separate from</strong> and <strong>in addition to</strong> your monthly Orage AI Agency fees:</p>
    <ul style="margin:0 0 8px;padding:0 0 0 18px;list-style:disc;">
      <li style="margin:0 0 4px;font-family:${FONT_BODY};font-size:12px;font-weight:500;color:${INK_2};line-height:1.6;"><strong>Voice / phone agents</strong> — per minute / per call</li>
      <li style="margin:0 0 4px;font-family:${FONT_BODY};font-size:12px;font-weight:500;color:${INK_2};line-height:1.6;"><strong>SMS / text agents</strong> — per message based on credits</li>
      <li style="margin:0;font-family:${FONT_BODY};font-size:12px;font-weight:500;color:${INK_2};line-height:1.6;">Additional integrated tools as specified in your service agreement</li>
    </ul>
    <p style="margin:0;font-family:${FONT_BODY};font-size:12px;font-weight:500;color:${INK_2};line-height:1.6;">These fees are billed by the respective service providers, NOT by Orage AI Agency. You are responsible for monitoring usage.</p>
  </div>

  <!-- 08 · CONTACT -->
  <p style="margin:0 0 14px;font-family:${FONT_BODY};font-size:13px;font-weight:500;color:${INK_2};line-height:1.7;text-align:center;">Questions about this invoice? <a href="mailto:team@orage.agency" style="color:${GOLD};text-decoration:none;">team@orage.agency</a> · (405) 967-9085</p>
  <p style="margin:0;font-family:${FONT_HEAD};font-size:14px;letter-spacing:3px;color:${GOLD};text-align:center;text-transform:uppercase;">Thank you</p>

  <!-- FOOTER -->
  <div style="margin-top:40px;padding-top:18px;border-top:2px solid ${GOLD};text-align:center;">
    <p style="margin:0;font-family:${FONT_BODY};font-size:11px;font-weight:500;color:${GOLD_TERT};letter-spacing:1px;text-transform:uppercase;">© ${new Date().getFullYear()} Orage AI Agency · Edmond, Oklahoma · George Moffat, Founder &amp; CEO</p>
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
