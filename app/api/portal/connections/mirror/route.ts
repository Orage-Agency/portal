import { NextResponse } from "next/server"
import { sql } from "@/lib/sql"
import { getConnection } from "@/lib/nango"
import { upsertOAuthConnection } from "@/lib/connections"
import { getProvider } from "@/lib/providers"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

/**
 * Called from the client AFTER Nango's Connect modal completes successfully.
 * We pull the fresh credentials from Nango and mirror them (encrypted) into
 * our own client_connections row.
 *
 * Body: { invitation_id, provider_id, nango_connection_id }
 *
 * This same function is also invoked from any server-side code that needs a
 * fresh token (export it as a helper too).
 */
export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => ({}))) as {
      invitation_id?: string
      provider_id?: string
      nango_connection_id?: string
    }
    const invitationId = (body.invitation_id || "").trim()
    const providerId = (body.provider_id || "").trim()
    const nangoConnectionId = (body.nango_connection_id || "").trim()
    if (!invitationId || !providerId || !nangoConnectionId) {
      return NextResponse.json(
        { error: "invitation_id, provider_id, nango_connection_id required" },
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
    if (!provider || provider.kind !== "oauth" || !provider.nangoIntegrationId) {
      return NextResponse.json({ error: "Provider misconfigured" }, { status: 400 })
    }
    if (!process.env.NANGO_SECRET_KEY) {
      return NextResponse.json(
        { error: "Server missing NANGO_SECRET_KEY" },
        { status: 503 },
      )
    }
    if (!process.env.CONNECTIONS_ENC_KEY) {
      return NextResponse.json(
        { error: "Server missing CONNECTIONS_ENC_KEY (32-byte hex)" },
        { status: 503 },
      )
    }

    const conn = await getConnection({
      connectionId: nangoConnectionId,
      integrationId: provider.nangoIntegrationId,
    })

    const creds = conn.credentials
    const accessToken = creds.access_token
    if (!accessToken) {
      return NextResponse.json(
        { error: "Nango did not return an access token" },
        { status: 502 },
      )
    }

    await upsertOAuthConnection({
      invitationId,
      provider: providerId,
      nangoConnectionId,
      accessToken,
      refreshToken: creds.refresh_token,
      tokenType: creds.type === "OAUTH2" ? "Bearer" : creds.type,
      expiresAt: creds.expires_at ?? null,
      scopes:
        typeof (creds.raw as Record<string, unknown> | undefined)?.scope === "string"
          ? ((creds.raw as Record<string, unknown>).scope as string)
          : null,
      providerEmail:
        typeof conn.metadata?.email === "string" ? (conn.metadata.email as string) : null,
      providerLabel:
        typeof conn.metadata?.name === "string" ? (conn.metadata.name as string) : null,
    })

    return NextResponse.json({ ok: true })
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message },
      { status: 500 },
    )
  }
}
