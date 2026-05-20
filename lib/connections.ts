/**
 * client_connections table helpers. Encryption uses AES-256-GCM with a key
 * from CONNECTIONS_ENC_KEY (32-byte hex). We do not lean on pgcrypto for
 * encryption — keeping the key off the DB means a compromised SQL query
 * can't decrypt tokens. The DB only stores ciphertext.
 */

import { sql } from "@/lib/sql"
import { randomBytes, createCipheriv, createDecipheriv } from "node:crypto"

function encKey(): Buffer {
  const hex = process.env.CONNECTIONS_ENC_KEY
  if (!hex) throw new Error("CONNECTIONS_ENC_KEY is not set (need 32-byte hex)")
  const buf = Buffer.from(hex, "hex")
  if (buf.length !== 32) {
    throw new Error(`CONNECTIONS_ENC_KEY must be 32 bytes (got ${buf.length})`)
  }
  return buf
}

export function encrypt(plain: string): Buffer {
  const iv = randomBytes(12)
  const c = createCipheriv("aes-256-gcm", encKey(), iv)
  const ct = Buffer.concat([c.update(plain, "utf8"), c.final()])
  const tag = c.getAuthTag()
  // Layout: [iv (12)][tag (16)][ciphertext]
  return Buffer.concat([iv, tag, ct])
}

export function decrypt(blob: Buffer): string {
  const iv = blob.subarray(0, 12)
  const tag = blob.subarray(12, 28)
  const ct = blob.subarray(28)
  const d = createDecipheriv("aes-256-gcm", encKey(), iv)
  d.setAuthTag(tag)
  const pt = Buffer.concat([d.update(ct), d.final()])
  return pt.toString("utf8")
}

export interface ConnectionRow {
  id: string
  invitation_id: string
  provider: string
  status: string
  nango_connection_id?: string | null
  scopes?: string | null
  token_type?: string | null
  expires_at?: string | null
  app_username?: string | null
  app_site_url?: string | null
  provider_account_email?: string | null
  provider_account_label?: string | null
  connected_at?: string | null
  last_used_at?: string | null
  last_error?: string | null
  created_at: string
  updated_at: string
}

export async function listConnections(invitationId: string): Promise<ConnectionRow[]> {
  const rows = await sql()`
    SELECT id, invitation_id, provider, status, nango_connection_id, scopes,
           token_type, expires_at, app_username, app_site_url,
           provider_account_email, provider_account_label,
           connected_at, last_used_at, last_error, created_at, updated_at
    FROM client_connections
    WHERE invitation_id = ${invitationId}
    ORDER BY provider
  `
  return rows as ConnectionRow[]
}

export async function upsertOAuthConnection(args: {
  invitationId: string
  provider: string
  nangoConnectionId: string
  accessToken: string
  refreshToken?: string
  tokenType?: string
  expiresAt?: string | null
  scopes?: string | null
  providerEmail?: string | null
  providerLabel?: string | null
}): Promise<void> {
  const id = `CON-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`
  const accessEnc = encrypt(args.accessToken)
  const refreshEnc = args.refreshToken ? encrypt(args.refreshToken) : null

  await sql()`
    INSERT INTO client_connections (
      id, invitation_id, provider, status,
      nango_connection_id, scopes, access_token_encrypted, refresh_token_encrypted,
      token_type, expires_at, provider_account_email, provider_account_label,
      connected_at, last_used_at, created_at, updated_at
    ) VALUES (
      ${id}, ${args.invitationId}, ${args.provider}, 'connected',
      ${args.nangoConnectionId}, ${args.scopes ?? null}, ${accessEnc}, ${refreshEnc},
      ${args.tokenType ?? "Bearer"}, ${args.expiresAt ?? null},
      ${args.providerEmail ?? null}, ${args.providerLabel ?? null},
      NOW(), NOW(), NOW(), NOW()
    )
    ON CONFLICT (invitation_id, provider) DO UPDATE SET
      status = 'connected',
      nango_connection_id = EXCLUDED.nango_connection_id,
      scopes = COALESCE(EXCLUDED.scopes, client_connections.scopes),
      access_token_encrypted = EXCLUDED.access_token_encrypted,
      refresh_token_encrypted = COALESCE(EXCLUDED.refresh_token_encrypted, client_connections.refresh_token_encrypted),
      token_type = EXCLUDED.token_type,
      expires_at = EXCLUDED.expires_at,
      provider_account_email = COALESCE(EXCLUDED.provider_account_email, client_connections.provider_account_email),
      provider_account_label = COALESCE(EXCLUDED.provider_account_label, client_connections.provider_account_label),
      connected_at = COALESCE(client_connections.connected_at, NOW()),
      last_used_at = NOW(),
      last_error = NULL,
      updated_at = NOW()
  `
}

export async function upsertAppPasswordConnection(args: {
  invitationId: string
  provider: string
  siteUrl: string
  username: string
  appPassword: string
  providerLabel?: string | null
}): Promise<void> {
  const id = `CON-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`
  const enc = encrypt(args.appPassword)
  await sql()`
    INSERT INTO client_connections (
      id, invitation_id, provider, status,
      app_username, app_password_encrypted, app_site_url,
      provider_account_label, connected_at, last_used_at, created_at, updated_at
    ) VALUES (
      ${id}, ${args.invitationId}, ${args.provider}, 'connected',
      ${args.username}, ${enc}, ${args.siteUrl},
      ${args.providerLabel ?? null}, NOW(), NOW(), NOW(), NOW()
    )
    ON CONFLICT (invitation_id, provider) DO UPDATE SET
      status = 'connected',
      app_username = EXCLUDED.app_username,
      app_password_encrypted = EXCLUDED.app_password_encrypted,
      app_site_url = EXCLUDED.app_site_url,
      provider_account_label = COALESCE(EXCLUDED.provider_account_label, client_connections.provider_account_label),
      connected_at = COALESCE(client_connections.connected_at, NOW()),
      last_used_at = NOW(),
      last_error = NULL,
      updated_at = NOW()
  `
}

export async function markDisconnected(invitationId: string, provider: string): Promise<void> {
  await sql()`
    UPDATE client_connections
    SET status = 'disconnected', updated_at = NOW()
    WHERE invitation_id = ${invitationId} AND provider = ${provider}
  `
}

export async function adminListAllConnections(): Promise<Array<ConnectionRow & { business_name?: string | null; contact_name?: string | null }>> {
  const rows = await sql()`
    SELECT c.*,
           COALESCE(inv.business_name, cl.business_name) AS business_name,
           COALESCE(inv.contact_name, cl.name)           AS contact_name
    FROM client_connections c
    LEFT JOIN invitations inv ON inv.id = c.invitation_id
    LEFT JOIN clients     cl  ON cl.id  = c.invitation_id
    ORDER BY c.updated_at DESC NULLS LAST
  `
  return rows as Array<ConnectionRow & { business_name?: string | null; contact_name?: string | null }>
}
