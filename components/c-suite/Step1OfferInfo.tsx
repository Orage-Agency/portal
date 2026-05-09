'use client';

import { OnboardingData, OfferType, OFFER_DEFAULTS } from '@/lib/types';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

const offerTypes: OfferType[] = ['Premier', 'Startup', 'Executive', 'Focus', 'Agency', 'CourseOnly'];

interface Step1Props {
  formData: OnboardingData;
  updateFormData: (updates: Partial<OnboardingData>) => void;
}

const featuredOffers: OfferType[] = ['Premier', 'Startup'];
const otherOffers: OfferType[] = ['Executive', 'Focus', 'Agency'];

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
        <p className="text-white/60 font-body">Select the offer type for this client</p>
      </div>

      {/* NOVA Offers - Premier and Startup */}
      <div className="space-y-4">
        <Label className="text-white font-body text-sm uppercase tracking-wider text-center">NOVA Offers</Label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {featuredOffers.map((offer) => {
            const defaults = OFFER_DEFAULTS[offer];
            const isSelected = formData.offer_type === offer;
            
            return (
              <button
                key={offer}
                onClick={() => handleOfferSelect(offer)}
                className={`p-8 rounded-xl border-2 transition-all text-left w-full ${
                  isSelected
                    ? 'border-gold bg-gold/10 shadow-2xl'
                    : 'border-gold/50 bg-white/5 hover:border-gold/80 hover:bg-gold/5'
                }`}
              >
                <h3 className={`font-heading text-3xl mb-3 ${isSelected ? 'text-gold' : 'text-white'}`}>
                  {offer}
                </h3>
                <p className="text-white/70 text-sm font-body mb-4 leading-relaxed">{defaults.description}</p>
                <div className="flex gap-4 text-sm font-body">
                  <span className="text-gold font-bold">
                    {defaults.setup > 0 ? `Setup: $${defaults.setup.toLocaleString()}` : 'No Setup Fee'}
                  </span>
                  <span className="text-white/50">•</span>
                  <span className="text-gold font-bold">
                    {defaults.monthly > 0 ? `Monthly: $${defaults.monthly.toLocaleString()}` : 'No Monthly Fee'}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Other Offers */}
      <div className="space-y-4">
        <Label className="text-white font-body text-sm uppercase tracking-wider">Other Offers</Label>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {otherOffers.map((offer) => {
            const defaults = OFFER_DEFAULTS[offer];
            const isSelected = formData.offer_type === offer;
            
            return (
              <button
                key={offer}
                onClick={() => handleOfferSelect(offer)}
                className={`p-6 rounded-lg border-2 transition-all text-left ${
                  isSelected
                    ? 'border-[#B68039] bg-[#B68039]/10'
                    : 'border-white/10 bg-white/5 hover:border-white/30'
                }`}
              >
                <h3 className={`font-heading text-2xl mb-2 ${isSelected ? 'text-[#B68039]' : 'text-white'}`}>
                  {offer}
                </h3>
                <p className="text-white/70 text-sm font-body mb-3">{defaults.description}</p>
                <div className="flex gap-4 text-sm font-body">
                  <span className="text-[#B68039]">
                    {defaults.setup > 0 ? `Setup: $${defaults.setup.toLocaleString()}` : 'No Setup Fee'}
                  </span>
                  <span className="text-white/50">•</span>
                  <span className="text-[#B68039]">
                    {defaults.monthly > 0 ? `Monthly: $${defaults.monthly.toLocaleString()}` : 'No Monthly Fee'}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>


    </div>
  );
}
