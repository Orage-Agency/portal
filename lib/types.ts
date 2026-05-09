export type OfferType = 'Executive' | 'Premier' | 'Startup' | 'CourseOnly' | 'Focus' | 'Agency';

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

export const OFFER_DEFAULTS: Record<OfferType, { setup: number; monthly: number; description: string }> = {
  Executive: {
    setup: 5000,
    monthly: 297,
    description: 'Full AI implementation with custom onboarding and 24/7 access to tools'
  },
  Premier: {
    setup: 2500,
    monthly: 297,
    description: '24-hour same day act now offer - Full implementation with custom onboarding'
  },
  Startup: {
    setup: 0,
    monthly: 597,
    description: 'Financing plan for Executive - $597/month for full one year contract (no cancellation)'
  },
  CourseOnly: {
    setup: 0,
    monthly: 197,
    description: '"AI for Business" course/hub with tools and free CRM (no contract, cancel anytime)'
  },
  Focus: {
    setup: 0,
    monthly: 0,
    description: 'Beta/Focus group testing - No agency fees (third-party costs apply). Implementation varies by AI readiness'
  },
  Agency: {
    setup: 0,
    monthly: 4000,
    description: 'Top-tier: Full services + 1-on-1 consulting, custom tool creation, highest access & ongoing optimization (Month-to-month, 30-day money back guarantee)'
  }
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
