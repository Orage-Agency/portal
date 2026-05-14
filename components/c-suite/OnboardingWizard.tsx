"use client"

import { useState, useEffect } from "react"
import type { OnboardingData, Invitation } from "@/lib/types"
import { generateClientId } from "@/lib/auth"
import { saveInvitation } from "@/lib/storage"
import StepIndicator from "./StepIndicator"
import Step1OfferInfo from "./Step1OfferInfo"
import Step3ClientDetails from "./Step3ClientDetails"
import Step4Payment from "./Step4Payment"
import Step5Customizations from "./Step5Customizations"
import SignatureStep from "./SignatureStep"
import DocumentViewer from "./DocumentViewer"
import { Button } from "@/components/ui/button"
import { ArrowLeft, ArrowRight, Home, Send, X, Mail, FileDown, Link2, Mic, Copy } from "lucide-react"
import { useRouter } from "next/navigation"

const TOTAL_STEPS = 6

export default function OnboardingWizard() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(1)
  const [formData, setFormData] = useState<OnboardingData>({
    offer_type: "Orage90",
    business_name: "",
    contact_name: "",
    client_email: "",
    client_phone: "",
    client_address: "",
    client_city: "",
    client_state: "",
    client_zip: "",
    setup_fee: 7500,
    monthly_fee: 2500,
    is_referral: "no",
    signature: "",
  })
  const [creatingSendLink, setCreatingSendLink] = useState(false)
  const [sendShareLink, setSendShareLink] = useState<string | null>(null)
  const [showSendShare, setShowSendShare] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem("c-suite-onboarding")
    if (saved) {
      try {
        setFormData(JSON.parse(saved))
      } catch (e) {
        console.error("[v0] Failed to parse saved data:", e)
      }
    }
  }, [])

  useEffect(() => {
    localStorage.setItem("c-suite-onboarding", JSON.stringify(formData))
  }, [formData])

  const updateFormData = (updates: Partial<OnboardingData>) => {
    setFormData((prev) => ({ ...prev, ...updates }))
  }

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return !!formData.offer_type
      case 2:
        return !!(
          formData.business_name &&
          formData.contact_name &&
          formData.client_email &&
          formData.client_phone &&
          formData.client_address
        )
      case 3:
        return true // Referral is optional
      case 4:
        return true // Customizations are optional
      case 5:
        return !!formData.signature // Signature is required
      default:
        return true
    }
  }

  const handleNext = () => {
    if (canProceed() && currentStep < TOTAL_STEPS) {
      setCurrentStep((prev) => prev + 1)
    }
  }

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1)
    }
  }

  /**
   * Escape hatch: skip having the admin sign on behalf of the client.
   * Mints an invitation row from the wizard's current form data and surfaces
   * a unique `/onboard/<id>` link the admin can email straight to the
   * client. The client signs themselves — no portal, no extra steps.
   */
  const sendToClientForSignature = async () => {
    if (!formData.business_name || !formData.client_email) {
      alert("Enter at least the business name and client email (step 2) before sending.")
      return
    }
    setCreatingSendLink(true)
    try {
      const id = generateClientId()
      const invitation: Invitation = {
        id,
        business_name: formData.business_name,
        contact_name: formData.contact_name || undefined,
        client_email: formData.client_email,
        offer_type: formData.offer_type,
        setup_fee: formData.setup_fee,
        monthly_fee: formData.monthly_fee,
        custom_services: formData.custom_services || undefined,
        special_notes: formData.special_notes || undefined,
        is_referral: formData.is_referral,
        referral_name: formData.is_referral === "yes" ? formData.referral_name : undefined,
        created_at: new Date().toISOString(),
        status: "pending",
      }
      await saveInvitation(invitation)
      const url = `${window.location.origin}/onboard/${id}`
      setSendShareLink(url)
      setShowSendShare(true)
    } catch (e) {
      alert(`Couldn't create the sign link: ${(e as Error).message}`)
    } finally {
      setCreatingSendLink(false)
    }
  }

  const intakeShareLink = sendShareLink ? `${sendShareLink}/intake` : null

  const buildShareMessage = (signUrl: string, intakeUrl: string) => {
    const greeting = formData.contact_name
      ? `Hi ${formData.contact_name},`
      : `Hi ${formData.business_name || "there"},`
    const subject = `Your Orage AI Agency agreement + voice setup`
    const body = `${greeting}

Two quick things to get you live:

1. Sign your Master Service Agreement — about a minute:
${signUrl}

2. Send us your voice — six short questions on your phone, about 5 minutes. We turn your answers into your STACY phone agent and chat agent:
${intakeUrl}

You can do them in any order. Both links are unique to you.

— Orage AI Agency
team@orage.agency`
    return { subject, body }
  }

  const copyShareLink = () => {
    if (!sendShareLink) return
    navigator.clipboard.writeText(sendShareLink)
    alert("Sign link copied to clipboard")
  }

  const copyIntakeLink = () => {
    if (!intakeShareLink) return
    navigator.clipboard.writeText(intakeShareLink)
    alert("Intake link copied to clipboard")
  }

  const copyShareMessage = () => {
    if (!sendShareLink || !intakeShareLink) return
    const { body } = buildShareMessage(sendShareLink, intakeShareLink)
    navigator.clipboard.writeText(body)
    alert("Message copied — both links included.")
  }

  const openShareInEmail = () => {
    if (!sendShareLink || !intakeShareLink) return
    const { subject, body } = buildShareMessage(sendShareLink, intakeShareLink)
    const params = new URLSearchParams()
    params.set("subject", subject)
    params.set("body", body)
    window.location.href = `mailto:${encodeURIComponent(formData.client_email || "")}?${params.toString()}`
  }

  const downloadShareEml = () => {
    if (!sendShareLink || !intakeShareLink) return
    const { subject, body } = buildShareMessage(sendShareLink, intakeShareLink)
    const safe = (formData.business_name || "client").replace(/[^a-z0-9-_]+/gi, "_")
    const headers = [
      `From: team@orage.agency`,
      formData.client_email ? `To: ${formData.client_email}` : null,
      `Subject: ${subject}`,
      `MIME-Version: 1.0`,
      `Content-Type: text/plain; charset=UTF-8`,
      `Content-Transfer-Encoding: 8bit`,
      `X-Orage-Sign-Link: ${sendShareLink}`,
      `X-Orage-Intake-Link: ${intakeShareLink}`,
    ]
      .filter(Boolean)
      .join("\r\n")
    const eml = `${headers}\r\n\r\n${body}\r\n`
    const blob = new Blob([eml], { type: "message/rfc822" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `Orage_Invitation_${safe}.eml`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <div className="min-h-screen bg-orage-black py-8 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8 md:mb-12">
          <img
            src="https://storage.googleapis.com/msgsndr/651kIrlKk834C2FEl66i/media/688a8bfb5a3e648018748f5e.png"
            alt="Orage AI Agency"
            className="h-12 md:h-16 mx-auto mb-4 md:mb-6"
          />
          <h1 className="font-heading text-4xl md:text-6xl text-gold mb-2">ORAGE CLIENT PORTAL</h1>
          <p className="font-body text-white/70 text-base md:text-lg">Executive Client Onboarding Portal</p>
        </div>

        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
          <div className="flex-1 bg-[#B68039]/15 border border-[#B68039]/40 rounded-lg px-4 py-3 flex flex-col md:flex-row md:items-center gap-3">
            <div className="flex-1">
              <p className="text-gold font-heading text-sm md:text-base">JUST WANT THEM TO SIGN?</p>
              <p className="text-white/70 text-xs md:text-sm">
                Skip filling in the wizard yourself — fill business name + client email (step 2), then send a one-click sign link.
              </p>
            </div>
            <Button
              onClick={sendToClientForSignature}
              disabled={creatingSendLink}
              className="gradient-button text-black font-semibold disabled:opacity-50"
            >
              <Send className="mr-2 h-4 w-4" />
              {creatingSendLink ? "Generating…" : "SEND FOR SIGNATURE"}
            </Button>
          </div>
          <Button
            onClick={() => router.push("/c-suite/admin")}
            variant="outline"
            className="bg-white/5 border-white/10 text-white hover:bg-white/10"
          >
            <Home className="mr-2 h-4 w-4" />
            <span className="hidden md:inline">Back to Dashboard</span>
            <span className="md:hidden">Dashboard</span>
          </Button>
        </div>

        {/* Step Indicator */}
        <StepIndicator currentStep={currentStep} totalSteps={TOTAL_STEPS} />

        {/* Step Content */}
        <div className="glass-panel rounded-lg p-4 md:p-8 mb-8">
          {currentStep === 1 && <Step1OfferInfo formData={formData} updateFormData={updateFormData} />}
          {currentStep === 2 && <Step3ClientDetails formData={formData} updateFormData={updateFormData} />}
          {currentStep === 3 && <Step4Payment formData={formData} updateFormData={updateFormData} />}
          {currentStep === 4 && <Step5Customizations formData={formData} updateFormData={updateFormData} />}
          {currentStep === 5 && <SignatureStep formData={formData} updateFormData={updateFormData} />}
          {currentStep === 6 && <DocumentViewer formData={formData} />}
        </div>

        {/* Navigation */}
        <div className="flex justify-between items-center gap-4">
          <Button
            onClick={handlePrevious}
            disabled={currentStep === 1}
            variant="outline"
            className="bg-transparent border-white/20 text-white hover:bg-white/10 transition-all duration-300"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          {currentStep < TOTAL_STEPS && (
            <Button
              onClick={handleNext}
              disabled={!canProceed()}
              className="gradient-button text-black font-semibold px-6 md:px-8 hover:scale-105 transition-transform"
            >
              {currentStep === 5 ? "Generate Documents" : "Next"}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          )}
        </div>

        <div className="mt-12 pt-6 border-t border-white/10 flex flex-wrap justify-center gap-6 text-sm pb-8">
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

      {/* Send-for-signature + intake share modal */}
      {showSendShare && sendShareLink && intakeShareLink && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-orage-black border border-gold/30 rounded-lg p-6 md:p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-4">
              <h3 className="font-heading text-2xl text-gold">CONTRACT + INTAKE LINKS</h3>
              <button
                onClick={() => {
                  setShowSendShare(false)
                  setSendShareLink(null)
                }}
                className="text-white/50 hover:text-white"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <p className="text-white/70 text-sm mb-5">
              Two unique links for <span className="text-gold">{formData.client_email || formData.business_name}</span>.
              Both tie to the same record so the voice answers land against this contract automatically.
              Nothing has been sent — copy or open in email when ready.
            </p>

            {/* Sign link */}
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-1.5">
                <Link2 className="h-4 w-4 text-gold" />
                <p className="text-[10px] uppercase tracking-[0.25em] text-gold/80 font-mono">
                  Step 1 — Sign the contract
                </p>
              </div>
              <div className="flex items-stretch gap-2">
                <input
                  readOnly
                  value={sendShareLink}
                  onFocus={(e) => e.currentTarget.select()}
                  className="flex-1 bg-black/40 border border-gold/30 rounded px-3 py-2 text-white/90 text-xs font-mono truncate focus:outline-none focus:border-gold/60"
                />
                <Button
                  onClick={copyShareLink}
                  className="bg-gold/15 hover:bg-gold/25 text-gold border border-gold/40 px-3"
                  aria-label="Copy sign link"
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Intake link */}
            <div className="mb-5">
              <div className="flex items-center gap-2 mb-1.5">
                <Mic className="h-4 w-4 text-gold" />
                <p className="text-[10px] uppercase tracking-[0.25em] text-gold/80 font-mono">
                  Step 2 — Voice intake (~5 min on phone)
                </p>
              </div>
              <div className="flex items-stretch gap-2">
                <input
                  readOnly
                  value={intakeShareLink}
                  onFocus={(e) => e.currentTarget.select()}
                  className="flex-1 bg-black/40 border border-gold/30 rounded px-3 py-2 text-white/90 text-xs font-mono truncate focus:outline-none focus:border-gold/60"
                />
                <Button
                  onClick={copyIntakeLink}
                  className="bg-gold/15 hover:bg-gold/25 text-gold border border-gold/40 px-3"
                  aria-label="Copy intake link"
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 mb-3">
              <Button
                onClick={copyShareMessage}
                variant="outline"
                className="bg-white/5 border-white/10 text-white hover:bg-white/10"
              >
                <Copy className="mr-2 h-4 w-4" />
                Copy full message
              </Button>
              <Button
                onClick={downloadShareEml}
                variant="outline"
                className="bg-white/5 border-white/10 text-white hover:bg-white/10"
              >
                <FileDown className="mr-2 h-4 w-4" />
                Download .eml
              </Button>
              <Button
                onClick={openShareInEmail}
                className="gradient-button text-black font-semibold col-span-2"
              >
                <Mail className="mr-2 h-4 w-4" />
                Open in Email (both links)
              </Button>
            </div>
            <p className="text-white/40 text-xs leading-relaxed">
              <span className="text-gold">Copy full message</span> grabs both links plus a friendly note in one block.{" "}
              <span className="text-gold">Open in Email</span> launches your default mail app with both links pre-filled.{" "}
              <span className="text-gold">Download .eml</span> saves a draft you can drag into any mail client.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
