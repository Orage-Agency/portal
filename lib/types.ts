export type OfferType = 'Toolkit' | 'Orage90' | 'AIEnabled';

export interface OnboardingData {
  // Step 1: Offer & Basic Info
  offer_type: OfferType;
  business_name: string;
  contact_name: string;

  // Step 2: Client Details
  client_email: string;
  client_phone: string;
  client_address: string;
  client_city: string;
  client_state: string;
  client_zip: string;

  // Step 3: Payment & Referral
  setup_fee: number;
  monthly_fee: number;
  is_referral: 'yes' | 'no';
  referral_name?: string;
  referral_commission?: number;

  // Step 4: Access & Portal
  portal_username: string;
  portal_password: string;
  portal_url: string;

  // Step 5: Customizations
  special_notes?: string;
  custom_services?: string;

  // Step 6: Signature (before document generation)
  signature?: string; // Base64 encoded signature image
  signature_date?: string;

  // Agency Signature
  agency_signature?: string;
  agency_signature_date?: string;

  client_id?: string; // Auto-generated client ID for portal login
  portal_login_url?: string; // Auto-generated portal login URL
}

export interface OfferDefaults {
  setup: number;
  monthly: number;
  displayName: string;
  tagline: string;
  description: string;
}

export const OFFER_DEFAULTS: Record<OfferType, OfferDefaults> = {
  Toolkit: {
    setup: 1500,
    monthly: 500,
    displayName: 'Toolkit',
    tagline: '90-day onboarding',
    description:
      'Self-serve AI toolkit with platform/course access, free CRM, AI tools, and templates. For teams who want to build their AI foundation themselves.',
  },
  Orage90: {
    setup: 7500,
    monthly: 2500,
    displayName: 'Orage 90',
    tagline: '90-day done-for-you',
    description:
      'Done-for-you 90-day AI implementation. Custom phone agent, email/SMS automation, integrations, hands-on onboarding, and ongoing support.',
  },
  AIEnabled: {
    setup: 30000,
    monthly: 10000,
    displayName: 'AI-Enabled Companies',
    tagline: 'Custom enterprise',
    description:
      'Custom AI transformation for established companies. Dedicated team, multiple agents, custom tool development, and 1-on-1 strategic consulting.',
  },
};

export interface ClientInvitation {
  id: string;
  business_name: string;
  contact_name?: string; // Pre-filled by admin
  offer_type: OfferType;
  setup_fee: number;
  monthly_fee: number;
  custom_services?: string;
  special_notes?: string;
  is_referral?: "yes" | "no"; // Admin-set referral status
  referral_name?: string; // Admin-set referral name
  created_at: string;
  status: 'pending' | 'completed';
  // Edited documents from admin review
  msa_content?: string;
  welcome_content?: string;
  invoice_content?: string;
  // Generated PDFs from edited content
  msa_pdf_data?: string; // Base64 encoded PDF
  welcome_pdf_data?: string; // Base64 encoded PDF
  invoice_pdf_data?: string; // Base64 encoded PDF
}

// Alias for backwards compatibility
export type Invitation = ClientInvitation;

export interface ClientPortalData extends OnboardingData {
  client_id: string;
  created_at: string;
}
