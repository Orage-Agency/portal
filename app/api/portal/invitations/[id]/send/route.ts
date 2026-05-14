import { NextResponse } from "next/server"
import { sql } from "@/lib/sql"
import { requireAdmin } from "@/lib/api-auth"
import { invitationEmail, sendEmail } from "@/lib/email"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

/**
 * Admin route — emails the signing link to the client via Gmail
 * (team@orage.agency). Body may override the stored email and contact name
 * for one-off sends without persisting changes.
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
      email?: string
      contact_name?: string
    }

    const rows = await sql()<Array<{
      id: string
      business_name: string
      contact_name: string | null
      client_email: string | null
      status: string
    }>>`
      SELECT id, business_name, contact_name, client_email, status
      FROM invitations
      WHERE id = ${id}
      LIMIT 1
    `
    if (!rows || rows.length === 0) {
      return NextResponse.json({ error: "Invitation not found" }, { status: 404 })
    }
    const inv = rows[0]
    const recipient = (body.email || inv.client_email || "").trim()
    if (!recipient) {
      return NextResponse.json(
        { error: "No client email on file. Provide an email in the request body or save one to the invitation." },
        { status: 400 },
      )
    }
    const recipientName = (body.contact_name || inv.contact_name || inv.business_name || "").trim()

    const origin =
      process.env.PORTAL_BASE_URL ||
      process.env.NEXT_PUBLIC_SITE_URL ||
      new URL(req.url).origin
    const base = origin.replace(/\/+$/, "")
    const signUrl = `${base}/onboard/${id}`
    const intakeUrl = `${base}/onboard/${id}/intake`

    const { subject, html } = invitationEmail({
      recipientName,
      businessName: inv.business_name,
      signUrl,
      intakeUrl,
    })

    await sendEmail({ to: recipient, subject, html })

    const now = new Date().toISOString()
    await sql()`
      UPDATE invitations
      SET client_email = ${recipient}, sent_at = ${now}, updated_at = ${now}
      WHERE id = ${id}
    `

    return NextResponse.json({ ok: true, sent_to: recipient, sent_at: now })
  } catch (err) {
    console.error("[send-invitation] failed:", err)
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}
