"use client"

import { use, useEffect, useState } from "react"
import { Check, Loader2, Link2, AlertCircle, Globe } from "lucide-react"

export const dynamic = "force-dynamic"

const LOGO = "https://assets.cdn.filesafe.space/651kIrlKk834C2FEl66i/media/69b0c2eebfc81fb1ab616b02.png"

interface ConnectionState {
  provider_id: string
  label: string
  category: string
  kind: "oauth" | "app_password"
  use: string
  icon: string
  connected: boolean
  status: string
  provider_account_email?: string | null
  provider_account_label?: string | null
  connected_at?: string | null
}

export default function ConnectPage({
  params,
}: {
  params: Promise<{ invitationId: string }>
}) {
  const { invitationId } = use(params)
  const [connections, setConnections] = useState<ConnectionState[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [busyProvider, setBusyProvider] = useState<string | null>(null)
  const [wpFor, setWpFor] = useState<string | null>(null)

  async function refresh() {
    const r = await fetch(
      `/api/portal/connections/list?invitation_id=${encodeURIComponent(invitationId)}`,
    )
    if (!r.ok) throw new Error(`list ${r.status}`)
    const j = (await r.json()) as { connections: ConnectionState[] }
    setConnections(j.connections)
  }

  useEffect(() => {
    refresh()
      .catch((e) => setError(String((e as Error).message)))
      .finally(() => setLoading(false))
  }, [invitationId])

  async function connectOAuth(providerId: string) {
    setBusyProvider(providerId)
    setError(null)
    try {
      const r = await fetch(`/api/portal/connections/start`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invitation_id: invitationId, provider_id: providerId }),
      })
      const j = await r.json()
      if (!r.ok) throw new Error(j.error || `start ${r.status}`)

      // Launch Nango's hosted Connect modal. We load the SDK from CDN so we
      // don't need a build-time dep — keeps the bundle small. If the SDK
      // can't load (offline), we fall back to a manual error.
      const Nango = await loadNango()
      const result: { connectionId: string; providerConfigKey: string } = await new Promise(
        (resolve, reject) => {
          const nango = new Nango({ connectSessionToken: j.token })
          nango.openConnectUI({
            onEvent: (event: { type: string; payload?: Record<string, unknown> }) => {
              if (event.type === "close") reject(new Error("Connection cancelled"))
              if (event.type === "connect" && event.payload) {
                resolve({
                  connectionId: String(event.payload.connectionId),
                  providerConfigKey: String(event.payload.providerConfigKey),
                })
              }
            },
          })
        },
      )

      // Mirror the token into our DB
      const mirror = await fetch(`/api/portal/connections/mirror`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          invitation_id: invitationId,
          provider_id: providerId,
          nango_connection_id: result.connectionId,
        }),
      })
      const mj = await mirror.json()
      if (!mirror.ok) throw new Error(mj.error || `mirror ${mirror.status}`)
      await refresh()
    } catch (e) {
      setError(String((e as Error).message))
    } finally {
      setBusyProvider(null)
    }
  }

  async function disconnect(providerId: string) {
    setBusyProvider(providerId)
    setError(null)
    try {
      const r = await fetch(`/api/portal/connections/disconnect`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invitation_id: invitationId, provider_id: providerId }),
      })
      const j = await r.json()
      if (!r.ok) throw new Error(j.error || `disconnect ${r.status}`)
      await refresh()
    } catch (e) {
      setError(String((e as Error).message))
    } finally {
      setBusyProvider(null)
    }
  }

  const connected = connections.filter((c) => c.connected).length
  const total = connections.length

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

      <header className="px-5 pt-6 pb-3">
        <div className="max-w-2xl mx-auto w-full">
          <div className="flex items-center justify-center mb-4">
            <img src={LOGO} alt="Orage" className="h-7 w-auto opacity-90" />
          </div>
          <div className="text-center space-y-2">
            <p
              className="bebas text-[11px] tracking-[0.4em] uppercase"
              style={{ color: "#B68039" }}
            >
              Connect your tools
            </p>
            <h1
              className="bebas tracking-[0.04em] leading-[1.05]"
              style={{
                color: "#E4AF7A",
                fontSize: "clamp(28px, 7vw, 38px)",
              }}
            >
              One tap. We take it from here.
            </h1>
            <p
              className="text-[13.5px] leading-relaxed pt-1 px-2"
              style={{ color: "rgba(255,214,156,0.7)", fontWeight: 500 }}
            >
              For each tool you use, tap Connect. You'll sign in once through their
              own login screen — we never see your password — and that's it.
              Your STACY agent uses these connections automatically.
            </p>
          </div>
          <div className="mt-5 flex items-center gap-3 max-w-xs mx-auto">
            <span className="bebas text-[11px] tracking-[0.3em] uppercase" style={{ color: "#B68039" }}>
              {connected} / {total} connected
            </span>
            <div className="flex-1 h-[2px] rounded-full overflow-hidden" style={{ background: "rgba(182,128,57,0.15)" }}>
              <div
                className="h-full transition-all duration-500"
                style={{ background: "#B68039", width: `${total === 0 ? 0 : (connected / total) * 100}%` }}
              />
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 px-5 py-6">
        <div className="max-w-2xl mx-auto w-full">
          {loading && (
            <p className="text-center text-white/60 text-sm">Loading…</p>
          )}

          {error && (
            <div
              className="mb-5 px-4 py-3 rounded-lg flex items-start gap-3"
              style={{
                background: "rgba(239,68,68,0.08)",
                border: "1px solid rgba(239,68,68,0.35)",
              }}
            >
              <AlertCircle className="h-4 w-4 mt-0.5 text-red-400 shrink-0" />
              <p className="text-red-300 text-[13px] leading-relaxed flex-1">{error}</p>
            </div>
          )}

          <div className="space-y-3">
            {connections.map((c) => (
              <div
                key={c.provider_id}
                className="rounded-lg p-4 md:p-5 transition"
                style={{
                  background: c.connected ? "rgba(182,128,57,0.08)" : "rgba(255,255,255,0.03)",
                  border: c.connected
                    ? "1px solid rgba(182,128,57,0.45)"
                    : "1px solid rgba(255,255,255,0.08)",
                }}
              >
                <div className="flex items-start gap-4">
                  <div
                    className="flex items-center justify-center rounded-md shrink-0"
                    style={{
                      width: 44,
                      height: 44,
                      background: "rgba(255,255,255,0.04)",
                      border: "1px solid rgba(182,128,57,0.18)",
                      fontSize: 22,
                    }}
                    aria-hidden
                  >
                    {c.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3
                        className="bebas text-[18px] tracking-[0.05em] uppercase"
                        style={{ color: c.connected ? "#E4AF7A" : "#FFE8C7" }}
                      >
                        {c.label}
                      </h3>
                      {c.connected && (
                        <span
                          className="inline-flex items-center gap-1 text-[10px] uppercase tracking-[0.2em] font-mono px-2 py-0.5 rounded-full"
                          style={{
                            background: "rgba(182,128,57,0.18)",
                            border: "1px solid rgba(182,128,57,0.5)",
                            color: "#E4AF7A",
                          }}
                        >
                          <Check className="h-3 w-3" /> Connected
                        </span>
                      )}
                    </div>
                    <p
                      className="text-[12.5px] leading-relaxed mt-1"
                      style={{ color: "rgba(255,214,156,0.65)" }}
                    >
                      {c.use}
                    </p>
                    {c.connected && c.provider_account_email && (
                      <p className="text-[11px] font-mono mt-1.5" style={{ color: "rgba(255,232,199,0.5)" }}>
                        Signed in as {c.provider_account_email}
                      </p>
                    )}
                  </div>
                  <div className="shrink-0">
                    {c.kind === "oauth" ? (
                      <button
                        onClick={() => (c.connected ? disconnect(c.provider_id) : connectOAuth(c.provider_id))}
                        disabled={busyProvider === c.provider_id}
                        className="bebas text-[12px] tracking-[0.25em] uppercase px-4 py-2.5 rounded transition disabled:opacity-50 flex items-center gap-1.5"
                        style={
                          c.connected
                            ? {
                                background: "transparent",
                                color: "rgba(255,214,156,0.55)",
                                border: "1px solid rgba(255,255,255,0.15)",
                              }
                            : {
                                background: "#B68039",
                                color: "#FFFFFF",
                                border: "1px solid #B68039",
                              }
                        }
                      >
                        {busyProvider === c.provider_id ? (
                          <>
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            …
                          </>
                        ) : c.connected ? (
                          "Disconnect"
                        ) : (
                          <>
                            <Link2 className="h-3.5 w-3.5" /> Connect
                          </>
                        )}
                      </button>
                    ) : (
                      <button
                        onClick={() => setWpFor(c.connected ? null : c.provider_id)}
                        disabled={busyProvider === c.provider_id}
                        className="bebas text-[12px] tracking-[0.25em] uppercase px-4 py-2.5 rounded transition disabled:opacity-50 flex items-center gap-1.5"
                        style={
                          c.connected
                            ? {
                                background: "transparent",
                                color: "rgba(255,214,156,0.55)",
                                border: "1px solid rgba(255,255,255,0.15)",
                              }
                            : {
                                background: "#B68039",
                                color: "#FFFFFF",
                                border: "1px solid #B68039",
                              }
                        }
                      >
                        {c.connected ? "Update" : (
                          <>
                            <Globe className="h-3.5 w-3.5" /> Set up
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>

                {/* WordPress inline form */}
                {wpFor === c.provider_id && c.kind === "app_password" && (
                  <WordPressForm
                    invitationId={invitationId}
                    providerId={c.provider_id}
                    onDone={async () => {
                      setWpFor(null)
                      await refresh()
                    }}
                    onClose={() => setWpFor(null)}
                  />
                )}
              </div>
            ))}
          </div>

          <p className="text-center text-[11px] bebas tracking-[0.25em] uppercase mt-8" style={{ color: "rgba(255,214,156,0.4)" }}>
            We never see your passwords · revoke any time from the same page
          </p>
        </div>
      </main>

      <footer className="px-5 pb-6 pt-3">
        <p
          className="text-center text-[11px] bebas tracking-[0.25em] uppercase"
          style={{ color: "rgba(255,214,156,0.35)" }}
        >
          Questions · team@orage.agency
        </p>
      </footer>
    </div>
  )
}

function WordPressForm({
  invitationId,
  providerId,
  onDone,
  onClose,
}: {
  invitationId: string
  providerId: string
  onDone: () => void
  onClose: () => void
}) {
  const [site, setSite] = useState("")
  const [user, setUser] = useState("")
  const [pass, setPass] = useState("")
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  async function submit() {
    if (!site || !user || !pass) {
      setErr("All three fields required")
      return
    }
    setBusy(true)
    setErr(null)
    try {
      const r = await fetch(`/api/portal/connections/app-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          invitation_id: invitationId,
          provider_id: providerId,
          site_url: site.trim(),
          username: user.trim(),
          app_password: pass.trim(),
        }),
      })
      const j = await r.json()
      if (!r.ok) throw new Error(j.error || `save ${r.status}`)
      onDone()
    } catch (e) {
      setErr(String((e as Error).message))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div
      className="mt-4 pt-4 space-y-2"
      style={{ borderTop: "1px solid rgba(182,128,57,0.18)" }}
    >
      <p className="text-[11px] uppercase tracking-[0.25em] font-mono" style={{ color: "rgba(255,214,156,0.55)" }}>
        WordPress site + admin login (Application Password)
      </p>
      <input
        placeholder="Site URL  (e.g. https://yourbusiness.com)"
        value={site}
        onChange={(e) => setSite(e.target.value)}
        className="w-full bg-white/5 border border-white/15 rounded px-3 py-2.5 text-sm text-white focus:outline-none focus:border-gold/50"
      />
      <input
        placeholder="WordPress username"
        value={user}
        onChange={(e) => setUser(e.target.value)}
        className="w-full bg-white/5 border border-white/15 rounded px-3 py-2.5 text-sm text-white focus:outline-none focus:border-gold/50"
      />
      <input
        type="password"
        placeholder="Application Password (Users → Profile → Application Passwords)"
        value={pass}
        onChange={(e) => setPass(e.target.value)}
        className="w-full bg-white/5 border border-white/15 rounded px-3 py-2.5 text-sm text-white focus:outline-none focus:border-gold/50"
      />
      {err && <p className="text-red-400 text-[12px]">{err}</p>}
      <div className="flex gap-2 pt-1">
        <button
          onClick={onClose}
          className="flex-1 bebas text-[12px] tracking-[0.25em] uppercase px-4 py-2 rounded border border-white/15 text-white/70"
        >
          Cancel
        </button>
        <button
          onClick={submit}
          disabled={busy}
          className="flex-1 bebas text-[12px] tracking-[0.25em] uppercase px-4 py-2 rounded text-white disabled:opacity-50"
          style={{ background: "#B68039" }}
        >
          {busy ? "Saving…" : "Save"}
        </button>
      </div>
    </div>
  )
}

declare global {
  interface Window {
    Nango?: new (opts: { connectSessionToken: string }) => {
      openConnectUI: (cfg: { onEvent: (event: { type: string; payload?: Record<string, unknown> }) => void }) => void
    }
  }
}

async function loadNango(): Promise<NonNullable<Window["Nango"]>> {
  if (window.Nango) return window.Nango
  await new Promise<void>((resolve, reject) => {
    const s = document.createElement("script")
    s.src = "https://unpkg.com/@nangohq/frontend@latest/dist/index.umd.js"
    s.onload = () => resolve()
    s.onerror = () => reject(new Error("Could not load Nango SDK"))
    document.head.appendChild(s)
  })
  if (!window.Nango) throw new Error("Nango SDK loaded but global missing")
  return window.Nango
}
