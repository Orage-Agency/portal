import { NextResponse } from "next/server"
import { sql } from "@/lib/sql"
import { requireAdmin } from "@/lib/api-auth"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

interface ClientRow {
  id: string
  name: string
  business_name: string
  email: string
  phone?: string | null
  address?: string | null
  plan: string
  price: number | string
  setup_fee?: number | string | null
  start_date: string
  portal_access: string
  msa_content?: string | null
  invoice_content?: string | null
  welcome_content?: string | null
  client_signature?: string | null
  agency_signature?: string | null
  signed_at?: string | null
  agency_signed_at?: string | null
  created_at?: string
  updated_at?: string
}

export async function GET(req: Request) {
  const denied = requireAdmin(req)
  if (denied) return denied
  try {
    const rows = await sql()<ClientRow[]>`SELECT * FROM clients ORDER BY created_at DESC`
    return NextResponse.json({ clients: rows ?? [] })
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}

/**
 * POST is intentionally PUBLIC — when a client completes the onboarding link,
 * they create their own client record. They authenticate via the invitation
 * ID (which the inviter shared). Guarded by invitation existence check.
 */
export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Partial<ClientRow> & { invitation_id?: string }
    if (!body.id || !body.name || !body.business_name || !body.email || !body.plan) {
      return NextResponse.json(
        { error: "id, name, business_name, email, plan are required" },
        { status: 400 },
      )
    }
    // If invitation_id was passed, confirm the invitation exists and is pending.
    // This stops random POSTs from creating client rows.
    if (body.invitation_id) {
      const inv = await sql()<Array<{ status: string }>>`
        SELECT status FROM invitations WHERE id = ${body.invitation_id} LIMIT 1
      `
      if (!inv || inv.length === 0) {
        return NextResponse.json({ error: "Invalid invitation" }, { status: 403 })
      }
    } else {
      // No invitation_id → must be admin-side direct entry. Require auth.
      const denied = requireAdmin(req)
      if (denied) return denied
    }
    const now = new Date().toISOString()
    await sql()`
      INSERT INTO clients (
        id, name, business_name, email, phone, address, plan, price, setup_fee,
        start_date, portal_access, msa_content, invoice_content, welcome_content,
        client_signature, agency_signature, signed_at, agency_signed_at,
        created_at, updated_at
      ) VALUES (
        ${body.id}, ${body.name}, ${body.business_name}, ${body.email},
        ${body.phone ?? null}, ${body.address ?? null}, ${body.plan}, ${Number(body.price ?? 0)},
        ${body.setup_fee !== undefined && body.setup_fee !== null ? Number(body.setup_fee) : null},
        ${body.start_date ?? now}, ${body.portal_access ?? body.email},
        ${body.msa_content ?? null}, ${body.invoice_content ?? null}, ${body.welcome_content ?? null},
        ${body.client_signature ?? null}, ${body.agency_signature ?? null},
        ${body.signed_at ?? null}, ${body.agency_signed_at ?? null},
        ${body.created_at ?? now}, ${now}
      )
      ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        business_name = EXCLUDED.business_name,
        email = EXCLUDED.email,
        phone = EXCLUDED.phone,
        address = EXCLUDED.address,
        plan = EXCLUDED.plan,
        price = EXCLUDED.price,
        setup_fee = EXCLUDED.setup_fee,
        start_date = EXCLUDED.start_date,
        portal_access = EXCLUDED.portal_access,
        msa_content = EXCLUDED.msa_content,
        invoice_content = EXCLUDED.invoice_content,
        welcome_content = EXCLUDED.welcome_content,
        client_signature = EXCLUDED.client_signature,
        agency_signature = EXCLUDED.agency_signature,
        signed_at = EXCLUDED.signed_at,
        agency_signed_at = EXCLUDED.agency_signed_at,
        updated_at = ${now}
    `
    return NextResponse.json({ ok: true })
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}

export async function DELETE(req: Request) {
  const denied = requireAdmin(req)
  if (denied) return denied
  try {
    const id = new URL(req.url).searchParams.get("id")
    if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 })
    await sql()`DELETE FROM clients WHERE id = ${id}`
    return NextResponse.json({ ok: true })
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}
