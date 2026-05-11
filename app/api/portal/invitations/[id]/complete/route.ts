import { NextResponse } from "next/server"
import { sql } from "@/lib/sql"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

/**
 * Public — when the client onboard page finalises, it calls this to flip
 * the invitation status from "pending" to "completed". No admin token
 * required (the link ID is the secret). Idempotent: re-completing a row is
 * a no-op.
 */
export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params
    const now = new Date().toISOString()
    const result = await sql()<Array<{ id: string }>>`
      UPDATE invitations
      SET status = 'completed', updated_at = ${now}
      WHERE id = ${id}
      RETURNING id
    `
    if (!result || result.length === 0) {
      return NextResponse.json({ error: "Invitation not found" }, { status: 404 })
    }
    return NextResponse.json({ ok: true })
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}
