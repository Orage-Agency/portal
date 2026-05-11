-- Update invitations table to match the application's data structure.
-- This was originally a DROP+CREATE which wiped existing rows on every
-- re-run; rewritten to be additive so it can run safely against a populated
-- production database.

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

-- For pre-existing tables created by 001 (old shape: client_name/email/plan/price),
-- add the columns the app expects. Old columns stay around harmlessly.
ALTER TABLE public.invitations ADD COLUMN IF NOT EXISTS offer_type TEXT;
ALTER TABLE public.invitations ADD COLUMN IF NOT EXISTS monthly_fee NUMERIC;
ALTER TABLE public.invitations ADD COLUMN IF NOT EXISTS custom_services TEXT;
ALTER TABLE public.invitations ADD COLUMN IF NOT EXISTS special_notes TEXT;

ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'invitations'
      AND policyname = 'Allow all operations on invitations'
  ) THEN
    CREATE POLICY "Allow all operations on invitations" ON public.invitations
      FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_invitations_status ON public.invitations(status);
