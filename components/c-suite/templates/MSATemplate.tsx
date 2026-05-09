import type { OnboardingData } from "@/lib/types"

export default function MSATemplate(data: OnboardingData): string {
  const today = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })

  const getServiceDescription = () => {
    switch (data.offer_type) {
      case "Executive":
        return `The AGENCY will provide the CLIENT with premium full-service AI implementation including:
- Free CRM (Customer Relationship Management system)
- AI voice/phone agent implementation
- Email/SMS AI agent setup and configuration
- Custom onboarding tailored to your business
- "AI for Business" platform/course access
- 24/7 access to AI tools (no support guarantee)
${data.custom_services ? `\nAdditional Custom Services:\n${data.custom_services}` : ""}`

      case "Premier":
        return `The AGENCY will provide the CLIENT with same-day act now AI services including:
- Free CRM (Customer Relationship Management system)
- AI voice/phone agent implementation
- Email/SMS AI agent setup and configuration
- Custom onboarding tailored to your business
- "AI for Business" platform/course access
- 24/7 access to AI tools (no support guarantee)
${data.custom_services ? `\nAdditional Custom Services:\n${data.custom_services}` : ""}

NOTE: This is a 24-hour same day act now offer with reduced setup fee.`

      case "Startup":
        return `The AGENCY will provide the CLIENT with financing plan AI services including:
- Free CRM (Customer Relationship Management system)
- AI voice/phone agent implementation
- Email/SMS AI agent setup
- Custom onboarding for your business
- "AI for Business" platform/course access
- 24/7 access to AI tools (no support guarantee)
${data.custom_services ? `\nAdditional Custom Services:\n${data.custom_services}` : ""}

NOTE: This is a financing plan for the Executive offer at $597/month for a full one-year contract with no cancellation option.`

      case "CourseOnly":
        return `The AGENCY will provide the CLIENT with access to:
- "AI for Business" online course/hub with comprehensive training
- Free CRM (Customer Relationship Management system)
- AI tools, education, videos, tutorials, templates, and walk-throughs
- Skills development for AI implementation
- 24/7 access to AI tools (no custom onboarding - self-paced learning)
- Benefits and rewards for completing course tasks (discounts, money-back offers based on tool usage and specific offers at time of promotion)
${data.custom_services ? `\nAdditional Services:\n${data.custom_services}` : ""}

NOTE: $197/month with NO contract or commitment - cancel anytime. Course Only clients lose access to CRM and tools if subscription is cancelled. This package is perfect for small businesses, entrepreneurs, and solopreneurs seeking AI education at a lower entry point. Clients can upgrade to full implementation services at any time.`

      case "FreeTrial":
        return `The AGENCY will provide the CLIENT with beta/focus group AI services including:
- Free CRM (Customer Relationship Management system)
- AI voice/phone agent implementation
- Email/SMS AI agent setup and configuration
- Custom onboarding tailored to your business
- "AI for Business" platform/course access
- 24/7 access to AI tools
${data.custom_services ? `\nAdditional Custom Services:\n${data.custom_services}` : ""}

IMPORTANT NOTES FOR FREE/TRIAL/FOCUS CLIENTS:
- This is a testing/beta engagement for focus group purposes
- NO FEES are charged directly by ORAGE AI AGENCY
- CLIENT is responsible for ALL third-party platform usage costs (ElevenLabs, SMS services, etc.)
- Implementation timeline varies and is subject to business audit and AI readiness assessment
- Services are provided to protect agency interests and gather feedback for service improvement
- This arrangement may be converted to a standard paid offer at any time with mutual agreement`

      case "Focus":
        return `The AGENCY will provide the CLIENT with beta/focus group AI services including:
- Free CRM (Customer Relationship Management system)
- AI voice/phone agent implementation
- Email/SMS AI agent setup and configuration
- Custom onboarding tailored to your business
- "AI for Business" platform/course access
- 24/7 access to AI tools
${data.custom_services ? `\nAdditional Custom Services:\n${data.custom_services}` : ""}

IMPORTANT NOTES FOR FOCUS CLIENTS:
- This is a testing/beta engagement for focus group purposes
- NO FEES are charged directly by ORAGE AI AGENCY
- CLIENT is responsible for ALL third-party platform usage costs (ElevenLabs, SMS services, etc.)
- Implementation timeline varies and is subject to business audit and AI readiness assessment
- Services are provided to protect agency interests and gather feedback for service improvement
- This arrangement may be converted to a standard paid offer at any time with mutual agreement`

      case "Agency":
        return `The AGENCY will provide the CLIENT with premium top-tier AI services including:
- All services included in Executive package
- Free CRM (Customer Relationship Management system)
- AI voice/phone agent implementation
- Email/SMS AI agent setup and configuration
- Custom onboarding tailored to your business
- "AI for Business" platform/course access
- 24/7 access to AI tools

PREMIUM AGENCY-TIER EXCLUSIVE SERVICES:
- True one-on-one consultation with leadership
- Regular strategy calls and step-by-step consulting
- Dedicated advising and business optimization
- Highest priority access to new tools and features
- Ongoing optimization and performance monitoring
- Custom tool creation based on specific business needs
- Priority support and rapid implementation
${data.custom_services ? `\nAdditional Custom Services:\n${data.custom_services}` : ""}

NOTE: This is our highest-tier offering at $4,000/month with NO implementation fee, NO contract (month-to-month), and includes our 30-day money back guarantee for comprehensive AI transformation and ongoing strategic partnership.`

      default:
        return "AI services as agreed upon by both parties."
    }
  }

  return `CLIENT AGREEMENT

CLIENT: ${data.business_name}
CONTACT: ${data.contact_name}

COMMENCE ON: ${today}
CONCLUDE ON: ${data.offer_type === "Startup" ? "One Year from Start Date (No Cancellation)" : data.offer_type === "FreeTrial" || data.offer_type === "Focus" ? "Testing Period (Varies by Readiness)" : "Ongoing (Month-to-Month)"}

1. AGREEMENT

This agreement contains the entire understanding between ORAGE AI AGENCY (the "AGENCY") and ${data.business_name} (the "CLIENT"). It supersedes all prior and simultaneous agreements between the parties. The only way to add or change this agreement is to do so in writing, signed by all parties. In the event that any part of this agreement is found to be invalid or unenforceable, the remainder of this agreement shall remain valid and enforceable. Any omission or failure by one or more provisions of this agreement or any failure by one or both parties to enforce a provision of this agreement shall not constitute a waiver of any other portion or provision of this agreement.

2. AI SERVICES TO BE PROVIDED

${getServiceDescription()}

The CLIENT has selected the ${data.offer_type === "FreeTrial" ? "Free/Trial/Focus" : data.offer_type === "Focus" ? "Focus" : data.offer_type} Package. ${data.offer_type === "Startup" ? "This is a one-year contract with no cancellation option." : data.offer_type === "FreeTrial" || data.offer_type === "Focus" ? "This is a testing/beta arrangement with no agency fees." : data.offer_type === "Agency" ? "This is our top-tier service with comprehensive strategic partnership." : "The contract allows flexibility for service adjustments. In the event that the CLIENT wants to upgrade packages, a new agreement will be formulated to reflect that change."}

3. PAYMENT

${
  data.offer_type === "FreeTrial" || data.offer_type === "Focus"
    ? `
NO AGENCY FEES APPLY FOR FREE/TRIAL/FOCUS CLIENTS.

CLIENT acknowledges:
- No setup fees or monthly fees are charged by ORAGE AI AGENCY
- CLIENT is solely responsible for all third-party platform costs
- This is a testing/beta arrangement for focus group purposes
- Implementation timeline varies based on business audit and AI readiness assessment
`
    : `Both parties have agreed to the following payment structure:
- Setup Fee: ${data.setup_fee > 0 ? `$${data.setup_fee.toLocaleString()}${data.offer_type === "Agency" ? " (NON-REFUNDABLE)" : ""}` : "Waived"}
- Monthly Recurring: $${data.monthly_fee.toLocaleString()}

The CLIENT will pay AGENCY the agreed amount per calendar month for their services for as long as services are rendered. This is to be paid via Stripe/Bank Transfer. AGENCY will send an invoice for the services provided at the end of each billing cycle.

Payment Schedule:
- Initial Setup Fee: ${data.setup_fee > 0 ? `$${data.setup_fee.toLocaleString()} due upon signing` : "N/A"}
- Monthly Recurring: $${data.monthly_fee.toLocaleString()}/month begins ${data.offer_type === "Startup" ? "immediately upon signing" : "1 month from onboarding date"}
`
}

${
  data.is_referral === "yes" && data.referral_name
    ? `\nREFERRAL ACKNOWLEDGMENT:
This client was referred by ${data.referral_name}.
Referral commission: $${data.referral_commission?.toLocaleString() || "0"}\n`
    : ""
}

${data.offer_type !== "FreeTrial" && data.offer_type !== "Focus" ? "IMPORTANT: NO SERVICES WILL BEGIN UNTIL PAYMENT IS MADE AND PROCESSED. All setup, implementation, and access provisions outlined in this agreement are contingent upon receipt and clearance of initial payment." : ""}

4. RESPONSIBILITY OF THE AGENCY

The AI implementation and services include the following taken care of by the AGENCY:

Planning & Strategy:
- Business process audit and AI readiness assessment
- Custom AI strategy development
- Tools and systems planning

Implementation:
- AI agent setup and configuration (voice/phone, email/SMS)
- CRM system setup and integration
- Custom onboarding${data.offer_type === "CourseOnly" ? " (NOT included for Course Only)" : ""}
- Platform access configuration

Ongoing Access:
- 24/7 tool access${data.offer_type === "CourseOnly" ? " for learning" : ""}
- Platform updates and optimization

AGENCY will provide all necessary AI tools, platforms, and systems needed to carry out this implementation at no further charge beyond the agreed monthly fee.

5. INTELLECTUAL PROPERTY

All custom configurations and setups created under this agreement remain the property of ORAGE AI AGENCY. AGENCY reserves the right to terminate access to all tools, systems, and configurations upon non-payment by CLIENT. AGENCY retains the right to use anonymized case studies and results in portfolio and marketing materials unless otherwise specified in writing.

6. CONFIDENTIALITY

Both parties agree to maintain confidentiality of all proprietary information, business processes, and data shared during the course of this engagement.

7. TERMINATION

${data.offer_type === "Startup" ? "This is a ONE YEAR CONTRACT with NO CANCELLATION option. CLIENT is committed to 12 monthly payments of $597." : data.offer_type === "FreeTrial" || data.offer_type === "Focus" ? "Either party may terminate this testing arrangement at any time with written notice. No fees or penalties apply for Free/Trial/Focus clients." : `Either party may terminate this agreement with 30 days written notice. CLIENT remains responsible for payment of all services rendered through the termination date.${data.offer_type === "CourseOnly" ? "\n\nFor Course Only clients: Cancellation results in immediate loss of access to CRM, tools, and course materials. No refunds for partial months." : ""}${data.offer_type === "Agency" ? "\n\nFor Agency-tier clients: This is a month-to-month agreement with no long-term contract. Monthly fees are pro-rated to termination date." : ""}`}

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

${
  data.offer_type === "Startup"
    ? `9. REFUND POLICY

Due to the financing nature of the Startup offer, NO REFUNDS are available under any circumstances. This is a binding one-year contract with 12 monthly payments of $597. All payments are final and non-refundable.`
    : `9. 30-DAY MONEY BACK GUARANTEE & REFUND POLICY

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
- Outside of these specific exceptions, all payments made after the 30-day window are final and non-refundable.`
}

${data.special_notes ? `\n10. SPECIAL TERMS & ADDITIONAL PROVISIONS\n\nThe following additional terms and conditions apply to this agreement:\n\n${data.special_notes}\n` : ""}

10. AGREEMENT SIGNATURES

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
