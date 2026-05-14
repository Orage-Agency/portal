import { NextResponse } from "next/server"
import { put } from "@vercel/blob"
import { sql } from "@/lib/sql"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

/**
 * Upload an audio recording to Vercel Blob and return its public URL.
 * Public route — authenticated by the invitation_id matching a real invitation.
 *
 * Request: multipart/form-data
 *   - file: the audio Blob
 *   - invitation_id: the link's ID
 *   - slot: which prompt this is for (intro | different | customer | goals)
 */
export async function POST(req: Request) {
  try {
    const form = await req.formData()
    const file = form.get("file")
    const invitationId = String(form.get("invitation_id") ?? "")
    const slot = String(form.get("slot") ?? "intro")
    if (!file || typeof file === "string") {
      return NextResponse.json({ error: "file is required" }, { status: 400 })
    }
    if (!invitationId) {
      return NextResponse.json({ error: "invitation_id is required" }, { status: 400 })
    }
    // Confirm the id matches a real invitation OR client (the link is the secret).
    const inv = await sql()<Array<{ id: string }>>`
      SELECT id FROM invitations WHERE id = ${invitationId} LIMIT 1
    `
    if (!inv || inv.length === 0) {
      const cli = await sql()<Array<{ id: string }>>`
        SELECT id FROM clients WHERE id = ${invitationId} LIMIT 1
      `
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
    const ext = (file as File).type?.includes("webm") ? "webm" : (file as File).type?.includes("mp4") ? "m4a" : "audio"
    const path = `intake-audio/${invitationId}/${slot}-${Date.now()}.${ext}`
    const blob = await put(path, file as Blob, {
      access: "public",
      contentType: (file as File).type || "audio/webm",
    })
    return NextResponse.json({ url: blob.url, slot })
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}
