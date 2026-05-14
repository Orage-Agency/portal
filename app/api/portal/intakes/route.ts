import { NextResponse } from "next/server"
import { sql } from "@/lib/sql"
import { requireAdmin } from "@/lib/api-auth"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

interface IntakeBody {
  id?: string
  invitation_id: string
  business_hours?: string
  service_area?: string
  services_pricing?: string
  tools_used?: string
  top_questions?: string
  agent_tone?: string
  disqualifiers?: string
  what_makes_different?: string
  ideal_customer?: string
  goals_12mo?: string
  audio_intro_url?: string
  audio_different_url?: string
  audio_customer_url?: string
  audio_goals_url?: string
  audio_operations_url?: string
  audio_faq_url?: string
  audio_tone_url?: string
  audio_booking_url?: string
  audio_notes_url?: string
  upsell_signals?: string
  status?: string
}

/**
 * GET — admin lists all intakes, or filters by invitation_id.
 */
export async function GET(req: Request) {
  const url = new URL(req.url)
  const invitationId = url.searchParams.get("invitation_id")
  // Allow public lookup by invitation_id (the link is the secret), admin lookup for all.
  if (!invitationId) {
    const denied = requireAdmin(req)
    if (denied) return denied
  }
  try {
    const rows = invitationId
      ? await sql()`SELECT * FROM client_intakes WHERE invitation_id = ${invitationId} ORDER BY created_at DESC`
      : await sql()`SELECT * FROM client_intakes ORDER BY created_at DESC`
    return NextResponse.json({ intakes: rows ?? [] })
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}

/**
 * POST — upsert intake. Public; authenticated by the invitation_id matching
 * an existing invitation row.
 */
export async function POST(req: Request) {
  try {
    const body = (await req.json()) as IntakeBody
    if (!body.invitation_id) {
      return NextResponse.json({ error: "invitation_id is required" }, { status: 400 })
    }
    // Verify the id matches a real invitation OR client (the link is the secret).
    const inv = await sql()<Array<{ id: string }>>`
      SELECT id FROM invitations WHERE id = ${body.invitation_id} LIMIT 1
    `
    if (!inv || inv.length === 0) {
      const cli = await sql()<Array<{ id: string }>>`
        SELECT id FROM clients WHERE id = ${body.invitation_id} LIMIT 1
      `
      if (!cli || cli.length === 0) {
        return NextResponse.json({ error: "Invalid invitation" }, { status: 403 })
      }
    }
    const now = new Date().toISOString()
    const id = body.id || `INTAKE-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`
    await sql()`
      INSERT INTO client_intakes (
        id, invitation_id, business_hours, service_area, services_pricing,
        tools_used, top_questions, agent_tone, disqualifiers,
        what_makes_different, ideal_customer, goals_12mo,
        audio_intro_url, audio_different_url, audio_customer_url, audio_goals_url,
        audio_operations_url, audio_faq_url, audio_tone_url,
        audio_booking_url, audio_notes_url,
        upsell_signals, status, created_at, updated_at
      ) VALUES (
        ${id}, ${body.invitation_id}, ${body.business_hours ?? null},
        ${body.service_area ?? null}, ${body.services_pricing ?? null},
        ${body.tools_used ?? null}, ${body.top_questions ?? null},
        ${body.agent_tone ?? null}, ${body.disqualifiers ?? null},
        ${body.what_makes_different ?? null}, ${body.ideal_customer ?? null},
        ${body.goals_12mo ?? null},
        ${body.audio_intro_url ?? null}, ${body.audio_different_url ?? null},
        ${body.audio_customer_url ?? null}, ${body.audio_goals_url ?? null},
        ${body.audio_operations_url ?? null}, ${body.audio_faq_url ?? null}, ${body.audio_tone_url ?? null},
        ${body.audio_booking_url ?? null}, ${body.audio_notes_url ?? null},
        ${body.upsell_signals ?? null}, ${body.status ?? "in_progress"},
        ${now}, ${now}
      )
      ON CONFLICT (id) DO UPDATE SET
        business_hours = EXCLUDED.business_hours,
        service_area = EXCLUDED.service_area,
        services_pricing = EXCLUDED.services_pricing,
        tools_used = EXCLUDED.tools_used,
        top_questions = EXCLUDED.top_questions,
        agent_tone = EXCLUDED.agent_tone,
        disqualifiers = EXCLUDED.disqualifiers,
        what_makes_different = EXCLUDED.what_makes_different,
        ideal_customer = EXCLUDED.ideal_customer,
        goals_12mo = EXCLUDED.goals_12mo,
        audio_intro_url = EXCLUDED.audio_intro_url,
        audio_different_url = EXCLUDED.audio_different_url,
        audio_customer_url = EXCLUDED.audio_customer_url,
        audio_goals_url = EXCLUDED.audio_goals_url,
        audio_operations_url = EXCLUDED.audio_operations_url,
        audio_faq_url = EXCLUDED.audio_faq_url,
        audio_tone_url = EXCLUDED.audio_tone_url,
        audio_booking_url = EXCLUDED.audio_booking_url,
        audio_notes_url = EXCLUDED.audio_notes_url,
        upsell_signals = EXCLUDED.upsell_signals,
        status = EXCLUDED.status,
        updated_at = ${now}
    `
    return NextResponse.json({ ok: true, id })
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}
