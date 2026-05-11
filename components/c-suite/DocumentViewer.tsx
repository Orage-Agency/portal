"use client"

import type { OnboardingData } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Copy, FolderOpen, Download, Check, Mail, KeyRound, ExternalLink, Edit3, Eye } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"
import { useState, useEffect, useMemo } from "react"
import MSATemplate from "./templates/MSATemplate"
import InvoiceTemplate from "./templates/InvoiceTemplate"
import WelcomeTemplate from "./templates/WelcomeTemplate"
import { saveClient, saveClientLogin, saveNotification } from "@/lib/storage"
import { generateAndDownloadPDF } from "@/lib/pdf"

interface DocumentViewerProps {
  formData: OnboardingData
}

type DocKey = "msa" | "invoice" | "welcome"

export default function DocumentViewer({ formData }: DocumentViewerProps) {
  const { toast } = useToast()
  const router = useRouter()
  const [clientId, setClientId] = useState<string>("")
  const [portalUrl, setPortalUrl] = useState<string>("")

  // Generate template content once per render — recompute only if formData changes
  const initialMSA = useMemo(() => MSATemplate(formData), [formData])
  const initialInvoice = useMemo(() => InvoiceTemplate(formData), [formData])
  const initialWelcome = useMemo(() => WelcomeTemplate(formData), [formData])

  // Editable state for each doc — initialized from templates
  const [msaContent, setMsaContent] = useState(initialMSA)
  const [invoiceContent, setInvoiceContent] = useState(initialInvoice)
  const [welcomeContent, setWelcomeContent] = useState(initialWelcome)

  // Per-doc view mode: "view" renders styled, "edit" shows textarea
  const [viewMode, setViewMode] = useState<Record<DocKey, "view" | "edit">>({
    msa: "edit",
    invoice: "edit",
    welcome: "edit",
  })

  const [isSaving, setIsSaving] = useState(false)
  const [isSaved, setIsSaved] = useState(false)

  useEffect(() => {
    const id = `OAA-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`
    setClientId(id)
    setPortalUrl(`${window.location.origin}/portal/login`)
  }, [])

  const toggleViewMode = (doc: DocKey) => {
    setViewMode((prev) => ({ ...prev, [doc]: prev[doc] === "view" ? "edit" : "view" }))
  }

  const resetToTemplate = (doc: DocKey) => {
    if (!confirm("Reset to the original template? This will discard your edits to this document.")) return
    if (doc === "msa") setMsaContent(initialMSA)
    if (doc === "invoice") setInvoiceContent(initialInvoice)
    if (doc === "welcome") setWelcomeContent(initialWelcome)
    toast({ title: "Reset", description: "Document reset to template" })
  }

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
    toast({ title: "Copied!", description: `${label} copied to clipboard` })
  }

  const copyAllCredentials = () => {
    const credentials = `Here is your client portal access credentials for Orage AI Agency. Please save these for your records and do not share with anyone:

Portal Login URL: ${portalUrl}

Login Credentials:
- Client ID: ${clientId}
- Email: ${formData.client_email}`
    navigator.clipboard.writeText(credentials)
    toast({ title: "Credentials Copied!", description: "Text is ready to send to your client", duration: 5000 })
  }

  const copyNextStepMessage = () => {
    const message = `Thank you for completing your initial agreement onboarding with Orage AI Agency!

To fully activate your services, please complete your next onboarding steps:

CRM & AI Agent Onboarding: https://client.orage.agency/crm

This is required to access all features in your client portal. Please complete this as soon as possible.

If you have any questions, feel free to reach out to our team.`
    navigator.clipboard.writeText(message)
    toast({ title: "Next Step Message Copied!", description: "Ready to send to your client", duration: 5000 })
  }

  const downloadAsPDF = async (content: string, filename: string) => {
    // Templates emit self-contained, branded, light-mode HTML — render straight to PDF.
    // If a client signature exists and this is the MSA, inline it into the signature block.
    let finalContent = content
    if (filename.includes("MSA") && formData.signature) {
      finalContent = finalContent.replace(
        /<div style="height:48px;border-bottom:1px solid #B68039;margin:0 0 6px;"><\/div>/g,
        (_match, offset, source) => {
          // Replace only the SECOND signature placeholder (the client one).
          const before = source.slice(0, offset)
          const isClient = (before.match(/height:48px;border-bottom:1px solid #B68039/g) || []).length >= 1
          if (!isClient) return _match
          return `<img src="${formData.signature}" alt="Client Signature" style="max-height:60px;display:block;margin:0 0 4px;" />`
        },
      )
    }
    await generateAndDownloadPDF(finalContent, filename)
    toast({ title: "PDF downloaded", description: "Saved to your downloads folder." })
  }

  const saveToPortal = async () => {
    setIsSaving(true)
    try {
      const clientRecord = {
        id: clientId,
        name: formData.contact_name,
        business_name: formData.business_name,
        email: formData.client_email,
        phone: formData.client_phone,
        address: `${formData.client_address || ""}, ${formData.client_city || ""}, ${formData.client_state || ""} ${formData.client_zip || ""}`,
        plan: formData.offer_type,
        price: formData.monthly_fee,
        setup_fee: formData.setup_fee,
        start_date: new Date().toISOString(),
        portal_access: formData.client_email,
        msa_content: msaContent,
        invoice_content: invoiceContent,
        welcome_content: welcomeContent,
        client_signature: formData.signature,
        signed_at: formData.signature_date,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }

      await saveClient(clientRecord)
      await saveClientLogin({
        id: clientId,
        client_id: clientId,
        password: formData.client_email,
        created_at: new Date().toISOString(),
      })
      await saveNotification({
        id: `notif-${Date.now()}`,
        title: "Onboarding Completed",
        message: `${formData.business_name} onboarding completed (direct entry)`,
        type: "onboarding_completed",
        clientId: clientId,
        clientName: formData.business_name,
        read: false,
        created_at: new Date().toISOString(),
      })

      setIsSaved(true)
      toast({
        title: "Saved to Portal!",
        description: "Client documents and login credentials saved",
        duration: 5000,
      })
      router.push("/c-suite/documents")
    } catch (error) {
      console.error("[v0] Error saving to portal:", error)
      toast({
        title: "Error",
        description: "Failed to save documents. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const renderDocPanel = (
    title: string,
    docKey: DocKey,
    content: string,
    setContent: (v: string) => void,
    initialContent: string,
    filenameStem: string,
  ) => {
    const mode = viewMode[docKey]
    const hasEdits = content !== initialContent

    return (
      <div className="space-y-3">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-2 md:gap-0">
          <div className="flex items-center gap-3 flex-wrap">
            <h3 className="font-heading text-xl md:text-2xl text-[#B68039]">{title}</h3>
            {hasEdits && (
              <span className="text-xs font-body text-gold/70 bg-gold/10 border border-gold/30 px-2 py-0.5 rounded">
                edited
              </span>
            )}
          </div>
          <div className="flex flex-wrap gap-2 w-full md:w-auto">
            <Button
              onClick={() => toggleViewMode(docKey)}
              variant="outline"
              size="sm"
              className="bg-white/5 border-white/10 text-white hover:bg-white/10"
            >
              {mode === "edit" ? (
                <>
                  <Eye className="mr-2 h-4 w-4" />
                  Preview
                </>
              ) : (
                <>
                  <Edit3 className="mr-2 h-4 w-4" />
                  Edit
                </>
              )}
            </Button>
            {hasEdits && (
              <Button
                onClick={() => resetToTemplate(docKey)}
                variant="outline"
                size="sm"
                className="bg-white/5 border-white/10 text-white hover:bg-white/10"
              >
                Reset
              </Button>
            )}
            <Button
              onClick={() => downloadAsPDF(content, `${formData.business_name}_${filenameStem}`)}
              variant="outline"
              size="sm"
              className="gradient-button text-black font-semibold"
            >
              <Download className="mr-2 h-4 w-4" />
              PDF
            </Button>
            <Button
              onClick={() => copyToClipboard(content, title)}
              variant="outline"
              size="sm"
              className="bg-white/5 border-white/10 text-white hover:bg-white/10"
            >
              <Copy className="mr-2 h-4 w-4" />
              Copy
            </Button>
          </div>
        </div>
        <div className="bg-[#0a0a0a] p-2 md:p-4 rounded-lg border border-[#B68039]/30 max-h-[32rem] overflow-y-auto shadow-xl">
          {mode === "edit" ? (
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              spellCheck={false}
              className="w-full bg-transparent text-white/90 font-mono text-[11px] leading-relaxed focus:outline-none focus:ring-1 focus:ring-gold/30 resize-y rounded p-3 min-h-[20rem]"
              rows={22}
            />
          ) : (
            <div className="bg-white rounded" dangerouslySetInnerHTML={{ __html: content }} />
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="font-heading text-3xl md:text-4xl text-gold mb-2">REVIEW & SEND DOCUMENTS</h2>
        <p className="text-white/60 font-body">
          Review each document below. Click <span className="text-gold">Edit</span> to modify the text directly, then{" "}
          <span className="text-gold">Save to Portal</span> when you're ready to send.
        </p>
      </div>

      <div className="bg-gradient-to-r from-[#B68039]/20 to-[#B68039]/10 border-2 border-[#B68039] rounded-lg p-4 md:p-6">
        <div className="flex items-center gap-3 mb-4">
          <KeyRound className="h-6 w-6 text-[#B68039]" />
          <div>
            <h3 className="font-heading text-xl md:text-2xl text-[#B68039]">CLIENT PORTAL ACCESS</h3>
            <p className="text-white/70 font-body text-sm">Auto-generated login credentials for your client</p>
          </div>
        </div>

        <div className="bg-black/40 border border-gold/30 rounded-lg p-4 mb-4 overflow-hidden">
          <p className="text-gold text-xs mb-2 uppercase tracking-wide font-semibold">Text Ready to Send to Client:</p>
          <div className="text-white font-body whitespace-pre-line leading-relaxed text-sm break-words max-w-full">
            {`Here is your client portal access credentials for Orage AI Agency. Please save these for your records and do not share with anyone:

Portal Login URL: ${portalUrl}

Login Credentials:
- Client ID: ${clientId}
- Email: ${formData.client_email}`}
          </div>
        </div>

        <div className="space-y-3">
          <div className="bg-black/30 rounded-lg p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
            <div className="w-full overflow-hidden">
              <label className="text-white/60 font-body text-xs uppercase tracking-wider block mb-1">Portal Login URL</label>
              <code className="text-[#B68039] font-mono text-sm break-all whitespace-normal block">{portalUrl}</code>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => copyToClipboard(portalUrl, "Portal URL")}
                size="sm"
                className="h-8 w-8 p-0 bg-white/10 hover:bg-white/20 text-white"
              >
                <Copy className="h-4 w-4" />
              </Button>
              <Button
                onClick={() => window.open(portalUrl, "_blank")}
                size="sm"
                className="h-8 w-8 p-0 bg-white/10 hover:bg-white/20 text-white"
              >
                <ExternalLink className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="bg-black/30 rounded-lg p-3 flex items-center justify-between">
              <div className="overflow-hidden">
                <label className="text-white/60 font-body text-xs uppercase tracking-wider block mb-1">Client ID</label>
                <code className="text-white font-mono text-sm font-bold truncate block">{clientId}</code>
              </div>
              <Button
                onClick={() => copyToClipboard(clientId, "Client ID")}
                size="sm"
                className="h-8 w-8 p-0 bg-white/10 hover:bg-white/20 text-white shrink-0 ml-2"
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>

            <div className="bg-black/30 rounded-lg p-3 flex items-center justify-between">
              <div className="overflow-hidden">
                <label className="text-white/60 font-body text-xs uppercase tracking-wider block mb-1">Login Email</label>
                <code className="text-white font-mono text-sm truncate block">{formData.client_email}</code>
              </div>
              <Button
                onClick={() => copyToClipboard(formData.client_email, "Email")}
                size="sm"
                className="h-8 w-8 p-0 bg-white/10 hover:bg-white/20 text-white shrink-0 ml-2"
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Button
              onClick={copyAllCredentials}
              className="w-full gradient-button text-black font-semibold text-base py-4"
            >
              <Mail className="mr-2 h-4 w-4" />
              Copy Portal Credentials
            </Button>
            <Button
              onClick={copyNextStepMessage}
              className="w-full gradient-button text-black font-semibold text-base py-4"
            >
              <Mail className="mr-2 h-4 w-4" />
              Copy Next Step Message
            </Button>
          </div>
        </div>
      </div>

      {formData.signature && (
        <div className="bg-[#B68039]/10 border border-[#B68039]/30 rounded-lg p-6">
          <div className="flex items-start gap-4">
            <Check className="h-6 w-6 text-[#B68039] mt-1" />
            <div className="flex-1">
              <h3 className="font-heading text-xl text-[#B68039] mb-2">Document Signed</h3>
              <p className="text-white/70 font-body mb-3">
                Signed by {formData.contact_name} on {new Date(formData.signature_date || "").toLocaleDateString()}
              </p>
              <div className="bg-white/10 rounded-lg p-4 inline-block">
                <img src={formData.signature || "/placeholder.svg"} alt="Signature" className="h-16" />
              </div>
            </div>
          </div>
        </div>
      )}

      {renderDocPanel("MASTER SERVICE AGREEMENT", "msa", msaContent, setMsaContent, initialMSA, "MSA")}
      {renderDocPanel("INVOICE", "invoice", invoiceContent, setInvoiceContent, initialInvoice, "Invoice")}
      {renderDocPanel("WELCOME PACKET", "welcome", welcomeContent, setWelcomeContent, initialWelcome, "Welcome")}

      <div className="p-6 rounded-lg bg-[#B68039]/10 border border-[#B68039]/30">
        <p className="text-white font-body mb-6 text-center">
          Once you're happy with the documents above, save them to the document portal.
        </p>
        <div className="flex flex-col md:flex-row gap-4 justify-center">
          <Button
            onClick={saveToPortal}
            disabled={isSaving || isSaved}
            className="gradient-button text-black font-semibold px-8 w-full md:w-auto disabled:opacity-50"
          >
            <FolderOpen className="mr-2 h-5 w-5" />
            {isSaving ? "Saving..." : isSaved ? "Saved" : "Save to Document Portal"}
          </Button>
          <Button
            onClick={() => {
              if (confirm("Start a new onboarding? Current progress will be cleared.")) {
                localStorage.removeItem("c-suite-onboarding")
                window.location.reload()
              }
            }}
            variant="outline"
            className="bg-white/5 border-white/10 text-white hover:bg-white/10 w-full md:w-auto"
          >
            Start New Onboarding
          </Button>
        </div>
      </div>
    </div>
  )
}
