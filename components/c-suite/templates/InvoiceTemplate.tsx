import type { OnboardingData } from "@/lib/types"
import { OFFER_DEFAULTS } from "@/lib/types"

export default function InvoiceTemplate(data: OnboardingData): string {
  const today = new Date()
  const invoiceDate = today.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
  const invoiceNumber = `#${data.business_name.substring(0, 3).toUpperCase()}-${String(today.getMonth() + 1).padStart(2, "0")}${String(today.getDate()).padStart(2, "0")}`

  const day91 = new Date(today)
  day91.setDate(day91.getDate() + 90)
  const monthlyStart = day91.toLocaleDateString("en-US", { year: "numeric", month: "2-digit", day: "2-digit" })
  const billingPeriodStart = today.toLocaleDateString("en-US", { year: "numeric", month: "2-digit", day: "2-digit" })

  const offerDisplayName = OFFER_DEFAULTS[data.offer_type]?.displayName || data.offer_type
  const subtotal = data.setup_fee

  return `INVOICE ${invoiceNumber}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

INVOICE BY:
Orage AI Agency
424 E 2nd St
Edmond, OK 73034
team@orage.agency
(405) 967-9085

DATE OF ISSUE: ${invoiceDate}
BILLING PERIOD: ${billingPeriodStart} - ${monthlyStart} (90-day onboarding phase)
DUE: On Receipt

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

BILL TO:
${data.business_name}
${data.contact_name}
${data.client_address}
${data.client_city}, ${data.client_state} ${data.client_zip}
${data.client_email}
${data.client_phone}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SERVICES / PRODUCTS

${offerDisplayName.toUpperCase()} PACKAGE

90-Day Onboarding Fee                         $${data.setup_fee.toLocaleString()}

NOTE: Monthly recurring fee of $${data.monthly_fee.toLocaleString()}/month begins on day 91 (${monthlyStart}).

${data.custom_services ? `\nADDITIONAL SERVICES:\n${data.custom_services}\n` : ""}
                                        ─────────────
                                    SUB TOTAL:  $${subtotal.toLocaleString()}
                                        TOTAL:  $${subtotal.toLocaleString()}
                                      TAX (0%):  $0.00
                                        ─────────────
                                  AMOUNT DUE:  $${subtotal.toLocaleString()}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PAYMENT METHODS

BANK WIRE / ACH TRANSFER
Bank Name: Bank of America
Account Number: 305010984426
Routing Number (Paper & Electronic): 103000017
Routing Number (Wires): 026009593
Account Type: Business Adv Fundamentals - 4426
Account Holder: Orage AI Agency

ONLINE PAYMENT
Stripe Invoice Link: [TO BE SENT SEPARATELY]
Client Portal: ${data.portal_url || "https://portal.orage.agency"}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

TERMS & CONDITIONS

Payment is due within 7 business days of the invoice date. Please forward remittance confirmation to team@orage.agency.

IMPORTANT: NO SERVICES WILL BEGIN UNTIL PAYMENT IS MADE AND PROCESSED. All setup, implementation, and access provisions are contingent upon receipt and clearance of payment.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

THIRD-PARTY USAGE FEES NOTICE

Certain AI services provided by Orage AI Agency utilize third-party platforms that may charge you directly based on usage. These charges are SEPARATE from and IN ADDITION to the monthly fees paid to Orage AI Agency.

Services subject to third-party usage fees include:
- Voice/Phone AI Agents - charged per minute/call
- SMS/Text Agents - charged per message based on credits
- Additional integrated tools as specified in your service agreement

These fees are billed directly by the respective service providers, NOT by Orage AI Agency. You are responsible for monitoring usage and managing associated costs.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

For questions regarding this invoice, please contact:
Email: team@orage.agency
Phone: (405) 967-9085

Thank you for choosing Orage AI Agency!

FOUNDER/CEO: George Moffat`
}
