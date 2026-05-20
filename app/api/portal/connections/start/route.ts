import { NextResponse } from "next/server"
import { sql } from "@/lib/sql"
import { createConnectSession } from "@/lib/nango"
import { getProvider } from "@/lib/providers"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

/**
 * Public — start an OAuth connect session for a given invitation + provider.
 * The link IS the secret (same model as the intake page). We hand back a
 * Nango Connect token; the browser uses it to launch Nango's hosted modal.
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
    // The link IS the secret — confirm the id maps to an invitation or client
    // (signed clients reuse the same id as their source invitation).
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
    if (provider.kind !== "oauth" || !provider.nangoIntegrationId) {
      return NextResponse.json(
        { error: "Provider does not use OAuth — use the app-password endpoint" },
        { status: 400 },
      )
    }
    if (!process.env.NANGO_SECRET_KEY) {
      return NextResponse.json(
        {
          error:
            "OAuth not yet configured. Server is missing NANGO_SECRET_KEY — admin needs to set it in Vercel.",
        },
        { status: 503 },
      )
    }

    const { token } = await createConnectSession({
      invitationId,
      integrationId: provider.nangoIntegrationId,
    })

    return NextResponse.json({
      token,
      provider_id: provider.id,
      integration_id: provider.nangoIntegrationId,
    })
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message },
      { status: 500 },
    )
  }
}
