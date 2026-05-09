"use client"

import Link from "next/link"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"

import { getClients, getClientLogins } from "@/lib/storage"

// Skip static generation - requires database access for client credentials
export const dynamic = "force-dynamic"

export default function ClientLoginPage() {
  const router = useRouter()
  const [clientId, setClientId] = useState("")
  const [email, setEmail] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    try {
      const clientLogins = await getClientLogins()
      const loginMatch = clientLogins.find(
        (login: any) => login.client_id === clientId && login.password.toLowerCase() === email.toLowerCase(),
      )

      if (loginMatch) {
        const allClients = await getClients()
        const clientData = allClients.find((c: any) => c.id === clientId)

        if (clientData) {
          localStorage.setItem("current_client", JSON.stringify(clientData))
          router.push("/portal/dashboard")
        } else {
          setError("Client data not found. Please contact support.")
        }
      } else {
        setError("Invalid Client ID or Email")
      }
    } catch (error) {
      console.error("[v0] Login error:", error)
      setError("An error occurred during login. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-orage-black flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        

        <div className="text-center mb-8">
          <img
            src="https://storage.googleapis.com/msgsndr/651kIrlKk834C2FEl66i/media/688a8bfb5a3e648018748f5e.png"
            alt="Orage AI Agency"
            className="h-16 mx-auto mb-6"
          />
          <h1 className="font-heading text-4xl text-gold mb-2">CLIENT PORTAL</h1>
          <p className="font-body text-white/70">Access your documents and information</p>
        </div>

        <div className="bg-white/5 backdrop-blur-sm border border-gold/20 rounded-lg p-8">
          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-white font-body mb-2">Client ID</label>
              <input
                type="text"
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
                className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-gold/50"
                placeholder="OAA-123456-ABC123"
                required
                disabled={isLoading}
              />
              <p className="text-white/40 text-xs mt-1">Use the Client ID provided during onboarding</p>
            </div>

            <div>
              <label className="block text-white font-body mb-2">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-gold/50"
                placeholder="your@email.com"
                required
                disabled={isLoading}
              />
            </div>

            {error && (
              <div className="bg-red-900/20 border border-red-500/50 rounded-lg p-4">
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-[#B68039] to-[#8B6028] hover:from-[#9B6A2F] hover:to-[#7A5222] text-white font-heading text-xl px-8 py-4 rounded-lg transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? "LOGGING IN..." : "LOGIN"}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
