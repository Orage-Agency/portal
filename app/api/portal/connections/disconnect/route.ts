import { NextResponse } from "next/server"
import { sql } from "@/lib/sql"
import { markDisconnected } from "@/lib/connections"
import { deleteConnection } from "@/lib/nango"
import { getProvider } from "@/lib/providers"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

/**
 * Public — disconnect a connection. Link is the secret. Marks the row
 * disconnected locally AND revokes the Nango connection so the provider
 * stops trusting us. We keep the (now ciphertext) row for audit; it can be
 * fully purged via the admin delete flow later.
 *
 * Body: { invitation_id, provider_id }
 */
export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => ({}))) as {
      invitation_id?: string
      provider_id?: string
    }
    const invitationId = (body.invitation_id || "").trim()
    const providerId = (body.provider_id || "").trim()
    if (!invitationId || !providerId) {
      return NextResponse.json(
        { error: "invitation_id and provider_id are required" },
        { status: 400 },
      )
    }

    // Confirm invitation/client exists
    const inv = (await sql()`
      SELECT id FROM invitations WHERE id = ${invitationId} LIMIT 1
    `) as Array<{ id: string }>
    if (!inv || inv.length === 0) {
      const cli = (await sql()`
        SELECT id FROM clients WHERE id = ${invitationId} LIMIT 1
      `) as Array<{ id: string }>
      if (!cli || cli.length === 0) {
        return NextResponse.json({ error: "Invalid invitation" }, { status: 403 })
      }
    }

    const provider = getProvider(providerId)
    if (!provider) {
      return NextResponse.json({ error: "Unknown provider" }, { status: 400 })
    }

    // Look up the stored connection so we can revoke at Nango too
    const existing = (await sql()`
      SELECT nango_connection_id FROM client_connections
      WHERE invitation_id = ${invitationId} AND provider = ${providerId}
      LIMIT 1
    `) as Array<{ nango_connection_id?: string | null }>

    if (
      provider.kind === "oauth" &&
      provider.nangoIntegrationId &&
      existing[0]?.nango_connection_id &&
      process.env.NANGO_SECRET_KEY
    ) {
      try {
        await deleteConnection({
          connectionId: existing[0].nango_connection_id,
          integrationId: provider.nangoIntegrationId,
        })
      } catch (e) {
        // Best-effort — Nango may have already revoked it on the provider side.
        console.warn(`[disconnect] nango delete failed for ${providerId}:`, (e as Error).message)
      }
    }

    await markDisconnected(invitationId, providerId)
    return NextResponse.json({ ok: true })
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message },
      { status: 500 },
    )
  }
}
