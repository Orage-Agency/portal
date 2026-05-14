import { NextResponse } from "next/server"
import { put } from "@vercel/blob"
import { sql } from "@/lib/sql"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"
export const maxDuration = 60

/**
 * Pricing docs / extras the client uploads at the end of the intake. The link
 * (invitation_id) is the secret — same auth model as the audio route.
 *
 * POST  multipart { file, invitation_id }   → { url, id }
 * GET   ?invitation_id=...                  → { uploads: [...] }
 */

export async function POST(req: Request) {
  try {
    const form = await req.formData()
    const file = form.get("file")
    const invitationId = String(form.get("invitation_id") ?? "")
    if (!file || typeof file === "string") {
      return NextResponse.json({ error: "file is required" }, { status: 400 })
    }
    if (!invitationId) {
      return NextResponse.json(
        { error: "invitation_id is required" },
        { status: 400 },
      )
    }

    // Same secret-by-link check the audio route uses.
    const inv = (await sql()`
      SELECT id FROM invitations WHERE id = ${invitationId} LIMIT 1
    `) as Array<{ id: string }>
    if (!inv || inv.length === 0) {
      const cli = (await sql()`
        SELECT id FROM clients WHERE id = ${invitationId} LIMIT 1
      `) as Array<{ id: string }>
      if (!cli || cli.length === 0) {
        return NextResponse.json({ error: "Invalid invitation" }, { status: 403 })
      }
    }

    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      return NextResponse.json(
        { error: "Vercel Blob is not configured (missing BLOB_READ_WRITE_TOKEN)." },
        { status: 500 },
      )
    }

    const f = file as File
    const safeName = (f.name || "upload").replace(/[^A-Za-z0-9._-]/g, "_")
    const path = `intake-uploads/${invitationId}/${Date.now()}-${safeName}`
    const blob = await put(path, f, {
      access: "public",
      contentType: f.type || "application/octet-stream",
    })

    const id = `UPL-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`
    await sql()`
      INSERT INTO intake_uploads (id, invitation_id, file_url, file_name, content_type, size_bytes, created_at)
      VALUES (${id}, ${invitationId}, ${blob.url}, ${f.name ?? null}, ${f.type ?? null}, ${f.size ?? null}, NOW())
    `

    return NextResponse.json({ id, url: blob.url, name: f.name, type: f.type, size: f.size })
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}

export async function GET(req: Request) {
  const url = new URL(req.url)
  const invitationId = url.searchParams.get("invitation_id")
  if (!invitationId) {
    return NextResponse.json({ error: "invitation_id is required" }, { status: 400 })
  }
  try {
    const rows = await sql()`
      SELECT id, file_url, file_name, content_type, size_bytes, created_at
      FROM intake_uploads
      WHERE invitation_id = ${invitationId}
      ORDER BY created_at DESC
    `
    return NextResponse.json({ uploads: rows ?? [] })
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}
