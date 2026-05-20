import { NextResponse } from "next/server"
import { sql } from "@/lib/sql"
import { upsertAppPasswordConnection } from "@/lib/connections"
import { getProvider } from "@/lib/providers"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

/**
 * Public — used by the inline form for non-OAuth providers (WordPress).
 * Body: { invitation_id, provider_id, site_url, username, app_password }
 */
export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => ({}))) as {
      invitation_id?: string
      provider_id?: string
      site_url?: string
      username?: string
      app_password?: string
    }
    const invitationId = (body.invitation_id || "").trim()
    const providerId = (body.provider_id || "").trim()
    const siteUrl = (body.site_url || "").trim()
    const username = (body.username || "").trim()
    const appPassword = (body.app_password || "").trim()
    if (!invitationId || !providerId || !siteUrl || !username || !appPassword) {
      return NextResponse.json(
        { error: "invitation_id, provider_id, site_url, username, app_password required" },
        { status: 400 },
      )
    }
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
    if (!provider || provider.kind !== "app_password") {
      return NextResponse.json({ error: "Provider does not accept app passwords" }, { status: 400 })
    }
    if (!process.env.CONNECTIONS_ENC_KEY) {
      return NextResponse.json(
        { error: "Server missing CONNECTIONS_ENC_KEY (32-byte hex)" },
        { status: 503 },
      )
    }
    await upsertAppPasswordConnection({
      invitationId,
      provider: providerId,
      siteUrl,
      username,
      appPassword,
      providerLabel: provider.label,
    })
    return NextResponse.json({ ok: true })
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message },
      { status: 500 },
    )
  }
}
