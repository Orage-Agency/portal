"use client"

import { use, useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { Mic, Square, Check, ArrowRight, ArrowLeft, SkipForward } from "lucide-react"
import { getInvitationById, type Invitation } from "@/lib/storage"

export const dynamic = "force-dynamic"

type StepId =
  | "welcome"
  | "basics"
  | "leads"
  | "voice-different"
  | "voice-customer"
  | "voice-goals"
  | "signals"
  | "done"

const STEPS: StepId[] = [
  "welcome",
  "basics",
  "leads",
  "voice-different",
  "voice-customer",
  "voice-goals",
  "signals",
  "done",
]

const TOOL_CHIPS = [
  "Square",
  "GoHighLevel",
  "QuickBooks",
  "Calendly",
  "Google Calendar",
  "Stripe",
  "Mailchimp",
  "Twilio",
  "HubSpot",
  "Other",
]

const HOURS_CHIPS = [
  "Mon–Fri 9–5",
  "Mon–Sat 8–6",
  "7 days 8–8",
  "24/7",
  "By appointment",
]

const TONE_CHIPS = [
  { id: "warm", label: "Warm + casual" },
  { id: "professional", label: "Professional" },
  { id: "nononsense", label: "No-nonsense" },
  { id: "friendly", label: "Friendly + curious" },
]

interface IntakeDraft {
  business_hours?: string
  service_area?: string
  services_pricing?: string
  tools_used?: string[]
  top_questions?: string
  agent_tone?: string
  disqualifiers?: string
  audio_intro_url?: string
  audio_different_url?: string
  audio_customer_url?: string
  audio_goals_url?: string
  upsell_signals?: {
    moreCallsWouldHelp?: boolean
    cantMeasureMarketing?: boolean
    teamUnderusesTools?: boolean
  }
}

export default function IntakePage({
  params,
}: {
  params: Promise<{ invitationId: string }>
}) {
  const { invitationId } = use(params)
  const router = useRouter()
  const [invitation, setInvitation] = useState<Invitation | null>(null)
  const [stepIndex, setStepIndex] = useState(0)
  const [draft, setDraft] = useState<IntakeDraft>({
    upsell_signals: {},
  })
  const [savingFinal, setSavingFinal] = useState(false)

  useEffect(() => {
    let cancelled = false
    getInvitationById(invitationId).then((inv) => {
      if (!cancelled) setInvitation(inv)
    })
    return () => {
      cancelled = true
    }
  }, [invitationId])

  function patch(p: Partial<IntakeDraft>) {
    setDraft((prev) => ({ ...prev, ...p }))
  }

  function next() {
    setStepIndex((i) => Math.min(i + 1, STEPS.length - 1))
  }

  function prev() {
    setStepIndex((i) => Math.max(i - 1, 0))
  }

  async function persistDraft(status: "in_progress" | "completed") {
    await fetch("/api/portal/intakes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        invitation_id: invitationId,
        business_hours: draft.business_hours,
        service_area: draft.service_area,
        services_pricing: draft.services_pricing,
        tools_used: draft.tools_used?.join(", "),
        top_questions: draft.top_questions,
        agent_tone: draft.agent_tone,
        disqualifiers: draft.disqualifiers,
        audio_intro_url: draft.audio_intro_url,
        audio_different_url: draft.audio_different_url,
        audio_customer_url: draft.audio_customer_url,
        audio_goals_url: draft.audio_goals_url,
        upsell_signals: draft.upsell_signals ? JSON.stringify(draft.upsell_signals) : undefined,
        status,
      }),
    })
  }

  async function finish() {
    setSavingFinal(true)
    try {
      await persistDraft("completed")
      next()
    } finally {
      setSavingFinal(false)
    }
  }

  const step = STEPS[stepIndex]
  const progress = ((stepIndex + 1) / STEPS.length) * 100

  return (
    <div className="min-h-screen bg-orage-black p-4 md:p-8 overflow-x-hidden">
      <div className="max-w-2xl mx-auto w-full">
        <img
          src="https://storage.googleapis.com/msgsndr/651kIrlKk834C2FEl66i/media/688a8bfb5a3e648018748f5e.png"
          alt="Orage AI Agency"
          className="h-12 md:h-14 mx-auto mb-6"
        />

        <div className="bg-white/5 backdrop-blur-sm border border-gold/20 rounded-lg p-4 md:p-8">
          {/* Progress bar */}
          <div className="mb-6">
            <div className="flex justify-between items-center mb-2">
              <span className="text-[10px] uppercase tracking-[0.18em] text-gold/70 font-mono">
                Setup · step {stepIndex + 1} / {STEPS.length}
              </span>
              {step !== "done" && step !== "welcome" && (
                <button
                  onClick={() => {
                    persistDraft("in_progress")
                    setStepIndex(STEPS.length - 1)
                  }}
                  className="text-[10px] uppercase tracking-[0.18em] text-white/40 hover:text-gold/80 font-mono transition"
                >
                  Skip the rest →
                </button>
              )}
            </div>
            <div className="h-1 bg-white/10 rounded-pill overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[#B68039] to-[#E4AF7A] transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Step body */}
          {step === "welcome" && (
            <WelcomeStep
              invitation={invitation}
              audioUrl={draft.audio_intro_url}
              onAudio={(url) => patch({ audio_intro_url: url })}
              invitationId={invitationId}
              onNext={next}
            />
          )}
          {step === "basics" && (
            <BasicsStep draft={draft} patch={patch} onNext={next} onPrev={prev} />
          )}
          {step === "leads" && (
            <LeadsStep draft={draft} patch={patch} onNext={next} onPrev={prev} />
          )}
          {step === "voice-different" && (
            <VoiceStep
              title="What makes you different?"
              prompt="In your own words — what makes your business different from competitors? 60 seconds max."
              slot="different"
              invitationId={invitationId}
              audioUrl={draft.audio_different_url}
              onAudio={(url) => patch({ audio_different_url: url })}
              onNext={next}
              onPrev={prev}
            />
          )}
          {step === "voice-customer" && (
            <VoiceStep
              title="Your ideal customer"
              prompt="Describe your ideal customer — their problems, the language they use, what they want."
              slot="customer"
              invitationId={invitationId}
              audioUrl={draft.audio_customer_url}
              onAudio={(url) => patch({ audio_customer_url: url })}
              onNext={next}
              onPrev={prev}
            />
          )}
          {step === "voice-goals" && (
            <VoiceStep
              title="Where do you want to be in 12 months?"
              prompt="What does winning look like by this time next year? Revenue, team size, lifestyle — say it out loud."
              slot="goals"
              invitationId={invitationId}
              audioUrl={draft.audio_goals_url}
              onAudio={(url) => patch({ audio_goals_url: url })}
              onNext={next}
              onPrev={prev}
            />
          )}
          {step === "signals" && (
            <SignalsStep
              draft={draft}
              patch={patch}
              onPrev={prev}
              onFinish={finish}
              saving={savingFinal}
            />
          )}
          {step === "done" && <DoneStep onClose={() => router.push("/")} />}
        </div>

        <p className="text-white/40 text-xs font-body text-center mt-6">
          All answers save automatically. You can close this and come back to finish later.
        </p>
      </div>
    </div>
  )
}

/* ─────────────────────────── Steps ─────────────────────────── */

function WelcomeStep({
  invitation,
  audioUrl,
  onAudio,
  invitationId,
  onNext,
}: {
  invitation: Invitation | null
  audioUrl?: string
  onAudio: (u: string) => void
  invitationId: string
  onNext: () => void
}) {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-[10px] uppercase tracking-[0.2em] text-gold/70 font-mono mb-2">
          01 — Welcome
        </p>
        <h1 className="font-heading text-2xl md:text-4xl text-gold mb-3 tracking-wider">
          You signed. Now let's build the agents.
        </h1>
        <p className="text-white/70 font-body leading-relaxed text-sm md:text-base">
          {invitation?.contact_name ? `Hey ${invitation.contact_name.split(" ")[0]} — ` : ""}
          this is the only setup you'll do. Three minutes of voice + a few quick taps. We turn
          your answers into a phone agent and chat agent tuned to <strong className="text-gold">{invitation?.business_name || "your business"}</strong>.
        </p>
      </div>

      <div className="bg-gradient-to-br from-[#B68039]/20 to-[#B68039]/5 border border-[#B68039]/40 rounded-lg p-6">
        <p className="text-[10px] uppercase tracking-[0.2em] text-gold/70 font-mono mb-3">
          First question · voice
        </p>
        <h3 className="text-white font-heading text-lg md:text-xl mb-4">
          In 60 seconds — what does your business do, and who's your ideal customer?
        </h3>
        <p className="text-white/60 text-sm font-body mb-4">
          Talk like you'd talk to a friend at a barbecue. No script. We'll do the rest.
        </p>
        <Recorder
          invitationId={invitationId}
          slot="intro"
          currentUrl={audioUrl}
          onUploaded={onAudio}
        />
      </div>

      <div className="flex justify-end">
        <button
          onClick={onNext}
          disabled={!audioUrl}
          className="bg-gradient-to-r from-[#B68039] to-[#8B6028] hover:from-[#9B6A2F] hover:to-[#7A5222] text-white font-heading text-base md:text-lg px-6 py-3 rounded-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
        >
          Continue <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}

function BasicsStep({
  draft,
  patch,
  onNext,
  onPrev,
}: {
  draft: IntakeDraft
  patch: (p: Partial<IntakeDraft>) => void
  onNext: () => void
  onPrev: () => void
}) {
  function toggleTool(t: string) {
    const current = new Set(draft.tools_used ?? [])
    if (current.has(t)) current.delete(t)
    else current.add(t)
    patch({ tools_used: Array.from(current) })
  }
  return (
    <div className="space-y-6">
      <div>
        <p className="text-[10px] uppercase tracking-[0.2em] text-gold/70 font-mono mb-2">
          02 — The basics
        </p>
        <h2 className="font-heading text-2xl md:text-3xl text-gold tracking-wider mb-1">
          Quick facts
        </h2>
        <p className="text-white/60 text-sm font-body">
          So the agent answers your phone, not someone else's.
        </p>
      </div>

      <Field label="Business hours">
        <Chips
          options={HOURS_CHIPS}
          selected={draft.business_hours}
          onSelect={(v) => patch({ business_hours: v })}
        />
        {draft.business_hours === "Custom" && (
          <input
            placeholder="e.g. Tue–Sat 7am–7pm, Sun closed"
            onChange={(e) => patch({ business_hours: e.target.value })}
            className="mt-2 w-full bg-white/5 border border-white/20 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-gold/50"
          />
        )}
      </Field>

      <Field label="Service area">
        <input
          value={draft.service_area ?? ""}
          onChange={(e) => patch({ service_area: e.target.value })}
          placeholder="e.g. Oklahoma City + 30 miles · Mobile only"
          className="w-full bg-white/5 border border-white/20 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-gold/50"
        />
      </Field>

      <Field
        label="Your services + starting prices"
        hint="One per line. STACY uses this to give callers a real answer to 'how much?'"
      >
        <textarea
          rows={4}
          value={draft.services_pricing ?? ""}
          onChange={(e) => patch({ services_pricing: e.target.value })}
          placeholder={`Full detail — $150\nPaint correction — from $400\nCeramic coating — from $800`}
          className="w-full bg-white/5 border border-white/20 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-gold/50"
        />
      </Field>

      <Field label="Tools you already use (tap all that apply)">
        <div className="flex flex-wrap gap-2">
          {TOOL_CHIPS.map((t) => {
            const on = draft.tools_used?.includes(t)
            return (
              <button
                key={t}
                onClick={() => toggleTool(t)}
                className={`px-3 py-1.5 rounded-pill text-xs font-mono uppercase tracking-wider transition border ${
                  on
                    ? "bg-gold/20 border-gold/60 text-gold"
                    : "bg-white/5 border-white/15 text-white/70 hover:border-gold/30"
                }`}
              >
                {t}
              </button>
            )
          })}
        </div>
      </Field>

      <NavRow onPrev={onPrev} onNext={onNext} canNext={true} />
    </div>
  )
}

function LeadsStep({
  draft,
  patch,
  onNext,
  onPrev,
}: {
  draft: IntakeDraft
  patch: (p: Partial<IntakeDraft>) => void
  onNext: () => void
  onPrev: () => void
}) {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-[10px] uppercase tracking-[0.2em] text-gold/70 font-mono mb-2">
          03 — Lead handling
        </p>
        <h2 className="font-heading text-2xl md:text-3xl text-gold tracking-wider mb-1">
          How should STACY screen them?
        </h2>
        <p className="text-white/60 text-sm font-body">
          Tells the agent who to qualify in, who to filter out, and how to sound.
        </p>
      </div>

      <Field
        label="Top 3-5 questions clients always ask"
        hint="Pre-loaded into the agent so it answers them like you would."
      >
        <textarea
          rows={4}
          value={draft.top_questions ?? ""}
          onChange={(e) => patch({ top_questions: e.target.value })}
          placeholder={`What's your pricing?\nHow long does it take?\nDo you come to me?\nWhat areas do you serve?`}
          className="w-full bg-white/5 border border-white/20 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-gold/50"
        />
      </Field>

      <Field label="What's a NO? (the disqualifier)" hint="STACY won't book these.">
        <textarea
          rows={3}
          value={draft.disqualifiers ?? ""}
          onChange={(e) => patch({ disqualifiers: e.target.value })}
          placeholder={`Outside service area\nUnder $X budget\nWrong vehicle type`}
          className="w-full bg-white/5 border border-white/20 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-gold/50"
        />
      </Field>

      <Field label="How should the agent talk?">
        <div className="grid grid-cols-2 gap-2">
          {TONE_CHIPS.map((t) => {
            const on = draft.agent_tone === t.id
            return (
              <button
                key={t.id}
                onClick={() => patch({ agent_tone: t.id })}
                className={`px-3 py-2 rounded text-sm font-body transition border ${
                  on
                    ? "bg-gold/20 border-gold/60 text-gold"
                    : "bg-white/5 border-white/15 text-white/70 hover:border-gold/30"
                }`}
              >
                {t.label}
              </button>
            )
          })}
        </div>
      </Field>

      <NavRow onPrev={onPrev} onNext={onNext} canNext={true} />
    </div>
  )
}

function VoiceStep({
  title,
  prompt,
  slot,
  invitationId,
  audioUrl,
  onAudio,
  onNext,
  onPrev,
}: {
  title: string
  prompt: string
  slot: string
  invitationId: string
  audioUrl?: string
  onAudio: (u: string) => void
  onNext: () => void
  onPrev: () => void
}) {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-[10px] uppercase tracking-[0.2em] text-gold/70 font-mono mb-2">
          Voice answer (optional · skippable)
        </p>
        <h2 className="font-heading text-2xl md:text-3xl text-gold tracking-wider mb-1">
          {title}
        </h2>
        <p className="text-white/70 font-body leading-relaxed text-sm md:text-base">
          {prompt}
        </p>
      </div>

      <Recorder
        invitationId={invitationId}
        slot={slot}
        currentUrl={audioUrl}
        onUploaded={onAudio}
      />

      <div className="flex justify-between items-center">
        <button
          onClick={onPrev}
          className="text-white/60 hover:text-white text-sm font-body flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>
        <div className="flex gap-3">
          <button
            onClick={onNext}
            className="text-white/60 hover:text-gold text-sm font-mono uppercase tracking-wider flex items-center gap-2"
          >
            Skip <SkipForward className="h-4 w-4" />
          </button>
          <button
            onClick={onNext}
            disabled={!audioUrl}
            className="bg-gradient-to-r from-[#B68039] to-[#8B6028] hover:from-[#9B6A2F] hover:to-[#7A5222] text-white font-heading px-5 py-2.5 rounded-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
          >
            Continue <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )
}

function SignalsStep({
  draft,
  patch,
  onPrev,
  onFinish,
  saving,
}: {
  draft: IntakeDraft
  patch: (p: Partial<IntakeDraft>) => void
  onPrev: () => void
  onFinish: () => void
  saving: boolean
}) {
  const signals = draft.upsell_signals ?? {}
  function set(key: keyof NonNullable<IntakeDraft["upsell_signals"]>, val: boolean) {
    patch({ upsell_signals: { ...signals, [key]: val } })
  }
  const QUESTIONS: Array<{ key: keyof NonNullable<IntakeDraft["upsell_signals"]>; label: string }> = [
    { key: "moreCallsWouldHelp", label: "We could handle 2× the calls if lead handling was better" },
    { key: "cantMeasureMarketing", label: "We struggle to know which marketing actually works" },
    { key: "teamUnderusesTools", label: "Our team doesn't really use the tools we already pay for" },
  ]

  return (
    <div className="space-y-6">
      <div>
        <p className="text-[10px] uppercase tracking-[0.2em] text-gold/70 font-mono mb-2">
          Last bit — 30 seconds
        </p>
        <h2 className="font-heading text-2xl md:text-3xl text-gold tracking-wider mb-1">
          Where are you right now?
        </h2>
        <p className="text-white/60 text-sm font-body">
          Helps us know what to surface in your weekly call.
        </p>
      </div>

      <div className="space-y-3">
        {QUESTIONS.map((q) => {
          const yes = signals[q.key] === true
          const no = signals[q.key] === false
          return (
            <div
              key={q.key}
              className="bg-white/5 border border-white/15 rounded-lg p-4 flex flex-col md:flex-row md:items-center justify-between gap-3"
            >
              <p className="text-white/85 font-body text-sm md:text-base flex-1">{q.label}</p>
              <div className="flex gap-2 shrink-0">
                <button
                  onClick={() => set(q.key, true)}
                  className={`px-4 py-2 rounded text-xs font-mono uppercase tracking-wider transition border ${
                    yes
                      ? "bg-gold/20 border-gold/60 text-gold"
                      : "bg-white/5 border-white/15 text-white/70 hover:border-gold/30"
                  }`}
                >
                  Yes
                </button>
                <button
                  onClick={() => set(q.key, false)}
                  className={`px-4 py-2 rounded text-xs font-mono uppercase tracking-wider transition border ${
                    no
                      ? "bg-white/15 border-white/40 text-white"
                      : "bg-white/5 border-white/15 text-white/70 hover:border-white/30"
                  }`}
                >
                  No
                </button>
              </div>
            </div>
          )
        })}
      </div>

      <div className="flex justify-between items-center pt-2">
        <button
          onClick={onPrev}
          className="text-white/60 hover:text-white text-sm font-body flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>
        <button
          onClick={onFinish}
          disabled={saving}
          className="bg-gradient-to-r from-[#B68039] to-[#8B6028] hover:from-[#9B6A2F] hover:to-[#7A5222] text-white font-heading text-base md:text-lg px-6 py-3 rounded-lg transition-all disabled:opacity-50 flex items-center gap-2"
        >
          {saving ? "Saving…" : "Finish setup"}
          <Check className="h-5 w-5" />
        </button>
      </div>
    </div>
  )
}

function DoneStep({ onClose }: { onClose: () => void }) {
  return (
    <div className="text-center py-6">
      <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-gold/20 border border-gold/40 mb-6">
        <Check className="h-8 w-8 text-gold" />
      </div>
      <h1 className="font-heading text-3xl md:text-4xl text-gold tracking-wider mb-3">
        That's it. You're in.
      </h1>
      <p className="text-white/70 font-body text-sm md:text-base max-w-md mx-auto mb-6 leading-relaxed">
        Your answers are saved. We'll have your first phone agent and CRM ready inside 48 hours.
        You'll get an email when it's live.
      </p>
      <p className="text-white/40 font-mono text-[11px] uppercase tracking-[0.2em] mb-8">
        Questions in the meantime · team@orage.agency
      </p>
      <button
        onClick={onClose}
        className="bg-white/10 hover:bg-white/20 text-white font-heading text-sm px-6 py-3 rounded transition"
      >
        Done
      </button>
    </div>
  )
}

/* ─────────────────────────── Helpers ─────────────────────────── */

function Field({
  label,
  hint,
  children,
}: {
  label: string
  hint?: string
  children: React.ReactNode
}) {
  return (
    <div className="space-y-2">
      <label className="block text-[10px] uppercase tracking-[0.18em] text-gold/80 font-mono">
        {label}
      </label>
      {hint && <p className="text-white/40 text-xs font-body leading-relaxed">{hint}</p>}
      {children}
    </div>
  )
}

function Chips({
  options,
  selected,
  onSelect,
}: {
  options: string[]
  selected?: string
  onSelect: (v: string) => void
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.concat("Custom").map((opt) => {
        const on = selected === opt
        return (
          <button
            key={opt}
            onClick={() => onSelect(opt)}
            className={`px-3 py-1.5 rounded-pill text-xs font-mono uppercase tracking-wider transition border ${
              on
                ? "bg-gold/20 border-gold/60 text-gold"
                : "bg-white/5 border-white/15 text-white/70 hover:border-gold/30"
            }`}
          >
            {opt}
          </button>
        )
      })}
    </div>
  )
}

function NavRow({
  onPrev,
  onNext,
  canNext,
}: {
  onPrev: () => void
  onNext: () => void
  canNext: boolean
}) {
  return (
    <div className="flex justify-between items-center pt-2">
      <button
        onClick={onPrev}
        className="text-white/60 hover:text-white text-sm font-body flex items-center gap-2"
      >
        <ArrowLeft className="h-4 w-4" />
        Back
      </button>
      <button
        onClick={onNext}
        disabled={!canNext}
        className="bg-gradient-to-r from-[#B68039] to-[#8B6028] hover:from-[#9B6A2F] hover:to-[#7A5222] text-white font-heading px-5 py-2.5 rounded-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
      >
        Continue <ArrowRight className="h-4 w-4" />
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
      alert("Microphone access denied. Click the lock icon in your browser address bar and allow microphone access.")
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
    <div className="flex flex-col items-center gap-4">
      {!recording && !uploading && (
        <button
          onClick={start}
          className="h-24 w-24 md:h-28 md:w-28 rounded-full bg-gradient-to-br from-[#B68039] to-[#8B6028] hover:from-[#9B6A2F] hover:to-[#7A5222] text-white shadow-xl shadow-[#B68039]/40 transition-all hover:scale-105 flex items-center justify-center"
          aria-label="Start recording"
        >
          <Mic className="h-10 w-10" />
        </button>
      )}
      {recording && (
        <button
          onClick={stop}
          className="h-24 w-24 md:h-28 md:w-28 rounded-full bg-red-500 hover:bg-red-600 text-white shadow-xl shadow-red-500/40 transition-all animate-pulse flex items-center justify-center"
          aria-label="Stop recording"
        >
          <Square className="h-8 w-8 fill-white" />
        </button>
      )}
      {uploading && (
        <div className="h-24 w-24 md:h-28 md:w-28 rounded-full bg-white/10 text-white flex items-center justify-center">
          <span className="text-xs font-mono uppercase tracking-wider">Saving…</span>
        </div>
      )}
      <div className="text-center">
        {recording && (
          <p className="text-white font-mono text-sm">
            <span className="text-red-400">● </span>
            Recording · {mmss}
            <span className="text-white/40"> · {remaining}s left</span>
          </p>
        )}
        {!recording && !uploading && !previewUrl && (
          <p className="text-white/50 font-mono text-xs uppercase tracking-wider">
            Tap to record · 60–90s
          </p>
        )}
        {!recording && previewUrl && (
          <div className="flex flex-col items-center gap-3">
            <p className="text-gold font-mono text-xs uppercase tracking-wider flex items-center gap-2">
              <Check className="h-4 w-4" /> Saved
            </p>
            <audio controls src={previewUrl} className="max-w-xs" />
            <button
              onClick={start}
              className="text-white/50 hover:text-gold font-mono text-[11px] uppercase tracking-wider transition"
            >
              Re-record
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
