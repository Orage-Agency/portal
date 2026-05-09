-- Add new columns to invitations table for contact name and referral info
ALTER TABLE invitations ADD COLUMN IF NOT EXISTS contact_name TEXT;
ALTER TABLE invitations ADD COLUMN IF NOT EXISTS is_referral VARCHAR(10);
ALTER TABLE invitations ADD COLUMN IF NOT EXISTS referral_name TEXT;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_invitations_contact_name ON invitations(contact_name);
CREATE INDEX IF NOT EXISTS idx_invitations_is_referral ON invitations(is_referral);
