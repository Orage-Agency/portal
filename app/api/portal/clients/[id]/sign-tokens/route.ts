import { NextResponse } from "next/server"
import { randomBytes } from "node:crypto"
import { sql } from "@/lib/sql"
import { requireAdmin } from "@/lib/api-auth"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

/**
 * Admin — mint a new one-time signing token for a client. POST returns the
 * fresh token and the full URL it points to. The token is the bearer secret
 * in /sign/t/<token>; once consumed it locks (subsequent attempts return
 * 410 Gone).
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
      doc_key?: "msa" | "welcome" | "invoice"
      expires_in_days?: number
    }

    // Confirm the client exists before minting a token.
    const exists = await sql()<Array<{ id: string }>>`
      SELECT id FROM clients WHERE id = ${id} LIMIT 1
    `
    if (!exists || exists.length === 0) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 })
    }

    const token = randomBytes(24).toString("hex") // 48-char URL-safe
    const docKey = body.doc_key ?? "msa"
    const now = new Date().toISOString()
    const expiresAt =
      typeof body.expires_in_days === "number" && body.expires_in_days > 0
        ? new Date(Date.now() + body.expires_in_days * 86400 * 1000).toISOString()
        : null

    await sql()`
      INSERT INTO sign_tokens (token, client_id, doc_key, created_at, updated_at, expires_at)
      VALUES (${token}, ${id}, ${docKey}, ${now}, ${now}, ${expiresAt})
    `

    const origin =
      process.env.PORTAL_BASE_URL ||
      process.env.NEXT_PUBLIC_SITE_URL ||
      new URL(req.url).origin
    const url = `${origin.replace(/\/+$/, "")}/sign/t/${token}`

    return NextResponse.json({ token, url, expires_at: expiresAt })
  } catch (err) {
    console.error("[sign-tokens] create failed:", err)
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}

/**
 * Admin — list all tokens for a client (so the file page can show "sent X
 * times, last signed Y").
 */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const denied = requireAdmin(req)
  if (denied) return denied
  try {
    const { id } = await params
    const rows = await sql()<Array<{
      token: string
      client_id: string
      doc_key: string
      signed_at: string | null
      created_at: string
      expires_at: string | null
    }>>`
      SELECT token, client_id, doc_key, signed_at, created_at, expires_at
      FROM sign_tokens
      WHERE client_id = ${id}
      ORDER BY created_at DESC
    `
    return NextResponse.json({ tokens: rows ?? [] })
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}
