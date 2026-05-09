import type { OnboardingData } from "@/lib/types"
import { OFFER_DEFAULTS } from "@/lib/types"

export default function MSATemplate(data: OnboardingData): string {
  const today = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
  const offerDisplayName = OFFER_DEFAULTS[data.offer_type]?.displayName || data.offer_type

  const getServiceDescription = () => {
    switch (data.offer_type) {
      case "Toolkit":
        return `The AGENCY will provide the CLIENT with self-serve access to the Orage AI Toolkit, including:
- "AI for Business" platform and course (full curriculum access)
- Free CRM (Customer Relationship Management system)
- Library of AI tools, templates, and workflow walkthroughs
- Access to community channels and learning resources
- 24/7 access to AI tools (no implementation guarantee)
${data.custom_services ? `\nAdditional Custom Services:\n${data.custom_services}` : ""}

NOTE: The Toolkit is a self-paced, self-serve offering. Custom one-on-one onboarding and done-for-you implementation are NOT included. CLIENT may upgrade to Orage 90 or AI-Enabled Companies at any time.`

      case "Orage90":
        return `The AGENCY will provide the CLIENT with a Done-For-You 90-day AI implementation, including:
- Free CRM (Customer Relationship Management system)
- Custom AI voice/phone agent setup and configuration
- Email/SMS AI agent implementation
- Custom 90-day onboarding tailored to your business
- "AI for Business" platform/course access
- Integration with existing business systems and workflows
- 24/7 access to AI tools and ongoing optimization during the 90-day window
${data.custom_services ? `\nAdditional Custom Services:\n${data.custom_services}` : ""}

NOTE: Orage 90 is a done-for-you implementation. The AGENCY drives setup and configuration during the 90-day onboarding period. After 90 days, services continue month-to-month at the recurring fee.`

      case "AIEnabled":
        return `The AGENCY will provide the CLIENT with a custom AI-Enabled Companies engagement, including:
- All services included in the Orage 90 package PLUS:
- Dedicated implementation team and account leadership
- Multiple AI agents (voice, SMS, email, chat) tuned to specific business workflows
- Custom tool development based on the CLIENT's specific operations
- 1-on-1 strategic consulting with agency leadership
- White-glove ongoing optimization and performance monitoring
- Priority access to new tools, features, and capabilities
- Executive advising and quarterly business reviews
${data.custom_services ? `\nAdditional Custom Services:\n${data.custom_services}` : ""}

NOTE: AI-Enabled Companies is a custom enterprise engagement. The 90-day implementation phase is followed by ongoing strategic partnership at the agreed monthly retainer.`

      default:
        return "AI services as agreed upon by both parties."
    }
  }

  return `CLIENT AGREEMENT

CLIENT: ${data.business_name}
CONTACT: ${data.contact_name}

COMMENCE ON: ${today}
CONCLUDE ON: 90-day implementation phase, then ongoing month-to-month

1. AGREEMENT

This agreement contains the entire understanding between ORAGE AI AGENCY (the "AGENCY") and ${data.business_name} (the "CLIENT"). It supersedes all prior and simultaneous agreements between the parties. The only way to add or change this agreement is to do so in writing, signed by all parties. In the event that any part of this agreement is found to be invalid or unenforceable, the remainder of this agreement shall remain valid and enforceable. Any omission or failure by one or more provisions of this agreement or any failure by one or both parties to enforce a provision of this agreement shall not constitute a waiver of any other portion or provision of this agreement.

2. AI SERVICES TO BE PROVIDED

${getServiceDescription()}

The CLIENT has selected the ${offerDisplayName} package. The contract allows flexibility for service adjustments. In the event that the CLIENT wants to upgrade packages, a new agreement will be formulated to reflect that change.

3. PAYMENT

Both parties have agreed to the following payment structure:
- 90-Day Onboarding Fee: $${data.setup_fee.toLocaleString()} (covers the 90-day implementation phase)
- Monthly Recurring: $${data.monthly_fee.toLocaleString()}/month (begins after the 90-day onboarding phase)

The CLIENT will pay AGENCY the agreed amount per calendar month for their services for as long as services are rendered. This is to be paid via Stripe/Bank Transfer. AGENCY will send an invoice for the services provided at the end of each billing cycle.

Payment Schedule:
- 90-Day Onboarding Fee: $${data.setup_fee.toLocaleString()} due upon signing
- Monthly Recurring: $${data.monthly_fee.toLocaleString()}/month begins on day 91 from the onboarding start date
${
  data.is_referral === "yes" && data.referral_name
    ? `\nREFERRAL ACKNOWLEDGMENT:
This client was referred by ${data.referral_name}.
Referral commission: $${data.referral_commission?.toLocaleString() || "0"}\n`
    : ""
}

IMPORTANT: NO SERVICES WILL BEGIN UNTIL PAYMENT IS MADE AND PROCESSED. All setup, implementation, and access provisions outlined in this agreement are contingent upon receipt and clearance of initial payment.

4. RESPONSIBILITY OF THE AGENCY

The AI implementation and services include the following taken care of by the AGENCY:

Planning & Strategy:
- Business process audit and AI readiness assessment
- Custom AI strategy development
- Tools and systems planning

Implementation:
${
  data.offer_type === "Toolkit"
    ? `- Platform and course access provisioning
- CRM access and basic setup guidance
- Self-serve tool library access`
    : data.offer_type === "Orage90"
    ? `- AI agent setup and configuration (voice/phone, email/SMS)
- CRM system setup and integration
- Custom 90-day onboarding
- Platform access configuration`
    : `- Multi-agent AI implementation (voice, SMS, email, chat)
- CRM system setup and deep integration
- Custom 90-day onboarding led by a dedicated implementation team
- Custom tool development as scoped per engagement
- Platform access configuration`
}

Ongoing Access:
- 24/7 tool access${data.offer_type === "Toolkit" ? " for self-serve learning and use" : ""}
- Platform updates and optimization

AGENCY will provide all necessary AI tools, platforms, and systems needed to carry out this implementation at no further charge beyond the agreed monthly fee.

5. INTELLECTUAL PROPERTY

All custom configurations and setups created under this agreement remain the property of ORAGE AI AGENCY. AGENCY reserves the right to terminate access to all tools, systems, and configurations upon non-payment by CLIENT. AGENCY retains the right to use anonymized case studies and results in portfolio and marketing materials unless otherwise specified in writing.

6. CONFIDENTIALITY

Both parties agree to maintain confidentiality of all proprietary information, business processes, and data shared during the course of this engagement.

7. TERMINATION

After the initial 90-day onboarding phase, either party may terminate this agreement with 30 days written notice. CLIENT remains responsible for payment of all services rendered through the termination date. The 90-day onboarding fee is non-refundable once implementation has commenced, except as covered by the 30-Day Money Back Guarantee in Section 9.

${
  data.offer_type === "Toolkit"
    ? "For Toolkit clients: Cancellation results in immediate loss of access to CRM, tools, and course materials. No refunds for partial months."
    : ""
}

8. THIRD-PARTY USAGE FEES & ADDITIONAL COSTS

IMPORTANT NOTICE: Certain AI services provided by ORAGE AI AGENCY utilize third-party platforms that may charge the CLIENT directly based on usage. These charges are separate from and in addition to the monthly fees paid to ORAGE AI AGENCY.

Third-Party Services Subject to Usage Fees:
- Voice/Phone AI Agents: Charges vary based on minutes used, number of calls, and voice synthesis usage.
- SMS/Text Agents: Based on message volume and credits consumed. Charges apply per message sent/received.
- Additional third-party tools as integrated per client needs.

Client Responsibilities:
- CLIENT acknowledges and agrees that third-party usage fees will be billed directly by the respective service providers, NOT by ORAGE AI AGENCY.
- CLIENT is responsible for monitoring usage and managing associated costs with third-party platforms.
- AGENCY will provide guidance on usage optimization but cannot control third-party pricing structures.
- CLIENT agrees to maintain active payment methods with third-party providers to ensure uninterrupted service.

9. 30-DAY MONEY BACK GUARANTEE & REFUND POLICY

ORAGE AI AGENCY offers a 30-Day Money Back Guarantee on all service tiers.

Terms of Guarantee:
- The CLIENT has thirty (30) days from the date of signing this agreement to request a full refund of agency fees paid.
- Upon processing of a refund, ALL access to tools, CRM systems, course materials, and agency-provided platforms will be IMMEDIATELY revoked.
- The CLIENT acknowledges that exercising this guarantee results in the complete termination of services and loss of all data/configurations within the provided tools.

Refund Policy After 30 Days:
- After the initial 30-day period has passed, NO REFUNDS will be issued for any reason.
- Exceptions to this policy are limited strictly to:
  a) Specific "Win Your Money Back" offers that may be active and applicable to the CLIENT's specific engagement.
  b) Earnings through the Referral Program as outlined in separate documentation.
- Outside of these specific exceptions, all payments made after the 30-day window are final and non-refundable.

${data.special_notes ? `10. SPECIAL TERMS & ADDITIONAL PROVISIONS\n\nThe following additional terms and conditions apply to this agreement:\n\n${data.special_notes}\n\n` : ""}${data.special_notes ? "11" : "10"}. AGREEMENT SIGNATURES

This agreement is entered into as of ${today}.

ORAGE AI AGENCY
Signature: ${data.agency_signature ? `<img src="${data.agency_signature}" alt="Agency Signature" style="max-height: 60px; vertical-align: middle; border-bottom: 1px solid #B68039;" />` : "________________________"}
Date: ${data.agency_signature_date ? new Date(data.agency_signature_date).toLocaleDateString() : "___________"}
Name: George Moffat
Title: Founder/CEO

${data.business_name}
Signature: ${data.signature ? `<img src="${data.signature}" alt="Client Signature" style="max-height: 60px; vertical-align: middle; border-bottom: 1px solid #B68039;" />` : "________________________"}
Date: ${data.signature_date ? new Date(data.signature_date).toLocaleDateString() : "___________"}
Name: ${data.contact_name}
Title: ___________`
}
