-- Per-client OAuth/credential connections to third-party tools (Google,
-- Calendly, GoHighLevel, Stripe, Square, WordPress, ...). One row per
-- (invitation_id, provider). Tokens are mirrored from Nango into our own
-- DB so we keep ownership of every access/refresh token — if we ever leave
-- Nango we can call provider APIs directly with what we already have.
--
-- pgcrypto is enabled so we can encrypt tokens at rest. Encryption key
-- comes from CONNECTIONS_ENC_KEY env var (passed via the helper functions
-- in lib/connections.ts, not stored in the DB).

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS public.client_connections (
  id TEXT PRIMARY KEY,
  invitation_id TEXT NOT NULL,
  provider TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  -- Nango (OAuth) fields
  nango_connection_id TEXT,
  scopes TEXT,
  access_token_encrypted BYTEA,
  refresh_token_encrypted BYTEA,
  token_type TEXT,
  expires_at TIMESTAMP,
  -- WordPress / non-OAuth application-password fields
  app_username TEXT,
  app_password_encrypted BYTEA,
  app_site_url TEXT,
  -- Metadata
  provider_account_email TEXT,
  provider_account_label TEXT,
  connected_at TIMESTAMP,
  last_used_at TIMESTAMP,
  last_error TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE (invitation_id, provider)
);

ALTER TABLE public.client_connections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all operations on client_connections" ON public.client_connections
  FOR ALL USING (true) WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_client_connections_invitation_id ON public.client_connections(invitation_id);
CREATE INDEX IF NOT EXISTS idx_client_connections_provider     ON public.client_connections(provider);
