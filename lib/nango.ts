/**
 * Thin server-only wrapper around Nango's REST API. We use Nango as a
 * managed OAuth handler (it owns the consent flow, the OAuth clients for
 * each provider, and refresh-token logic) but mirror every token into our
 * own `client_connections` table so we keep ownership of credentials.
 *
 * Env:
 *   NANGO_SECRET_KEY   server-side secret from nango.dev → Environment Settings
 *   NANGO_PUBLIC_KEY   browser-side public key (used by Connect UI)
 *   NANGO_API_BASE     optional override; defaults to https://api.nango.dev
 *
 * Nango docs: https://docs.nango.dev
 */

const API_BASE = process.env.NANGO_API_BASE || "https://api.nango.dev"

export function nangoSecret(): string {
  const k = process.env.NANGO_SECRET_KEY
  if (!k) throw new Error("NANGO_SECRET_KEY is not set")
  return k
}

export function nangoPublic(): string {
  // Public key is safe to expose to the browser. We return undefined-tolerant
  // so the UI can gracefully say "not configured" instead of crashing.
  return process.env.NANGO_PUBLIC_KEY || ""
}

/**
 * Ask Nango for a one-shot Connect Session token. The browser uses it to
 * launch Nango's hosted modal — the client never sees our secret key.
 * Each session is bound to a single invitation_id + provider.
 */
export async function createConnectSession(args: {
  invitationId: string
  integrationId: string
}): Promise<{ token: string }> {
  const r = await fetch(`${API_BASE}/connect/sessions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${nangoSecret()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      end_user: { id: args.invitationId },
      allowed_integrations: [args.integrationId],
    }),
  })
  if (!r.ok) {
    const t = await r.text().catch(() => "")
    throw new Error(`nango createConnectSession ${r.status}: ${t.slice(0, 200)}`)
  }
  const j = (await r.json()) as { data?: { token?: string } }
  const token = j.data?.token
  if (!token) throw new Error("nango did not return a connect token")
  return { token }
}

/**
 * Fetch the current (refreshed) credentials for a stored connection. Use
 * this server-side every time we need to call the provider; Nango handles
 * refresh transparently. We mirror the access token into our DB after each
 * fetch so we keep ownership.
 */
export async function getConnection(args: {
  connectionId: string
  integrationId: string
}): Promise<NangoConnection> {
  const url = new URL(`${API_BASE}/connection/${encodeURIComponent(args.connectionId)}`)
  url.searchParams.set("provider_config_key", args.integrationId)
  url.searchParams.set("refresh_token", "true")
  const r = await fetch(url, {
    headers: { Authorization: `Bearer ${nangoSecret()}` },
  })
  if (!r.ok) {
    const t = await r.text().catch(() => "")
    throw new Error(`nango getConnection ${r.status}: ${t.slice(0, 200)}`)
  }
  return (await r.json()) as NangoConnection
}

export async function listConnectionsByEndUser(args: {
  endUserId: string
}): Promise<Array<{ connection_id: string; provider_config_key: string }>> {
  const url = new URL(`${API_BASE}/connection`)
  url.searchParams.set("end_user_id", args.endUserId)
  const r = await fetch(url, {
    headers: { Authorization: `Bearer ${nangoSecret()}` },
  })
  if (!r.ok) return []
  const j = (await r.json()) as { connections?: Array<{ connection_id: string; provider_config_key: string }> }
  return j.connections ?? []
}

export async function deleteConnection(args: {
  connectionId: string
  integrationId: string
}): Promise<void> {
  const url = new URL(`${API_BASE}/connection/${encodeURIComponent(args.connectionId)}`)
  url.searchParams.set("provider_config_key", args.integrationId)
  const r = await fetch(url, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${nangoSecret()}` },
  })
  if (!r.ok) {
    const t = await r.text().catch(() => "")
    throw new Error(`nango deleteConnection ${r.status}: ${t.slice(0, 200)}`)
  }
}

export interface NangoConnection {
  connection_id: string
  provider_config_key: string
  provider: string
  end_user?: { id: string }
  created_at: string
  updated_at: string
  credentials: {
    type: "OAUTH2" | "OAUTH1" | "API_KEY" | "BASIC"
    access_token?: string
    refresh_token?: string
    expires_at?: string
    raw?: Record<string, unknown>
  }
  metadata?: Record<string, unknown>
}
