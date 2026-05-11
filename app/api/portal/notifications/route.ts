import { NextResponse } from "next/server"
import { sql } from "@/lib/sql"
import { requireAdmin } from "@/lib/api-auth"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

interface NotificationRow {
  id: string
  title: string
  message: string
  type?: string | null
  client_id?: string | null
  client_name?: string | null
  read?: boolean
  created_at?: string
}

export async function GET(req: Request) {
  const denied = requireAdmin(req)
  if (denied) return denied
  try {
    const rows = await sql()<NotificationRow[]>`
      SELECT id, title, message, type, client_id, client_name, read, created_at
      FROM notifications
      ORDER BY created_at DESC
    `
    return NextResponse.json({ notifications: rows ?? [] })
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}

/**
 * POST is public — client onboard completion fires a notification.
 * Same trust model as clients/POST.
 */
export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Partial<NotificationRow>
    if (!body.id || !body.title || !body.message) {
      return NextResponse.json(
        { error: "id, title, message are required" },
        { status: 400 },
      )
    }
    const now = new Date().toISOString()
    await sql()`
      INSERT INTO notifications (id, title, message, type, client_id, client_name, read, created_at)
      VALUES (
        ${body.id}, ${body.title}, ${body.message}, ${body.type ?? "info"},
        ${body.client_id ?? null}, ${body.client_name ?? null}, ${body.read ?? false},
        ${body.created_at ?? now}
      )
      ON CONFLICT (id) DO UPDATE SET
        title = EXCLUDED.title,
        message = EXCLUDED.message,
        type = EXCLUDED.type,
        client_id = EXCLUDED.client_id,
        client_name = EXCLUDED.client_name,
        read = EXCLUDED.read
    `
    return NextResponse.json({ ok: true })
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}

export async function PATCH(req: Request) {
  const denied = requireAdmin(req)
  if (denied) return denied
  try {
    const id = new URL(req.url).searchParams.get("id")
    if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 })
    await sql()`UPDATE notifications SET read = true WHERE id = ${id}`
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
    await sql()`DELETE FROM notifications WHERE id = ${id}`
    return NextResponse.json({ ok: true })
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}
