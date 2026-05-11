import type { OnboardingData } from "@/lib/types"
import { OFFER_DEFAULTS } from "@/lib/types"

/**
 * MSA — Master Service Agreement.
 *
 * Output is self-contained, light-mode Orage-branded HTML. Inline styles only —
 * survives textarea round-trip, dangerouslySetInnerHTML, html2canvas → PDF, and
 * email rendering. Per BRAND.md, all client-facing docs are LIGHT mode.
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

const sectionTitle = (eyebrow: string, title: string) => `
  <div style="margin:36px 0 14px;">
    <p style="margin:0 0 6px;font-family:${FONT_HEAD};font-size:11px;letter-spacing:5px;color:${GOLD_TERT};text-transform:uppercase;font-weight:400;">${eyebrow}</p>
    <h2 style="margin:0 0 8px;font-family:${FONT_HEAD};font-size:22px;letter-spacing:3px;color:${GOLD};text-transform:uppercase;font-weight:400;line-height:1.1;">${title}</h2>
    <div style="height:1px;background:rgba(182,128,57,0.25);"></div>
  </div>`

const p = (html: string) => `
  <p style="margin:0 0 12px;font-family:${FONT_BODY};font-size:13px;font-weight:500;line-height:1.7;color:${INK};">${html}</p>`

const li = (html: string) => `
  <li style="margin:0 0 6px;font-family:${FONT_BODY};font-size:13px;font-weight:500;line-height:1.65;color:${INK};">${html}</li>`

const ul = (items: string[]) => `
  <ul style="margin:0 0 14px;padding:0 0 0 18px;list-style:disc;">${items.map(li).join("")}</ul>`

const featureBox = (title: string, body: string) => `
  <div style="background:${FEATURE};border:1px solid ${BORDER_SOFT};border-radius:12px;padding:20px 22px;margin:14px 0;">
    <p style="margin:0 0 8px;font-family:${FONT_HEAD};font-size:11px;letter-spacing:4px;color:${GOLD_TERT};text-transform:uppercase;font-weight:400;">Note</p>
    <h4 style="margin:0 0 10px;font-family:${FONT_HEAD};font-size:18px;letter-spacing:2px;color:${GOLD_DEEP};text-transform:uppercase;font-weight:400;line-height:1.2;">${title}</h4>
    <p style="margin:0;font-family:${FONT_BODY};font-size:13px;font-weight:500;line-height:1.65;color:${INK_2};">${body}</p>
  </div>`

export default function MSATemplate(data: OnboardingData): string {
  const today = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })
  const offerDisplayName = OFFER_DEFAULTS[data.offer_type]?.displayName || data.offer_type

  const servicesByOffer = (() => {
    switch (data.offer_type) {
      case "Toolkit":
        return {
          intro: `The AGENCY will provide the CLIENT with self-serve access to the Orage AI Toolkit, including:`,
          bullets: [
            `"AI for Business" platform and course (full curriculum access)`,
            `Free CRM (Customer Relationship Management system)`,
            `Library of AI tools, templates, and workflow walkthroughs`,
            `Access to community channels and learning resources`,
            `24/7 access to AI tools (no implementation guarantee)`,
          ],
          note: `The Toolkit is a self-paced, self-serve offering. Custom one-on-one onboarding and done-for-you implementation are NOT included. CLIENT may upgrade to Orage 90 or AI-Enabled Companies at any time.`,
        }
      case "Orage90":
        return {
          intro: `The AGENCY will provide the CLIENT with a Done-For-You 90-day AI implementation, including:`,
          bullets: [
            `Free CRM (Customer Relationship Management system)`,
            `Custom AI voice/phone agent setup and configuration`,
            `Email/SMS AI agent implementation`,
            `Custom 90-day onboarding tailored to your business`,
            `"AI for Business" platform / course access`,
            `Integration with existing business systems and workflows`,
            `24/7 access to AI tools and ongoing optimization during the 90-day window`,
          ],
          note: `Orage 90 is a done-for-you implementation. The AGENCY drives setup and configuration during the 90-day onboarding period. After 90 days, services continue month-to-month at the recurring fee.`,
        }
      case "AIEnabled":
      default:
        return {
          intro: `The AGENCY will provide the CLIENT with a custom AI-Enabled Companies engagement, including:`,
          bullets: [
            `All services included in the Orage 90 package PLUS:`,
            `Dedicated implementation team and account leadership`,
            `Multiple AI agents (voice, SMS, email, chat) tuned to specific business workflows`,
            `Custom tool development based on the CLIENT's specific operations`,
            `1-on-1 strategic consulting with agency leadership`,
            `White-glove ongoing optimization and performance monitoring`,
            `Priority access to new tools, features, and capabilities`,
            `Executive advising and quarterly business reviews`,
          ],
          note: `AI-Enabled Companies is a custom enterprise engagement. The 90-day implementation phase is followed by ongoing strategic partnership at the agreed monthly retainer.`,
        }
    }
  })()

  const implementationBullets =
    data.offer_type === "Toolkit"
      ? [
          `Platform and course access provisioning`,
          `CRM access and basic setup guidance`,
          `Self-serve tool library access`,
        ]
      : data.offer_type === "Orage90"
      ? [
          `AI agent setup and configuration (voice/phone, email/SMS)`,
          `CRM system setup and integration`,
          `Custom 90-day onboarding`,
          `Platform access configuration`,
        ]
      : [
          `Multi-agent AI implementation (voice, SMS, email, chat)`,
          `CRM system setup and deep integration`,
          `Custom 90-day onboarding led by a dedicated implementation team`,
          `Custom tool development as scoped per engagement`,
          `Platform access configuration`,
        ]

  const agencySignatureMark = data.agency_signature
    ? `<img src="${data.agency_signature}" alt="Agency Signature" style="max-height:60px;display:block;margin:0 0 4px;" />`
    : `<div style="height:48px;border-bottom:1px solid ${GOLD};margin:0 0 6px;"></div>`

  const clientSignatureMark = data.signature
    ? `<img src="${data.signature}" alt="Client Signature" style="max-height:60px;display:block;margin:0 0 4px;" />`
    : `<div style="height:48px;border-bottom:1px solid ${GOLD};margin:0 0 6px;"></div>`

  const referralBlock =
    data.is_referral === "yes" && data.referral_name
      ? `<div style="margin:14px 0 0;padding:14px 16px;background:${FEATURE};border:1px solid ${BORDER_SOFT};border-radius:8px;">
          <p style="margin:0 0 4px;font-family:${FONT_HEAD};font-size:11px;letter-spacing:4px;color:${GOLD_TERT};text-transform:uppercase;">Referral acknowledgment</p>
          <p style="margin:0;font-family:${FONT_BODY};font-size:13px;font-weight:500;color:${INK};line-height:1.6;">This client was referred by <strong style="color:${GOLD};">${data.referral_name}</strong>. Referral commission: $${(data.referral_commission ?? 0).toLocaleString()}.</p>
        </div>`
      : ""

  const specialNotesSection = data.special_notes
    ? sectionTitle("10 — Special Terms", "Additional Provisions") +
      p(escapeHtml(data.special_notes).replace(/\n/g, "<br/>"))
    : ""

  const signatureSectionNumber = data.special_notes ? "11" : "10"

  return `
<div style="background:${PAPER};color:${INK};font-family:${FONT_BODY};max-width:680px;margin:0 auto;padding:40px 48px;box-sizing:border-box;">

  <!-- 01 · HEADER -->
  <div style="text-align:center;padding-bottom:24px;border-bottom:2px solid ${GOLD};margin-bottom:32px;">
    <img src="${LOGO_URL}" alt="Orage AI Agency" style="width:96px;height:auto;display:inline-block;margin:0 0 16px;" />
    <p style="margin:0 0 8px;font-family:${FONT_HEAD};font-size:11px;letter-spacing:5px;color:${GOLD_TERT};text-transform:uppercase;font-weight:400;">Orage AI Agency</p>
    <h1 style="margin:0;font-family:${FONT_HEAD};font-size:32px;letter-spacing:6px;color:${GOLD};text-transform:uppercase;font-weight:400;line-height:1;">Client Agreement</h1>
  </div>

  <!-- 02 · PARTIES + DATES -->
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse;margin:0 0 8px;">
    <tr>
      <td style="vertical-align:top;padding:0 12px 14px 0;width:50%;">
        <p style="margin:0 0 4px;font-family:${FONT_HEAD};font-size:11px;letter-spacing:4px;color:${GOLD_TERT};text-transform:uppercase;">Client</p>
        <p style="margin:0 0 2px;font-family:${FONT_HEAD};font-size:18px;letter-spacing:2px;color:${INK};text-transform:uppercase;line-height:1.2;">${escapeHtml(data.business_name || "—")}</p>
        <p style="margin:0;font-family:${FONT_BODY};font-size:13px;font-weight:500;color:${INK_2};">${escapeHtml(data.contact_name || "")}</p>
      </td>
      <td style="vertical-align:top;padding:0 0 14px 12px;width:50%;">
        <p style="margin:0 0 4px;font-family:${FONT_HEAD};font-size:11px;letter-spacing:4px;color:${GOLD_TERT};text-transform:uppercase;">Commences</p>
        <p style="margin:0 0 8px;font-family:${FONT_BODY};font-size:13px;font-weight:600;color:${INK};">${today}</p>
        <p style="margin:0 0 4px;font-family:${FONT_HEAD};font-size:11px;letter-spacing:4px;color:${GOLD_TERT};text-transform:uppercase;">Term</p>
        <p style="margin:0;font-family:${FONT_BODY};font-size:13px;font-weight:500;color:${INK_2};line-height:1.6;">90-day implementation, then ongoing month-to-month</p>
      </td>
    </tr>
  </table>

  ${sectionTitle("01 — Agreement", "Scope & Authority")}
  ${p(`This agreement contains the entire understanding between <strong style="color:${GOLD};">ORAGE AI AGENCY</strong> (the "AGENCY") and <strong style="color:${GOLD};">${escapeHtml(data.business_name)}</strong> (the "CLIENT"). It supersedes all prior and simultaneous agreements between the parties. The only way to add or change this agreement is to do so in writing, signed by all parties. If any part is found invalid or unenforceable, the remainder remains valid. Failure to enforce any provision shall not constitute a waiver of any other.`)}

  ${sectionTitle("02 — AI Services", `${offerDisplayName} Package`)}
  ${p(servicesByOffer.intro)}
  ${ul(servicesByOffer.bullets.map(escapeHtml))}
  ${data.custom_services ? p(`<strong style="color:${GOLD_DEEP};">Additional Custom Services:</strong><br/>${escapeHtml(data.custom_services).replace(/\n/g, "<br/>")}`) : ""}
  ${featureBox("How this tier works", escapeHtml(servicesByOffer.note))}
  ${p(`The CLIENT has selected the <strong>${offerDisplayName}</strong> package. The contract allows flexibility for service adjustments. If the CLIENT wants to upgrade packages, a new agreement will be formulated to reflect that change.`)}

  ${sectionTitle("03 — Payment", "Fees & Schedule")}
  ${p("Both parties have agreed to the following payment structure:")}
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:separate;border-spacing:0;margin:0 0 14px;border:1px solid ${BORDER_SOFT};border-radius:10px;overflow:hidden;">
    <tr>
      <td style="background:${FEATURE};padding:14px 18px;font-family:${FONT_HEAD};font-size:11px;letter-spacing:4px;color:${GOLD_TERT};text-transform:uppercase;border-bottom:1px solid ${BORDER_SOFT};">Line item</td>
      <td style="background:${FEATURE};padding:14px 18px;font-family:${FONT_HEAD};font-size:11px;letter-spacing:4px;color:${GOLD_TERT};text-transform:uppercase;text-align:right;border-bottom:1px solid ${BORDER_SOFT};">Amount</td>
    </tr>
    <tr>
      <td style="padding:14px 18px;font-family:${FONT_BODY};font-size:13px;font-weight:600;color:${INK};border-bottom:1px solid ${BORDER_SOFT};">90-Day Onboarding Fee <span style="font-weight:500;color:${INK_2};">(due on signing)</span></td>
      <td style="padding:14px 18px;font-family:${FONT_BODY};font-size:14px;font-weight:700;color:${GOLD};text-align:right;border-bottom:1px solid ${BORDER_SOFT};">$${data.setup_fee.toLocaleString()}</td>
    </tr>
    <tr>
      <td style="padding:14px 18px;font-family:${FONT_BODY};font-size:13px;font-weight:600;color:${INK};">Monthly Recurring <span style="font-weight:500;color:${INK_2};">(begins day 91)</span></td>
      <td style="padding:14px 18px;font-family:${FONT_BODY};font-size:14px;font-weight:700;color:${GOLD};text-align:right;">$${data.monthly_fee.toLocaleString()} / mo</td>
    </tr>
  </table>
  ${p(`The CLIENT will pay AGENCY the agreed amount per calendar month for as long as services are rendered. Paid via Stripe / Bank Transfer. AGENCY will send an invoice for services provided at the end of each billing cycle.`)}
  ${referralBlock}
  ${featureBox("Payment activates services", `No services begin until payment is made and processed. All setup, implementation, and access provisions are contingent on receipt and clearance of initial payment.`)}

  ${sectionTitle("04 — Responsibility of the Agency", "What we deliver")}
  ${p(`<strong style="color:${GOLD_DEEP};">Planning & Strategy</strong>`)}
  ${ul([
    `Business process audit and AI readiness assessment`,
    `Custom AI strategy development`,
    `Tools and systems planning`,
  ])}
  ${p(`<strong style="color:${GOLD_DEEP};">Implementation</strong>`)}
  ${ul(implementationBullets)}
  ${p(`<strong style="color:${GOLD_DEEP};">Ongoing Access</strong>`)}
  ${ul([
    `24/7 tool access${data.offer_type === "Toolkit" ? " for self-serve learning and use" : ""}`,
    `Platform updates and optimization`,
  ])}
  ${p(`AGENCY will provide all necessary AI tools, platforms, and systems needed to carry out this implementation at no further charge beyond the agreed monthly fee.`)}

  ${sectionTitle("05 — Intellectual Property", "Ownership & Usage")}
  ${p(`All custom configurations and setups created under this agreement remain the property of ORAGE AI AGENCY. AGENCY reserves the right to terminate access to all tools, systems, and configurations upon non-payment by CLIENT. AGENCY retains the right to use anonymized case studies and results in portfolio and marketing materials unless otherwise specified in writing.`)}

  ${sectionTitle("06 — Confidentiality", "Mutual Protection")}
  ${p(`Both parties agree to maintain confidentiality of all proprietary information, business processes, and data shared during the course of this engagement.`)}

  ${sectionTitle("07 — Termination", "Notice & Refund Conditions")}
  ${p(`After the initial 90-day onboarding phase, either party may terminate this agreement with 30 days written notice. CLIENT remains responsible for payment of all services rendered through the termination date. The 90-day onboarding fee is non-refundable once implementation has commenced, except as covered by the 30-Day Money Back Guarantee in Section 9.`)}
  ${data.offer_type === "Toolkit" ? featureBox("Toolkit cancellation", `Cancellation results in immediate loss of access to CRM, tools, and course materials. No refunds for partial months.`) : ""}

  ${sectionTitle("08 — Third-Party Usage Fees", "Direct-billed costs you should know")}
  ${p(`Certain AI services provided by ORAGE AI AGENCY utilize third-party platforms that may charge the CLIENT directly based on usage. These charges are separate from and in addition to the monthly fees paid to ORAGE AI AGENCY.`)}
  ${p(`<strong style="color:${GOLD_DEEP};">Services subject to usage fees</strong>`)}
  ${ul([
    `<strong>Voice / Phone AI Agents</strong> — based on minutes used, number of calls, voice synthesis usage`,
    `<strong>SMS / Text Agents</strong> — based on message volume and credits consumed`,
    `Additional third-party tools as integrated per client needs`,
  ])}
  ${p(`<strong style="color:${GOLD_DEEP};">Client responsibilities</strong>`)}
  ${ul([
    `Third-party usage fees are billed directly by the respective service providers, NOT by ORAGE AI AGENCY`,
    `CLIENT is responsible for monitoring usage and managing associated costs with third-party platforms`,
    `AGENCY will provide guidance on usage optimization but cannot control third-party pricing structures`,
    `CLIENT agrees to maintain active payment methods with third-party providers to ensure uninterrupted service`,
  ])}

  ${sectionTitle("09 — 30-Day Money Back Guarantee", "Refund Policy")}
  ${p(`ORAGE AI AGENCY offers a 30-Day Money Back Guarantee on all service tiers.`)}
  ${p(`<strong style="color:${GOLD_DEEP};">Terms of guarantee</strong>`)}
  ${ul([
    `The CLIENT has thirty (30) days from the date of signing this agreement to request a full refund of agency fees paid`,
    `Upon processing of a refund, ALL access to tools, CRM systems, course materials, and agency-provided platforms will be IMMEDIATELY revoked`,
    `Exercising this guarantee results in complete termination of services and loss of all data / configurations within the provided tools`,
  ])}
  ${p(`<strong style="color:${GOLD_DEEP};">Refund policy after 30 days</strong>`)}
  ${ul([
    `After the initial 30-day period, NO REFUNDS will be issued for any reason`,
    `Exceptions are limited to specific "Win Your Money Back" offers active on the CLIENT's engagement, or earnings through the Referral Program as outlined in separate documentation`,
    `Outside of these exceptions, all payments made after the 30-day window are final and non-refundable`,
  ])}

  ${specialNotesSection}

  ${sectionTitle(`${signatureSectionNumber} — Signatures`, `Entered into as of ${today}`)}
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse;margin:16px 0 0;">
    <tr>
      <td style="vertical-align:top;padding:0 12px 0 0;width:50%;">
        <p style="margin:0 0 8px;font-family:${FONT_HEAD};font-size:11px;letter-spacing:4px;color:${GOLD_TERT};text-transform:uppercase;">Orage AI Agency</p>
        ${agencySignatureMark}
        <p style="margin:0 0 2px;font-family:${FONT_BODY};font-size:12px;font-weight:600;color:${INK};">George Moffat</p>
        <p style="margin:0 0 2px;font-family:${FONT_BODY};font-size:11px;font-weight:500;color:${INK_2};">Founder &amp; CEO</p>
        <p style="margin:0;font-family:${FONT_BODY};font-size:11px;font-weight:500;color:${INK_2};">Date: ${data.agency_signature_date ? new Date(data.agency_signature_date).toLocaleDateString() : "_____________"}</p>
      </td>
      <td style="vertical-align:top;padding:0 0 0 12px;width:50%;">
        <p style="margin:0 0 8px;font-family:${FONT_HEAD};font-size:11px;letter-spacing:4px;color:${GOLD_TERT};text-transform:uppercase;">${escapeHtml(data.business_name)}</p>
        ${clientSignatureMark}
        <p style="margin:0 0 2px;font-family:${FONT_BODY};font-size:12px;font-weight:600;color:${INK};">${escapeHtml(data.contact_name || "")}</p>
        <p style="margin:0 0 2px;font-family:${FONT_BODY};font-size:11px;font-weight:500;color:${INK_2};">Title: _____________</p>
        <p style="margin:0;font-family:${FONT_BODY};font-size:11px;font-weight:500;color:${INK_2};">Date: ${data.signature_date ? new Date(data.signature_date).toLocaleDateString() : "_____________"}</p>
      </td>
    </tr>
  </table>

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
