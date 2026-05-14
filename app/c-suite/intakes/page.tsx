"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Mic, FileText, Check, Clock } from "lucide-react"
import { checkMasterAuth, MASTER_PASSWORD } from "@/lib/auth"

export const dynamic = "force-dynamic"

const SLOTS = [
  "intro",
  "operations",
  "different",
  "booking",
  "customer",
  "faq",
  "tone",
  "goals",
  "notes",
] as const

interface IntakeRow {
  invitation_id: string
  business_name?: string | null
  contact_name?: string | null
  client_email?: string | null
  status: string | null
  updated_at: string | null
  created_at: string | null
  audio_intro_url?: string | null
  audio_operations_url?: string | null
  audio_different_url?: string | null
  audio_booking_url?: string | null
  audio_customer_url?: string | null
  audio_faq_url?: string | null
  audio_tone_url?: string | null
  audio_goals_url?: string | null
  audio_notes_url?: string | null
  transcript_intro?: string | null
  transcript_operations?: string | null
  transcript_different?: string | null
  transcript_booking?: string | null
  transcript_customer?: string | null
  transcript_faq?: string | null
  transcript_tone?: string | null
  transcript_goals?: string | null
  transcript_notes?: string | null
}

export default function IntakesListPage() {
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const [intakes, setIntakes] = useState<IntakeRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setMounted(true)
    if (!checkMasterAuth()) {
      router.push("/")
      return
    }
    fetch("/api/portal/intakes", { headers: { "x-orage-auth": MASTER_PASSWORD } })
      .then(async (r) => {
        if (!r.ok) throw new Error(`(${r.status})`)
        const j = (await r.json()) as { intakes?: IntakeRow[] }
        setIntakes(j.intakes ?? [])
      })
      .catch((e) => setError(String((e as Error).message)))
      .finally(() => setLoading(false))
  }, [router])

  if (!mounted) return null

  return (
    <div className="min-h-screen bg-orage-black p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <Link
          href="/c-suite/admin"
          className="text-gold hover:text-gold/80 mb-6 inline-flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to admin
        </Link>

        <div className="mb-8">
          <h1 className="font-heading text-3xl md:text-4xl text-gold tracking-wider">
            CLIENT INTAKES
          </h1>
          <p className="font-body text-white/60 mt-2 text-sm">
            Voice answers + transcripts + uploads from the agent-build flow.
          </p>
        </div>

        {loading && <p className="text-white/60 font-body">Loading…</p>}
        {error && (
          <p className="text-red-400 font-body">Failed to load intakes: {error}</p>
        )}

        {!loading && !error && intakes.length === 0 && (
          <div className="bg-white/5 border border-gold/20 rounded-lg p-8 text-center">
            <p className="text-white/70 font-body">
              No intakes yet. They'll appear here once a client opens the voice
              setup link from their contract email.
            </p>
          </div>
        )}

        {!loading && intakes.length > 0 && (
          <div className="space-y-3">
            {intakes.map((row) => {
              const recordings = SLOTS.filter(
                (s) => row[`audio_${s}_url` as keyof IntakeRow],
              ).length
              const transcripts = SLOTS.filter(
                (s) => row[`transcript_${s}` as keyof IntakeRow],
              ).length
              const isDone = row.status === "completed"
              return (
                <Link
                  key={row.invitation_id}
                  href={`/c-suite/intakes/${encodeURIComponent(row.invitation_id)}`}
                  className="block bg-white/5 hover:bg-white/[0.07] backdrop-blur-sm border border-gold/20 hover:border-gold/50 rounded-lg p-5 transition-all"
                >
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-1.5 flex-wrap">
                        <h2 className="font-heading text-lg text-white truncate">
                          {row.business_name || row.invitation_id}
                        </h2>
                        <StatusPill done={isDone} />
                      </div>
                      <p className="text-white/50 text-xs font-body">
                        {row.contact_name ? `${row.contact_name} · ` : ""}
                        {row.client_email || row.invitation_id}
                      </p>
                    </div>
                    <div className="flex items-center gap-5 text-xs">
                      <Stat icon={<Mic className="h-3.5 w-3.5" />} label={`${recordings}/9 recorded`} />
                      <Stat icon={<FileText className="h-3.5 w-3.5" />} label={`${transcripts} transcripts`} />
                      <Stat
                        icon={<Clock className="h-3.5 w-3.5" />}
                        label={fmtDate(row.updated_at || row.created_at)}
                      />
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

function StatusPill({ done }: { done: boolean }) {
  if (done) {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-[0.2em] text-gold font-mono px-2 py-0.5 rounded-pill bg-gold/15 border border-gold/40">
        <Check className="h-3 w-3" /> Completed
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-[0.2em] text-white/60 font-mono px-2 py-0.5 rounded-pill bg-white/5 border border-white/15">
      In progress
    </span>
  )
}

function Stat({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-white/60 font-mono uppercase tracking-wider whitespace-nowrap">
      <span className="text-gold/70">{icon}</span>
      {label}
    </span>
  )
}

function fmtDate(iso?: string | null): string {
  if (!iso) return "—"
  const d = new Date(iso)
  return d.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}
