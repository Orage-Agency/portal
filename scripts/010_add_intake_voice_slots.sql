-- Adds the new voice-only intake slots: operations, faq, tone.
-- Six total voice questions now: intro, different, operations, faq, tone, goals.

ALTER TABLE public.client_intakes ADD COLUMN IF NOT EXISTS audio_operations_url TEXT;
ALTER TABLE public.client_intakes ADD COLUMN IF NOT EXISTS audio_faq_url TEXT;
ALTER TABLE public.client_intakes ADD COLUMN IF NOT EXISTS audio_tone_url TEXT;
