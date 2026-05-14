"use client"

import { use, useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { Mic, Square, Check, ArrowRight, ArrowLeft, RotateCcw } from "lucide-react"
import { getInvitationById, type Invitation } from "@/lib/storage"

export const dynamic = "force-dynamic"

const LOGO = "https://assets.cdn.filesafe.space/651kIrlKk834C2FEl66i/media/69b0c2eebfc81fb1ab616b02.png"

interface Question {
  slot: "intro" | "different" | "operations" | "faq" | "tone" | "goals"
  field:
    | "audio_intro_url"
    | "audio_different_url"
    | "audio_operations_url"
    | "audio_faq_url"
    | "audio_tone_url"
    | "audio_goals_url"
  eyebrow: string
  prompt: string
  hint: string
}

const QUESTIONS: Question[] = [
  {
    slot: "intro",
    field: "audio_intro_url",
    eyebrow: "01 — Who you are",
    prompt: "What does your business do, and who's your ideal customer?",
    hint: "Talk like you'd talk to a friend. 60 seconds.",
  },
  {
    slot: "different",
    field: "audio_different_url",
    eyebrow: "02 — Edge",
    prompt: "What makes you different from your competitors?",
    hint: "The reason people pick you. Say it out loud.",
  },
  {
    slot: "operations",
    field: "audio_operations_url",
    eyebrow: "03 — How you operate",
    prompt: "Walk me through hours, where you work, what you do, and what it costs.",
    hint: "STACY uses this to answer your phone like you would.",
  },
  {
    slot: "faq",
    field: "audio_faq_url",
    eyebrow: "04 — Qualify in, qualify out",
    prompt: "Top questions clients ask — and who's a NO for you?",
    hint: "What you say a hundred times a week, and what disqualifies a lead.",
  },
  {
    slot: "tone",
    field: "audio_tone_url",
    eyebrow: "05 — Voice of the agent",
    prompt: "How should the agent sound? Give a sentence in the voice you want.",
    hint: "Speak it the way you'd want STACY to say it.",
  },
  {
    slot: "goals",
    field: "audio_goals_url",
    eyebrow: "06 — Where you're going",
    prompt: "Where do you want to be 12 months from now?",
    hint: "Revenue, team, lifestyle. Out loud.",
  },
]

type Audios = Partial<Record<Question["field"], string>>

export default function IntakePage({
  params,
}: {
  params: Promise<{ invitationId: string }>
}) {
  const { invitationId } = use(params)
  const router = useRouter()
  const [invitation, setInvitation] = useState<Invitation | null>(null)
  const [stepIndex, setStepIndex] = useState(0)
  const [audios, setAudios] = useState<Audios>({})
  const [savingFinal, setSavingFinal] = useState(false)
  const [done, setDone] = useState(false)

  useEffect(() => {
    let cancelled = false
    getInvitationById(invitationId).then((inv) => {
      if (!cancelled) setInvitation(inv)
    })
    return () => {
      cancelled = true
    }
  }, [invitationId])

  async function persist(status: "in_progress" | "completed", overrides?: Audios) {
    const a = { ...audios, ...(overrides ?? {}) }
    await fetch("/api/portal/intakes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        invitation_id: invitationId,
        ...a,
        status,
      }),
    })
  }

  function setAudio(field: Question["field"], url: string) {
    const next = { ...audios, [field]: url }
    setAudios(next)
    void persist("in_progress", { [field]: url })
  }

  function next() {
    if (stepIndex < QUESTIONS.length - 1) {
      setStepIndex((i) => i + 1)
    } else {
      finish()
    }
  }

  function prev() {
    setStepIndex((i) => Math.max(i - 1, 0))
  }

  async function finish() {
    setSavingFinal(true)
    try {
      await persist("completed")
      setDone(true)
    } finally {
      setSavingFinal(false)
    }
  }

  const q = QUESTIONS[stepIndex]
  const currentUrl = q ? audios[q.field] : undefined
  const totalAnswered = QUESTIONS.filter((qq) => audios[qq.field]).length
  const progress = done ? 100 : ((stepIndex + (currentUrl ? 1 : 0)) / QUESTIONS.length) * 100

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{
        background: "#000000",
        fontFamily:
          "'Montserrat', -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif",
        color: "#FFD69C",
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Montserrat:wght@500;600;700&display=swap');
        .bebas { font-family: 'Bebas Neue', Impact, 'Anton', 'Oswald', 'Arial Narrow', sans-serif; font-weight: 400; }
      `}</style>

      {/* Top bar — logo + slim progress */}
      <header className="px-5 pt-5 pb-3">
        <div className="max-w-md mx-auto w-full">
          <div className="flex items-center justify-center mb-4">
            <img src={LOGO} alt="Orage" className="h-7 w-auto opacity-90" />
          </div>
          <div className="flex items-center gap-3">
            <span
              className="bebas text-[11px] tracking-[0.3em] uppercase"
              style={{ color: "#B68039" }}
            >
              {String(stepIndex + 1).padStart(2, "0")} / {String(QUESTIONS.length).padStart(2, "0")}
            </span>
            <div
              className="flex-1 h-[2px] rounded-full overflow-hidden"
              style={{ background: "rgba(182,128,57,0.15)" }}
            >
              <div
                className="h-full transition-all duration-500"
                style={{ background: "#B68039", width: `${progress}%` }}
              />
            </div>
            <span
              className="bebas text-[11px] tracking-[0.2em] uppercase"
              style={{ color: "rgba(255,214,156,0.5)" }}
            >
              {totalAnswered} done
            </span>
          </div>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-5 py-6">
        <div className="max-w-md mx-auto w-full">
          {done ? (
            <DoneCard
              invitation={invitation}
              onClose={() => router.push("/")}
            />
          ) : (
            <QuestionCard
              q={q}
              audioUrl={currentUrl}
              invitationId={invitationId}
              onAudio={(url) => setAudio(q.field, url)}
              onNext={next}
              onPrev={stepIndex > 0 ? prev : undefined}
              isLast={stepIndex === QUESTIONS.length - 1}
              saving={savingFinal}
            />
          )}
        </div>
      </main>

      <footer className="px-5 pb-6 pt-3">
        <p
          className="text-center text-[11px] bebas tracking-[0.25em] uppercase"
          style={{ color: "rgba(255,214,156,0.35)" }}
        >
          Saves automatically · Close anytime
        </p>
      </footer>
    </div>
  )
}

/* ─────────────────────────── Question card ─────────────────────────── */

function QuestionCard({
  q,
  audioUrl,
  invitationId,
  onAudio,
  onNext,
  onPrev,
  isLast,
  saving,
}: {
  q: Question
  audioUrl?: string
  invitationId: string
  onAudio: (url: string) => void
  onNext: () => void
  onPrev?: () => void
  isLast: boolean
  saving: boolean
}) {
  return (
    <div className="space-y-8 text-center">
      <div className="space-y-2">
        <p
          className="bebas text-[11px] tracking-[0.4em] uppercase"
          style={{ color: "#B68039" }}
        >
          {q.eyebrow}
        </p>
        <h1
          className="bebas tracking-[0.04em] leading-[1.05]"
          style={{
            color: "#E4AF7A",
            fontSize: "clamp(28px, 7vw, 38px)",
          }}
        >
          {q.prompt}
        </h1>
        <p
          className="text-[13px] leading-relaxed pt-1"
          style={{ color: "rgba(255,214,156,0.55)", fontWeight: 500 }}
        >
          {q.hint}
        </p>
      </div>

      <Recorder
        invitationId={invitationId}
        slot={q.slot}
        currentUrl={audioUrl}
        onUploaded={onAudio}
      />

      <div className="flex items-center justify-between gap-3 pt-2">
        {onPrev ? (
          <button
            onClick={onPrev}
            className="bebas text-[12px] tracking-[0.25em] uppercase flex items-center gap-2 px-3 py-2 rounded transition"
            style={{ color: "rgba(255,214,156,0.55)" }}
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>
        ) : (
          <span />
        )}

        <button
          onClick={onNext}
          disabled={saving}
          className="bebas text-[14px] tracking-[0.25em] uppercase flex items-center gap-2 px-6 py-3 rounded transition disabled:opacity-50"
          style={{
            background: audioUrl ? "#B68039" : "transparent",
            color: audioUrl ? "#FFFFFF" : "rgba(255,214,156,0.7)",
            border: audioUrl ? "1px solid #B68039" : "1px solid rgba(182,128,57,0.4)",
          }}
        >
          {saving
            ? "Saving…"
            : isLast
            ? audioUrl
              ? "Finish"
              : "Skip & finish"
            : audioUrl
            ? "Continue"
            : "Skip"}
          {!saving && <ArrowRight className="h-4 w-4" />}
        </button>
      </div>
    </div>
  )
}

/* ─────────────────────────── Done card ─────────────────────────── */

function DoneCard({
  invitation,
  onClose,
}: {
  invitation: Invitation | null
  onClose: () => void
}) {
  const firstName = invitation?.contact_name?.split(" ")[0]
  return (
    <div className="space-y-8 text-center">
      <div
        className="inline-flex h-20 w-20 mx-auto items-center justify-center rounded-full"
        style={{
          background: "rgba(182,128,57,0.15)",
          border: "1px solid #B68039",
        }}
      >
        <Check className="h-9 w-9" style={{ color: "#E4AF7A" }} />
      </div>
      <div className="space-y-3">
        <p className="bebas text-[11px] tracking-[0.4em] uppercase" style={{ color: "#B68039" }}>
          That's it
        </p>
        <h1
          className="bebas tracking-[0.06em] leading-[1.05]"
          style={{
            color: "#E4AF7A",
            fontSize: "clamp(32px, 8vw, 42px)",
          }}
        >
          {firstName ? `Thanks, ${firstName}.` : "Thanks."}
        </h1>
        <p
          className="text-[14px] leading-relaxed max-w-sm mx-auto"
          style={{ color: "rgba(255,214,156,0.7)", fontWeight: 500 }}
        >
          We'll have your phone agent and chat agent ready inside 48 hours. You'll get an email
          when it's live.
        </p>
      </div>
      <p
        className="bebas text-[11px] tracking-[0.3em] uppercase"
        style={{ color: "rgba(255,214,156,0.4)" }}
      >
        Questions · team@orage.agency
      </p>
      <button
        onClick={onClose}
        className="bebas text-[14px] tracking-[0.25em] uppercase px-6 py-3 rounded transition"
        style={{
          background: "#B68039",
          color: "#FFFFFF",
        }}
      >
        Done
      </button>
    </div>
  )
}

/* ─────────────────────────── Recorder ─────────────────────────── */

function Recorder({
  invitationId,
  slot,
  currentUrl,
  onUploaded,
}: {
  invitationId: string
  slot: string
  currentUrl?: string
  onUploaded: (url: string) => void
}) {
  const [recording, setRecording] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [elapsedSec, setElapsedSec] = useState(0)
  const [previewUrl, setPreviewUrl] = useState<string | undefined>(currentUrl)
  const recorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const timerRef = useRef<number | null>(null)
  const MAX_SEC = 90

  useEffect(() => {
    setPreviewUrl(currentUrl)
  }, [currentUrl, slot])

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
      if (recorderRef.current && recorderRef.current.state === "recording") {
        recorderRef.current.stop()
        recorderRef.current.stream.getTracks().forEach((t) => t.stop())
      }
    }
  }, [])

  async function start() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mr = new MediaRecorder(stream)
      chunksRef.current = []
      mr.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data)
      }
      mr.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop())
        const blob = new Blob(chunksRef.current, { type: mr.mimeType || "audio/webm" })
        await upload(blob)
      }
      recorderRef.current = mr
      mr.start()
      setRecording(true)
      setElapsedSec(0)
      setPreviewUrl(undefined)
      timerRef.current = window.setInterval(() => {
        setElapsedSec((s) => {
          if (s + 1 >= MAX_SEC) stop()
          return s + 1
        })
      }, 1000)
    } catch (err) {
      alert(
        "Microphone access denied. Tap the lock icon in your browser address bar and allow microphone access.",
      )
      console.error(err)
    }
  }

  function stop() {
    if (timerRef.current) clearInterval(timerRef.current)
    timerRef.current = null
    if (recorderRef.current && recorderRef.current.state === "recording") {
      recorderRef.current.stop()
    }
    setRecording(false)
  }

  async function upload(blob: Blob) {
    setUploading(true)
    try {
      const form = new FormData()
      form.append("file", blob, `${slot}.webm`)
      form.append("invitation_id", invitationId)
      form.append("slot", slot)
      const r = await fetch("/api/portal/intakes/audio", { method: "POST", body: form })
      if (!r.ok) throw new Error(`upload failed (${r.status})`)
      const { url } = (await r.json()) as { url: string }
      setPreviewUrl(url)
      onUploaded(url)
    } catch (err) {
      console.error(err)
      alert("Upload failed. Please try again.")
    } finally {
      setUploading(false)
    }
  }

  const mmss = `${Math.floor(elapsedSec / 60)}:${String(elapsedSec % 60).padStart(2, "0")}`
  const remaining = MAX_SEC - elapsedSec

  return (
    <div className="flex flex-col items-center gap-5">
      {!recording && !uploading && !previewUrl && (
        <button
          onClick={start}
          className="relative h-32 w-32 rounded-full flex items-center justify-center transition active:scale-95"
          style={{
            background:
              "radial-gradient(circle at 30% 30%, #E4AF7A 0%, #B68039 55%, #543C1C 100%)",
            boxShadow: "0 12px 40px rgba(182,128,57,0.45), 0 0 0 1px rgba(228,175,122,0.25) inset",
          }}
          aria-label="Start recording"
        >
          <span
            className="absolute inset-0 rounded-full"
            style={{
              border: "1px solid rgba(228,175,122,0.4)",
            }}
          />
          <Mic className="h-12 w-12 text-white" strokeWidth={1.75} />
        </button>
      )}

      {recording && (
        <button
          onClick={stop}
          className="relative h-32 w-32 rounded-full flex items-center justify-center transition active:scale-95"
          style={{
            background: "#B68039",
            boxShadow: "0 0 0 8px rgba(182,128,57,0.18), 0 0 0 16px rgba(182,128,57,0.08)",
          }}
          aria-label="Stop recording"
        >
          <span
            className="absolute inset-0 rounded-full animate-ping"
            style={{ background: "rgba(182,128,57,0.25)" }}
          />
          <Square className="h-10 w-10 fill-white text-white" strokeWidth={0} />
        </button>
      )}

      {uploading && (
        <div
          className="h-32 w-32 rounded-full flex items-center justify-center"
          style={{ background: "rgba(182,128,57,0.15)", border: "1px solid #B68039" }}
        >
          <span
            className="bebas text-[12px] tracking-[0.3em] uppercase"
            style={{ color: "#E4AF7A" }}
          >
            Saving
          </span>
        </div>
      )}

      {!recording && !uploading && previewUrl && (
        <button
          onClick={start}
          className="relative h-32 w-32 rounded-full flex items-center justify-center transition active:scale-95"
          style={{
            background: "rgba(182,128,57,0.12)",
            border: "1px solid rgba(228,175,122,0.5)",
          }}
          aria-label="Re-record"
        >
          <RotateCcw className="h-9 w-9" style={{ color: "#E4AF7A" }} strokeWidth={1.75} />
        </button>
      )}

      <div className="min-h-[44px] flex flex-col items-center gap-2">
        {recording && (
          <p
            className="bebas text-[13px] tracking-[0.25em] uppercase"
            style={{ color: "#E4AF7A" }}
          >
            Recording · {mmss}
            <span style={{ color: "rgba(255,214,156,0.4)" }}> · {remaining}s left</span>
          </p>
        )}
        {!recording && !uploading && !previewUrl && (
          <p
            className="bebas text-[12px] tracking-[0.3em] uppercase"
            style={{ color: "rgba(255,214,156,0.55)" }}
          >
            Tap to record
          </p>
        )}
        {!recording && previewUrl && (
          <>
            <p
              className="bebas text-[12px] tracking-[0.3em] uppercase flex items-center gap-2"
              style={{ color: "#E4AF7A" }}
            >
              <Check className="h-3.5 w-3.5" /> Saved · tap to redo
            </p>
            <audio
              controls
              src={previewUrl}
              className="max-w-[260px] w-full"
              style={{ height: 36 }}
            />
          </>
        )}
      </div>
    </div>
  )
}
