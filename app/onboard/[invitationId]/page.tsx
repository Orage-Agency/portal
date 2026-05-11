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
  const [step, setStep] = useState(1) // 1 = info, 2 = signature, 3 = completion
  const [isDrawing, setIsDrawing] = useState(false)
  const [hasSignature, setHasSignature] = useState(false)
  const [signature, setSignature] = useState<string | undefined>()
  const [contactName, setContactName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [address, setAddress] = useState("")
  const [city, setCity] = useState("")
  const [state, setState] = useState("")
  const [zip, setZip] = useState("")
  const [portalUrl, setPortalUrl] = useState("")
  const [isReferral, setIsReferral] = useState<"yes" | "no">("no")
  const [referralName, setReferralName] = useState("")
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
        
        // Pre-fill contact name if provided by admin
        if (found.contact_name) {
          setContactName(found.contact_name)
        }
        
        // Set referral status from admin if provided
        if (found.is_referral) {
          setIsReferral(found.is_referral as "yes" | "no")
          if (found.is_referral === "yes" && found.referral_name) {
            setReferralName(found.referral_name)
          }
        }
      } else if (found.status === "completed") {
        alert("This invitation has already been completed")
        router.push("/")
      }
    } catch (error) {
      console.error("[v0] Error loading invitation:", error)
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
    setIsDrawing(false)
    setHasSignature(true)
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

  const saveSignature = () => {
    const canvas = canvasRef.current
    if (!canvas) return

    const signatureData = canvas.toDataURL("image/png")
    setSignature(signatureData)
  }

  const downloadMSAPreview = async () => {
    // USE STORED PDF IF AVAILABLE - THIS IS THE ADMIN-EDITED PDF
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
    
    // Fallback: generate from content if no stored PDF
    const msaContent = getMSAContent()
    await generateAndDownloadPDF(msaContent, `MSA_Preview_${invitation?.business_name || "Document"}`)
  }

  useEffect(() => {
    if (step !== 2) return

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
  }, [step])

  const getMSAContent = () => {
    if (!invitation) return ""
    
    // USE THE ADMIN-EDITED CONTENT FROM THE INVITATION - NOT A NEW TEMPLATE
    if (invitation.msa_content) {
      return invitation.msa_content
    }

    // Fallback only if no admin-edited content exists
    const previewData: OnboardingData = {
      offer_type: invitation.offer_type,
      business_name: invitation.business_name,
      contact_name: contactName || "Client Name",
      client_email: email || "client@email.com",
      client_phone: phone || "555-555-5555",
      client_address: address || "123 Main St",
      client_city: city || "City",
      client_state: state || "State",
      client_zip: zip || "12345",
      setup_fee: invitation.setup_fee,
      monthly_fee: invitation.monthly_fee,
      is_referral: isReferral,
      referral_name: referralName,
      custom_services: invitation.custom_services,
      special_notes: invitation.special_notes,
      signature: "",
      created_at: new Date().toISOString(),
    }

    return MSATemplate(previewData)
  }

  const handleSubmit = async () => {
    if (!signature) {
      alert("Please provide your signature before completing onboarding")
      return
    }

    if (!contactName || !email || !phone) {
      alert("Please fill in all required fields")
      return
    }

    const clientId = `OAA-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`

    const clientData: OnboardingData & { client_id: string; created_at: string } = {
      offer_type: invitation!.offer_type,
      business_name: invitation!.business_name,
      contact_name: contactName,
      client_email: email,
      client_phone: phone,
      client_address: address,
      client_city: city,
      client_state: state,
      client_zip: zip,
      setup_fee: invitation!.setup_fee,
      monthly_fee: invitation!.monthly_fee,
      is_referral: isReferral,
      referral_name: isReferral === "yes" ? referralName : undefined,
      portal_username: email,
      portal_password: "",
      portal_url: portalUrl || "TBD",
      custom_services: invitation!.custom_services,
      special_notes: invitation!.special_notes,
      signature: signature,
      signature_date: new Date().toISOString(),
      client_id: clientId,
      created_at: new Date().toISOString(),
    }

    // USE ADMIN-EDITED CONTENT FROM INVITATION - NOT NEW TEMPLATES
    const msaContent = invitation!.msa_content || MSATemplate(clientData)
    const invoiceContent = invitation!.invoice_content || InvoiceTemplate(clientData)
    const welcomeContent = invitation!.welcome_content || WelcomeTemplate(clientData)

    const clientRecord = {
      id: clientId,
      name: contactName,
      business_name: invitation!.business_name,
      email: email,
      phone: phone,
      address: `${address}, ${city}, ${state} ${zip}`,
      plan: invitation!.offer_type,
      price: invitation!.monthly_fee,
      setup_fee: invitation!.setup_fee,
      start_date: new Date().toISOString(),
      portal_access: email,
      msa_content: msaContent,
      invoice_content: invoiceContent,
      welcome_content: welcomeContent,
      client_signature: signature,
      signed_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    // The invitation_id authenticates this public client save (no admin token).
    await saveClient(clientRecord, { invitationId: resolvedParams.invitationId })

    await saveClientLogin({
      id: clientId,
      client_id: clientId,
      password: email,
      created_at: new Date().toISOString(),
    })

    await saveNotification({
      id: `notif-${Date.now()}`,
      title: "Onboarding Completed",
      message: `${invitation!.business_name} completed onboarding - Ready for Agency Signature`,
      type: "onboarding_completed",
      clientId: clientId,
      clientName: invitation!.business_name,
      read: false,
      created_at: new Date().toISOString(),
    })

    await completeInvitationPublic(resolvedParams.invitationId)

    setCompletedClientId(clientId)
    setCompletedEmail(email)
    setStep(3)
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

  if (step === 3) {
    return (
      <div className="min-h-screen bg-orage-black p-4 md:p-8 flex items-center justify-center overflow-x-hidden">
        <div className="max-w-2xl w-full bg-white/5 backdrop-blur-sm border border-gold/20 rounded-lg p-4 md:p-8 text-center overflow-hidden">
          <img
            src="https://storage.googleapis.com/msgsndr/651kIrlKk834C2FEl66i/media/688a8bfb5a3e648018748f5e.png"
            alt="Orage AI Agency"
            className="h-12 md:h-16 mx-auto mb-6 md:mb-8"
          />
          <h1 className="font-heading text-2xl md:text-4xl text-gold mb-4 break-words">ONBOARDING COMPLETE</h1>
          <p className="font-body text-white/70 mb-8 break-words">
            Thank you for completing your initial agreement onboarding. Your client portal is now ready.
          </p>

          <div className="bg-gradient-to-r from-[#B68039]/20 to-[#B68039]/10 border-2 border-[#B68039] rounded-lg p-6 mb-8">
            <h2 className="font-heading text-xl md:text-2xl text-[#B68039] mb-4">
              NEXT STEP: COMPLETE YOUR ONBOARDING
            </h2>
            <p className="text-white/80 font-body mb-6 leading-relaxed">
              To fully activate your Orage AI Agency services, please complete your CRM onboarding and AI Agent setup.
              This is required to access all features and tools in your client portal.
            </p>
            <a
              href="https://client.orage.agency/crm"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block w-full gradient-button text-black font-heading text-lg md:text-xl px-6 py-4 rounded-lg transition-all duration-300 transform hover:scale-105"
            >
              CONTINUE TO CRM & AI AGENT ONBOARDING →
            </a>
          </div>

          <div className="bg-gold/10 border border-gold/30 rounded-lg p-4 md:p-6 mb-6 text-left overflow-hidden w-full">
            <p className="text-gold text-sm mb-3 uppercase tracking-wide font-semibold text-center break-words">
              Save for your records - this is your log in to your portal access:
            </p>
            <div className="text-white font-body whitespace-pre-line leading-relaxed text-xs md:text-base font-sans break-words w-full overflow-x-hidden">
              {`Orage AI Agency client portal log in access:

Portal Login URL: ${window.location.origin}/portal/login

Login Credentials:
- Client ID: ${completedClientId}
- Email: ${completedEmail}`}
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
            className="w-full mb-4 bg-gradient-to-r from-[#B68039] to-[#8B6028] hover:from-[#9B6A2F] hover:to-[#7A5222] text-white font-heading text-lg md:text-xl py-4 px-4 rounded-lg flex flex-col md:flex-row items-center justify-center gap-2 transition-all duration-300 transform hover:scale-105 whitespace-normal h-auto min-h-[48px]"
          >
            <Download className="h-5 w-5 flex-shrink-0" />
            <span className="text-center">Copy All Login Information</span>
          </button>

          <button
            onClick={() => window.open("/portal/login", "_blank")}
            className="w-full bg-gradient-to-r from-[#B68039] to-[#8B6028] hover:from-[#9B6A2F] hover:to-[#7A5222] text-white font-heading text-lg md:text-xl px-4 md:px-8 py-4 rounded-lg transition-all duration-300 transform hover:scale-105 whitespace-normal h-auto break-words"
          >
            GO TO CLIENT PORTAL
          </button>

          <div className="mt-8 pt-6 border-t border-white/10 flex flex-wrap justify-center gap-4 md:gap-6 text-sm">
            <a
              href="https://orage.agency/#terms"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#B68039] hover:text-[#9B6A2F] transition-colors"
            >
              Terms of Service
            </a>
            <a
              href="https://orage.agency/#privacy"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#B68039] hover:text-[#9B6A2F] transition-colors"
            >
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
            <h1 className="font-heading text-2xl md:text-4xl text-gold mb-2 break-words">WELCOME TO ORAGE AI NOVA</h1>
            <h2 className="font-heading text-lg md:text-xl text-gold/80 mb-4 break-words">AGENCY AGREEMENTS</h2>
            <div className="w-24 h-0.5 bg-gradient-to-r from-transparent via-gold to-transparent mb-6"></div>
          </div>
          <p className="font-body text-white/70 mb-6 break-words text-center">Complete your onboarding to get started</p>

          {step === 1 ? (
            <>
              <div className="bg-gold/10 border border-gold/30 rounded-lg p-4 md:p-6 mb-8 overflow-hidden w-full">
                <h2 className="font-heading text-xl md:text-2xl text-white mb-4">Your Selected Plan</h2>
                <div className="space-y-2 text-sm md:text-base break-words">
                  <p className="text-white break-words">
                    <span className="text-gold">Business:</span> {invitation.business_name}
                  </p>
                  <p className="text-white break-words">
                    <span className="text-gold">Plan:</span> {OFFER_DEFAULTS[invitation.offer_type]?.displayName || invitation.offer_type}
                  </p>
                  <p className="text-white break-words">
                    <span className="text-gold">90-Day Onboarding Fee:</span> ${invitation.setup_fee.toLocaleString()}
                  </p>
                  <p className="text-white break-words">
                    <span className="text-gold">Monthly Fee:</span> ${invitation.monthly_fee.toLocaleString()}/mo
                  </p>
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-white font-body mb-2">Contact Name *</label>
                  <input
                    type="text"
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-gold/50"
                    placeholder="Your full name"
                  />
                </div>

                <div>
                  <label className="block text-white font-body mb-2">Email Address *</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-gold/50"
                    placeholder="your@email.com"
                  />
                </div>

                <div>
                  <label className="block text-white font-body mb-2">Phone Number *</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-gold/50"
                    placeholder="(555) 555-5555"
                  />
                </div>

                <div>
                  <label className="block text-white font-body mb-2">Street Address</label>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-gold/50"
                    placeholder="123 Main St"
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="col-span-2">
                    <label className="block text-white font-body mb-2">City</label>
                    <input
                      type="text"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-gold/50"
                    />
                  </div>
                  <div>
                    <label className="block text-white font-body mb-2">State</label>
                    <input
                      type="text"
                      value={state}
                      onChange={(e) => setState(e.target.value)}
                      className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-gold/50"
                      placeholder="OK"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-white font-body mb-2">ZIP Code</label>
                  <input
                    type="text"
                    value={zip}
                    onChange={(e) => setZip(e.target.value)}
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-gold/50"
                    placeholder="73034"
                  />
                </div>

                <div>
                  <label className="block text-white font-body mb-2">Your Website/Portal URL (Optional)</label>
                  <input
                    type="url"
                    value={portalUrl}
                    onChange={(e) => setPortalUrl(e.target.value)}
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-gold/50"
                    placeholder="https://yourwebsite.com"
                  />
                </div>

                <div className="space-y-4 pt-4 border-t border-white/10">
                  {!invitation?.is_referral && (
                    <>
                      <label className="block text-white font-body mb-2 text-sm md:text-base">Is this a referral? *</label>
                      <div className="flex gap-6">
                        <label className="flex items-center space-x-2 cursor-pointer">
                          <input
                            type="radio"
                            name="referral"
                            value="no"
                            checked={isReferral === "no"}
                            onChange={() => setIsReferral("no")}
                            className="text-[#B68039] focus:ring-[#B68039]"
                          />
                          <span className="text-white font-body">No</span>
                        </label>
                        <label className="flex items-center space-x-2 cursor-pointer">
                          <input
                            type="radio"
                            name="referral"
                            value="yes"
                            checked={isReferral === "yes"}
                            onChange={() => setIsReferral("yes")}
                            className="text-[#B68039] focus:ring-[#B68039]"
                          />
                          <span className="text-white font-body">Yes</span>
                        </label>
                      </div>
                    </>
                  )}
                  {invitation?.is_referral === "yes" && (
                    <div className="bg-white/5 border border-gold/30 rounded-lg p-4">
                      <p className="text-white font-body text-sm">
                        <span className="text-gold font-bold">Referral Source:</span> {invitation?.referral_name || "Not specified"}
                      </p>
                    </div>
                  )}
                </div>

                {isReferral === "yes" && !invitation?.is_referral && (
                  <div className="bg-[#B68039]/10 border border-[#B68039]/30 rounded-lg p-4 animate-in fade-in slide-in-from-top-2">
                    <label className="block text-white font-body mb-2">Referral Name *</label>
                    <input
                      type="text"
                      value={referralName}
                      onChange={(e) => setReferralName(e.target.value)}
                      className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-gold/50"
                      placeholder="Who referred you?"
                    />
                  </div>
                )}

                <button
                  onClick={() => setStep(2)}
                  className="w-full bg-gradient-to-r from-[#B68039] to-[#8B6028] hover:from-[#9B6A2F] hover:to-[#7A5222] text-white font-heading text-lg md:text-xl py-4 rounded-lg transition-all duration-300 transform hover:scale-105 whitespace-normal h-auto break-words"
                >
                  CONTINUE TO AGREEMENT
                </button>
              </div>
            </>
          ) : (
            <div className="space-y-6">
              <div className="bg-white/10 border border-white/20 rounded-lg p-4 mb-6">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-white font-heading text-lg">Agreement Preview</h3>
                  <button
                    onClick={downloadMSAPreview}
                    className="text-[#B68039] hover:text-[#9B6A2F] hover:bg-white/5 text-sm font-body h-auto py-1 px-2 flex items-center gap-2 rounded transition-colors"
                  >
                    <Download className="h-4 w-4" />
                    Download Preview (PDF)
                  </button>
                </div>
                <div className="h-64 md:h-96 overflow-y-auto bg-black/40 p-2 rounded border border-white/10">
                  <div className="bg-white rounded" dangerouslySetInnerHTML={{ __html: getMSAContent() }} />
                </div>
                <p className="text-white/50 text-xs mt-2 text-center">Scroll to review the full agreement</p>
              </div>

              <div className="bg-gold/10 border border-gold/30 rounded-lg p-4 md:p-6 w-full overflow-hidden">
                <h2 className="font-heading text-xl md:text-2xl text-white mb-4">Sign Agreement</h2>
                <p className="text-white/70 font-body mb-6 text-sm md:text-base break-words">
                  Please sign below to accept the terms and complete your onboarding.
                </p>

                <div className="bg-orage-black/50 border border-gold/30 rounded-lg p-4 mb-4">
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
                    <div className="text-center text-white/30 pointer-events-none -mt-24">Sign Here</div>
                  )}
                </div>

                <div className="flex gap-4 mb-6">
                  <button
                    onClick={clearSignature}
                    className="flex-1 bg-white/10 hover:bg-white/20 text-white font-body py-2 rounded-lg transition-colors"
                  >
                    Clear
                  </button>
                  <button
                    onClick={saveSignature}
                    disabled={!hasSignature}
                    className="flex-1 bg-gradient-to-r from-[#B68039] to-[#8B6028] hover:from-[#9B6A2F] hover:to-[#7A5222] text-white font-body py-2 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Save Signature
                  </button>
                </div>

                {signature && (
                  <div className="bg-[#B68039]/10 border border-[#B68039]/30 rounded-lg p-3 mb-6">
                    <p className="text-[#B68039] text-sm text-center">Signature Saved ✓</p>
                  </div>
                )}

                <div className="flex items-start gap-3 mb-6">
                  <input type="checkbox" id="terms" className="mt-1" />
                  <label htmlFor="terms" className="text-white/70 text-sm font-body">
                    I agree to the{" "}
                    <a
                      href="https://orage.agency/#terms"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#B68039] hover:underline"
                    >
                      Terms of Service
                    </a>{" "}
                    and{" "}
                    <a
                      href="https://orage.agency/#privacy"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#B68039] hover:underline"
                    >
                      Privacy Policy
                    </a>
                  </label>
                </div>

                <div className="flex flex-col md:flex-row gap-4">
                  <button
                    onClick={() => setStep(1)}
                    className="w-full md:w-auto px-8 bg-white/10 hover:bg-white/20 text-white font-body py-3 rounded-lg transition-colors"
                  >
                    Back
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={!signature}
                    className="w-full md:flex-1 bg-gradient-to-r from-[#B68039] to-[#8B6028] hover:from-[#9B6A2F] hover:to-[#7A5222] text-white font-heading text-lg py-3 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed whitespace-normal h-auto break-words"
                  >
                    SUBMIT
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
