'use client';

import { OnboardingData } from '@/lib/types';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

interface Step2Props {
  formData: OnboardingData;
  updateFormData: (updates: Partial<OnboardingData>) => void;
}

export default function Step2ClientDetails({ formData, updateFormData }: Step2Props) {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="font-heading text-4xl text-gold mb-2">STEP 3: CLIENT DETAILS</h2>
        <p className="text-white/60 font-body">Contact information and address</p>
      </div>

      {/* Business Name */}
      <div className="space-y-2">
        <Label htmlFor="business_name" className="text-white font-body text-sm uppercase tracking-wider">
          Business Name *
        </Label>
        <Input
          id="business_name"
          value={formData.business_name}
          onChange={(e) => updateFormData({ business_name: e.target.value })}
          placeholder="Enter business name"
          className="bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-[#B68039]"
          required
        />
      </div>

      {/* Contact Name */}
      <div className="space-y-2">
        <Label htmlFor="contact_name" className="text-white font-body text-sm uppercase tracking-wider">
          Primary Contact Name *
        </Label>
        <Input
          id="contact_name"
          value={formData.contact_name}
          onChange={(e) => updateFormData({ contact_name: e.target.value })}
          placeholder="Enter contact name"
          className="bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-[#B68039]"
          required
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Email */}
        <div className="space-y-2">
          <Label htmlFor="client_email" className="text-white font-body text-sm uppercase tracking-wider">
            Email Address *
          </Label>
          <Input
            id="client_email"
            type="email"
            value={formData.client_email}
            onChange={(e) => updateFormData({ client_email: e.target.value })}
            placeholder="client@example.com"
            className="bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-[#B68039]"
            required
          />
        </div>

        {/* Phone */}
        <div className="space-y-2">
          <Label htmlFor="client_phone" className="text-white font-body text-sm uppercase tracking-wider">
            Phone Number *
          </Label>
          <Input
            id="client_phone"
            type="tel"
            value={formData.client_phone}
            onChange={(e) => updateFormData({ client_phone: e.target.value })}
            placeholder="(555) 123-4567"
            className="bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-[#B68039]"
            required
          />
        </div>
      </div>

      {/* Address */}
      <div className="space-y-2">
        <Label htmlFor="client_address" className="text-white font-body text-sm uppercase tracking-wider">
          Street Address *
        </Label>
        <Input
          id="client_address"
          value={formData.client_address}
          onChange={(e) => updateFormData({ client_address: e.target.value })}
          placeholder="123 Main Street"
          className="bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-[#B68039]"
          required
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* City */}
        <div className="space-y-2">
          <Label htmlFor="client_city" className="text-white font-body text-sm uppercase tracking-wider">
            City *
          </Label>
          <Input
            id="client_city"
            value={formData.client_city}
            onChange={(e) => updateFormData({ client_city: e.target.value })}
            placeholder="City"
            className="bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-[#B68039]"
            required
          />
        </div>

        {/* State */}
        <div className="space-y-2">
          <Label htmlFor="client_state" className="text-white font-body text-sm uppercase tracking-wider">
            State *
          </Label>
          <Input
            id="client_state"
            value={formData.client_state}
            onChange={(e) => updateFormData({ client_state: e.target.value })}
            placeholder="OK"
            className="bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-[#B68039]"
            required
          />
        </div>

        {/* ZIP */}
        <div className="space-y-2">
          <Label htmlFor="client_zip" className="text-white font-body text-sm uppercase tracking-wider">
            ZIP Code *
          </Label>
          <Input
            id="client_zip"
            value={formData.client_zip}
            onChange={(e) => updateFormData({ client_zip: e.target.value })}
            placeholder="73116"
            className="bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-[#B68039]"
            required
          />
        </div>
      </div>
    </div>
  );
}
