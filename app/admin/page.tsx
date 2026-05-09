"use client"

import type React from "react"

import { useRouter } from "next/navigation"
import { useState } from "react"
import { MASTER_PASSWORD, setMasterAuth } from "@/lib/auth"

export default function AdminLoginPage() {
  const router = useRouter()
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault()
    if (password === MASTER_PASSWORD) {
      setMasterAuth()
      router.push("/c-suite/admin")
    } else {
      setError("Incorrect password")
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
          <h1 className="font-heading text-4xl text-gold mb-2">ORAGE ADMIN PORTAL</h1>
          <p className="font-body text-white/70">Admin access to manage client onboarding</p>
        </div>

        <div className="bg-white/5 backdrop-blur-sm border border-gold/20 rounded-lg p-8">
          <form onSubmit={handleAdminLogin} className="space-y-6">
            <div>
              <label className="block text-white font-body mb-2">Master Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter master password"
                className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder:text-white/40 focus:outline-none focus:border-gold/50"
                required
              />
            </div>
            {error && (
              <div className="bg-red-900/20 border border-red-500/50 rounded-lg p-4">
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}
            <button
              type="submit"
              className="w-full gradient-button text-white font-heading text-xl px-8 py-4 rounded-lg"
            >
              ADMIN LOGIN
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
