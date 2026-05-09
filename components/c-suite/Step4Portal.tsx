import { OnboardingData } from '@/lib/types';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Copy, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Step4Props {
  formData: OnboardingData;
  updateFormData: (updates: Partial<OnboardingData>) => void;
}

export default function Step4Portal({ formData, updateFormData }: Step4Props) {
  const { toast } = useToast();

  const generatePassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%';
    let password = '';
    for (let i = 0; i < 16; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    updateFormData({ portal_password: password });
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: 'Copied!',
      description: `${label} copied to clipboard`,
    });
  };

  // Auto-generate username from email
  const handleEmailChange = (email: string) => {
    if (!formData.portal_username && email) {
      const username = email.split('@')[0];
      updateFormData({ portal_username: username });
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="font-heading text-4xl text-gold mb-2">STEP 4: PORTAL ACCESS</h2>
        <p className="text-white/60 font-body">Client portal credentials and URL</p>
      </div>

      {/* Username */}
      <div className="space-y-2">
        <Label htmlFor="portal_username" className="text-white font-body text-sm uppercase tracking-wider">
          Portal Username *
        </Label>
        <div className="flex gap-2">
          <Input
            id="portal_username"
            value={formData.portal_username}
            onChange={(e) => updateFormData({ portal_username: e.target.value })}
            placeholder="username"
            className="bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-[#B68039]"
            required
          />
          <Button
            type="button"
            onClick={() => copyToClipboard(formData.portal_username, 'Username')}
            variant="outline"
            size="icon"
            className="bg-white/5 border-white/10 text-white hover:bg-white/10"
          >
            <Copy className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Password */}
      <div className="space-y-2">
        <Label htmlFor="portal_password" className="text-white font-body text-sm uppercase tracking-wider">
          Portal Password *
        </Label>
        <div className="flex gap-2">
          <Input
            id="portal_password"
            value={formData.portal_password}
            onChange={(e) => updateFormData({ portal_password: e.target.value })}
            placeholder="Generate or enter password"
            className="bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-[#B68039] font-mono"
            required
          />
          <Button
            type="button"
            onClick={generatePassword}
            variant="outline"
            size="icon"
            className="bg-white/5 border-white/10 text-white hover:bg-white/10"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            onClick={() => copyToClipboard(formData.portal_password, 'Password')}
            variant="outline"
            size="icon"
            className="bg-white/5 border-white/10 text-white hover:bg-white/10"
          >
            <Copy className="h-4 w-4" />
          </Button>
        </div>
        <p className="text-white/40 text-xs font-body">Click the refresh icon to generate a secure password</p>
      </div>

      {/* Portal URL */}
      <div className="space-y-2">
        <Label htmlFor="portal_url" className="text-white font-body text-sm uppercase tracking-wider">
          Client Portal URL *
        </Label>
        <div className="flex gap-2">
          <Input
            id="portal_url"
            type="url"
            value={formData.portal_url}
            onChange={(e) => updateFormData({ portal_url: e.target.value })}
            placeholder="https://notion.so/your-client-portal"
            className="bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-[#B68039]"
            required
          />
          <Button
            type="button"
            onClick={() => copyToClipboard(formData.portal_url, 'Portal URL')}
            variant="outline"
            size="icon"
            className="bg-white/5 border-white/10 text-white hover:bg-white/10"
          >
            <Copy className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
