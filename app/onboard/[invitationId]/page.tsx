"use client"

import type React from "react"
import { Download } from "lucide-react"
import { generateAndDownloadPDF } from "@/lib/pdf"
import { use, useEffect, useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { type ClientInvitation, type OnboardingData, OFFER_DEFAULTS } from "@/lib/types"
import MSATemplate from "@/components/c-suite/templates/MSATemplate"
import InvoiceTemplate from "@/components/c-suite/templates/InvoiceTemplate"
import WelcomeTemplate from "@/components/c-suite/templates/WelcomeTemplate"
import {
  saveClient,
  saveClientLogin,
  saveNotification,
  getInvitationById,
  completeInvitationPublic,
} from "@/lib/storage"

// Skip static generation - requires database access for dynamic invitation IDs
export const dynamic = "force-dynamic"

export default function ClientOnboardingPage({ params }: { params: Promise<{ invitationId: string }> }) {
  const resolvedParams = use(params)
  const router = useRouter()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [mounted, setMounted] = useState(false)
  const [invitation, setInvitation] = useState<ClientInvitation | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)
  const [isDrawing, setIsDrawing] = useState(false)
  const [hasSignature, setHasSignature] = useState(false)
  const [signature, setSignature] = useState<string | undefined>()
  const [contactName, setContactName] = useState("")
  const [email, setEmail] = useState("")
  const [termsAccepted, setTermsAccepted] = useState(false)
  const [completedClientId, setCompletedClientId] = useState("")
  const [completedEmail, setCompletedEmail] = useState("")

  useEffect(() => {
    setMounted(true)
    loadInvitation()
  }, [])

  const loadInvitation = async () => {
    setIsLoading(true)
    try {
      const found = await getInvitationById(resolvedParams.invitationId)
      if (!found) {
        alert("Invalid or expired invitation link")
        router.push("/")
        return
      }
      if (found.status === "pending") {
        setInvitation(found as ClientInvitation)
        if (found.contact_name) setContactName(found.contact_name)
        if (found.client_email) setEmail(found.client_email)
      } else if (found.status === "completed") {
        alert("This invitation has already been completed")
        router.push("/")
      }
    } catch (error) {
      console.error("[onboard] Error loading invitation:", error)
      alert("Error loading invitation. Please try again or contact support.")
    } finally {
      setIsLoading(false)
    }
  }

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    setIsDrawing(true)
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return
    const rect = canvas.getBoundingClientRect()
    const x = "touches" in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left
    const y = "touches" in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top
    ctx.beginPath()
    ctx.moveTo(x, y)
  }

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return
    const rect = canvas.getBoundingClientRect()
    const x = "touches" in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left
    const y = "touches" in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top
    ctx.lineTo(x, y)
    ctx.stroke()
  }

  const stopDrawing = () => {
    if (!isDrawing) return
    setIsDrawing(false)
    const canvas = canvasRef.current
    if (canvas) {
      setHasSignature(true)
      setSignature(canvas.toDataURL("image/png"))
    }
  }

  const clearSignature = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    setHasSignature(false)
    setSignature(undefined)
  }

  const downloadMSAPreview = async () => {
    if (invitation?.msa_pdf_data) {
      const byteCharacters = atob(invitation.msa_pdf_data)
      const byteNumbers = new Array(byteCharacters.length)
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i)
      }
      const byteArray = new Uint8Array(byteNumbers)
      const blob = new Blob([byteArray], { type: "application/pdf" })
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = `MSA_Agreement_${invitation?.business_name || "Document"}.pdf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
      return
    }
    const msaContent = getMSAContent()
    await generateAndDownloadPDF(msaContent, `MSA_Preview_${invitation?.business_name || "Document"}`)
  }

  useEffect(() => {
    if (isLoading || done) return
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return
    const rect = canvas.getBoundingClientRect()
    canvas.width = rect.width * window.devicePixelRatio
    canvas.height = rect.height * window.devicePixelRatio
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio)
    ctx.strokeStyle = "#B68039"
    ctx.lineWidth = 2
    ctx.lineCap = "round"
    ctx.lineJoin = "round"
  }, [isLoading, done])

  const getMSAContent = () => {
    if (!invitation) return ""
    if (invitation.msa_content) return invitation.msa_content

    const previewData: OnboardingData = {
      offer_type: invitation.offer_type,
      business_name: invitation.business_name,
      contact_name: contactName || invitation.contact_name || "Client Name",
      client_email: email || invitation.client_email || "client@email.com",
      client_phone: "",
      client_address: "",
      client_city: "",
      client_state: "",
      client_zip: "",
      setup_fee: invitation.setup_fee,
      monthly_fee: invitation.monthly_fee,
      is_referral: (invitation.is_referral as "yes" | "no") || "no",
      referral_name: invitation.referral_name,
      portal_username: email || "",
      portal_password: "",
      portal_url: "",
      custom_services: invitation.custom_services,
      special_notes: invitation.special_notes,
      signature: "",
      signature_date: new Date().toISOString(),
    }
    return MSATemplate(previewData)
  }

  const handleSubmit = async () => {
    if (!signature) {
      alert("Please sign before submitting.")
      return
    }
    if (!email.trim()) {
      alert("Please confirm your email address.")
      return
    }
    if (!contactName.trim()) {
      alert("Please confirm your name.")
      return
    }
    if (!termsAccepted) {
      alert("Please accept the Terms of Service to continue.")
      return
    }
    setSubmitting(true)
    try {
      const clientId = `OAA-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`
      const now = new Date().toISOString()

      const clientData: OnboardingData & { client_id: string; created_at: string } = {
        offer_type: invitation!.offer_type,
        business_name: invitation!.business_name,
        contact_name: contactName,
        client_email: email,
        client_phone: "",
        client_address: "",
        client_city: "",
        client_state: "",
        client_zip: "",
        setup_fee: invitation!.setup_fee,
        monthly_fee: invitation!.monthly_fee,
        is_referral: (invitation!.is_referral as "yes" | "no") || "no",
        referral_name: invitation!.referral_name,
        portal_username: email,
        portal_password: "",
        portal_url: "TBD",
        custom_services: invitation!.custom_services,
        special_notes: invitation!.special_notes,
        signature,
        signature_date: now,
        client_id: clientId,
        created_at: now,
      }

      const msaContent = invitation!.msa_content || MSATemplate(clientData)
      const invoiceContent = invitation!.invoice_content || InvoiceTemplate(clientData)
      const welcomeContent = invitation!.welcome_content || WelcomeTemplate(clientData)

      const clientRecord = {
        id: clientId,
        name: contactName,
        business_name: invitation!.business_name,
        email,
        phone: "",
        address: "",
        plan: invitation!.offer_type,
        price: invitation!.monthly_fee,
        setup_fee: invitation!.setup_fee,
        start_date: now,
        portal_access: email,
        msa_content: msaContent,
        invoice_content: invoiceContent,
        welcome_content: welcomeContent,
        client_signature: signature,
        signed_at: now,
        created_at: now,
        updated_at: now,
      }

      await saveClient(clientRecord, { invitationId: resolvedParams.invitationId })

      await saveClientLogin({
        id: clientId,
        client_id: clientId,
        password: email,
        created_at: now,
      })

      await saveNotification({
        id: `notif-${Date.now()}`,
        title: "Agreement Signed",
        message: `${invitation!.business_name} signed — ready for agency countersignature`,
        type: "onboarding_completed",
        clientId: clientId,
        clientName: invitation!.business_name,
        read: false,
        created_at: now,
      })

      await completeInvitationPublic(resolvedParams.invitationId)

      // Fire-and-await the welcome + team notification email. Failures here
      // shouldn't block the user from seeing their login — log them and
      // continue.
      try {
        await fetch(
          `/api/portal/invitations/${encodeURIComponent(resolvedParams.invitationId)}/notify-signed`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              client_id: clientId,
              client_email: email,
              client_name: contactName,
            }),
          },
        )
      } catch (e) {
        console.error("[onboard] notify-signed failed:", e)
      }

      setCompletedClientId(clientId)
      setCompletedEmail(email)
      setDone(true)
    } catch (e) {
      console.error("[onboard] submit failed:", e)
      alert("We couldn't save your signature. Please try again or contact team@orage.agency.")
    } finally {
      setSubmitting(false)
    }
  }

  if (!mounted || isLoading) {
    return (
      <div className="min-h-screen bg-orage-black p-4 md:p-8 flex items-center justify-center">
        <div className="text-center">
          <img
            src="https://storage.googleapis.com/msgsndr/651kIrlKk834C2FEl66i/media/688a8bfb5a3e648018748f5e.png"
            alt="Orage AI Agency"
            className="h-16 mx-auto mb-4 animate-pulse"
          />
          <p className="text-white/70 font-body">Loading invitation...</p>
        </div>
      </div>
    )
  }

  if (!invitation) return null

  if (done) {
    return (
      <div className="min-h-screen bg-orage-black p-4 md:p-8 flex items-center justify-center overflow-x-hidden">
        <div className="max-w-2xl w-full bg-white/5 backdrop-blur-sm border border-gold/20 rounded-lg p-4 md:p-8 text-center overflow-hidden">
          <img
            src="https://storage.googleapis.com/msgsndr/651kIrlKk834C2FEl66i/media/688a8bfb5a3e648018748f5e.png"
            alt="Orage AI Agency"
            className="h-12 md:h-16 mx-auto mb-6 md:mb-8"
          />
          <h1 className="font-heading text-2xl md:text-4xl text-gold mb-4 break-words">SIGNED & SEALED</h1>
          <p className="font-body text-white/70 mb-8 break-words">
            Thank you for signing. We just emailed your welcome message and portal login to <span className="text-gold">{completedEmail}</span>.
          </p>

          <div className="bg-gradient-to-r from-[#B68039]/20 to-[#B68039]/10 border-2 border-[#B68039] rounded-lg p-6 mb-8">
            <h2 className="font-heading text-xl md:text-2xl text-[#B68039] mb-4">
              ONE MORE STEP — BUILD YOUR AGENTS
            </h2>
            <p className="text-white/80 font-body mb-6 leading-relaxed">
              Three minutes of voice + a few quick taps. We turn your answers into a phone agent
              and chat agent tuned to your business — live in 48 hours.
            </p>
            <a
              href={`/onboard/${resolvedParams.invitationId}/intake`}
              className="inline-block w-full gradient-button text-black font-heading text-lg md:text-xl px-6 py-4 rounded-lg transition-all duration-300 transform hover:scale-105"
            >
              CONTINUE TO AGENT SETUP →
            </a>
          </div>

          <div className="bg-gold/10 border border-gold/30 rounded-lg p-4 md:p-6 mb-6 text-left overflow-hidden w-full">
            <p className="text-gold text-sm mb-3 uppercase tracking-wide font-semibold text-center break-words">
              Save for your records — this is your portal log in:
            </p>
            <div className="text-white font-body whitespace-pre-line leading-relaxed text-xs md:text-base font-sans break-words w-full overflow-x-hidden">
              {`Portal Login URL: ${window.location.origin}/portal/login

Client ID: ${completedClientId}
Email: ${completedEmail}`}
            </div>
          </div>

          <button
            onClick={() => {
              const text = `Orage AI Agency client portal log in access:

Portal Login URL: ${window.location.origin}/portal/login

Login Credentials:
- Client ID: ${completedClientId}
- Email: ${completedEmail}`
              navigator.clipboard.writeText(text)
              alert("Login information copied to clipboard")
            }}
            className="w-full mb-4 bg-white/10 hover:bg-white/20 text-white font-heading text-base md:text-lg py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-all"
          >
            <Download className="h-5 w-5 flex-shrink-0" />
            <span>Copy login info</span>
          </button>

          <button
            onClick={() => window.open("/portal/login", "_blank")}
            className="w-full bg-gradient-to-r from-[#B68039] to-[#8B6028] hover:from-[#9B6A2F] hover:to-[#7A5222] text-white font-heading text-lg md:text-xl px-4 md:px-8 py-4 rounded-lg transition-all duration-300 transform hover:scale-105 whitespace-normal h-auto break-words"
          >
            GO TO CLIENT PORTAL
          </button>

          <div className="mt-8 pt-6 border-t border-white/10 flex flex-wrap justify-center gap-4 md:gap-6 text-sm">
            <a href="https://orage.agency/#terms" target="_blank" rel="noopener noreferrer" className="text-[#B68039] hover:text-[#9B6A2F] transition-colors">
              Terms of Service
            </a>
            <a href="https://orage.agency/#privacy" target="_blank" rel="noopener noreferrer" className="text-[#B68039] hover:text-[#9B6A2F] transition-colors">
              Privacy Policy
            </a>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-orage-black p-4 md:p-8 overflow-x-hidden">
      <div className="max-w-3xl mx-auto w-full">
        <img
          src="https://storage.googleapis.com/msgsndr/651kIrlKk834C2FEl66i/media/688a8bfb5a3e648018748f5e.png"
          alt="Orage AI Agency"
          className="h-12 md:h-16 mx-auto mb-6 md:mb-8"
        />

        <div className="bg-white/5 backdrop-blur-sm border border-gold/20 rounded-lg p-4 md:p-8 mb-8 w-full max-w-full overflow-hidden">
          <div className="flex flex-col items-center mb-8">
            <h1 className="font-heading text-2xl md:text-4xl text-gold mb-2 break-words text-center">REVIEW &amp; SIGN</h1>
            <h2 className="font-heading text-lg md:text-xl text-gold/80 mb-4 break-words text-center">
              {invitation.business_name} · {OFFER_DEFAULTS[invitation.offer_type]?.displayName || invitation.offer_type}
            </h2>
            <div className="w-24 h-0.5 bg-gradient-to-r from-transparent via-gold to-transparent"></div>
          </div>

          <div className="bg-gold/10 border border-gold/30 rounded-lg p-4 md:p-6 mb-6 overflow-hidden w-full">
            <h2 className="font-heading text-lg md:text-xl text-white mb-3">Your plan</h2>
            <div className="space-y-1 text-sm md:text-base break-words">
              <p className="text-white"><span className="text-gold">90-Day Onboarding Fee:</span> ${invitation.setup_fee.toLocaleString()}</p>
              <p className="text-white"><span className="text-gold">Monthly:</span> ${invitation.monthly_fee.toLocaleString()}/mo</p>
            </div>
          </div>

          <div className="bg-white/10 border border-white/20 rounded-lg p-4 mb-6">
            <div className="flex justify-between items-center mb-3 flex-wrap gap-2">
              <h3 className="text-white font-heading text-lg">Master Service Agreement</h3>
              <button
                onClick={downloadMSAPreview}
                className="text-[#B68039] hover:text-[#9B6A2F] hover:bg-white/5 text-sm font-body h-auto py-1 px-2 flex items-center gap-2 rounded transition-colors"
              >
                <Download className="h-4 w-4" />
                Download PDF
              </button>
            </div>
            <div className="h-64 md:h-96 overflow-y-auto bg-black/40 p-2 rounded border border-white/10">
              <div className="bg-white rounded" dangerouslySetInnerHTML={{ __html: getMSAContent() }} />
            </div>
            <p className="text-white/50 text-xs mt-2 text-center">Scroll to review the full agreement</p>
          </div>

          <div className="space-y-4 mb-6">
            <div>
              <label className="block text-white font-body mb-2 text-sm md:text-base">Your name *</label>
              <input
                type="text"
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
                className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-gold/50"
                placeholder="Full name"
              />
            </div>
            <div>
              <label className="block text-white font-body mb-2 text-sm md:text-base">Email *</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-gold/50"
                placeholder="you@business.com"
              />
              <p className="text-white/40 text-xs mt-1">We'll send your portal login here.</p>
            </div>
          </div>

          <div className="bg-gold/10 border border-gold/30 rounded-lg p-4 md:p-6 w-full overflow-hidden">
            <h2 className="font-heading text-xl md:text-2xl text-white mb-2">Sign here</h2>
            <p className="text-white/70 font-body mb-4 text-sm md:text-base break-words">
              Use your finger or mouse to sign below.
            </p>

            <div className="bg-orage-black/50 border border-gold/30 rounded-lg p-4 mb-4 relative">
              <canvas
                ref={canvasRef}
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                onTouchStart={startDrawing}
                onTouchMove={draw}
                onTouchEnd={stopDrawing}
                className="w-full h-48 cursor-crosshair touch-none bg-transparent"
              />
              {!hasSignature && (
                <div className="absolute inset-0 flex items-center justify-center text-white/30 pointer-events-none">
                  Sign Here
                </div>
              )}
            </div>

            <div className="flex gap-4 mb-6">
              <button
                onClick={clearSignature}
                className="flex-1 bg-white/10 hover:bg-white/20 text-white font-body py-2 rounded-lg transition-colors"
              >
                Clear
              </button>
            </div>

            <div className="flex items-start gap-3 mb-6">
              <input
                type="checkbox"
                id="terms"
                checked={termsAccepted}
                onChange={(e) => setTermsAccepted(e.target.checked)}
                className="mt-1 accent-gold w-4 h-4"
              />
              <label htmlFor="terms" className="text-white/70 text-sm font-body">
                I agree to the{" "}
                <a href="https://orage.agency/#terms" target="_blank" rel="noopener noreferrer" className="text-[#B68039] hover:underline">
                  Terms of Service
                </a>{" "}
                and{" "}
                <a href="https://orage.agency/#privacy" target="_blank" rel="noopener noreferrer" className="text-[#B68039] hover:underline">
                  Privacy Policy
                </a>
              </label>
            </div>

            <button
              onClick={handleSubmit}
              disabled={!signature || submitting || !termsAccepted}
              className="w-full bg-gradient-to-r from-[#B68039] to-[#8B6028] hover:from-[#9B6A2F] hover:to-[#7A5222] text-white font-heading text-lg py-3 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed whitespace-normal h-auto break-words"
            >
              {submitting ? "SIGNING..." : "SIGN & SUBMIT"}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
