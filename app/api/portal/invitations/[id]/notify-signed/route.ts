import { NextResponse } from "next/server"
import { sql } from "@/lib/sql"
import {
  sendEmail,
  signedNotificationEmail,
  TEAM_NOTIFY_EMAIL,
  welcomeEmail,
} from "@/lib/email"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

/**
 * Public — called from the onboard page after the client signs. The
 * invitation ID is the bearer secret (same pattern as /complete). Sends:
 *   1. Welcome email with portal login + agent-intake link → client
 *   2. Signed-notification email → team@orage.agency
 * Idempotent-ish: callers should only fire once, but a duplicate just
 * re-sends.
 */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params
    const body = (await req.json().catch(() => ({}))) as {
      client_id?: string
      client_email?: string
      client_name?: string
    }
    if (!body.client_id || !body.client_email) {
      return NextResponse.json(
        { error: "client_id and client_email are required" },
        { status: 400 },
      )
    }

    const rows = await sql()<Array<{ id: string; business_name: string }>>`
      SELECT id, business_name FROM invitations WHERE id = ${id} LIMIT 1
    `
    if (!rows || rows.length === 0) {
      return NextResponse.json({ error: "Invitation not found" }, { status: 404 })
    }
    const inv = rows[0]

    const origin =
      process.env.PORTAL_BASE_URL ||
      process.env.NEXT_PUBLIC_SITE_URL ||
      new URL(req.url).origin
    const base = origin.replace(/\/+$/, "")
    const portalLoginUrl = `${base}/portal/login`
    const intakeUrl = `${base}/onboard/${id}/intake`
    const reviewUrl = `${base}/c-suite/documents/${body.client_id}`

    const recipientName = (body.client_name || inv.business_name).trim()

    const wel = welcomeEmail({
      recipientName,
      businessName: inv.business_name,
      clientId: body.client_id,
      clientEmail: body.client_email,
      portalLoginUrl,
      intakeUrl,
    })
    const notify = signedNotificationEmail({
      businessName: inv.business_name,
      clientName: recipientName,
      clientEmail: body.client_email,
      clientId: body.client_id,
      reviewUrl,
    })

    // Run both sends; surface but don't fail the request if one bounces.
    const results = await Promise.allSettled([
      sendEmail({ to: body.client_email, subject: wel.subject, html: wel.html, bcc: TEAM_NOTIFY_EMAIL }),
      sendEmail({ to: TEAM_NOTIFY_EMAIL, subject: notify.subject, html: notify.html }),
    ])
    const failures = results.filter((r) => r.status === "rejected")
    if (failures.length) {
      console.error("[notify-signed] partial failure:", failures)
    }

    return NextResponse.json({
      ok: true,
      welcome_sent: results[0].status === "fulfilled",
      team_notified: results[1].status === "fulfilled",
    })
  } catch (err) {
    console.error("[notify-signed] failed:", err)
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}
