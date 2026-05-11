import { NextResponse } from "next/server"
import { sql } from "@/lib/sql"
import { requireAdmin } from "@/lib/api-auth"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

interface LoginRow {
  id: string
  client_id: string
  password: string
  created_at?: string
}

export async function GET(req: Request) {
  const denied = requireAdmin(req)
  if (denied) return denied
  try {
    const rows = await sql()<LoginRow[]>`SELECT * FROM client_logins`
    return NextResponse.json({ logins: rows ?? [] })
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}

/**
 * POST is public for the same reason as /api/portal/clients POST — the
 * client onboard page creates its own login row on completion.
 */
export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Partial<LoginRow>
    if (!body.id || !body.client_id || !body.password) {
      return NextResponse.json(
        { error: "id, client_id, password are required" },
        { status: 400 },
      )
    }
    const now = new Date().toISOString()
    await sql()`
      INSERT INTO client_logins (id, client_id, password, created_at)
      VALUES (${body.id}, ${body.client_id}, ${body.password}, ${body.created_at ?? now})
      ON CONFLICT (id) DO UPDATE SET
        client_id = EXCLUDED.client_id,
        password = EXCLUDED.password
    `
    return NextResponse.json({ ok: true })
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}
