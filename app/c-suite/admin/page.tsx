"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { checkMasterAuth, clearMasterAuth } from "@/lib/auth"
import Link from "next/link"
import { getNotifications } from "@/lib/storage"

// Skip static generation for this page - it requires client-side auth and database access
export const dynamic = "force-dynamic"

export default function AdminDashboard() {
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    setMounted(true)
    if (!checkMasterAuth()) {
      router.push("/")
    }

    async function loadNotifications() {
      const notifications = await getNotifications()
      const count = notifications.filter((n: any) => !n.read).length
      setUnreadCount(count)
    }
    loadNotifications()
  }, [router])

  const handleLogout = () => {
    clearMasterAuth()
    router.push("/")
  }

  if (!mounted) return null

  return (
    <div className="min-h-screen bg-orage-black p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 md:mb-12 gap-4 md:gap-0">
          <div>
            <img
              src="https://storage.googleapis.com/msgsndr/651kIrlKk834C2FEl66i/media/688a8bfb5a3e648018748f5e.png"
              alt="Orage AI Agency"
              className="h-12 md:h-16 mb-4"
            />
            <h1 className="font-heading text-4xl md:text-5xl text-gold">ORAGE CLIENT PORTAL</h1>
            <p className="font-body text-white/70 mt-2">Admin Dashboard</p>
          </div>
          <button
            onClick={handleLogout}
            className="w-full md:w-auto px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-all"
          >
            Logout
          </button>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          <Link
            href="/c-suite/invitations"
            className="bg-white/5 backdrop-blur-sm border border-gold/20 rounded-lg p-8 hover:border-gold/50 transition-all group"
          >
            <div className="text-gold text-4xl mb-4">+</div>
            <h3 className="font-heading text-2xl text-white mb-2 group-hover:text-gold transition-colors">
              CREATE INVITATION
            </h3>
            <p className="font-body text-white/60">Generate client onboarding link</p>
          </Link>

          <Link
            href="/c-suite/onboard"
            className="bg-white/5 backdrop-blur-sm border border-gold/20 rounded-lg p-8 hover:border-gold/50 transition-all group"
          >
            <div className="text-gold text-4xl mb-4">✓</div>
            <h3 className="font-heading text-2xl text-white mb-2 group-hover:text-gold transition-colors">
              DIRECT ONBOARD
            </h3>
            <p className="font-body text-white/60">Complete full onboarding process</p>
          </Link>

          <Link
            href="/c-suite/documents"
            className="bg-white/5 backdrop-blur-sm border border-gold/20 rounded-lg p-8 hover:border-gold/50 transition-all group"
          >
            <div className="text-gold text-4xl mb-4">📄</div>
            <h3 className="font-heading text-2xl text-white mb-2 group-hover:text-gold transition-colors">DOCUMENTS</h3>
            <p className="font-body text-white/60">View all client documents</p>
          </Link>

          <Link
            href="/c-suite/intakes"
            className="bg-white/5 backdrop-blur-sm border border-gold/20 rounded-lg p-8 hover:border-gold/50 transition-all group"
          >
            <div className="text-gold text-4xl mb-4">🎙</div>
            <h3 className="font-heading text-2xl text-white mb-2 group-hover:text-gold transition-colors">INTAKES</h3>
            <p className="font-body text-white/60">Voice answers + transcripts + uploads</p>
          </Link>

          <Link
            href="/c-suite/notifications"
            className="bg-white/5 backdrop-blur-sm border border-gold/20 rounded-lg p-8 hover:border-gold/50 transition-all group relative"
          >
            {unreadCount > 0 && (
              <div className="absolute top-4 right-4 bg-red-500 text-white text-xs font-bold px-2.5 py-1 rounded-full shadow-lg animate-pulse">
                {unreadCount}
              </div>
            )}
            <div className="text-gold text-4xl mb-4">🔔</div>
            <h3 className="font-heading text-2xl text-white mb-2 group-hover:text-gold transition-colors">
              NOTIFICATIONS
            </h3>
            <p className="font-body text-white/60">View client activity updates</p>
          </Link>
        </div>
      </div>
    </div>
  )
}
