import { NextResponse } from "next/server"
import { listConnections, adminListAllConnections } from "@/lib/connections"
import { requireAdmin } from "@/lib/api-auth"
import { PROVIDERS } from "@/lib/providers"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

/**
 * GET ?invitation_id=X   public — returns connections for one client
 * GET (no param)         admin  — returns every connection in the system
 *
 * Tokens (encrypted) are never returned. We surface status + provider +
 * email/label + connected_at so the UI can render Connected pills.
 */
export async function GET(req: Request) {
  try {
    const url = new URL(req.url)
    const invitationId = url.searchParams.get("invitation_id")
    if (invitationId) {
      const rows = await listConnections(invitationId)
      // Merge with provider registry so the client UI can render every
      // available provider whether or not it's been connected yet.
      const byProvider = new Map(rows.map((r) => [r.provider, r]))
      const merged = PROVIDERS.map((p) => {
        const row = byProvider.get(p.id)
        return {
          provider_id: p.id,
          label: p.label,
          category: p.category,
          kind: p.kind,
          use: p.use,
          icon: p.icon,
          connected: row?.status === "connected",
          status: row?.status ?? "not_connected",
          provider_account_email: row?.provider_account_email ?? null,
          provider_account_label: row?.provider_account_label ?? null,
          connected_at: row?.connected_at ?? null,
          last_used_at: row?.last_used_at ?? null,
        }
      })
      return NextResponse.json({ connections: merged })
    }

    // Admin: every row in the system
    const denied = requireAdmin(req)
    if (denied) return denied
    const all = await adminListAllConnections()
    return NextResponse.json({ connections: all })
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message },
      { status: 500 },
    )
  }
}
