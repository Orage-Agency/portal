-- Client intake answers — captured AFTER signing. One row per invitation.
-- Designed to feed STACY + chat agent setup. Audio recordings live in
-- Vercel Blob; this table stores their URLs and any text answers.

CREATE TABLE IF NOT EXISTS public.client_intakes (
  id TEXT PRIMARY KEY,
  invitation_id TEXT NOT NULL,

  -- Business basics
  business_hours TEXT,
  service_area TEXT,
  services_pricing TEXT,
  tools_used TEXT,            -- comma-separated chips (Square, GHL, Calendly, ...)
  top_questions TEXT,         -- top 3-5 FAQs

  -- STACY personality
  agent_tone TEXT,            -- warm / professional / no-nonsense / friendly / custom
  disqualifiers TEXT,         -- what makes someone a NO

  -- Voice answers — store as text transcripts AND audio URLs
  what_makes_different TEXT,
  ideal_customer TEXT,
  goals_12mo TEXT,

  -- Vercel Blob URLs for raw audio recordings
  audio_intro_url TEXT,
  audio_different_url TEXT,
  audio_customer_url TEXT,
  audio_goals_url TEXT,

  -- Upsell signals — JSON of boolean toggles
  upsell_signals TEXT,

  status TEXT DEFAULT 'in_progress',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

ALTER TABLE public.client_intakes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all operations on client_intakes" ON public.client_intakes
  FOR ALL USING (true) WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_intakes_invitation_id ON public.client_intakes(invitation_id);
CREATE INDEX IF NOT EXISTS idx_intakes_status ON public.client_intakes(status);
