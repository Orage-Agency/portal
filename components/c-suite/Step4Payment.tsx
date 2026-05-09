'use client';

import { OnboardingData } from '@/lib/types';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

interface Step3Props {
  formData: OnboardingData;
  updateFormData: (updates: Partial<OnboardingData>) => void;
}

export default function Step3Payment({ formData, updateFormData }: Step3Props) {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="font-heading text-4xl text-gold mb-2">STEP 3: REFERRAL</h2>
        <p className="text-white/60 font-body">Referral information</p>
      </div>

      {/* Referral */}
      <div className="space-y-4">
        <Label className="text-white font-body text-sm uppercase tracking-wider">Is this a referral? *</Label>
        <RadioGroup
          value={formData.is_referral}
          onValueChange={(value: 'yes' | 'no') => updateFormData({ is_referral: value })}
          className="flex gap-6"
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="no" id="no" className="border-white/30 text-[#B68039]" />
            <Label htmlFor="no" className="text-white font-body cursor-pointer">No</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="yes" id="yes" className="border-white/30 text-[#B68039]" />
            <Label htmlFor="yes" className="text-white font-body cursor-pointer">Yes</Label>
          </div>
        </RadioGroup>
      </div>

      {/* Conditional Referral Fields */}
      {formData.is_referral === 'yes' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 rounded-lg border border-[#B68039]/30 bg-[#B68039]/5">
          <div className="space-y-2">
            <Label htmlFor="referral_name" className="text-white font-body text-sm uppercase tracking-wider">
              Referral Name
            </Label>
            <Input
              id="referral_name"
              value={formData.referral_name || ''}
              onChange={(e) => updateFormData({ referral_name: e.target.value })}
              placeholder="Who referred this client?"
              className="bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-[#B68039]"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="referral_commission" className="text-white font-body text-sm uppercase tracking-wider">
              Referral Commission
            </Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/50">$</span>
              <Input
                id="referral_commission"
                type="number"
                value={formData.referral_commission || ''}
                onChange={(e) => updateFormData({ referral_commission: parseFloat(e.target.value) || 0 })}
                placeholder="0.00"
                className="bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-[#B68039] pl-8"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
