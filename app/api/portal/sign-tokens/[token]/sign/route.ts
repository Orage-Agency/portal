import { NextResponse } from "next/server"
import { sql } from "@/lib/sql"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

/**
 * PUBLIC — consume a signing token. Atomically marks the token as signed
 * AND writes the signature onto the client row, so the documents page on
 * the admin side sees the new signature on next refresh. Returns 410 Gone
 * if the token is already used.
 */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  try {
    const { token } = await params
    const body = (await req.json().catch(() => ({}))) as { signature?: string }
    if (!body.signature) {
      return NextResponse.json({ error: "signature is required" }, { status: 400 })
    }

    const tokenRows = await sql()<Array<{
      token: string
      client_id: string
      signed_at: string | null
      expires_at: string | null
    }>>`
      SELECT token, client_id, signed_at, expires_at
      FROM sign_tokens
      WHERE token = ${token}
      LIMIT 1
    `
    if (!tokenRows || tokenRows.length === 0) {
      return NextResponse.json({ error: "Not found" }, { status: 404 })
    }
    const t = tokenRows[0]
    if (t.signed_at) {
      return NextResponse.json(
        { error: "This signing link has already been used.", locked: true },
        { status: 410 },
      )
    }
    if (t.expires_at && new Date(t.expires_at).getTime() < Date.now()) {
      return NextResponse.json(
        { error: "This signing link has expired.", expired: true },
        { status: 410 },
      )
    }

    const now = new Date().toISOString()

    // Lock the token first — if two clients race, only one wins.
    const locked = await sql()<Array<{ token: string }>>`
      UPDATE sign_tokens
      SET signed_at = ${now}, signature = ${body.signature}, updated_at = ${now}
      WHERE token = ${token} AND signed_at IS NULL
      RETURNING token
    `
    if (!locked || locked.length === 0) {
      return NextResponse.json(
        { error: "This signing link has already been used.", locked: true },
        { status: 410 },
      )
    }

    // Mirror onto the client row so PDFs/UX everywhere see the signature.
    await sql()`
      UPDATE clients
      SET client_signature = ${body.signature},
          signed_at = ${now},
          updated_at = ${now}
      WHERE id = ${t.client_id}
    `

    // Drop a notification so the admin sees it in the bell.
    try {
      await sql()`
        INSERT INTO notifications (
          id, title, message, type, client_id, read, created_at
        ) VALUES (
          ${`notif-${Date.now()}`}, ${"Client Signed"},
          ${"A client signed a document via a one-time link — ready for agency countersignature."},
          ${"document_signed"}, ${t.client_id}, ${false}, ${now}
        )
      `
    } catch (e) {
      // Notifications table may not exist on very old installs; surface only.
      console.warn("[sign-tokens/sign] could not insert notification:", e)
    }

    return NextResponse.json({ ok: true, signed_at: now, client_id: t.client_id })
  } catch (err) {
    console.error("[sign-tokens/sign] failed:", err)
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}
