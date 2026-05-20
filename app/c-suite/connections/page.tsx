"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Plug, Check } from "lucide-react"
import { checkMasterAuth, MASTER_PASSWORD } from "@/lib/auth"

export const dynamic = "force-dynamic"

interface AdminConnRow {
  id: string
  invitation_id: string
  provider: string
  status: string
  connected_at?: string | null
  last_used_at?: string | null
  provider_account_email?: string | null
  business_name?: string | null
  contact_name?: string | null
}

export default function ConnectionsListPage() {
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const [rows, setRows] = useState<AdminConnRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setMounted(true)
    if (!checkMasterAuth()) {
      router.push("/")
      return
    }
    fetch("/api/portal/connections/list", { headers: { "x-orage-auth": MASTER_PASSWORD } })
      .then(async (r) => {
        if (!r.ok) throw new Error(`(${r.status})`)
        return (await r.json()) as { connections: AdminConnRow[] }
      })
      .then((j) => setRows(j.connections ?? []))
      .catch((e) => setError(String((e as Error).message)))
      .finally(() => setLoading(false))
  }, [router])

  if (!mounted) return null

  // Group by invitation_id
  const groups = new Map<string, AdminConnRow[]>()
  for (const r of rows) {
    if (!groups.has(r.invitation_id)) groups.set(r.invitation_id, [])
    groups.get(r.invitation_id)!.push(r)
  }
  const sortedGroups = Array.from(groups.entries()).sort((a, b) => {
    const aMax = Math.max(...a[1].map((r) => new Date(r.last_used_at || r.connected_at || 0).getTime()))
    const bMax = Math.max(...b[1].map((r) => new Date(r.last_used_at || r.connected_at || 0).getTime()))
    return bMax - aMax
  })

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
          <h1 className="font-heading text-3xl md:text-4xl text-gold tracking-wider flex items-center gap-3">
            <Plug className="h-7 w-7" />
            CLIENT CONNECTIONS
          </h1>
          <p className="font-body text-white/60 mt-2 text-sm">
            OAuth + credential access each client has granted Orage. We store
            tokens encrypted in our DB and refresh through Nango automatically.
          </p>
        </div>

        {loading && <p className="text-white/60 font-body">Loading…</p>}
        {error && <p className="text-red-400 font-body">Failed: {error}</p>}

        {!loading && sortedGroups.length === 0 && (
          <div className="bg-white/5 border border-gold/20 rounded-lg p-8 text-center">
            <p className="text-white/70 font-body">
              No connections yet. Send a client the Connect link from any
              invitation row.
            </p>
          </div>
        )}

        {sortedGroups.length > 0 && (
          <div className="space-y-3">
            {sortedGroups.map(([invitationId, conns]) => {
              const first = conns[0]
              const connectedCount = conns.filter((c) => c.status === "connected").length
              return (
                <Link
                  key={invitationId}
                  href={`/c-suite/connections/${encodeURIComponent(invitationId)}`}
                  className="block bg-white/5 hover:bg-white/[0.07] backdrop-blur-sm border border-gold/20 hover:border-gold/50 rounded-lg p-5 transition-all"
                >
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <h2 className="font-heading text-lg text-white truncate">
                        {first.business_name || invitationId}
                      </h2>
                      <p className="text-white/50 text-xs font-body mt-0.5">
                        {first.contact_name ? `${first.contact_name} · ` : ""}
                        <span className="font-mono">{invitationId}</span>
                      </p>
                    </div>
                    <div className="flex items-center gap-3 flex-wrap">
                      {conns.map((c) => (
                        <span
                          key={c.provider}
                          className="inline-flex items-center gap-1 text-[10px] uppercase tracking-[0.2em] font-mono px-2 py-1 rounded-full"
                          style={
                            c.status === "connected"
                              ? {
                                  background: "rgba(182,128,57,0.15)",
                                  border: "1px solid rgba(182,128,57,0.5)",
                                  color: "#E4AF7A",
                                }
                              : {
                                  background: "rgba(255,255,255,0.04)",
                                  border: "1px solid rgba(255,255,255,0.12)",
                                  color: "rgba(255,255,255,0.5)",
                                }
                          }
                        >
                          {c.status === "connected" && <Check className="h-3 w-3" />}
                          {c.provider}
                        </span>
                      ))}
                      <span className="text-white/40 text-[11px] font-mono whitespace-nowrap">
                        {connectedCount} connected
                      </span>
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
