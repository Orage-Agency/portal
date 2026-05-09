import type { OnboardingData } from "@/lib/types"
import { OFFER_DEFAULTS } from "@/lib/types"

export default function WelcomeTemplate(data: OnboardingData): string {
  const offerDisplayName = OFFER_DEFAULTS[data.offer_type]?.displayName || data.offer_type

  const getPackageDetails = () => {
    switch (data.offer_type) {
      case "Toolkit":
        return `You've selected the Toolkit package, which includes:
• "AI for Business" platform & course (full curriculum access)
• Free CRM (Customer Relationship Management system)
• Library of AI tools, templates, and workflow walkthroughs
• Community access for peer learning
• 24/7 access to AI tools for learning and experimentation

IMPORTANT: This package is self-serve. Custom one-on-one onboarding is NOT included — you learn and implement at your own pace. $${data.monthly_fee.toLocaleString()}/month after the 90-day onboarding window. You can upgrade to Orage 90 or AI-Enabled Companies at any time.
`

      case "Orage90":
        return `You've selected Orage 90 — our Done-For-You 90-day implementation, which includes:
• Free CRM (Customer Relationship Management system)
• Custom AI voice/phone agent setup
• Email/SMS AI agent implementation
• Custom 90-day onboarding tailored to your business
• "AI for Business" platform/course access
• Integration with your existing systems and workflows
• Ongoing optimization during the 90-day window

After the 90-day onboarding phase completes, services continue month-to-month at $${data.monthly_fee.toLocaleString()}/month.
`

      case "AIEnabled":
        return `You've selected AI-Enabled Companies — our custom enterprise engagement, which includes:
• Everything in Orage 90 PLUS:
• Dedicated implementation team and account leadership
• Multiple AI agents (voice, SMS, email, chat) tuned to your workflows
• Custom tool development based on your specific operations
• 1-on-1 strategic consulting with agency leadership
• White-glove ongoing optimization and performance monitoring
• Priority access to new tools, features, and capabilities
• Quarterly executive business reviews

90-day implementation phase followed by ongoing strategic partnership at $${data.monthly_fee.toLocaleString()}/month.
`

      default:
        return ""
    }
  }

  const getNextSteps = () => {
    if (data.offer_type === "Toolkit") {
      return `3. Get Started Learning
   Access your course materials immediately through your portal. Begin with the introduction modules to get familiar with AI fundamentals and our platform.

4. Explore Your Tools
   Your free CRM and AI tools are ready to use. Follow the tutorials to start experimenting and learning how to leverage AI for your business.`
    }

    return `3. Initial Consultation
   We'll be reaching out within a week to schedule your kickoff call where we'll discuss:
   - Business goals and AI implementation strategy
   - 90-day timeline and milestones
   - Custom onboarding process
   - Agent setup and configuration
   - Any questions you may have

4. Let's Build
   Once we've aligned on the strategy, we'll begin implementing your AI agents and tools to transform your business operations.`
  }

  return `WELCOME TO ORAGE AI AGENCY

Hey ${data.contact_name},

Thank you for choosing to work with us at Orage AI Agency! We're thrilled to have the opportunity to help ${data.business_name} scale efficiently and become an AI-enabled company.

Below, you'll find everything you need to get started smoothly:

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

YOUR CLIENT PORTAL

Welcome to your personalized Client Portal! This is your dedicated space to stay connected with us and track every stage of your project in one convenient place.

Portal Access:
${
  data.client_id
    ? `• Portal Login URL: ${data.portal_login_url || "https://portal.orage.agency/portal/login"}
• Client ID: ${data.client_id}
• Email: ${data.client_email}`
    : `• Portal URL: ${data.portal_url || "Your portal URL will be provided"}
• Login credentials will be sent separately`
}

Inside your portal, you'll find:

- Documents (Agreements & Invoices)
All your important paperwork in one place. Easily review signed agreements and manage invoices without hunting through emails.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

YOUR PACKAGE: ${offerDisplayName.toUpperCase()}

${getPackageDetails()}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

WHAT HAPPENS NEXT?

1. Review Your Agreement
   Your Master Service Agreement is attached for your records. Please review and keep this for your files.

2. Portal Access
   Log into your client portal using the credentials above. Bookmark it for easy access!

${getNextSteps()}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CONTACT US

The Client Portal is designed to make your experience with us as seamless and transparent as possible. We're excited to have you here and look forward to helping you scale efficiently with AI.

If you have any immediate questions or concerns, don't hesitate to reach out:

Email: team@orage.agency
Website: orage.agency

We're here to support you every step of the way.

Welcome aboard!

The Orage AI Agency Team
George Moffat, Founder/CEO

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

IMPORTANT NOTICE - THIRD-PARTY USAGE FEES

Please be aware that certain AI services (voice/phone agents, SMS agents, etc.) may incur usage-based charges from third-party providers. These charges are billed directly by the service providers and are separate from your monthly Orage AI Agency fees. You are responsible for monitoring and managing these costs. We'll provide guidance on usage optimization, but third-party pricing is outside our control.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

P.S. Don't forget to save your portal credentials in a secure location. You'll be using them frequently to access your AI tools and track your implementation progress.`
}
