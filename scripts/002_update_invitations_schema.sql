-- Update invitations table to match the application's data structure
-- Drop the old invitations table and recreate with correct columns
DROP TABLE IF EXISTS public.invitations CASCADE;

CREATE TABLE IF NOT EXISTS public.invitations (
  id TEXT PRIMARY KEY,
  business_name TEXT NOT NULL,
  offer_type TEXT NOT NULL,
  setup_fee NUMERIC NOT NULL,
  monthly_fee NUMERIC NOT NULL,
  custom_services TEXT,
  special_notes TEXT,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;

-- Create policy for invitations table
CREATE POLICY "Allow all operations on invitations" ON public.invitations FOR ALL USING (true) WITH CHECK (true);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_invitations_status ON public.invitations(status);
