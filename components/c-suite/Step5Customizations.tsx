'use client';

import { OnboardingData } from '@/lib/types';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { Sparkles, Loader2 } from 'lucide-react';

interface Step5Props {
  formData: OnboardingData;
  updateFormData: (updates: Partial<OnboardingData>) => void;
}

export default function Step5Customizations({ formData, updateFormData }: Step5Props) {
  const [isRevisingServices, setIsRevisingServices] = useState(false);
  const [isRevisingNotes, setIsRevisingNotes] = useState(false);

  const reviseText = async (fieldName: 'custom_services' | 'special_notes', currentText: string) => {
    if (!currentText.trim()) {
      alert('Please enter some text first before revising.');
      return;
    }

    const setLoading = fieldName === 'custom_services' ? setIsRevisingServices : setIsRevisingNotes;
    setLoading(true);

    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      let revised = currentText.trim();
      
      // Split into sentences and clean up
      const sentences = revised
        .split(/[.!?]+/)
        .map(s => s.trim())
        .filter(s => s.length > 0);
      
      // Professional formatting for each sentence
      const formatted = sentences.map(sentence => {
        // Capitalize first letter
        let clean = sentence.charAt(0).toUpperCase() + sentence.slice(1);
        
        // Replace common informal language
        clean = clean
          .replace(/\bi'm\b/gi, 'I am')
          .replace(/\bwe're\b/gi, 'we are')
          .replace(/\bthey're\b/gi, 'they are')
          .replace(/\bdon't\b/gi, 'do not')
          .replace(/\bcan't\b/gi, 'cannot')
          .replace(/\bwon't\b/gi, 'will not')
          .replace(/\bisn't\b/gi, 'is not')
          .replace(/\baren't\b/gi, 'are not')
          .replace(/\bhasn't\b/gi, 'has not')
          .replace(/\bhaven't\b/gi, 'have not')
          .replace(/\bwouldn't\b/gi, 'would not')
          .replace(/\bcouldn't\b/gi, 'could not')
          .replace(/\bshouldn't\b/gi, 'should not');
        
        // Add period if missing
        if (!clean.match(/[.!?]$/)) {
          clean += '.';
        }
        
        return clean;
      });
      
      // Format as bullet points for services, paragraph for notes
      if (fieldName === 'custom_services') {
        revised = formatted.map(line => `• ${line}`).join('\n');
      } else {
        // Special notes: format as professional agreement language
        const header = 'SPECIAL TERMS & ADDITIONAL PROVISIONS:\n\n';
        const body = formatted.map((line, idx) => `${idx + 1}. ${line}`).join('\n\n');
        revised = header + body;
      }

      updateFormData({ [fieldName]: revised });
    } catch (error) {
      console.error('Error revising text:', error);
      alert('Failed to revise text. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="font-heading text-4xl text-gold mb-2">STEP 4: CUSTOMIZATIONS</h2>
        <p className="text-white/60 font-body">Optional notes and custom service details</p>
      </div>

      {/* Custom Services */}
      <div className="space-y-2">
        <Label htmlFor="custom_services" className="text-white font-body text-sm uppercase tracking-wider">
          Additional Custom Services (Optional)
        </Label>
        <Textarea
          id="custom_services"
          value={formData.custom_services || ''}
          onChange={(e) => updateFormData({ custom_services: e.target.value })}
          placeholder="List any custom or additional services beyond the standard package..."
          className="bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-[#B68039] min-h-[120px]"
          rows={5}
        />
        <div className="flex items-start justify-between gap-4">
          <p className="text-white/40 text-xs font-body mt-1 flex-1">
            Examples: Additional AI agent customizations, extended training sessions, priority implementation timeline
          </p>
          <Button
            type="button"
            onClick={() => reviseText('custom_services', formData.custom_services || '')}
            disabled={isRevisingServices || !formData.custom_services?.trim()}
            className="bg-gradient-to-r from-[#B68039] to-[#8B6028] hover:from-[#9B6A2F] hover:to-[#7A5222] text-white font-body text-sm px-4 py-2 rounded-md transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isRevisingServices ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Revising...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                Revise Text
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Special Notes */}
      <div className="space-y-2">
        <Label htmlFor="special_notes" className="text-white font-body text-sm uppercase tracking-wider">
          Special Terms & Provisions (Optional)
        </Label>
        <Textarea
          id="special_notes"
          value={formData.special_notes || ''}
          onChange={(e) => updateFormData({ special_notes: e.target.value })}
          placeholder="Enter any special terms, conditions, payment arrangements, or client-specific provisions that should be included in the agreement..."
          className="bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-[#B68039] min-h-[140px]"
          rows={6}
        />
        <div className="flex items-start justify-between gap-4">
          <p className="text-white/40 text-xs font-body mt-1 flex-1">
            This section will appear in the MSA under "Special Terms & Additional Provisions" - use for custom payment plans, unique deliverables, or specific timeline commitments
          </p>
          <Button
            type="button"
            onClick={() => reviseText('special_notes', formData.special_notes || '')}
            disabled={isRevisingNotes || !formData.special_notes?.trim()}
            className="bg-gradient-to-r from-[#B68039] to-[#8B6028] hover:from-[#9B6A2F] hover:to-[#7A5222] text-white font-body text-sm px-4 py-2 rounded-md transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isRevisingNotes ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Revising...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                Revise Text
              </>
            )}
          </Button>
        </div>
      </div>

    </div>
  );
}
