-- Add client_email + sent_at columns to invitations so admins can email the
-- signing link directly from the portal (no more copy-paste).
ALTER TABLE public.invitations ADD COLUMN IF NOT EXISTS client_email TEXT;
ALTER TABLE public.invitations ADD COLUMN IF NOT EXISTS sent_at TIMESTAMP;

CREATE INDEX IF NOT EXISTS idx_invitations_client_email ON public.invitations(client_email);
