"use client"

import { useRouter } from "next/navigation"

export default function HomePage() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-orage-black flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        <img
          src="https://storage.googleapis.com/msgsndr/651kIrlKk834C2FEl66i/media/688a8bfb5a3e648018748f5e.png"
          alt="Orage AI Agency"
          className="h-20 mx-auto mb-8"
        />
        <h1 className="font-heading text-5xl text-gold mb-4">ORAGE AI AGENCY</h1>
        <p className="font-body text-white/70 mb-10">Welcome to your client experience</p>
        
        <button
          onClick={() => router.push("/portal/login")}
          className="gradient-button text-white font-heading text-2xl px-12 py-5 rounded-lg"
        >
          ENTER CLIENT PORTAL
        </button>
      </div>
    </div>
  )
}
