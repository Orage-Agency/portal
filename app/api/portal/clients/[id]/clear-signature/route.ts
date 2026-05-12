import { NextResponse } from "next/server"
import { sql } from "@/lib/sql"
import { requireAdmin } from "@/lib/api-auth"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

/**
 * Admin route — clears the client's signature, the agency's signature, or
 * both. POST body: { which: "client" | "agency" | "both" }. Used from the
 * documents page when an admin wants to redo a signature.
 */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const denied = requireAdmin(req)
  if (denied) return denied
  try {
    const { id } = await params
    const body = (await req.json().catch(() => ({}))) as {
      which?: "client" | "agency" | "both"
    }
    const which = body.which ?? "client"
    const now = new Date().toISOString()
    let result: Array<{ id: string }> | null = null
    if (which === "client") {
      result = await sql()<Array<{ id: string }>>`
        UPDATE clients
        SET client_signature = NULL, signed_at = NULL, updated_at = ${now}
        WHERE id = ${id}
        RETURNING id
      `
    } else if (which === "agency") {
      result = await sql()<Array<{ id: string }>>`
        UPDATE clients
        SET agency_signature = NULL, agency_signed_at = NULL, updated_at = ${now}
        WHERE id = ${id}
        RETURNING id
      `
    } else {
      result = await sql()<Array<{ id: string }>>`
        UPDATE clients
        SET client_signature = NULL, signed_at = NULL,
            agency_signature = NULL, agency_signed_at = NULL,
            updated_at = ${now}
        WHERE id = ${id}
        RETURNING id
      `
    }
    if (!result || result.length === 0) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 })
    }
    return NextResponse.json({ ok: true, cleared: which })
  } catch (err) {
    console.error("[clear-signature] failed:", err)
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}
