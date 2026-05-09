import { OnboardingData } from '@/lib/types';
import { ExternalLink } from 'lucide-react';

interface Step2Props {
  formData: OnboardingData;
  updateFormData: (updates: Partial<OnboardingData>) => void;
}

export default function Step2Payment({ formData }: Step2Props) {
  const hasImplementationFee = formData.setup_fee > 0;
  const showTwoLinks = hasImplementationFee && !['Startup', 'CourseOnly', 'Focus'].includes(formData.offer_type);

  return (
    <div className="space-y-8">
      <div>
        <h2 className="font-heading text-4xl text-gold mb-2">STEP 2: PAYMENT LINKS</h2>
        <p className="text-white/60 font-body">Complete your payment to proceed with onboarding</p>
      </div>

      {/* Payment Summary */}
      <div className="bg-white/5 border border-gold/20 rounded-lg p-6 space-y-4">
        <h3 className="font-heading text-2xl text-gold mb-4">Payment Summary</h3>
        <div className="space-y-2 font-body">
          <div className="flex justify-between text-white">
            <span>Offer Type:</span>
            <span className="text-gold font-semibold">{formData.offer_type}</span>
          </div>
          {formData.setup_fee > 0 && (
            <div className="flex justify-between text-white">
              <span>Setup Fee:</span>
              <span className="text-gold font-semibold">${formData.setup_fee.toLocaleString()}</span>
            </div>
          )}
          <div className="flex justify-between text-white">
            <span>Monthly Recurring:</span>
            <span className="text-gold font-semibold">${formData.monthly_fee.toLocaleString()}/month</span>
          </div>
        </div>
      </div>

      {/* Payment Links */}
      <div className="space-y-4">
        {showTwoLinks ? (
          <>
            {/* Implementation Fee Link */}
            <div className="bg-gradient-to-r from-gold/10 to-transparent border border-gold/30 rounded-lg p-6">
              <h4 className="font-heading text-xl text-gold mb-3">Implementation Fee Payment</h4>
              <p className="text-white/70 font-body text-sm mb-4">
                Pay the one-time setup fee of ${formData.setup_fee.toLocaleString()} to begin your implementation.
              </p>
              <a
                href={
                  formData.offer_type === 'Premier' 
                    ? 'https://buy.stripe.com/dRmeVeehFcYyge19Af1kA09' 
                    : formData.offer_type === 'Executive'
                    ? 'https://buy.stripe.com/cNibJ2gpNgaKaTHcMr1kA0c'
                    : '#'
                }
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 gradient-button text-white font-heading px-6 py-3 rounded-lg hover:scale-105 transition-transform"
              >
                Pay Implementation Fee
                <ExternalLink className="h-4 w-4" />
              </a>
            </div>

            {/* Monthly Recurring Link */}
            <div className="bg-gradient-to-r from-gold/10 to-transparent border border-gold/30 rounded-lg p-6">
              <h4 className="font-heading text-xl text-gold mb-3">Monthly Recurring Payment</h4>
              <p className="text-white/70 font-body text-sm mb-4">
                Set up your monthly recurring payment of ${formData.monthly_fee.toLocaleString()}/month.
              </p>
              <a
                href={formData.monthly_fee === 297 ? 'https://buy.stripe.com/00wdRaddBbUue5T7s71kA0a' : '#'}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 gradient-button text-white font-heading px-6 py-3 rounded-lg hover:scale-105 transition-transform"
              >
                Set Up Monthly Payment
                <ExternalLink className="h-4 w-4" />
              </a>
            </div>
          </>
        ) : (
          /* Single Payment Link for Startup/CourseOnly */
          <div className="bg-gradient-to-r from-gold/10 to-transparent border border-gold/30 rounded-lg p-6">
            <h4 className="font-heading text-xl text-gold mb-3">Payment Link</h4>
            <p className="text-white/70 font-body text-sm mb-4">
              {formData.offer_type === 'Startup'
                ? `Set up your monthly recurring payment of $${formData.monthly_fee.toLocaleString()}/month for the one-year contract.`
                : formData.offer_type === 'CourseOnly'
                ? `Complete your payment to access the course materials.`
                : `Complete your payment to proceed.`}
            </p>
            <a
              href={
                formData.offer_type === 'Startup' && formData.monthly_fee === 597 
                  ? 'https://buy.stripe.com/00wcN67Th7EebXLcMr1kA0b'
                  : formData.offer_type === 'Agency' && formData.monthly_fee === 4000
                  ? 'https://buy.stripe.com/5kQ3cw7Th3nY0f3aEj1kA0d'
                  : '#'
              }
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 gradient-button text-white font-heading px-6 py-3 rounded-lg hover:scale-105 transition-transform"
            >
              Complete Payment
              <ExternalLink className="h-4 w-4" />
            </a>
          </div>
        )}
      </div>

      {/* Important Notice */}
      <div className="bg-gold/10 border border-gold/50 rounded-lg p-4">
        <p className="text-white/80 font-body text-sm">
          <strong className="text-gold">Important:</strong> After completing payment, you may proceed to the next step. 
          Your payment confirmation will be verified during the onboarding process.
        </p>
      </div>
    </div>
  );
}
