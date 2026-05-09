-- Add missing fields to clients table
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS phone TEXT;

-- Ensure all columns exist with correct types
ALTER TABLE public.clients ALTER COLUMN signed_at TYPE TEXT;
ALTER TABLE public.clients ALTER COLUMN agency_signed_at TYPE TEXT;
ALTER TABLE public.clients ALTER COLUMN created_at TYPE TEXT;
ALTER TABLE public.clients ALTER COLUMN updated_at TYPE TEXT;
