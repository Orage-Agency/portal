"use client"

import { use, useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import {
  Mic,
  Square,
  Check,
  ArrowRight,
  ArrowLeft,
  RotateCcw,
  Upload,
  FileText,
} from "lucide-react"
import { getInvitationById, type Invitation } from "@/lib/storage"

export const dynamic = "force-dynamic"

const LOGO = "https://assets.cdn.filesafe.space/651kIrlKk834C2FEl66i/media/69b0c2eebfc81fb1ab616b02.png"

type Slot =
  | "intro"
  | "operations"
  | "different"
  | "customer"
  | "faq"
  | "booking"
  | "tone"
  | "goals"
  | "notes"

type AudioField =
  | "audio_intro_url"
  | "audio_operations_url"
  | "audio_different_url"
  | "audio_customer_url"
  | "audio_faq_url"
  | "audio_booking_url"
  | "audio_tone_url"
  | "audio_goals_url"
  | "audio_notes_url"

interface VoiceQuestion {
  type: "voice"
  slot: Slot
  field: AudioField
  eyebrow: string
  prompt: string
  hint: string
}

interface UploadStep {
  type: "upload"
  eyebrow: string
  title: string
  hint: string
}

type Step = VoiceQuestion | UploadStep

const STEPS: Step[] = [
  {
    type: "voice",
    slot: "intro",
    field: "audio_intro_url",
    eyebrow: "01 — Who you are",
    prompt: "What does your business do, and who do you serve?",
    hint: "One minute. Plain English. Like you'd tell a friend at dinner.",
  },
  {
    type: "voice",
    slot: "operations",
    field: "audio_operations_url",
    eyebrow: "02 — Hours · location",
    prompt: "When are you open, and where do you work?",
    hint:
      "Be specific: opening time, closing time, weekdays vs weekends, holidays, " +
      "and the exact area you cover (e.g. 'Mon–Fri 8am–6pm, Sat 9am–2pm, " +
      "closed Sun. OKC + 30 miles, mobile only').",
  },
  {
    type: "voice",
    slot: "different",
    field: "audio_different_url",
    eyebrow: "03 — Pricing",
    prompt: "List your services and what each one costs.",
    hint:
      "Walk me down your menu. Service name → starting price → roughly how long " +
      "it takes → what's included. STACY uses this to give callers real numbers, " +
      "not 'we'll get back to you'.",
  },
  {
    type: "voice",
    slot: "booking",
    field: "audio_booking_url",
    eyebrow: "04 — Booking flow",
    prompt: "How do you take a booking today, start to finish?",
    hint:
      "How they reach you, what info you need, where you put it on the calendar, " +
      "deposits or no, who confirms, what they get sent. Walk me through it once.",
  },
  {
    type: "voice",
    slot: "customer",
    field: "audio_customer_url",
    eyebrow: "05 — Yes vs no",
    prompt: "Who's your perfect customer — and who's a hard NO?",
    hint:
      "Both sides. The fit you want more of (budget, type, vibe), and who " +
      "STACY should NOT book (out of area, wrong job, too cheap, etc).",
  },
  {
    type: "voice",
    slot: "faq",
    field: "audio_faq_url",
    eyebrow: "06 — Top questions",
    prompt: "Top 5 questions clients ask — and exactly how you answer each one.",
    hint:
      "Speak the question, then your answer, in your own words. The agent " +
      "will repeat your answers back word for word.",
  },
  {
    type: "voice",
    slot: "tone",
    field: "audio_tone_url",
    eyebrow: "07 — Voice of the agent",
    prompt: "Read me one sentence in the exact tone you want STACY to sound.",
    hint: "Casual, formal, warm, no-nonsense — speak it the way you want her to speak.",
  },
  {
    type: "voice",
    slot: "goals",
    field: "audio_goals_url",
    eyebrow: "08 — Where you're going",
    prompt: "Where do you want to be 12 months from now?",
    hint: "Revenue, team size, lifestyle. Out loud.",
  },
  {
    type: "upload",
    eyebrow: "09 — Last step",
    title: "Anything we should have?",
    hint:
      "Upload your price sheet, services menu, intake form, or anything else " +
      "you'd hand a new customer. Then leave a final voice note for anything " +
      "we missed.",
  },
]

interface UploadItem {
  id: string
  url: string
  name?: string
  type?: string
  size?: number
}

type AudioMap = Partial<Record<AudioField, string>>
type TranscriptMap = Partial<Record<Slot, string>>

export default function IntakePage({
  params,
}: {
  params: Promise<{ invitationId: string }>
}) {
  const { invitationId } = use(params)
  const router = useRouter()
  const [invitation, setInvitation] = useState<Invitation | null>(null)
  const [stepIndex, setStepIndex] = useState(0)
  const [audios, setAudios] = useState<AudioMap>({})
  const [transcripts, setTranscripts] = useState<TranscriptMap>({})
  const [uploads, setUploads] = useState<UploadItem[]>([])
  const [savingFinal, setSavingFinal] = useState(false)
  const [done, setDone] = useState(false)

  useEffect(() => {
    let cancelled = false
    getInvitationById(invitationId).then((inv) => {
      if (!cancelled) setInvitation(inv)
    })
    fetch(`/api/portal/intakes/uploads?invitation_id=${encodeURIComponent(invitationId)}`)
      .then((r) => (r.ok ? r.json() : { uploads: [] }))
      .then((j: { uploads?: Array<{ id: string; file_url: string; file_name?: string; content_type?: string; size_bytes?: number }> }) => {
        if (cancelled || !j.uploads) return
        setUploads(
          j.uploads.map((u) => ({
            id: u.id,
            url: u.file_url,
            name: u.file_name,
            type: u.content_type,
            size: u.size_bytes,
          })),
        )
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [invitationId])

  async function persist(
    status: "in_progress" | "completed",
    overrides?: AudioMap,
  ) {
    const a = { ...audios, ...(overrides ?? {}) }
    await fetch("/api/portal/intakes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        invitation_id: invitationId,
        ...a,
        status,
      }),
    }).catch(() => {})
  }

  function handleAudio(slot: Slot, field: AudioField, url: string, transcript?: string) {
    const nextAudios = { ...audios, [field]: url }
    setAudios(nextAudios)
    if (transcript) setTranscripts((t) => ({ ...t, [slot]: transcript }))
    void persist("in_progress", { [field]: url })
  }

  function next() {
    if (stepIndex < STEPS.length - 1) setStepIndex((i) => i + 1)
    else finish()
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

  const step = STEPS[stepIndex]
  const totalAnswered =
    STEPS.filter((s) => s.type === "voice").filter((s) =>
      s.type === "voice" ? audios[s.field] : false,
    ).length + (uploads.length > 0 || audios.audio_notes_url ? 1 : 0)
  const progress = done
    ? 100
    : ((stepIndex + (isStepDone(step, audios, uploads) ? 1 : 0)) / STEPS.length) * 100

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
              {String(stepIndex + 1).padStart(2, "0")} / {String(STEPS.length).padStart(2, "0")}
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
            <DoneCard invitation={invitation} onClose={() => router.push("/")} />
          ) : step.type === "voice" ? (
            <QuestionCard
              q={step}
              audioUrl={audios[step.field]}
              transcript={transcripts[step.slot]}
              invitationId={invitationId}
              onAudio={(url, transcript) =>
                handleAudio(step.slot, step.field, url, transcript)
              }
              onNext={next}
              onPrev={stepIndex > 0 ? prev : undefined}
              isLast={stepIndex === STEPS.length - 1}
              saving={savingFinal}
            />
          ) : (
            <UploadCard
              step={step}
              invitationId={invitationId}
              uploads={uploads}
              setUploads={setUploads}
              notesAudioUrl={audios.audio_notes_url}
              notesTranscript={transcripts.notes}
              onNotesAudio={(url, transcript) =>
                handleAudio("notes", "audio_notes_url", url, transcript)
              }
              onPrev={prev}
              onFinish={finish}
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

function isStepDone(step: Step, audios: AudioMap, uploads: UploadItem[]): boolean {
  if (step.type === "voice") return Boolean(audios[step.field])
  return uploads.length > 0 || Boolean(audios.audio_notes_url)
}

/* ─────────────────────────── Voice card ─────────────────────────── */

function QuestionCard({
  q,
  audioUrl,
  transcript,
  invitationId,
  onAudio,
  onNext,
  onPrev,
  isLast,
  saving,
}: {
  q: VoiceQuestion
  audioUrl?: string
  transcript?: string
  invitationId: string
  onAudio: (url: string, transcript?: string) => void
  onNext: () => void
  onPrev?: () => void
  isLast: boolean
  saving: boolean
}) {
  return (
    <div className="space-y-7 text-center">
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
            fontSize: "clamp(26px, 6.5vw, 36px)",
          }}
        >
          {q.prompt}
        </h1>
        <p
          className="text-[13px] leading-relaxed pt-1 px-2"
          style={{ color: "rgba(255,214,156,0.6)", fontWeight: 500 }}
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

      {transcript && <TranscriptPreview text={transcript} />}

      <div className="flex items-center justify-between gap-3 pt-1">
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

/* ─────────────────────────── Upload card ─────────────────────────── */

function UploadCard({
  step,
  invitationId,
  uploads,
  setUploads,
  notesAudioUrl,
  notesTranscript,
  onNotesAudio,
  onPrev,
  onFinish,
  saving,
}: {
  step: UploadStep
  invitationId: string
  uploads: UploadItem[]
  setUploads: (u: UploadItem[]) => void
  notesAudioUrl?: string
  notesTranscript?: string
  onNotesAudio: (url: string, transcript?: string) => void
  onPrev: () => void
  onFinish: () => void
  saving: boolean
}) {
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return
    setUploading(true)
    try {
      const newOnes: UploadItem[] = []
      for (const file of Array.from(files)) {
        const form = new FormData()
        form.append("file", file)
        form.append("invitation_id", invitationId)
        const r = await fetch("/api/portal/intakes/uploads", {
          method: "POST",
          body: form,
        })
        if (!r.ok) {
          console.error(`upload failed for ${file.name}`)
          continue
        }
        const j = (await r.json()) as UploadItem
        newOnes.push(j)
      }
      setUploads([...newOnes, ...uploads])
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ""
    }
  }

  return (
    <div className="space-y-7">
      <div className="text-center space-y-2">
        <p
          className="bebas text-[11px] tracking-[0.4em] uppercase"
          style={{ color: "#B68039" }}
        >
          {step.eyebrow}
        </p>
        <h1
          className="bebas tracking-[0.04em] leading-[1.05]"
          style={{
            color: "#E4AF7A",
            fontSize: "clamp(28px, 7vw, 38px)",
          }}
        >
          {step.title}
        </h1>
        <p
          className="text-[13px] leading-relaxed pt-1 px-2"
          style={{ color: "rgba(255,214,156,0.6)", fontWeight: 500 }}
        >
          {step.hint}
        </p>
      </div>

      <div className="space-y-3">
        <input
          ref={fileInputRef}
          type="file"
          multiple
          onChange={(e) => handleFiles(e.target.files)}
          className="hidden"
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="w-full flex items-center justify-center gap-3 py-5 rounded-lg transition active:scale-[0.99]"
          style={{
            background: "rgba(182,128,57,0.08)",
            border: "1px dashed rgba(228,175,122,0.5)",
            color: "#E4AF7A",
          }}
        >
          <Upload className="h-5 w-5" strokeWidth={1.75} />
          <span className="bebas text-[14px] tracking-[0.25em] uppercase">
            {uploading ? "Uploading…" : "Add files"}
          </span>
        </button>

        {uploads.length > 0 && (
          <ul className="space-y-2">
            {uploads.map((u) => (
              <li
                key={u.id}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg"
                style={{
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(182,128,57,0.2)",
                }}
              >
                <FileText
                  className="h-4 w-4 shrink-0"
                  style={{ color: "#B68039" }}
                  strokeWidth={1.75}
                />
                <a
                  href={u.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[13px] flex-1 truncate underline-offset-2 hover:underline"
                  style={{ color: "#FFE8C7", fontWeight: 600 }}
                >
                  {u.name || "File"}
                </a>
                {typeof u.size === "number" && (
                  <span
                    className="text-[11px] bebas tracking-[0.2em] uppercase shrink-0"
                    style={{ color: "rgba(255,214,156,0.5)" }}
                  >
                    {formatSize(u.size)}
                  </span>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div
        className="space-y-4 pt-2 border-t"
        style={{ borderColor: "rgba(182,128,57,0.18)" }}
      >
        <div className="text-center pt-4 space-y-1">
          <p
            className="bebas text-[11px] tracking-[0.4em] uppercase"
            style={{ color: "#B68039" }}
          >
            Anything we missed
          </p>
          <p
            className="text-[13px] leading-relaxed px-2"
            style={{ color: "rgba(255,214,156,0.6)", fontWeight: 500 }}
          >
            One last voice note. Anything important we didn't ask about.
          </p>
        </div>

        <Recorder
          invitationId={invitationId}
          slot="notes"
          currentUrl={notesAudioUrl}
          onUploaded={onNotesAudio}
          compact
        />

        {notesTranscript && <TranscriptPreview text={notesTranscript} />}
      </div>

      <div className="flex items-center justify-between gap-3 pt-1">
        <button
          onClick={onPrev}
          className="bebas text-[12px] tracking-[0.25em] uppercase flex items-center gap-2 px-3 py-2 rounded transition"
          style={{ color: "rgba(255,214,156,0.55)" }}
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>

        <button
          onClick={onFinish}
          disabled={saving}
          className="bebas text-[14px] tracking-[0.25em] uppercase flex items-center gap-2 px-6 py-3 rounded transition disabled:opacity-50"
          style={{
            background: "#B68039",
            color: "#FFFFFF",
            border: "1px solid #B68039",
          }}
        >
          {saving ? "Saving…" : "Finish"}
          {!saving && <Check className="h-4 w-4" />}
        </button>
      </div>
    </div>
  )
}

function formatSize(n: number): string {
  if (n < 1024) return `${n} b`
  if (n < 1024 * 1024) return `${Math.round(n / 1024)} kb`
  return `${(n / (1024 * 1024)).toFixed(1)} mb`
}

/* ─────────────────────────── Transcript preview ─────────────────────────── */

function TranscriptPreview({ text }: { text: string }) {
  const [open, setOpen] = useState(false)
  const short = text.length > 220 ? text.slice(0, 220).trimEnd() + "…" : text
  return (
    <div
      className="text-left mx-auto max-w-sm rounded-lg p-3.5"
      style={{
        background: "rgba(255,255,255,0.04)",
        border: "1px solid rgba(182,128,57,0.2)",
      }}
    >
      <div className="flex items-center justify-between mb-2">
        <p
          className="bebas text-[10px] tracking-[0.3em] uppercase"
          style={{ color: "#B68039" }}
        >
          Transcript
        </p>
        {text.length > 220 && (
          <button
            onClick={() => setOpen((v) => !v)}
            className="bebas text-[10px] tracking-[0.25em] uppercase"
            style={{ color: "rgba(255,214,156,0.55)" }}
          >
            {open ? "Less" : "More"}
          </button>
        )}
      </div>
      <p
        className="text-[12.5px] leading-relaxed"
        style={{ color: "rgba(255,232,199,0.85)", fontWeight: 500 }}
      >
        {open ? text : short}
      </p>
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
        style={{ background: "#B68039", color: "#FFFFFF" }}
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
  compact,
}: {
  invitationId: string
  slot: string
  currentUrl?: string
  onUploaded: (url: string, transcript?: string) => void
  compact?: boolean
}) {
  const [recording, setRecording] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [elapsedSec, setElapsedSec] = useState(0)
  const [previewUrl, setPreviewUrl] = useState<string | undefined>(currentUrl)
  const recorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const timerRef = useRef<number | null>(null)
  const MAX_SEC = 120

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
      const { url, transcript } = (await r.json()) as { url: string; transcript?: string }
      setPreviewUrl(url)
      onUploaded(url, transcript)
    } catch (err) {
      console.error(err)
      alert("Upload failed. Please try again.")
    } finally {
      setUploading(false)
    }
  }

  const mmss = `${Math.floor(elapsedSec / 60)}:${String(elapsedSec % 60).padStart(2, "0")}`
  const remaining = MAX_SEC - elapsedSec
  const size = compact ? 24 : 32

  return (
    <div className="flex flex-col items-center gap-4">
      {!recording && !uploading && !previewUrl && (
        <button
          onClick={start}
          className="relative rounded-full flex items-center justify-center transition active:scale-95"
          style={{
            height: size * 4,
            width: size * 4,
            background:
              "radial-gradient(circle at 30% 30%, #E4AF7A 0%, #B68039 55%, #543C1C 100%)",
            boxShadow: "0 12px 40px rgba(182,128,57,0.45), 0 0 0 1px rgba(228,175,122,0.25) inset",
          }}
          aria-label="Start recording"
        >
          <span
            className="absolute inset-0 rounded-full"
            style={{ border: "1px solid rgba(228,175,122,0.4)" }}
          />
          <Mic
            className="text-white"
            style={{ height: size * 1.4, width: size * 1.4 }}
            strokeWidth={1.75}
          />
        </button>
      )}

      {recording && (
        <button
          onClick={stop}
          className="relative rounded-full flex items-center justify-center transition active:scale-95"
          style={{
            height: size * 4,
            width: size * 4,
            background: "#B68039",
            boxShadow: "0 0 0 8px rgba(182,128,57,0.18), 0 0 0 16px rgba(182,128,57,0.08)",
          }}
          aria-label="Stop recording"
        >
          <span
            className="absolute inset-0 rounded-full animate-ping"
            style={{ background: "rgba(182,128,57,0.25)" }}
          />
          <Square
            className="fill-white text-white"
            style={{ height: size * 1.2, width: size * 1.2 }}
            strokeWidth={0}
          />
        </button>
      )}

      {uploading && (
        <div
          className="rounded-full flex items-center justify-center"
          style={{
            height: size * 4,
            width: size * 4,
            background: "rgba(182,128,57,0.15)",
            border: "1px solid #B68039",
          }}
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
          className="relative rounded-full flex items-center justify-center transition active:scale-95"
          style={{
            height: size * 4,
            width: size * 4,
            background: "rgba(182,128,57,0.12)",
            border: "1px solid rgba(228,175,122,0.5)",
          }}
          aria-label="Re-record"
        >
          <RotateCcw
            style={{ height: size * 1.2, width: size * 1.2, color: "#E4AF7A" }}
            strokeWidth={1.75}
          />
        </button>
      )}

      <div className="min-h-[40px] flex flex-col items-center gap-2">
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
            Tap to record · up to 2 min
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
