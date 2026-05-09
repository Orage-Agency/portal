"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { checkMasterAuth } from "@/lib/auth"
import { Bell, Check, Trash2, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  getNotifications,
  markNotificationRead,

// Skip static generation - requires client-side auth and database access
export const dynamic = "force-dynamic"
  deleteNotification as deleteNotificationFromStorage,
} from "@/lib/storage"

interface Notification {
  id: string
  type: "invitation_completed" | "info_updated" | "onboarding_completed"
  clientId: string
  clientName: string
  message: string
  timestamp: string
  read: boolean
}

export default function NotificationsPage() {
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])

  useEffect(() => {
    setMounted(true)
    if (!checkMasterAuth()) {
      router.push("/")
      return
    }
    loadNotifications()
  }, [router])

  const loadNotifications = async () => {
    const data = await getNotifications()
    console.log(
      "[v0] Loaded notifications with clientIds:",
      data.map((n: any) => ({ id: n.id, clientId: n.clientId, clientName: n.clientName })),
    )
    setNotifications(data as any)
  }

  const markAsRead = async (id: string) => {
    await markNotificationRead(id)
    await loadNotifications()
  }

  const markAllAsRead = async () => {
    for (const notif of notifications.filter((n) => !n.read)) {
      await markNotificationRead(notif.id)
    }
    await loadNotifications()
  }

  const deleteNotification = async (id: string) => {
    await deleteNotificationFromStorage(id)
    await loadNotifications()
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "onboarding_completed":
        return "✓"
      case "invitation_completed":
        return "📧"
      case "info_updated":
        return "✏️"
      default:
        return "📌"
    }
  }

  const getNotificationColor = (type: string) => {
    switch (type) {
      case "onboarding_completed":
        return "border-gold/50 bg-gold/10"
      case "invitation_completed":
        return "border-blue-500/50 bg-blue-500/10"
      case "info_updated":
        return "border-purple-500/50 bg-purple-500/10"
      default:
        return "border-white/20 bg-white/5"
    }
  }

  if (!mounted) return null

  const unreadCount = notifications.filter((n) => !n.read).length

  return (
    <div className="min-h-screen bg-orage-black p-4 md:p-8 overflow-x-hidden">
      <div className="max-w-4xl mx-auto">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8">
          <div className="w-full md:w-auto">
            <img
              src="https://storage.googleapis.com/msgsndr/651kIrlKk834C2FEl66i/media/688a8bfb5a3e648018748f5e.png"
              alt="Orage AI Agency"
              className="h-12 mb-4"
            />
            <h1 className="font-heading text-4xl md:text-5xl text-gold mb-2 break-words">NOTIFICATIONS</h1>
            <p className="text-white/70 font-body">
              {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount > 1 ? "s" : ""}` : "All caught up!"}
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
            <Button
              onClick={() => router.push("/c-suite/admin")}
              variant="outline"
              className="bg-white/5 border-white/10 text-white hover:bg-white/10 w-full sm:w-auto gradient-button"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Button>
            {unreadCount > 0 && (
              <Button
                onClick={markAllAsRead}
                className="bg-gold hover:bg-gold/90 text-black w-full sm:w-auto gradient-button"
              >
                <Check className="mr-2 h-4 w-4" />
                Mark All Read
              </Button>
            )}
          </div>
        </div>

        <div className="space-y-4">
          {notifications.length === 0 ? (
            <div className="bg-white/5 border border-white/10 rounded-lg p-12 text-center">
              <Bell className="h-16 w-16 text-white/20 mx-auto mb-4" />
              <p className="text-white/50 font-body">No notifications yet</p>
            </div>
          ) : (
            notifications.map((notif) => (
              <div
                key={notif.id}
                className={`border rounded-lg p-4 md:p-6 transition-all ${
                  notif.read ? "bg-white/5 border-white/10" : getNotificationColor(notif.type)
                }`}
              >
                <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
                  <div className="flex items-start gap-4 flex-1 min-w-0 w-full">
                    <div className="text-3xl flex-shrink-0">{getNotificationIcon(notif.type)}</div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-heading text-lg md:text-xl text-white mb-1 break-words">
                        {notif.clientName}
                      </h3>
                      <p className="text-white/80 font-body mb-2 break-words whitespace-pre-wrap">{notif.message}</p>
                      <p className="text-white/50 text-sm">{new Date(notif.timestamp).toLocaleString()}</p>
                      {notif.type === "onboarding_completed" && (
                        <Button
                          onClick={() => {
                            console.log("[v0] Navigating to client documents for:", notif.clientId)
                            if (!notif.clientId) {
                              console.error("[v0] ERROR: clientId is missing from notification:", notif)
                              alert("Client ID is missing. Please check the notification data.")
                              return
                            }
                            router.push(`/c-suite/documents/${notif.clientId}`)
                          }}
                          className="mt-3 bg-gold hover:bg-gold/90 text-black text-sm w-full sm:w-auto gradient-button"
                        >
                          View Client Documents
                        </Button>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2 self-end sm:self-start">
                    {!notif.read && (
                      <button
                        onClick={() => markAsRead(notif.id)}
                        className="p-2 hover:bg-white/10 rounded transition-all"
                        title="Mark as read"
                      >
                        <Check className="h-5 w-5 text-white/70" />
                      </button>
                    )}
                    <button
                      onClick={() => deleteNotification(notif.id)}
                      className="p-2 hover:bg-red-500/20 rounded transition-all"
                      title="Delete"
                    >
                      <Trash2 className="h-5 w-5 text-red-500/70" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
