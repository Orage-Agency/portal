'use client';

import { OnboardingData, OfferType, OFFER_DEFAULTS } from '@/lib/types';
import { Label } from '@/components/ui/label';

interface Step1Props {
  formData: OnboardingData;
  updateFormData: (updates: Partial<OnboardingData>) => void;
}

const TIERS: OfferType[] = ['Toolkit', 'Orage90', 'AIEnabled'];
const FEATURED_TIER: OfferType = 'Orage90';

export default function Step1OfferInfo({ formData, updateFormData }: Step1Props) {
  const handleOfferSelect = (offer: OfferType) => {
    const defaults = OFFER_DEFAULTS[offer];
    updateFormData({
      offer_type: offer,
      setup_fee: defaults.setup,
      monthly_fee: defaults.monthly,
    });
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="font-heading text-4xl text-gold mb-2">STEP 1: OFFER SELECTION</h2>
        <p className="text-white/60 font-body">Select the tier for this client</p>
      </div>

      <div className="space-y-4">
        <Label className="text-white font-body text-sm uppercase tracking-wider">Tiers</Label>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {TIERS.map((offer) => {
            const defaults = OFFER_DEFAULTS[offer];
            const isSelected = formData.offer_type === offer;
            const isFeatured = offer === FEATURED_TIER;

            return (
              <button
                key={offer}
                onClick={() => handleOfferSelect(offer)}
                className={`relative p-6 md:p-8 rounded-xl border-2 transition-all text-left w-full flex flex-col ${
                  isSelected
                    ? 'border-gold bg-gold/10 shadow-2xl'
                    : isFeatured
                    ? 'border-gold/50 bg-white/5 hover:border-gold/80 hover:bg-gold/5'
                    : 'border-white/10 bg-white/5 hover:border-white/30'
                }`}
              >
                {isFeatured && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gold text-black text-xs font-heading tracking-wider px-3 py-1 rounded-full">
                    FEATURED
                  </span>
                )}

                <div className="mb-4">
                  <h3 className={`font-heading text-2xl md:text-3xl mb-1 ${isSelected ? 'text-gold' : 'text-white'}`}>
                    {defaults.displayName}
                  </h3>
                  <p className="text-gold/80 text-xs font-body uppercase tracking-wider">{defaults.tagline}</p>
                </div>

                <p className="text-white/70 text-sm font-body mb-6 leading-relaxed flex-1">{defaults.description}</p>

                <div className="space-y-1 font-body border-t border-white/10 pt-4">
                  <div className="flex justify-between items-baseline">
                    <span className="text-white/60 text-xs uppercase tracking-wider">90-Day Setup</span>
                    <span className="text-gold font-bold text-lg">${defaults.setup.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-baseline">
                    <span className="text-white/60 text-xs uppercase tracking-wider">Monthly</span>
                    <span className="text-gold font-bold text-lg">${defaults.monthly.toLocaleString()}/mo</span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
