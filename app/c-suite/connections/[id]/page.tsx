"use client"

import { use, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Plug, Check, Copy, ExternalLink, Link2 } from "lucide-react"
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

interface ProviderState {
  provider_id: string
  label: string
  category: string
  kind: string
  use: string
  icon: string
  connected: boolean
  status: string
  provider_account_email?: string | null
  connected_at?: string | null
  last_used_at?: string | null
}

export default function ConnectionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const [providers, setProviders] = useState<ProviderState[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showShare, setShowShare] = useState(false)

  useEffect(() => {
    setMounted(true)
    if (!checkMasterAuth()) {
      router.push("/")
      return
    }
    fetch(`/api/portal/connections/list?invitation_id=${encodeURIComponent(id)}`)
      .then(async (r) => {
        if (!r.ok) throw new Error(`(${r.status})`)
        return (await r.json()) as { connections: ProviderState[] }
      })
      .then((j) => setProviders(j.connections ?? []))
      .catch((e) => setError(String((e as Error).message)))
      .finally(() => setLoading(false))
  }, [id, router])

  if (!mounted) return null

  const connected = providers.filter((p) => p.connected)
  const pending = providers.filter((p) => !p.connected)

  return (
    <div className="min-h-screen bg-orage-black p-4 md:p-8">
      <div className="max-w-3xl mx-auto">
        <Link
          href="/c-suite/connections"
          className="text-gold hover:text-gold/80 mb-6 inline-flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          All connections
        </Link>

        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-8">
          <div className="min-w-0">
            <p className="text-[10px] uppercase tracking-[0.3em] text-gold/70 font-mono mb-2 flex items-center gap-2">
              <Plug className="h-3.5 w-3.5" />
              Client connections
            </p>
            <h1 className="font-heading text-3xl md:text-4xl text-gold tracking-wider truncate">
              {id}
            </h1>
            <p className="text-white/60 text-sm font-body mt-1.5">
              {connected.length} connected · {pending.length} not yet connected
            </p>
          </div>
          <button
            onClick={() => setShowShare(true)}
            className="self-start md:self-auto inline-flex items-center gap-2 px-4 py-2.5 bg-gold/10 hover:bg-gold/20 text-gold border border-gold/40 rounded-lg font-mono text-xs uppercase tracking-wider transition"
          >
            <Link2 className="h-4 w-4" />
            Get Connect Link
          </button>
        </div>

        {loading && <p className="text-white/60 font-body">Loading…</p>}
        {error && <p className="text-red-400 font-body">Failed: {error}</p>}

        {!loading && (
          <div className="space-y-4">
            {providers.map((p) => (
              <div
                key={p.provider_id}
                className="bg-white/5 border border-gold/20 rounded-lg p-5"
              >
                <div className="flex items-start gap-4">
                  <div
                    className="flex items-center justify-center rounded-md shrink-0"
                    style={{
                      width: 40,
                      height: 40,
                      background: "rgba(255,255,255,0.04)",
                      border: "1px solid rgba(182,128,57,0.2)",
                      fontSize: 20,
                    }}
                  >
                    {p.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-heading text-lg text-white tracking-wide">{p.label}</h3>
                      {p.connected ? (
                        <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-[0.2em] text-gold font-mono px-2 py-0.5 rounded-full bg-gold/15 border border-gold/40">
                          <Check className="h-3 w-3" /> Connected
                        </span>
                      ) : (
                        <span className="text-[10px] uppercase tracking-[0.2em] text-white/40 font-mono px-2 py-0.5 rounded-full border border-white/15">
                          Not connected
                        </span>
                      )}
                    </div>
                    <p className="text-white/55 text-[12.5px] mt-1">{p.use}</p>
                    {p.connected && p.provider_account_email && (
                      <p className="text-[11px] font-mono mt-1.5 text-white/40">
                        Signed in as {p.provider_account_email}
                      </p>
                    )}
                    {p.connected && p.connected_at && (
                      <p className="text-[11px] font-mono mt-0.5 text-white/30">
                        Connected {fmtDate(p.connected_at)}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <ConnectLinkDialog open={showShare} onOpenChange={setShowShare} invitationId={id} />
    </div>
  )
}

function ConnectLinkDialog({
  open,
  onOpenChange,
  invitationId,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  invitationId: string
}) {
  const [origin, setOrigin] = useState("")
  const [copied, setCopied] = useState<"link" | "message" | null>(null)

  useEffect(() => {
    if (typeof window !== "undefined") setOrigin(window.location.origin)
  }, [])

  const link = `${origin}/portal/connect/${invitationId}`
  const message =
    `Hey — quick last step for your Orage AI setup. Tap this link on your phone and connect the tools you use (Google, GoHighLevel, Stripe, etc.). One tap per tool, you sign in through their own login screen — we never see your password.\n\n${link}`

  function copy(kind: "link" | "message", text: string) {
    if (!text) return
    navigator.clipboard.writeText(text)
    setCopied(kind)
    setTimeout(() => setCopied(null), 1800)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-orage-black border border-gold/30 text-white max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-heading text-gold tracking-wider text-xl flex items-center gap-2">
            <Link2 className="h-5 w-5" /> CONNECT LINK
          </DialogTitle>
          <DialogDescription className="text-white/60 font-body">
            Nothing has been sent. Copy the link or share message and forward
            however you like. The link works on any device; mobile is best.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          <div>
            <p className="text-[10px] uppercase tracking-[0.25em] text-gold/70 font-mono mb-2">
              The link
            </p>
            <div className="flex items-stretch gap-2">
              <input
                readOnly
                value={link}
                onFocus={(e) => e.currentTarget.select()}
                className="flex-1 bg-white/5 border border-white/15 rounded px-3 py-2.5 text-sm text-white font-mono truncate focus:outline-none focus:border-gold/50"
              />
              <Button
                onClick={() => copy("link", link)}
                className="bg-gold/15 hover:bg-gold/25 text-gold border border-gold/40 px-3"
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
            <p className="text-[10px] uppercase tracking-[0.25em] text-gold/70 font-mono mb-2">
              Pre-written message
            </p>
            <textarea
              readOnly
              value={message}
              onFocus={(e) => e.currentTarget.select()}
              rows={6}
              className="w-full bg-white/5 border border-white/15 rounded px-3 py-2.5 text-sm text-white/90 font-body leading-relaxed resize-none focus:outline-none focus:border-gold/50"
            />
            <Button
              onClick={() => copy("message", message)}
              className="mt-2 w-full bg-gold/15 hover:bg-gold/25 text-gold border border-gold/40"
            >
              {copied === "message" ? (
                <>
                  <Check className="mr-2 h-4 w-4" /> Message copied
                </>
              ) : (
                <>
                  <Copy className="mr-2 h-4 w-4" /> Copy message
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}
