import type { OnboardingData } from "@/lib/types"

export default function WelcomeTemplate(data: OnboardingData): string {
  return `WELCOME TO ORAGE AI AGENCY

Hey ${data.contact_name},

Thank you for choosing to work with us at Orage AI Agency! We're thrilled to have the opportunity to help ${data.business_name} scale efficiently and improve operations with our custom AI services, tools, and agents.

Below, you'll find everything you need to get started smoothly:

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

YOUR CLIENT PORTAL

Welcome to your personalized Client Portal! This is your dedicated space to stay connected with us and track every stage of your project in one convenient place.

Portal Access:
${
  data.client_id
    ? `• Portal Login URL: ${data.portal_login_url || window.location.origin + "/portal/login"}
• Client ID: ${data.client_id}
• Email: ${data.client_email}`
    : `• Portal URL: ${data.portal_url || "Your portal URL will be provided"}
• Login credentials will be sent separately`
}

Inside your portal, you'll find:

- Documents (Agreements & Invoices)  
All your important paperwork in one place. Easily review signed agreements and manage invoices without hunting through emails.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

YOUR PACKAGE: ${data.offer_type.replace("CourseOnly", "COURSE ONLY")}

${
  data.offer_type === "Executive"
    ? `You've selected our premium Executive Package, which includes:
• Free CRM (Customer Relationship Management system)
• AI voice/phone agent - fully customized to your business
• Email/SMS AI agent - automated communication handling
• Custom onboarding tailored specifically to your business needs
• "AI for Business" platform/course - full access to all training materials
• 24/7 access to all AI tools
`
    : ""
}${
  data.offer_type === "Premier"
    ? `You've selected our Premier Package (24-hour same day act now offer!), which includes:
• Free CRM (Customer Relationship Management system)
• AI voice/phone agent - customized for your operations
• Email/SMS AI agent - automated communication workflows
• Custom onboarding designed for your business
• "AI for Business" platform/course - complete course access
• 24/7 access to AI tools
`
    : ""
}${
  data.offer_type === "Startup"
    ? `You've selected our Startup Package (Financing Plan), which includes:
• Free CRM (Customer Relationship Management system)
• AI voice/phone agent implementation
• Email/SMS AI agent setup
• Custom onboarding for your business
• "AI for Business" platform/course access
• 24/7 access to AI tools

IMPORTANT: This is a ONE YEAR CONTRACT at $597/month with NO CANCELLATION option. You're committed to 12 monthly payments.
`
    : ""
}${
  data.offer_type === "CourseOnly"
    ? `You've selected our Course Only Package, which includes:
• "AI for Business" online course/hub - comprehensive AI training
• Free CRM (Customer Relationship Management system)
• AI tools, education, videos, tutorials, templates, and walk-throughs
• Skills development to implement AI in your business
• 24/7 access to AI tools for learning and experimentation
• Benefits and rewards for completing course tasks
• Potential discounts and money-back offers based on tool usage
• Community access for peer learning

IMPORTANT: This package does NOT include custom onboarding (you learn at your own pace). $197/month with NO contract or commitment - cancel anytime. Please note that if you cancel, you will lose access to the CRM and tools.

Perfect for small businesses, entrepreneurs, and solopreneurs who want AI education at a lower entry point. You can upgrade to full implementation services at any time!
`
    : ""
}${
  data.offer_type === "FreeTrial"
    ? `You've been selected for our Free/Trial/Focus Group Program, which includes:
• AI voice/phone agent - implementation and testing
• Email/SMS AI agent - setup and configuration
• Custom onboarding (timeline subject to AI readiness audit)
• Access to beta features and new tools
• Opportunity to provide feedback that shapes our services

IMPORTANT: This is a NO-COST program for testing and feedback purposes. While you will NOT be charged for Orage AI Agency services, you ARE responsible for any third-party platform usage costs (ElevenLabs, SMS credits, etc.) which are billed directly by those providers. Implementation timeline is subject to your business's AI readiness assessment.
`
    : ""
}${
  data.offer_type === "Focus"
    ? `You've selected our Focus Group Program, which includes:
• AI voice/phone agent - implementation and testing
• Email/SMS AI agent - setup and configuration
• Custom onboarding (timeline subject to AI readiness audit)
• Access to beta features and new tools
• Opportunity to provide feedback that shapes our services

IMPORTANT: This is a NO-COST program for testing and feedback purposes. While you will NOT be charged for Orage AI Agency services, you ARE responsible for any third-party platform usage costs (ElevenLabs, SMS credits, etc.) which are billed directly by those providers. Implementation timeline is subject to your business's AI readiness assessment.
`
    : ""
}${
  data.offer_type === "Agency"
    ? `You've selected our exclusive AGENCY Package - our highest tier of service, which includes:
• Everything in the Executive Package PLUS:
• True one-on-one consultation with our team
• Dedicated strategy calls and personalized advising
• Step-by-step consulting throughout implementation
• Priority access to new tools and features before anyone else
• Ongoing optimization and performance monitoring
• Custom tool creation based on your specific business needs
• White-glove service with highest priority support

IMPORTANT: $15,000 NON-REFUNDABLE setup fee + $5,000/month. This is our premium tier with the highest level of access, customization, and personal attention.
`
    : ""
}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

WHAT HAPPENS NEXT?

1. Review Your Agreement
   Your Master Service Agreement is attached for your records. Please review and keep this for your files.

2. Portal Access
   Log into your client portal using the credentials above. Bookmark it for easy access!

${
  data.offer_type !== "CourseOnly" && data.offer_type !== "Focus"
    ? `3. Initial Consultation
   We'll be reaching out within a week to schedule your kickoff call where we'll discuss:
   - Business goals and AI implementation strategy
   - Timeline and milestones
   - Custom onboarding process
   - Agent setup and configuration
   - Any questions you may have

4. Let's Automate!
   Once we've aligned on the strategy, we'll begin implementing your AI agents and tools to transform your business operations.`
    : data.offer_type === "CourseOnly"
      ? `3. Get Started Learning
   Access your course materials immediately through your portal. Begin with the introduction modules to get familiar with AI fundamentals and our platform.

4. Explore Your Tools
   Your free CRM and AI tools are ready to use. Follow the tutorials to start experimenting and learning how to leverage AI for your business.`
      : `3. Initial Consultation
   We'll be reaching out within a week to schedule your kickoff call where we'll discuss:
   - Business goals and AI implementation strategy
   - Timeline and milestones
   - Custom onboarding process
   - Agent setup and configuration
   - Any questions you may have

4. Let's Automate!
   Once we've aligned on the strategy, we'll begin implementing your AI agents and tools to transform your business operations.`
}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CONTACT US

The Client Portal is designed to make your experience with us as seamless and transparent as possible. We're excited to have you here and look forward to helping you scale efficiently with AI!

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

P.S. Don't forget to save your portal credentials in a secure location. You'll be using them frequently to access your AI tools and track your implementation progress!`
}
