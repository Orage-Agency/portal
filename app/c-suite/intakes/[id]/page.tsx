"use client"

import { use, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import {
  ArrowLeft,
  Mic,
  FileText,
  Download,
  Copy,
  Check,
  ExternalLink,
  AlertCircle,
  Send,
} from "lucide-react"
import { checkMasterAuth, MASTER_PASSWORD } from "@/lib/auth"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

export const dynamic = "force-dynamic"

const QUESTIONS: Array<{
  slot: string
  field: string
  transcriptField: string
  eyebrow: string
  prompt: string
}> = [
  { slot: "intro", field: "audio_intro_url", transcriptField: "transcript_intro", eyebrow: "01 — Who you are", prompt: "What does your business do, and who do you serve?" },
  { slot: "operations", field: "audio_operations_url", transcriptField: "transcript_operations", eyebrow: "02 — Hours · location", prompt: "When are you open, and where do you work?" },
  { slot: "different", field: "audio_different_url", transcriptField: "transcript_different", eyebrow: "03 — Pricing", prompt: "Services and what each one costs." },
  { slot: "booking", field: "audio_booking_url", transcriptField: "transcript_booking", eyebrow: "04 — Booking flow", prompt: "How you take a booking today." },
  { slot: "customer", field: "audio_customer_url", transcriptField: "transcript_customer", eyebrow: "05 — Yes vs no", prompt: "Perfect customer + hard NOs." },
  { slot: "faq", field: "audio_faq_url", transcriptField: "transcript_faq", eyebrow: "06 — Top questions", prompt: "Top 5 FAQ + verbatim answers." },
  { slot: "tone", field: "audio_tone_url", transcriptField: "transcript_tone", eyebrow: "07 — Voice of the agent", prompt: "One sentence in the agent's tone." },
  { slot: "goals", field: "audio_goals_url", transcriptField: "transcript_goals", eyebrow: "08 — Where you're going", prompt: "12-month goal." },
  { slot: "notes", field: "audio_notes_url", transcriptField: "transcript_notes", eyebrow: "09 — Anything missed", prompt: "Final voice note + any uploaded files." },
]

interface IntakeRow {
  invitation_id: string
  business_name?: string | null
  contact_name?: string | null
  client_email?: string | null
  status: string | null
  created_at: string | null
  updated_at: string | null
  [k: string]: unknown
}

interface UploadRow {
  id: string
  file_url: string
  file_name?: string | null
  content_type?: string | null
  size_bytes?: number | null
  created_at?: string | null
}

export default function IntakeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const [intake, setIntake] = useState<IntakeRow | null>(null)
  const [uploads, setUploads] = useState<UploadRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [copiedAll, setCopiedAll] = useState(false)
  const [showMissingReminder, setShowMissingReminder] = useState(false)

  useEffect(() => {
    setMounted(true)
    if (!checkMasterAuth()) {
      router.push("/")
      return
    }
    Promise.all([
      fetch(`/api/portal/intakes?invitation_id=${encodeURIComponent(id)}`, {
        headers: { "x-orage-auth": MASTER_PASSWORD },
      }).then(async (r) => {
        if (!r.ok) throw new Error(`intake fetch ${r.status}`)
        return (await r.json()) as { intakes?: IntakeRow[] }
      }),
      fetch(`/api/portal/intakes/uploads?invitation_id=${encodeURIComponent(id)}`).then(
        async (r) => {
          if (!r.ok) return { uploads: [] as UploadRow[] }
          return (await r.json()) as { uploads?: UploadRow[] }
        },
      ),
    ])
      .then(([intakeRes, uploadsRes]) => {
        const row = intakeRes.intakes?.[0] ?? null
        setIntake(row)
        setUploads(uploadsRes.uploads ?? [])
      })
      .catch((e) => setError(String((e as Error).message)))
      .finally(() => setLoading(false))
  }, [id, router])

  function copyAllTranscripts() {
    if (!intake) return
    const lines: string[] = [
      `Client intake — ${intake.business_name ?? id}`,
      intake.contact_name ? `Contact: ${intake.contact_name}` : "",
      intake.client_email ? `Email: ${intake.client_email}` : "",
      `Invitation ID: ${id}`,
      "",
    ]
    for (const q of QUESTIONS) {
      const transcript = intake[q.transcriptField] as string | null | undefined
      const audio = intake[q.field] as string | null | undefined
      lines.push(`### ${q.eyebrow}`)
      lines.push(q.prompt)
      lines.push("")
      lines.push(transcript ? transcript : "(no transcript yet)")
      if (audio) lines.push(`Audio: ${audio}`)
      lines.push("")
    }
    if (uploads.length > 0) {
      lines.push("### Uploaded files")
      for (const u of uploads) {
        lines.push(`- ${u.file_name ?? "file"} → ${u.file_url}`)
      }
    }
    navigator.clipboard.writeText(lines.join("\n"))
    setCopiedAll(true)
    setTimeout(() => setCopiedAll(false), 1800)
  }

  if (!mounted) return null

  return (
    <div className="min-h-screen bg-orage-black p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <Link
          href="/c-suite/intakes"
          className="text-gold hover:text-gold/80 mb-6 inline-flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          All intakes
        </Link>

        {loading && <p className="text-white/60 font-body">Loading…</p>}
        {error && <p className="text-red-400 font-body">Couldn't load: {error}</p>}

        {!loading && !intake && !error && (
          <div className="bg-white/5 border border-gold/20 rounded-lg p-8 text-center">
            <p className="text-white/70 font-body">
              No intake yet for this invitation. The client hasn't recorded
              anything.
            </p>
          </div>
        )}

        {intake && (
          <>
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-8">
              <div className="min-w-0">
                <p className="text-[10px] uppercase tracking-[0.3em] text-gold/70 font-mono mb-2">
                  Client intake
                </p>
                <h1 className="font-heading text-3xl md:text-4xl text-gold tracking-wider truncate">
                  {intake.business_name || intake.invitation_id}
                </h1>
                <p className="text-white/60 text-sm font-body mt-1.5">
                  {intake.contact_name ? `${intake.contact_name} · ` : ""}
                  {intake.client_email || intake.invitation_id}
                </p>
                <p className="text-white/40 text-xs font-mono mt-1 truncate">
                  ID {intake.invitation_id} ·{" "}
                  {intake.status === "completed" ? "Completed" : "In progress"} ·
                  Updated {fmtDate(intake.updated_at)}
                </p>
              </div>
              <div className="flex flex-col md:flex-row gap-2 self-start md:self-auto">
                {(() => {
                  const missing = QUESTIONS.filter(
                    (q) => !intake[q.field],
                  )
                  if (missing.length === 0) return null
                  return (
                    <button
                      onClick={() => setShowMissingReminder(true)}
                      className="inline-flex items-center gap-2 px-4 py-2.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/40 rounded-lg font-mono text-xs uppercase tracking-wider transition"
                      title={`${missing.length} of ${QUESTIONS.length} questions still empty`}
                    >
                      <AlertCircle className="h-4 w-4" />
                      Send Missing-Info Reminder ({missing.length})
                    </button>
                  )
                })()}
                <button
                  onClick={copyAllTranscripts}
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-gold/10 hover:bg-gold/20 text-gold border border-gold/40 rounded-lg font-mono text-xs uppercase tracking-wider transition"
                >
                  {copiedAll ? (
                    <>
                      <Check className="h-4 w-4" /> Copied
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4" /> Copy all
                    </>
                  )}
                </button>
              </div>
            </div>

            <div className="space-y-4">
              {QUESTIONS.map((q) => {
                const audio = intake[q.field] as string | null | undefined
                const transcript = intake[q.transcriptField] as string | null | undefined
                return (
                  <div
                    key={q.slot}
                    className="bg-white/5 backdrop-blur-sm border border-gold/20 rounded-lg p-5 md:p-6"
                  >
                    <p className="text-[10px] uppercase tracking-[0.3em] text-gold/70 font-mono mb-1.5">
                      {q.eyebrow}
                    </p>
                    <h3 className="font-heading text-lg md:text-xl text-white tracking-wide mb-4">
                      {q.prompt}
                    </h3>

                    {audio ? (
                      <div className="space-y-3">
                        <audio controls src={audio} className="w-full" preload="metadata" />
                        <div className="flex items-center gap-3 text-xs">
                          <a
                            href={audio}
                            download
                            className="inline-flex items-center gap-1.5 text-gold/80 hover:text-gold font-mono uppercase tracking-wider"
                          >
                            <Download className="h-3.5 w-3.5" /> Download
                          </a>
                          <a
                            href={audio}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 text-white/40 hover:text-white/70 font-mono uppercase tracking-wider"
                          >
                            <ExternalLink className="h-3.5 w-3.5" /> Open
                          </a>
                        </div>
                        {transcript ? (
                          <div className="mt-3 bg-black/30 border border-white/10 rounded-md p-4">
                            <p className="text-[10px] uppercase tracking-[0.3em] text-gold/70 font-mono mb-2">
                              Transcript
                            </p>
                            <p className="text-white/85 text-sm leading-relaxed whitespace-pre-wrap font-body">
                              {transcript}
                            </p>
                          </div>
                        ) : (
                          <p className="text-white/40 text-xs font-mono uppercase tracking-wider mt-2">
                            Transcript pending
                          </p>
                        )}
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-white/40 text-sm font-body">
                        <Mic className="h-4 w-4" />
                        Not recorded
                      </div>
                    )}
                  </div>
                )
              })}

              {uploads.length > 0 && (
                <div className="bg-white/5 backdrop-blur-sm border border-gold/20 rounded-lg p-5 md:p-6">
                  <p className="text-[10px] uppercase tracking-[0.3em] text-gold/70 font-mono mb-1.5">
                    Uploaded files
                  </p>
                  <h3 className="font-heading text-lg md:text-xl text-white tracking-wide mb-4">
                    Pricing docs · menus · extras
                  </h3>
                  <ul className="space-y-2">
                    {uploads.map((u) => (
                      <li
                        key={u.id}
                        className="flex items-center gap-3 px-3 py-2.5 bg-black/30 border border-white/10 rounded-md"
                      >
                        <FileText className="h-4 w-4 text-gold shrink-0" />
                        <a
                          href={u.file_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1 text-sm text-white hover:text-gold font-body truncate"
                        >
                          {u.file_name || "File"}
                        </a>
                        {typeof u.size_bytes === "number" && (
                          <span className="text-xs font-mono text-white/40 whitespace-nowrap">
                            {fmtSize(u.size_bytes)}
                          </span>
                        )}
                        <a
                          href={u.file_url}
                          download
                          className="text-gold/80 hover:text-gold"
                          aria-label="Download"
                        >
                          <Download className="h-4 w-4" />
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {intake && (
        <MissingReminderDialog
          open={showMissingReminder}
          onOpenChange={setShowMissingReminder}
          intake={intake}
        />
      )}
    </div>
  )
}

function MissingReminderDialog({
  open,
  onOpenChange,
  intake,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  intake: IntakeRow
}) {
  const [origin, setOrigin] = useState("")
  const [copied, setCopied] = useState<"link" | "message" | null>(null)

  useEffect(() => {
    if (typeof window !== "undefined") setOrigin(window.location.origin)
  }, [])

  const missing = QUESTIONS.filter((q) => !intake[q.field])
  const link = `${origin}/onboard/${intake.invitation_id}/intake`
  const firstName = intake.contact_name?.split(" ")[0] || "there"
  const bulletList = missing.map((q) => `  • ${q.eyebrow.replace(/^\d+\s*—\s*/, "")} — ${q.prompt}`).join("\n")
  const message =
    `Hey ${firstName} — quick follow-up on your Orage AI agent setup.\n\n` +
    `We still need your voice on the question${missing.length !== 1 ? "s" : ""} below so we can build STACY around the full picture:\n\n${bulletList}\n\n` +
    `Just tap the link and answer the ones marked unfinished — your earlier answers are already saved. Takes about a minute each.\n\n${link}\n\n— Orage AI Agency`

  function copy(kind: "link" | "message", text: string) {
    if (!text) return
    navigator.clipboard.writeText(text)
    setCopied(kind)
    setTimeout(() => setCopied(null), 1800)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-orage-black border border-amber-500/40 text-white max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-heading text-amber-300 tracking-wider text-xl flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            MISSING ANSWERS REMINDER
          </DialogTitle>
          <DialogDescription className="text-white/70 font-body">
            Nothing sent yet. Copy the link or message and forward it however you
            like. The intake link picks up where they left off — already-saved
            answers are preserved.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          <div>
            <p className="text-[10px] uppercase tracking-[0.25em] text-amber-300/80 font-mono mb-2">
              Still needed ({missing.length} of {QUESTIONS.length})
            </p>
            <ul className="space-y-1 bg-amber-500/5 border border-amber-500/20 rounded p-3">
              {missing.map((q) => (
                <li key={q.slot} className="text-[13px] text-white/80 font-body flex items-start gap-2">
                  <span className="text-amber-300/70 font-mono text-[11px] pt-0.5">{q.eyebrow.split(" — ")[0]}</span>
                  <span>{q.eyebrow.split(" — ")[1]}</span>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="text-[10px] uppercase tracking-[0.25em] text-amber-300/80 font-mono mb-2">
              Intake link (same as before)
            </p>
            <div className="flex items-stretch gap-2">
              <input
                readOnly
                value={link}
                onFocus={(e) => e.currentTarget.select()}
                className="flex-1 bg-white/5 border border-white/15 rounded px-3 py-2.5 text-sm text-white font-mono truncate focus:outline-none focus:border-amber-400/50"
              />
              <Button
                onClick={() => copy("link", link)}
                className="bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/40 px-3"
              >
                {copied === "link" ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
              <Button
                onClick={() => window.open(link, "_blank")}
                className="bg-white/5 hover:bg-white/10 text-white border border-white/15 px-3"
                aria-label="Preview"
              >
                <ExternalLink className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div>
            <p className="text-[10px] uppercase tracking-[0.25em] text-amber-300/80 font-mono mb-2">
              Pre-written nudge (names what's missing)
            </p>
            <textarea
              readOnly
              value={message}
              onFocus={(e) => e.currentTarget.select()}
              rows={9}
              className="w-full bg-white/5 border border-white/15 rounded px-3 py-2.5 text-sm text-white/90 font-body leading-relaxed resize-none focus:outline-none focus:border-amber-400/50"
            />
            <Button
              onClick={() => copy("message", message)}
              className="mt-2 w-full bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/40"
            >
              {copied === "message" ? (
                <>
                  <Check className="mr-2 h-4 w-4" /> Message copied
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" /> Copy reminder message
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function fmtDate(iso?: string | null): string {
  if (!iso) return "—"
  return new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

function fmtSize(n: number): string {
  if (n < 1024) return `${n} b`
  if (n < 1024 * 1024) return `${Math.round(n / 1024)} kb`
  return `${(n / (1024 * 1024)).toFixed(1)} mb`
}
