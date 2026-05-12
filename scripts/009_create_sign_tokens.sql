-- Unique one-time signing tokens. Each "Send for Signature" press creates a
-- row; once the client signs, signed_at is set and the token is "locked"
-- (subsequent attempts fail with 410 Gone). The token itself is the bearer
-- secret in the public URL /sign/t/<token>.
CREATE TABLE IF NOT EXISTS public.sign_tokens (
  token TEXT PRIMARY KEY,
  client_id TEXT NOT NULL,
  doc_key TEXT DEFAULT 'msa',
  signed_at TIMESTAMP,
  signature TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_sign_tokens_client_id ON public.sign_tokens(client_id);
CREATE INDEX IF NOT EXISTS idx_sign_tokens_signed_at ON public.sign_tokens(signed_at);

ALTER TABLE public.sign_tokens ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'sign_tokens'
      AND policyname = 'Allow all operations on sign_tokens'
  ) THEN
    CREATE POLICY "Allow all operations on sign_tokens" ON public.sign_tokens
      FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;
