import { NextResponse } from "next/server"
import { put } from "@vercel/blob"
import { sql } from "@/lib/sql"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"
export const maxDuration = 60

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
    const ct = (file as File).type ?? ""
    const ext = ct.includes("mp4") || ct.includes("m4a")
      ? "m4a"
      : ct.includes("mpeg") || ct.includes("mp3")
      ? "mp3"
      : ct.includes("wav")
      ? "wav"
      : "webm"
    const path = `intake-audio/${invitationId}/${slot}-${Date.now()}.${ext}`
    const blob = await put(path, file as Blob, {
      access: "public",
      contentType: (file as File).type || "audio/webm",
    })

    // Persist the audio URL into client_intakes immediately, so the row
    // exists even if the React page never POSTs back (or POSTs late). The
    // page's separate POST is then idempotent. Slot is from a fixed
    // whitelist below.
    const SLOT_AUDIO_COLUMN: Record<string, string> = {
      intro: "audio_intro_url",
      different: "audio_different_url",
      customer: "audio_customer_url",
      goals: "audio_goals_url",
      operations: "audio_operations_url",
      faq: "audio_faq_url",
      tone: "audio_tone_url",
      booking: "audio_booking_url",
      notes: "audio_notes_url",
    }
    const audioCol = SLOT_AUDIO_COLUMN[slot]
    if (audioCol) {
      try {
        const seedId = `INTAKE-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`
        const upsertSql = `
          INSERT INTO public.client_intakes (id, invitation_id, ${audioCol}, status, created_at, updated_at)
          VALUES ($1, $2, $3, 'in_progress', NOW(), NOW())
          ON CONFLICT (invitation_id) DO UPDATE
            SET ${audioCol} = EXCLUDED.${audioCol}, updated_at = NOW()
        `
        const client = sql() as unknown as {
          query: (q: string, params: unknown[]) => Promise<unknown>
        }
        await client.query(upsertSql, [seedId, invitationId, blob.url])
      } catch (e) {
        console.warn(`[audio] could not persist ${audioCol}:`, (e as Error).message)
      }
    }

    // Transcription is best-effort — we await it inline so the client gets
    // {url, transcript?} in one round trip, but any failure is swallowed
    // because the recording itself is what matters.
    let transcript: string | undefined
    try {
      const origin = new URL(req.url).origin
      const trRes = await fetch(`${origin}/api/portal/intakes/transcribe`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          invitation_id: invitationId,
          slot,
          audio_url: blob.url,
        }),
      })
      const tr = (await trRes.json().catch(() => ({}))) as {
        ok?: boolean
        text?: string
      }
      if (tr.ok && tr.text) transcript = tr.text
    } catch (e) {
      console.warn(`[audio] transcription pass for slot=${slot} failed:`, (e as Error).message)
    }

    return NextResponse.json({ url: blob.url, slot, transcript })
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}
