import { NextResponse } from "next/server"
import { sql } from "@/lib/sql"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

/**
 * PUBLIC route. The invitation ID is the secret — anyone who has the link
 * can read the invitation. Mirrors the existing UX (clients open the link
 * with no login).
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params
    const rows = await sql()<Array<{
      id: string
      business_name: string
      contact_name: string | null
      offer_type: string
      setup_fee: number | string
      monthly_fee: number | string
      custom_services: string | null
      special_notes: string | null
      is_referral: string | null
      referral_name: string | null
      status: string
      created_at: string
      updated_at: string | null
    }>>`
      SELECT id, business_name, contact_name, offer_type, setup_fee, monthly_fee,
             custom_services, special_notes, is_referral, referral_name, status,
             created_at, updated_at
      FROM invitations
      WHERE id = ${id}
      LIMIT 1
    `
    if (!rows || rows.length === 0) {
      return NextResponse.json({ error: "Not found" }, { status: 404 })
    }
    return NextResponse.json({ invitation: rows[0] })
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message },
      { status: 500 },
    )
  }
}
