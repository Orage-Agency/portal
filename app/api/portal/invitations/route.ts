import { NextResponse } from "next/server"
import { sql } from "@/lib/sql"
import { requireAdmin } from "@/lib/api-auth"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

interface InvitationRow {
  id: string
  business_name: string
  contact_name?: string | null
  client_email?: string | null
  offer_type: string
  setup_fee: number | string
  monthly_fee: number | string
  custom_services?: string | null
  special_notes?: string | null
  is_referral?: string | null
  referral_name?: string | null
  status: string
  created_at: string
  updated_at?: string | null
  sent_at?: string | null
}

export async function GET(req: Request) {
  const denied = requireAdmin(req)
  if (denied) return denied
  try {
    const rows = await sql()<InvitationRow[]>`
      SELECT id, business_name, contact_name, client_email, offer_type, setup_fee, monthly_fee,
             custom_services, special_notes, is_referral, referral_name, status,
             created_at, updated_at, sent_at
      FROM invitations
      ORDER BY created_at DESC
    `
    return NextResponse.json({ invitations: rows ?? [] })
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message },
      { status: 500 },
    )
  }
}

export async function POST(req: Request) {
  const denied = requireAdmin(req)
  if (denied) return denied
  try {
    const body = (await req.json()) as Partial<InvitationRow>
    if (!body.id || !body.business_name || !body.offer_type) {
      return NextResponse.json(
        { error: "id, business_name, offer_type are required" },
        { status: 400 },
      )
    }
    const now = new Date().toISOString()
    await sql()`
      INSERT INTO invitations (
        id, business_name, contact_name, client_email, offer_type, setup_fee, monthly_fee,
        custom_services, special_notes, is_referral, referral_name, status,
        created_at, updated_at
      ) VALUES (
        ${body.id}, ${body.business_name}, ${body.contact_name ?? null}, ${body.client_email ?? null},
        ${body.offer_type}, ${Number(body.setup_fee ?? 0)}, ${Number(body.monthly_fee ?? 0)},
        ${body.custom_services ?? null}, ${body.special_notes ?? null},
        ${body.is_referral ?? null}, ${body.referral_name ?? null},
        ${body.status ?? "pending"}, ${body.created_at ?? now}, ${now}
      )
      ON CONFLICT (id) DO UPDATE SET
        business_name = EXCLUDED.business_name,
        contact_name = EXCLUDED.contact_name,
        client_email = EXCLUDED.client_email,
        offer_type = EXCLUDED.offer_type,
        setup_fee = EXCLUDED.setup_fee,
        monthly_fee = EXCLUDED.monthly_fee,
        custom_services = EXCLUDED.custom_services,
        special_notes = EXCLUDED.special_notes,
        is_referral = EXCLUDED.is_referral,
        referral_name = EXCLUDED.referral_name,
        status = EXCLUDED.status,
        updated_at = ${now}
    `
    return NextResponse.json({ ok: true })
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message },
      { status: 500 },
    )
  }
}

export async function DELETE(req: Request) {
  const denied = requireAdmin(req)
  if (denied) return denied
  try {
    const id = new URL(req.url).searchParams.get("id")
    if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 })
    // Cascade: drop the intake answers + uploaded pricing docs that share this id.
    // Audio in Blob storage is left behind on purpose — recording is the source
    // of truth for the client and orphaned blobs are cheap.
    try { await sql()`DELETE FROM client_intakes WHERE invitation_id = ${id}` } catch {}
    try { await sql()`DELETE FROM intake_uploads WHERE invitation_id = ${id}` } catch {}
    await sql()`DELETE FROM invitations WHERE id = ${id}`
    return NextResponse.json({ ok: true })
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message },
      { status: 500 },
    )
  }
}
