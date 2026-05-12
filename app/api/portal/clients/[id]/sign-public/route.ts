import { NextResponse } from "next/server"
import { sql } from "@/lib/sql"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

/**
 * PUBLIC sign endpoint. Lets an existing client open a link like
 * `/sign/[clientId]` and sign a document without logging into the
 * portal. The client ID is the bearer secret — same pattern as
 * /onboard/[invitationId]. Useful for re-signing or sending an
 * already-onboarded client a fresh signature request.
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params
    const rows = await sql()<Array<{
      id: string
      name: string
      business_name: string
      email: string
      msa_content: string | null
      invoice_content: string | null
      welcome_content: string | null
      client_signature: string | null
      agency_signature: string | null
      signed_at: string | null
      agency_signed_at: string | null
    }>>`
      SELECT id, name, business_name, email, msa_content, invoice_content,
             welcome_content, client_signature, agency_signature,
             signed_at, agency_signed_at
      FROM clients
      WHERE id = ${id}
      LIMIT 1
    `
    if (!rows || rows.length === 0) {
      return NextResponse.json({ error: "Not found" }, { status: 404 })
    }
    return NextResponse.json({ client: rows[0] })
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}

/**
 * POST { signature: base64, doc?: "msa" } — stores the client's
 * signature on the client row. Idempotent: re-signing overwrites.
 */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params
    const body = (await req.json().catch(() => ({}))) as {
      signature?: string
    }
    if (!body.signature) {
      return NextResponse.json({ error: "signature is required" }, { status: 400 })
    }
    const now = new Date().toISOString()
    const result = await sql()<Array<{ id: string }>>`
      UPDATE clients
      SET client_signature = ${body.signature},
          signed_at = ${now},
          updated_at = ${now}
      WHERE id = ${id}
      RETURNING id
    `
    if (!result || result.length === 0) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 })
    }
    return NextResponse.json({ ok: true, signed_at: now })
  } catch (err) {
    console.error("[sign-public] failed:", err)
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}

/**
 * DELETE — public "remove signature" is intentionally NOT supported here.
 * Signature removal is an admin-only action; see
 * /api/portal/clients/[id]/clear-signature.
 */
