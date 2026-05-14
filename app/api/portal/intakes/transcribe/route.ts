import { NextResponse } from "next/server"
import { sql } from "@/lib/sql"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"
export const maxDuration = 60

/**
 * Whisper transcription, opportunistic.
 *
 * Audio is already saved to Blob by /api/portal/intakes/audio. This endpoint
 * downloads the audio, sends it to OpenAI Whisper via the Vercel AI Gateway,
 * and writes the transcript to the matching client_intakes.transcript_<slot>
 * column. If anything goes wrong — missing key, network, Whisper error — we
 * return 200 with { ok: false, reason } and the audio remains the source of
 * truth. The intake page fires-and-forgets this route; transcript is bonus.
 *
 * Body: { invitation_id: string, slot: string, audio_url: string }
 */

const SLOT_TO_COLUMN: Record<string, string> = {
  intro: "transcript_intro",
  different: "transcript_different",
  operations: "transcript_operations",
  faq: "transcript_faq",
  tone: "transcript_tone",
  goals: "transcript_goals",
  customer: "transcript_customer",
  booking: "transcript_booking",
  notes: "transcript_notes",
}

export async function POST(req: Request) {
  let body: { invitation_id?: string; slot?: string; audio_url?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ ok: false, reason: "bad_json" }, { status: 400 })
  }

  const { invitation_id, slot, audio_url } = body
  if (!invitation_id || !slot || !audio_url) {
    return NextResponse.json(
      { ok: false, reason: "missing_fields" },
      { status: 400 },
    )
  }

  const column = SLOT_TO_COLUMN[slot]
  if (!column) {
    return NextResponse.json({ ok: false, reason: "unknown_slot" })
  }

  const apiKey = process.env.AI_GATEWAY_API_KEY || process.env.OPENAI_API_KEY
  if (!apiKey) {
    return NextResponse.json({
      ok: false,
      reason: "no_transcription_key",
      hint:
        "Set AI_GATEWAY_API_KEY (preferred) or OPENAI_API_KEY in Vercel env to enable Whisper.",
    })
  }

  try {
    const audioRes = await fetch(audio_url)
    if (!audioRes.ok) {
      return NextResponse.json({
        ok: false,
        reason: `audio_fetch_${audioRes.status}`,
      })
    }
    const audioBlob = await audioRes.blob()
    const filename = audio_url.split("/").pop() || `${slot}.webm`

    const form = new FormData()
    form.append("file", audioBlob, filename)
    form.append("model", "whisper-1")
    form.append("response_format", "json")
    form.append("language", "en")

    const baseUrl = process.env.AI_GATEWAY_API_KEY
      ? "https://gateway.ai.vercel.com/v1/openai/audio/transcriptions"
      : "https://api.openai.com/v1/audio/transcriptions"

    const whisperRes = await fetch(baseUrl, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}` },
      body: form,
    })

    if (!whisperRes.ok) {
      const errText = await whisperRes.text()
      console.error(
        `[transcribe] whisper ${whisperRes.status} for slot=${slot}: ${errText.slice(0, 200)}`,
      )
      return NextResponse.json({
        ok: false,
        reason: `whisper_${whisperRes.status}`,
      })
    }

    const { text } = (await whisperRes.json()) as { text?: string }
    const transcript = (text || "").trim()
    if (!transcript) {
      return NextResponse.json({ ok: false, reason: "empty_transcript" })
    }

    // Update the column matching this slot. Identifier is from a fixed
    // whitelist (SLOT_TO_COLUMN) so direct interpolation is safe.
    const updateSql = `UPDATE public.client_intakes SET ${column} = $1, updated_at = NOW() WHERE invitation_id = $2`
    const client = sql() as unknown as {
      query: (q: string, params: unknown[]) => Promise<unknown>
    }
    await client.query(updateSql, [transcript, invitation_id])

    return NextResponse.json({ ok: true, slot, text: transcript })
  } catch (err) {
    console.error(`[transcribe] failed slot=${slot}:`, err)
    return NextResponse.json({
      ok: false,
      reason: "exception",
      message: (err as Error).message,
    })
  }
}
