"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { checkMasterAuth } from "@/lib/auth"
import { generateClientId } from "@/lib/auth"
import { type OfferType, OFFER_DEFAULTS, type Invitation } from "@/lib/types"
import Link from "next/link"
import { Share2, Download, Trash2, Mail, CheckCircle2 } from "lucide-react"
import { getInvitations, saveInvitation, deleteInvitation, sendInvitationEmail } from "@/lib/storage"
import { generatePDFFromText } from "@/lib/pdf"
import { MSATemplate, WelcomeTemplate, InvoiceTemplate } from "@/lib/templates"

// Skip static generation - requires client-side auth and database access
export const dynamic = "force-dynamic"

export default function InvitationsPage() {
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const [businessName, setBusinessName] = useState("")
  const [contactName, setContactName] = useState("")
  const [clientEmail, setClientEmail] = useState("")
  const [sendingId, setSendingId] = useState<string | null>(null)
  const [isReferral, setIsReferral] = useState<"yes" | "no">("no")
  const [referralName, setReferralName] = useState("")
  const [offerType, setOfferType] = useState<OfferType>("Orage90")
  const [setupFee, setSetupFee] = useState(7500)
  const [monthlyFee, setMonthlyFee] = useState(2500)
  const [customServices, setCustomServices] = useState("")
  const [specialNotes, setSpecialNotes] = useState("")
  const [invitations, setInvitations] = useState<Invitation[]>([])
  const [generatedLink, setGeneratedLink] = useState("")
  const [reviewStep, setReviewStep] = useState(false)
  const [reviewSubStep, setReviewSubStep] = useState<"edit" | "preview">("edit")
  const [contractPreview, setContractPreview] = useState("")
  const [editableNotes, setEditableNotes] = useState("")
  const [activeTab, setActiveTab] = useState<"agreement" | "welcome" | "invoice">("agreement")
  const [editableMSA, setEditableMSA] = useState("")
  const [editableWelcome, setEditableWelcome] = useState("")
  const [editableInvoice, setEditableInvoice] = useState("")
  const [selectedInvitations, setSelectedInvitations] = useState<Set<string>>(new Set())
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  useEffect(() => {
    setMounted(true)
    if (!checkMasterAuth()) {
      router.push("/")
      return
    }
    loadInvitations()
  }, [router])

  const loadInvitations = async () => {
    console.log("[v0] Loading invitations...")
    const data = await getInvitations()
    console.log("[v0] Loaded invitations:", data)
    if (data && data.length > 0) {
      setInvitations(data)
    } else if (invitations.length === 0) {
      // Only set empty array if current state is also empty
      setInvitations([])
    }
  }

  const handleOfferChange = (offer: OfferType) => {
    setOfferType(offer)
    setSetupFee(OFFER_DEFAULTS[offer].setup)
    setMonthlyFee(OFFER_DEFAULTS[offer].monthly)
  }

  const handleCreateInvitation = async () => {
    if (!businessName) {
      alert("Please enter a business name")
      return
    }

    // Generate documents
    const formData = {
      business_name: businessName,
      contact_name: contactName || businessName,
      client_email: clientEmail,
      client_phone: "",
      client_address: "",
      client_city: "",
      client_state: "",
      client_zip: "",
      offer_type: offerType,
      setup_fee: setupFee,
      monthly_fee: monthlyFee,
      custom_services: customServices,
      special_notes: specialNotes,
      signature: "",
      signature_date: new Date().toISOString(),
      portal_login_url: "",
    }

    const msaContent = MSATemplate(formData)
    const welcomeContent = WelcomeTemplate(formData)
    const invoiceContent = InvoiceTemplate(formData)

    setEditableMSA(msaContent)
    setEditableWelcome(welcomeContent)
    setEditableInvoice(invoiceContent)
    setEditableNotes(specialNotes)
    setReviewStep(true)
    setActiveTab("agreement")
  }

  const handleConfirmInvitation = async () => {
    console.log("[v0] Starting PDF generation from edited content")
    console.log("[v0] editableMSA length:", editableMSA.length)
    console.log("[v0] editableWelcome length:", editableWelcome.length)
    console.log("[v0] editableInvoice length:", editableInvoice.length)
    
    try {
      // Validate that we have content to generate PDFs from
      if (!editableMSA || !editableWelcome || !editableInvoice) {
        alert("Please ensure all documents have content before confirming.")
        return
      }

      // Generate PDFs - each wrapped in its own try/catch so one failure doesn't block all
      let msaPdfBase64 = ""
      let welcomePdfBase64 = ""
      let invoicePdfBase64 = ""
      
      try {
        const msaPdfBlob = await generatePDFFromText(editableMSA, `${businessName}_MSA`)
        msaPdfBase64 = await blobToBase64(msaPdfBlob)
      } catch (e) {
        console.error("[v0] MSA PDF generation failed:", e)
      }
      
      try {
        const welcomePdfBlob = await generatePDFFromText(editableWelcome, `${businessName}_Welcome`)
        welcomePdfBase64 = await blobToBase64(welcomePdfBlob)
      } catch (e) {
        console.error("[v0] Welcome PDF generation failed:", e)
      }
      
      try {
        const invoicePdfBlob = await generatePDFFromText(editableInvoice, `${businessName}_Invoice`)
        invoicePdfBase64 = await blobToBase64(invoicePdfBlob)
      } catch (e) {
        console.error("[v0] Invoice PDF generation failed:", e)
      }

      const invitation: Invitation = {
        id: generateClientId(),
        business_name: businessName,
        contact_name: contactName || undefined,
        client_email: clientEmail.trim() || undefined,
        offer_type: offerType,
        setup_fee: setupFee,
        monthly_fee: monthlyFee,
        custom_services: customServices || undefined,
        special_notes: editableNotes || undefined,
        is_referral: isReferral,
        referral_name: isReferral === "yes" ? referralName : undefined,
        created_at: new Date().toISOString(),
        status: "pending",
        // Store edited content
        msa_content: editableMSA,
        welcome_content: editableWelcome,
        invoice_content: editableInvoice,
        // Store generated PDFs (may be empty if generation failed)
        msa_pdf_data: msaPdfBase64 || undefined,
        welcome_pdf_data: welcomePdfBase64 || undefined,
        invoice_pdf_data: invoicePdfBase64 || undefined,
      }

      setInvitations((prev) => [invitation, ...prev])

      await saveInvitation(invitation)
      console.log("[v0] Invitation saved successfully")

      const link = `${window.location.origin}/onboard/${invitation.id}`
      setGeneratedLink(link)

      // Reset form and review step
      setBusinessName("")
      setContactName("")
      setClientEmail("")
      setIsReferral("no")
      setReferralName("")
      setCustomServices("")
      setSpecialNotes("")
      setEditableNotes("")
      setEditableMSA("")
      setEditableWelcome("")
      setEditableInvoice("")
      setReviewStep(false)
      setReviewSubStep("edit")

      setTimeout(async () => {
        await loadInvitations()
      }, 1500)
    } catch (error) {
      console.error("[v0] Error generating PDFs:", error)
      alert("Error generating PDFs. Please try again.")
    }
  }

  const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onloadend = () => {
        const base64 = reader.result as string
        resolve(base64.split(",")[1]) // Remove data:application/pdf;base64, prefix
      }
      reader.onerror = reject
      reader.readAsDataURL(blob)
    })
  }

  const downloadDocument = (content: string, filename: string) => {
    // Templates emit branded HTML — save as a standalone .html file so it
    // opens in a browser looking exactly like the in-app preview.
    const wrapped = `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><title>${filename}</title><link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Montserrat:wght@500;600;700&display=swap" rel="stylesheet"></head><body style="margin:0;background:#FFFFFF;">${content}</body></html>`
    const blob = new Blob([wrapped], { type: "text/html;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const element = document.createElement("a")
    element.href = url
    element.download = filename.replace(/\.txt$/i, "") + ".html"
    document.body.appendChild(element)
    element.click()
    document.body.removeChild(element)
    URL.revokeObjectURL(url)
  }

  const handleCancelReview = () => {
    setReviewStep(false)
    setReviewSubStep("edit")
    setEditableNotes("")
  }

  const handleSaveAndView = () => {
    // Move to PDF preview step
    setReviewSubStep("preview")
  }

  const toggleInvitationSelection = (invitationId: string) => {
    const newSelected = new Set(selectedInvitations)
    if (newSelected.has(invitationId)) {
      newSelected.delete(invitationId)
    } else {
      newSelected.add(invitationId)
    }
    setSelectedInvitations(newSelected)
  }

  const toggleSelectAll = () => {
    const pendingInvitations = invitations.filter((inv) => inv.status === "pending")
    if (selectedInvitations.size === pendingInvitations.length) {
      setSelectedInvitations(new Set())
    } else {
      setSelectedInvitations(new Set(pendingInvitations.map((inv) => inv.id)))
    }
  }

  const handleDeleteSelected = async () => {
    if (selectedInvitations.size === 0) {
      alert("Please select at least one invitation to delete")
      return
    }

    console.log("[v0] Deleting invitations:", Array.from(selectedInvitations))

    try {
      for (const id of selectedInvitations) {
        await deleteInvitation(id)
      }

      console.log("[v0] Invitations deleted successfully")
      setSelectedInvitations(new Set())
      setShowDeleteConfirm(false)
      await loadInvitations()
    } catch (error) {
      console.error("[v0] Error deleting invitations:", error)
      alert("Error deleting invitations. Please try again.")
    }
  }

  const copyLink = () => {
    navigator.clipboard.writeText(generatedLink)
    alert("Link copied to clipboard")
  }

  const shareLink = () => {
    const text = `Here is your onboarding link for Orage AI Agency, please complete to get started:

${generatedLink}`
    navigator.clipboard.writeText(text)
    alert("Share text copied to clipboard!")
  }

  const handleSendInvitation = async (inv: Invitation) => {
    const target = (inv.client_email || "").trim() ||
      (prompt(`Email the signing link to ${inv.business_name} at:`)?.trim() ?? "")
    if (!target) return
    setSendingId(inv.id)
    try {
      const res = await sendInvitationEmail(inv.id, { email: target })
      setInvitations((prev) =>
        prev.map((i) =>
          i.id === inv.id ? { ...i, client_email: res.sent_to, sent_at: res.sent_at } : i,
        ),
      )
      alert(`Signing link emailed to ${res.sent_to}`)
    } catch (e) {
      alert(`Failed to send invitation: ${(e as Error).message}`)
    } finally {
      setSendingId(null)
    }
  }

  const handleSendGeneratedLink = async () => {
    // Latest created invitation is at the top of the list.
    const latest = invitations[0]
    if (!latest) return
    await handleSendInvitation(latest)
  }

  const sharePendingLink = (id: string) => {
    const link = `${window.location.origin}/onboard/${id}`
    const text = `Here is your onboarding link for Orage AI Agency, please complete to get started:

${link}`
    navigator.clipboard.writeText(text)
    alert("Share text copied")
  }

  if (!mounted) return null

  return (
    <div className="min-h-screen bg-orage-black p-4 md:p-8 overflow-x-hidden">
      <div className="max-w-5xl mx-auto w-full">
        <Link href="/c-suite/admin" className="text-gold hover:text-gold/80 mb-8 inline-block">
          ← Back to Dashboard
        </Link>

        <h1 className="font-heading text-3xl md:text-5xl text-gold mb-8 break-words">
          {reviewStep ? (reviewSubStep === "edit" ? "REVIEW & EDIT CONTRACT" : "PREVIEW DOCUMENTS") : "CREATE CLIENT INVITATION"}
        </h1>

        {!reviewStep ? (
          <div className="bg-white/5 backdrop-blur-sm border border-gold/20 rounded-lg p-4 md:p-8 mb-8 w-full max-w-full overflow-hidden">
            <div className="space-y-6">
              <div>
                <label className="block text-white font-body mb-2 text-sm md:text-base">Business Name</label>
                <input
                  type="text"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-gold/50"
                  placeholder="Enter client business name"
                />
              </div>

              <div>
                <label className="block text-white font-body mb-2 text-sm md:text-base">Offer Type</label>
                <select
                  value={offerType}
                  onChange={(e) => handleOfferChange(e.target.value as OfferType)}
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-gold/50"
                >
                  {(Object.keys(OFFER_DEFAULTS) as OfferType[]).map((offer) => (
                    <option key={offer} value={offer} className="bg-black">
                      {OFFER_DEFAULTS[offer].displayName} — ${OFFER_DEFAULTS[offer].setup.toLocaleString()} / ${OFFER_DEFAULTS[offer].monthly.toLocaleString()}/mo
                    </option>
                  ))}
                </select>
                <p className="text-white/60 text-xs md:text-sm mt-2 break-words">
                  {OFFER_DEFAULTS[offerType].description}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-white font-body mb-2 text-sm md:text-base">90-Day Onboarding Fee</label>
                  <input
                    type="number"
                    value={setupFee}
                    onChange={(e) => setSetupFee(Number(e.target.value))}
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-gold/50"
                  />
                  <p className="text-white/40 text-xs mt-1">Override the default if needed</p>
                </div>
                <div>
                  <label className="block text-white font-body mb-2 text-sm md:text-base">Monthly Recurring</label>
                  <input
                    type="number"
                    value={monthlyFee}
                    onChange={(e) => setMonthlyFee(Number(e.target.value))}
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-gold/50"
                  />
                  <p className="text-white/40 text-xs mt-1">Override the default if needed</p>
                </div>
              </div>

              <div>
                <label className="block text-white font-body mb-2 text-sm md:text-base">Contact Name (Optional)</label>
                <input
                  type="text"
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-gold/50"
                  placeholder="Enter contact person's name"
                />
              </div>

              <div>
                <label className="block text-white font-body mb-2 text-sm md:text-base">Client Email *</label>
                <input
                  type="email"
                  value={clientEmail}
                  onChange={(e) => setClientEmail(e.target.value)}
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-gold/50"
                  placeholder="client@business.com"
                />
                <p className="text-white/40 text-xs mt-1">The signing link will be emailed here from team@orage.agency.</p>
              </div>

              <div>
                <label className="block text-white font-body mb-2 text-sm md:text-base">Is This a Referral?</label>
                <div className="space-y-3">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="radio"
                      name="referral"
                      value="no"
                      checked={isReferral === "no"}
                      onChange={(e) => setIsReferral(e.target.value as "yes" | "no")}
                      className="accent-gold w-4 h-4"
                    />
                    <span className="text-white font-body text-sm md:text-base">No</span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="radio"
                      name="referral"
                      value="yes"
                      checked={isReferral === "yes"}
                      onChange={(e) => setIsReferral(e.target.value as "yes" | "no")}
                      className="accent-gold w-4 h-4"
                    />
                    <span className="text-white font-body text-sm md:text-base">Yes</span>
                  </label>
                </div>
              </div>

              {isReferral === "yes" && (
                <div>
                  <label className="block text-white font-body mb-2 text-sm md:text-base">Referral Name</label>
                  <input
                    type="text"
                    value={referralName}
                    onChange={(e) => setReferralName(e.target.value)}
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-gold/50"
                    placeholder="Enter referral source name"
                  />
                </div>
              )}
              <button
                onClick={handleCreateInvitation}
                className="flex-1 px-4 md:px-8 py-4 bg-white/10 hover:bg-white/20 text-white font-heading text-base md:text-xl rounded-lg transition-all"
              >
                CREATE INVITATION
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-white/5 backdrop-blur-sm border border-gold/20 rounded-lg p-4 md:p-8 mb-8 w-full max-w-full overflow-hidden">
            <div className="space-y-6">
              <div className="bg-black/40 border border-gold/30 rounded-lg p-6">
                <h3 className="font-heading text-2xl text-gold mb-4">Contract Summary</h3>
                <div className="space-y-3 text-white font-body text-sm md:text-base">
                  <p><span className="text-gold font-bold">Business:</span> {businessName}</p>
                  <p><span className="text-gold font-bold">Offer:</span> {OFFER_DEFAULTS[offerType].displayName}</p>
                  <p><span className="text-gold font-bold">90-Day Onboarding Fee:</span> ${setupFee.toLocaleString()}</p>
                  <p><span className="text-gold font-bold">Monthly Recurring:</span> ${monthlyFee.toLocaleString()}/mo</p>
                  {customServices && (
                    <p><span className="text-gold font-bold">Custom Services:</span> {customServices}</p>
                  )}
                </div>
              </div>

              {/* Document Tabs */}
              <div className="space-y-4">
                <div className="flex flex-wrap gap-2 border-b border-white/20">
                  <button
                    onClick={() => setActiveTab("agreement")}
                    className={`px-4 py-2 font-heading ${activeTab === "agreement" ? "border-b-2 border-gold text-gold" : "text-white/60 hover:text-white"}`}
                  >
                    MSA Agreement
                  </button>
                  <button
                    onClick={() => setActiveTab("welcome")}
                    className={`px-4 py-2 font-heading ${activeTab === "welcome" ? "border-b-2 border-gold text-gold" : "text-white/60 hover:text-white"}`}
                  >
                    Welcome Packet
                  </button>
                  <button
                    onClick={() => setActiveTab("invoice")}
                    className={`px-4 py-2 font-heading ${activeTab === "invoice" ? "border-b-2 border-gold text-gold" : "text-white/60 hover:text-white"}`}
                  >
                    Invoice
                  </button>
                </div>

                {/* Document Content - Editable (raw HTML — tweak text inside the tags) */}
                <div className="bg-[#0a0a0a] p-2 md:p-4 rounded-lg border border-[#B68039]/30 max-h-[28rem] overflow-y-auto shadow-xl">
                  {activeTab === "agreement" && (
                    <textarea
                      value={editableMSA}
                      onChange={(e) => setEditableMSA(e.target.value)}
                      className="w-full bg-transparent text-white/90 font-mono text-[11px] leading-relaxed focus:outline-none resize-y p-2"
                      rows={20}
                    />
                  )}
                  {activeTab === "welcome" && (
                    <textarea
                      value={editableWelcome}
                      onChange={(e) => setEditableWelcome(e.target.value)}
                      className="w-full bg-transparent text-white/90 font-mono text-[11px] leading-relaxed focus:outline-none resize-y p-2"
                      rows={20}
                    />
                  )}
                  {activeTab === "invoice" && (
                    <textarea
                      value={editableInvoice}
                      onChange={(e) => setEditableInvoice(e.target.value)}
                      className="w-full bg-transparent text-white/90 font-mono text-[11px] leading-relaxed focus:outline-none resize-y p-2"
                      rows={20}
                    />
                  )}
                </div>

                {/* Download Buttons */}
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => downloadDocument(editableMSA, `${businessName}_Agreement.txt`)}
                    className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-all text-sm"
                  >
                    <Download className="h-4 w-4" />
                    Download Agreement
                  </button>
                  <button
                    onClick={() => downloadDocument(editableWelcome, `${businessName}_Welcome.txt`)}
                    className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-all text-sm"
                  >
                    <Download className="h-4 w-4" />
                    Download Welcome
                  </button>
                  <button
                    onClick={() => downloadDocument(editableInvoice, `${businessName}_Invoice.txt`)}
                    className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-all text-sm"
                  >
                    <Download className="h-4 w-4" />
                    Download Invoice
                  </button>
                </div>
              </div>

              {/* Special Notes */}
              <div>
                <label className="block text-white font-body mb-2 text-sm md:text-base">Edit Special Notes (Optional)</label>
                <textarea
                  value={editableNotes}
                  onChange={(e) => setEditableNotes(e.target.value)}
                  rows={4}
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-gold/50 text-sm md:text-base"
                  placeholder="Add any additional terms or notes for the client..."
                />
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  onClick={handleCancelReview}
                  className="flex-1 px-4 md:px-8 py-4 bg-white/10 hover:bg-white/20 text-white font-heading text-base md:text-lg rounded-lg transition-all"
                >
                  BACK TO EDIT
                </button>
                <button
                  onClick={handleSaveAndView}
                  className="flex-1 bg-gradient-to-r from-[#B68039] to-[#8B6028] hover:from-[#9B6A2F] hover:to-[#7A5222] text-white font-heading text-base md:text-xl px-4 md:px-8 py-4 rounded-lg transition-all duration-300 transform hover:scale-105"
                >
                  SAVE AND VIEW
                </button>
              </div>
            </div>
          </div>
        )}

        {reviewStep && reviewSubStep === "preview" && (
          <div className="bg-white/5 backdrop-blur-sm border border-gold/20 rounded-lg p-4 md:p-8 w-full max-w-full overflow-hidden">
            <h2 className="font-heading text-2xl md:text-3xl text-gold mb-6 break-words">PDF PREVIEW</h2>
            
            <div className="space-y-6">
              {/* PDF Tabs */}
              <div className="flex flex-wrap gap-2 border-b border-white/20 pb-4">
                <button
                  onClick={() => setActiveTab("agreement")}
                  className={`px-4 py-2 font-heading ${activeTab === "agreement" ? "border-b-2 border-gold text-gold" : "text-white/60 hover:text-white"}`}
                >
                  MSA Agreement
                </button>
                <button
                  onClick={() => setActiveTab("welcome")}
                  className={`px-4 py-2 font-heading ${activeTab === "welcome" ? "border-b-2 border-gold text-gold" : "text-white/60 hover:text-white"}`}
                >
                  Welcome Packet
                </button>
                <button
                  onClick={() => setActiveTab("invoice")}
                  className={`px-4 py-2 font-heading ${activeTab === "invoice" ? "border-b-2 border-gold text-gold" : "text-white/60 hover:text-white"}`}
                >
                  Invoice
                </button>
              </div>

              {/* Rendered preview — exactly what the client will see */}
              <div className="bg-[#0a0a0a] p-2 md:p-4 rounded-lg border border-[#B68039]/30 max-h-[32rem] overflow-y-auto shadow-xl">
                <div
                  className="bg-white rounded"
                  dangerouslySetInnerHTML={{
                    __html:
                      activeTab === "agreement"
                        ? editableMSA
                        : activeTab === "welcome"
                        ? editableWelcome
                        : editableInvoice,
                  }}
                />
              </div>

              {/* Download Buttons */}
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => downloadDocument(editableMSA, `${businessName}_Agreement.txt`)}
                  className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-all text-sm"
                >
                  <Download className="h-4 w-4" />
                  Download Agreement
                </button>
                <button
                  onClick={() => downloadDocument(editableWelcome, `${businessName}_Welcome.txt`)}
                  className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-all text-sm"
                >
                  <Download className="h-4 w-4" />
                  Download Welcome
                </button>
                <button
                  onClick={() => downloadDocument(editableInvoice, `${businessName}_Invoice.txt`)}
                  className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-all text-sm"
                >
                  <Download className="h-4 w-4" />
                  Download Invoice
                </button>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  onClick={() => setReviewSubStep("edit")}
                  className="flex-1 px-4 md:px-8 py-4 bg-white/10 hover:bg-white/20 text-white font-heading text-base md:text-lg rounded-lg transition-all"
                >
                  BACK TO EDIT
                </button>
                <button
                  onClick={handleConfirmInvitation}
                  className="flex-1 bg-gradient-to-r from-[#B68039] to-[#8B6028] hover:from-[#9B6A2F] hover:to-[#7A5222] text-white font-heading text-base md:text-xl px-4 md:px-8 py-4 rounded-lg transition-all duration-300 transform hover:scale-105"
                >
                  CONFIRM & CREATE INVITATION
                </button>
              </div>
            </div>
          </div>
        )}

        {generatedLink && (
          <div className="bg-[#B68039]/20 border border-[#B68039]/50 rounded-lg p-4 md:p-6 mb-8 w-full max-w-full overflow-hidden">
            <h3 className="font-heading text-xl md:text-2xl text-gold mb-4 break-words">Invitation Created</h3>

            <div className="bg-black/40 border border-white/20 rounded-lg p-4 mb-4 overflow-hidden w-full">
              <p className="text-white/60 text-xs md:text-sm mb-2 uppercase tracking-wide">Text Ready to Send:</p>
              <div className="text-white font-body whitespace-pre-line leading-relaxed break-words text-xs md:text-base w-full overflow-x-hidden">
                {`Here is your onboarding link for Orage AI Agency, please complete to get started:

${generatedLink}`}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 w-full">
              <input
                type="text"
                value={generatedLink}
                readOnly
                className="flex-1 bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white text-xs md:text-base break-all w-full"
              />
              <button
                onClick={copyLink}
                className="w-full sm:w-auto px-4 md:px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-all text-sm md:text-base whitespace-normal h-auto min-h-[44px]"
              >
                Copy Link Only
              </button>
              <button
                onClick={shareLink}
                className="w-full sm:w-auto px-4 md:px-8 py-3 bg-white/10 hover:bg-white/20 text-white font-bold rounded-lg transition-all flex items-center justify-center gap-2 text-xs md:text-base whitespace-normal h-auto min-h-[44px]"
              >
                <Share2 className="h-4 w-4 flex-shrink-0" />
                <span>COPY FULL INVITATION MESSAGE</span>
              </button>
              <button
                onClick={handleSendGeneratedLink}
                disabled={sendingId !== null}
                className="w-full sm:w-auto px-4 md:px-8 py-3 bg-gradient-to-r from-[#B68039] to-[#8B6028] hover:from-[#9B6A2F] hover:to-[#7A5222] disabled:opacity-50 text-white font-bold rounded-lg transition-all flex items-center justify-center gap-2 shadow-lg transform hover:scale-105 text-xs md:text-base whitespace-normal h-auto min-h-[44px]"
              >
                <Mail className="h-4 w-4 flex-shrink-0" />
                <span>{sendingId ? "SENDING..." : "EMAIL TO CLIENT"}</span>
              </button>
            </div>
          </div>
        )}

        <div className="bg-white/5 backdrop-blur-sm border border-gold/20 rounded-lg p-4 md:p-8 w-full max-w-full overflow-hidden">
          <div className="flex flex-col gap-4 mb-6">
            <h2 className="font-heading text-2xl md:text-3xl text-gold break-words">PENDING INVITATIONS</h2>
            {invitations.filter((inv) => inv.status === "pending").length > 0 && (
              <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
                <button
                  onClick={toggleSelectAll}
                  className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded transition-all text-sm"
                >
                  {selectedInvitations.size === invitations.filter((inv) => inv.status === "pending").length &&
                  invitations.filter((inv) => inv.status === "pending").length > 0
                    ? "Deselect All"
                    : "Select All"}
                </button>
                {selectedInvitations.size > 0 && (
                  <>
                    <span className="text-white/60 text-sm">{selectedInvitations.size} selected</span>
                    <button
                      onClick={() => setShowDeleteConfirm(true)}
                      className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded transition-all text-sm flex items-center gap-2"
                    >
                      <Trash2 className="h-4 w-4" />
                      Delete Selected
                    </button>
                  </>
                )}
              </div>
            )}
          </div>

          {showDeleteConfirm && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <div className="bg-[#0a0a0a] border border-red-500/50 rounded-lg p-6 max-w-md w-full">
                <h3 className="font-heading text-xl text-red-400 mb-3">Confirm Deletion</h3>
                <p className="text-white/70 mb-6">
                  Are you sure you want to delete {selectedInvitations.size} invitation{selectedInvitations.size !== 1 ? "s" : ""}? This action cannot be undone.
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowDeleteConfirm(false)}
                    className="flex-1 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDeleteSelected}
                    className="flex-1 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded transition-all font-bold"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          )}

          {invitations.filter((inv) => inv.status === "pending").length === 0 ? (
            <p className="text-white/60">No pending invitations</p>
          ) : (
            <div className="space-y-4">
              {invitations
                .filter((inv) => inv.status === "pending")
                .map((inv) => (
                  <div key={inv.id} className="bg-white/5 border border-white/20 rounded-lg p-4 w-full overflow-hidden">
                    <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                      <div className="flex items-start gap-3 flex-1 min-w-0 w-full">
                        <input
                          type="checkbox"
                          checked={selectedInvitations.has(inv.id)}
                          onChange={() => toggleInvitationSelection(inv.id)}
                          className="mt-1 w-5 h-5 accent-gold cursor-pointer flex-shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <h4 className="font-heading text-lg md:text-xl text-white break-words">{inv.business_name}</h4>
                          <p className="text-white/60 text-sm md:text-base break-words">
                            {OFFER_DEFAULTS[inv.offer_type as OfferType]?.displayName || inv.offer_type} — ${inv.setup_fee.toLocaleString()} (90-day) + ${inv.monthly_fee.toLocaleString()}/mo
                          </p>
                          {inv.client_email && (
                            <p className="text-white/60 text-xs md:text-sm mt-1 break-all">
                              <span className="text-gold">Email:</span> {inv.client_email}
                            </p>
                          )}
                          {inv.sent_at && (
                            <p className="text-emerald-400/80 text-xs mt-1 flex items-center gap-1">
                              <CheckCircle2 className="h-3 w-3" />
                              Sent {new Date(inv.sent_at).toLocaleString()}
                            </p>
                          )}
                          <p className="text-white/40 text-xs md:text-sm mt-1 break-all">ID: {inv.id}</p>
                        </div>
                      </div>
                      <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                        <button
                          onClick={() => {
                            const link = `${window.location.origin}/onboard/${inv.id}`
                            navigator.clipboard.writeText(link)
                            alert("Link copied")
                          }}
                          className="w-full sm:w-auto px-4 py-2 bg-gold/20 hover:bg-gold/30 text-gold rounded transition-all text-sm whitespace-normal h-auto min-h-[40px]"
                        >
                          Copy Link
                        </button>
                        <button
                          onClick={() => sharePendingLink(inv.id)}
                          className="w-full sm:w-auto px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded transition-all text-sm flex items-center justify-center gap-2 text-xs md:text-sm whitespace-normal h-auto min-h-[40px]"
                        >
                          <Share2 className="h-3 w-3 flex-shrink-0" />
                          <span>COPY MESSAGE</span>
                        </button>
                        <button
                          onClick={() => handleSendInvitation(inv)}
                          disabled={sendingId === inv.id}
                          className="w-full sm:w-auto px-4 py-2 bg-gradient-to-r from-[#B68039] to-[#8B6028] hover:from-[#9B6A2F] hover:to-[#7A5222] disabled:opacity-50 text-white font-bold rounded transition-all text-sm flex items-center justify-center gap-2 shadow-md transform hover:scale-105 text-xs md:text-sm whitespace-normal h-auto min-h-[40px]"
                        >
                          <Mail className="h-3 w-3 flex-shrink-0" />
                          <span>{sendingId === inv.id ? "SENDING..." : inv.sent_at ? "RESEND" : "EMAIL CLIENT"}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
