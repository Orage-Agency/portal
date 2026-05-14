-- Transcripts (one TEXT per voice slot) + a final free-form "notes" voice
-- answer + a separate intake_uploads table for pricing docs / extras the
-- client uploads at the end of the flow. Audio is the source of truth;
-- transcript is best-effort and may be NULL if Whisper isn't configured.

ALTER TABLE public.client_intakes ADD COLUMN IF NOT EXISTS transcript_intro       TEXT;
ALTER TABLE public.client_intakes ADD COLUMN IF NOT EXISTS transcript_different   TEXT;
ALTER TABLE public.client_intakes ADD COLUMN IF NOT EXISTS transcript_operations  TEXT;
ALTER TABLE public.client_intakes ADD COLUMN IF NOT EXISTS transcript_faq         TEXT;
ALTER TABLE public.client_intakes ADD COLUMN IF NOT EXISTS transcript_tone        TEXT;
ALTER TABLE public.client_intakes ADD COLUMN IF NOT EXISTS transcript_goals       TEXT;
ALTER TABLE public.client_intakes ADD COLUMN IF NOT EXISTS transcript_customer    TEXT;
ALTER TABLE public.client_intakes ADD COLUMN IF NOT EXISTS transcript_booking     TEXT;
ALTER TABLE public.client_intakes ADD COLUMN IF NOT EXISTS audio_booking_url      TEXT;
ALTER TABLE public.client_intakes ADD COLUMN IF NOT EXISTS audio_notes_url        TEXT;
ALTER TABLE public.client_intakes ADD COLUMN IF NOT EXISTS transcript_notes       TEXT;

CREATE TABLE IF NOT EXISTS public.intake_uploads (
  id TEXT PRIMARY KEY,
  invitation_id TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_name TEXT,
  content_type TEXT,
  size_bytes BIGINT,
  created_at TIMESTAMP DEFAULT NOW()
);

ALTER TABLE public.intake_uploads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all operations on intake_uploads" ON public.intake_uploads
  FOR ALL USING (true) WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_intake_uploads_invitation_id ON public.intake_uploads(invitation_id);
