import { NextResponse } from "next/server"
import { sql } from "@/lib/sql"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

/**
 * PUBLIC — fetch the document a token points at. Returns 404 if the token
 * is unknown, 410 if it has already been signed (locked), 410 if expired.
 * The token itself is the bearer secret.
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  try {
    const { token } = await params
    // Make sure the table exists even if the migration hasn't been run.
    await sql()`CREATE TABLE IF NOT EXISTS public.sign_tokens (
      token TEXT PRIMARY KEY,
      client_id TEXT NOT NULL,
      doc_key TEXT DEFAULT 'msa',
      signed_at TIMESTAMP,
      signature TEXT,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW(),
      expires_at TIMESTAMP
    )`
    const rows = await sql()<Array<{
      token: string
      client_id: string
      doc_key: string
      signed_at: string | null
      expires_at: string | null
      business_name: string
      name: string
      email: string
      msa_content: string | null
      invoice_content: string | null
      welcome_content: string | null
      agency_signature: string | null
      agency_signed_at: string | null
    }>>`
      SELECT t.token, t.client_id, t.doc_key, t.signed_at, t.expires_at,
             c.business_name, c.name, c.email,
             c.msa_content, c.invoice_content, c.welcome_content,
             c.agency_signature, c.agency_signed_at
      FROM sign_tokens t
      JOIN clients c ON c.id = t.client_id
      WHERE t.token = ${token}
      LIMIT 1
    `
    if (!rows || rows.length === 0) {
      return NextResponse.json({ error: "Not found" }, { status: 404 })
    }
    const row = rows[0]
    if (row.signed_at) {
      return NextResponse.json(
        { error: "This signing link has already been used.", locked: true },
        { status: 410 },
      )
    }
    if (row.expires_at && new Date(row.expires_at).getTime() < Date.now()) {
      return NextResponse.json(
        { error: "This signing link has expired.", expired: true },
        { status: 410 },
      )
    }
    return NextResponse.json({ document: row })
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}
