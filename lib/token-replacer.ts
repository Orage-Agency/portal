import { OnboardingData } from './types';

export function replaceTokens(template: string, data: OnboardingData): string {
  let result = template;
  
  // Basic replacements
  result = result.replace(/\[CLIENT_NAME\]/g, data.contact_name);
  result = result.replace(/\[BUSINESS_NAME\]/g, data.business_name);
  result = result.replace(/\[CLIENT_EMAIL\]/g, data.client_email);
  result = result.replace(/\[CLIENT_PHONE\]/g, data.client_phone);
  result = result.replace(/\[CLIENT_ADDRESS\]/g, data.client_address);
  result = result.replace(/\[CLIENT_CITY\]/g, data.client_city);
  result = result.replace(/\[CLIENT_STATE\]/g, data.client_state);
  result = result.replace(/\[CLIENT_ZIP\]/g, data.client_zip);
  
  // Payment
  result = result.replace(/\[SETUP_FEE\]/g, `$${data.setup_fee.toLocaleString()}`);
  result = result.replace(/\[MONTHLY_FEE\]/g, `$${data.monthly_fee.toLocaleString()}`);
  
  // Portal
  result = result.replace(/\[PORTAL_USERNAME\]/g, data.portal_username);
  result = result.replace(/\[PORTAL_PASSWORD\]/g, data.portal_password);
  result = result.replace(/\[PORTAL_URL\]/g, data.portal_url);
  
  // Offer type
  result = result.replace(/\[OFFER_TYPE\]/g, data.offer_type);
  
  // Dates
  const today = new Date();
  const formattedDate = today.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
  result = result.replace(/\[CURRENT_DATE\]/g, formattedDate);
  
  // Notes
  result = result.replace(/\[SPECIAL_NOTES\]/g, data.special_notes || 'None');
  result = result.replace(/\[CUSTOM_SERVICES\]/g, data.custom_services || 'Standard package services');
  
  return result;
}
