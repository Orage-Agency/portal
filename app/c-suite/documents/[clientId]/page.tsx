"use client"

import { useEffect, useState, useRef } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Download, CheckCircle, Mail, Pencil, Save, X, Send, FileDown, Trash2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import MSATemplate from "@/components/c-suite/templates/MSATemplate"
import {
  getClients,
  saveClient,
  saveNotification,
  clearClientSignature,
} from "@/lib/storage"
import { generateAndDownloadPDF } from "@/lib/pdf"
import type { Client } from "@/lib/storage"

// Skip static generation - requires client-side auth and database access
export const dynamic = "force-dynamic"

interface ClientFolder {
  id: string
  clientName: string
  contactName: string
  dateCreated: string
  signature?: string
  signatureDate?: string
  clientData?: {
    client_email?: string
    business_name?: string
    client_phone?: string
    client_address?: string
    client_city?: string
    client_state?: string
    client_zip?: string
    offer_type?: string
    setup_fee?: number
    monthly_fee?: number
    agency_signature?: string
    agency_signature_date?: string
  }
  documents: {
    msa: string
    invoice: string
    welcome: string
  }
}

export default function ClientDocumentsPage() {
  const params = useParams()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [client, setClient] = useState<Client | null>(null)
  const [selectedDoc, setSelectedDoc] = useState<"msa" | "invoice" | "welcome">("msa")
  const [isSigning, setIsSigning] = useState(false)
  const [agencySignature, setAgencySignature] = useState("")
  const [isEditing, setIsEditing] = useState(false)
  const [editDraft, setEditDraft] = useState("")
  const [savingEdit, setSavingEdit] = useState(false)
  const [showSignShare, setShowSignShare] = useState(false)
  const [clearingSig, setClearingSig] = useState<"client" | "agency" | null>(null)
  const { toast } = useToast()
  const router = useRouter()
  const clientId = params.clientId as string

  useEffect(() => {
    if (clientId) {
      loadClient()
    }
  }, [clientId])

  const loadClient = async () => {
    console.log("[v0] Looking for client with ID:", clientId)

    try {
      const clients = await getClients()
      console.log("[v0] All clients:", clients)

      let foundClient = clients.find((c) => c.id === clientId)

      if (!foundClient) {
        const decodedId = decodeURIComponent(clientId)
        console.log("[v0] Trying decoded ID:", decodedId)
        foundClient = clients.find((c) => c.id === decodedId)
      }

      console.log("[v0] Found client:", foundClient)

      if (foundClient) {
        setClient(foundClient)
      } else {
        toast({
          title: "Client not found",
          description: "Redirecting to portal...",
          variant: "destructive",
        })
        setTimeout(() => router.push("/c-suite/documents"), 1500)
      }
    } catch (error) {
      console.error("[v0] Error loading client:", error)
      toast({
        title: "Error",
        description: "Failed to load client data",
        variant: "destructive",
      })
    }
  }

  const shareClientCredentials = () => {
    if (!client || !client.email) {
      toast({
        title: "Error",
        description: "Client email not found",
        variant: "destructive",
      })
      return
    }

    const portalUrl = `${window.location.origin}/portal/login`
    const text = `Here is your client portal access credentials for Orage AI Agency. Please save these for your records and do not share with anyone:

Portal Login URL: ${portalUrl}

Login Credentials:
- Client ID: ${client.id}
- Email: ${client.email}`

    navigator.clipboard.writeText(text)
    toast({
      title: "Credentials Copied!",
      description: "Text is ready to send to your client",
      duration: 5000,
    })
  }

  const copyNextStepMessage = () => {
    const message = `Thank you for completing your initial agreement onboarding with Orage AI Agency!

To fully activate your services, please complete your next onboarding steps:

CRM & AI Agent Onboarding: https://client.orage.agency/crm

This is required to access all features in your client portal. Please complete this as soon as possible.

If you have any questions, feel free to reach out to our team.`

    navigator.clipboard.writeText(message)
    toast({
      title: "Next Step Message Copied!",
      description: "Ready to send to your client",
      duration: 5000,
    })
  }

  const downloadAsPDF = async (content: string, filename: string) => {
    // The MSA template already inlines signature <img> tags via the
    // {{client_signature}} / {{agency_signature}} placeholders, so we can
    // hand the HTML straight to the renderer. For older records that still
    // contain the literal "Signature: ___" placeholder lines, replace them
    // with the captured signature image before rendering.
    let finalContent = content

    if (filename.includes("msa") || filename.toLowerCase().includes("msa")) {
      if (client?.client_signature) {
        const placeholder = `${client.business_name}\nSignature: ________________________`
        const replacement = `${client.business_name}\nSignature: <img src="${client.client_signature}" alt="Client Signature" style="max-height:60px;vertical-align:middle;border-bottom:1px solid #B68039;" />`
        finalContent = finalContent.replace(placeholder, replacement)
      }
      if (client?.agency_signature) {
        const placeholder = `ORAGE AI AGENCY\nSignature: ________________________`
        const replacement = `ORAGE AI AGENCY\nSignature: <img src="${client.agency_signature}" alt="Agency Signature" style="max-height:60px;vertical-align:middle;border-bottom:1px solid #B68039;" />`
        finalContent = finalContent.replace(placeholder, replacement)
      }
    }

    try {
      await generateAndDownloadPDF(finalContent, filename)
      toast({
        title: "PDF Downloaded",
        description: `${filename}.pdf saved to your downloads.`,
      })
    } catch (err) {
      console.error("[documents] PDF generation failed:", err)
      toast({
        title: "PDF generation failed",
        description: "Try again or use the TXT download as a fallback.",
        variant: "destructive",
      })
    }
  }

  const downloadDocument = (content: string, filename: string, format: "txt" | "doc") => {
    const blob = new Blob([content], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${filename}.${format}`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    toast({
      title: "Downloaded!",
      description: `${filename}.${format} has been downloaded`,
    })
  }

  const copyDocument = (content: string, docName: string) => {
    navigator.clipboard.writeText(content)
    toast({
      title: "Copied!",
      description: `${docName} copied to clipboard`,
    })
  }

  const printDocument = (content: string) => {
    const printWindow = window.open("", "", "height=600,width=800")
    if (printWindow) {
      printWindow.document.write(
        '<pre style="white-space: pre-wrap; font-family: Montserrat, Arial; padding: 20px;">' + content + "</pre>",
      )
      printWindow.document.close()
      printWindow.print()
    }
  }

  const deleteClient = async () => {
    if (!client) return

    if (confirm(`Delete all documents for ${client.business_name}? This cannot be undone.`)) {
      try {
        await saveClient({ id: client.id, deleted: true })
        toast({
          title: "Deleted",
          description: `${client.business_name}'s documents have been deleted`,
        })
        router.push("/c-suite/documents")
      } catch (error) {
        console.error("[v0] Error deleting client:", error)
        toast({
          title: "Error",
          description: "Failed to delete client data",
          variant: "destructive",
        })
      }
    }
  }

  const getDocumentContent = () => {
    if (!client) return ""
    if (selectedDoc === "msa") return client.msa_content || ""
    if (selectedDoc === "invoice") return client.invoice_content || ""
    if (selectedDoc === "welcome") return client.welcome_content || ""
    return ""
  }

  /**
   * Build a public sign URL + an invitation message body. Shared by the
   * "Copy link", "Open in Email", and "Download .eml" actions.
   */
  const buildSignShare = () => {
    if (!client) return null
    const link = `${window.location.origin}/sign/${client.id}`
    const subject = `Please sign your Orage AI Agency agreement`
    const body = `Hi ${client.name || client.business_name},

Your agreement is ready to sign — click the link below. After signing, you'll be able to download the signed PDF for your records.

${link}

— Orage AI Agency
team@orage.agency`
    return { link, subject, body }
  }

  const copySignLink = () => {
    const s = buildSignShare()
    if (!s) return
    navigator.clipboard.writeText(s.link)
    toast({ title: "Sign link copied", description: s.link })
  }

  const copySignMessage = () => {
    const s = buildSignShare()
    if (!s) return
    navigator.clipboard.writeText(s.body)
    toast({ title: "Message copied", description: "Paste it into any email or text" })
  }

  const openSignInEmail = () => {
    const s = buildSignShare()
    if (!s || !client) return
    const params = new URLSearchParams()
    params.set("subject", s.subject)
    params.set("body", s.body)
    const url = `mailto:${encodeURIComponent(client.email || "")}?${params.toString()}`
    window.location.href = url
  }

  const downloadSignEml = () => {
    const s = buildSignShare()
    if (!s || !client) return
    const safeName = (client.business_name || "client").replace(/[^a-z0-9-_]+/gi, "_")
    const headers = [
      `From: team@orage.agency`,
      client.email ? `To: ${client.email}` : null,
      `Subject: ${s.subject}`,
      `MIME-Version: 1.0`,
      `Content-Type: text/plain; charset=UTF-8`,
      `Content-Transfer-Encoding: 8bit`,
      `X-Orage-Client-Id: ${client.id}`,
      `X-Orage-Sign-Link: ${s.link}`,
    ]
      .filter(Boolean)
      .join("\r\n")
    const eml = `${headers}\r\n\r\n${s.body}\r\n`
    const blob = new Blob([eml], { type: "message/rfc822" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `Orage_SignRequest_${safeName}.eml`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  /**
   * Removes the client or agency signature from the stored client record.
   * After clearing, the next PDF download (or sign-link send) starts from
   * a clean slate.
   */
  const removeSignature = async (which: "client" | "agency") => {
    if (!client) return
    const label = which === "client" ? "the client's signature" : "the agency signature"
    if (!confirm(`Remove ${label}? This cannot be undone — the signature image will be deleted.`)) {
      return
    }
    setClearingSig(which)
    try {
      await clearClientSignature(client.id, which)
      const updated: Client = {
        ...client,
        updated_at: new Date().toISOString(),
      }
      if (which === "client") {
        updated.client_signature = undefined
        updated.signed_at = undefined
      } else {
        updated.agency_signature = undefined
        updated.agency_signed_at = undefined
      }
      setClient(updated)
      toast({
        title: "Signature removed",
        description: which === "client" ? "The client can sign again via a new sign link." : "You can re-sign as the agency anytime.",
      })
    } catch (e) {
      console.error("[documents] removeSignature failed:", e)
      toast({
        title: "Could not remove signature",
        description: (e as Error).message,
        variant: "destructive",
      })
    } finally {
      setClearingSig(null)
    }
  }

  const startEditing = () => {
    setEditDraft(getDocumentContent())
    setIsEditing(true)
  }

  const cancelEditing = () => {
    setIsEditing(false)
    setEditDraft("")
  }

  const saveEditing = async () => {
    if (!client) return
    setSavingEdit(true)
    try {
      const field =
        selectedDoc === "msa"
          ? "msa_content"
          : selectedDoc === "invoice"
            ? "invoice_content"
            : "welcome_content"
      const updated: Client = {
        ...client,
        [field]: editDraft,
        updated_at: new Date().toISOString(),
      }
      await saveClient(updated)
      setClient(updated)
      setIsEditing(false)
      setEditDraft("")
      toast({
        title: "Saved",
        description: `${getDocumentName()} updated. PDF downloads will use the new wording.`,
      })
    } catch (err) {
      console.error("[documents] saveEditing failed:", err)
      toast({
        title: "Save failed",
        description: "Couldn't save your changes. Please try again.",
        variant: "destructive",
      })
    } finally {
      setSavingEdit(false)
    }
  }

  // Whenever the admin switches docs while editing, drop the unsaved draft.
  useEffect(() => {
    if (isEditing) {
      setIsEditing(false)
      setEditDraft("")
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDoc])

  const getDocumentName = () => {
    const names = {
      msa: "Master Service Agreement",
      invoice: "Invoice",
      welcome: "Welcome Packet",
    }
    return names[selectedDoc]
  }

  const handleAgencySign = async () => {
    if (!client || !agencySignature) {
      toast({
        title: "Error",
        description: "Please provide agency signature",
        variant: "destructive",
      })
      return
    }

    try {
      const updatedClient: Client = {
        ...client,
        agency_signature: agencySignature,
        agency_signed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }

      // Regenerate MSA with both signatures
      const clientData = {
        offer_type: client.plan,
        business_name: client.business_name,
        contact_name: client.name,
        client_email: client.email,
        client_phone: "",
        client_address: client.address || "",
        client_city: "",
        client_state: "",
        client_zip: "",
        setup_fee: client.setup_fee || 0,
        monthly_fee: client.price,
        is_referral: "no" as const,
        signature: client.client_signature,
        signature_date: client.signed_at,
        agency_signature: agencySignature,
        agency_signature_date: new Date().toISOString(),
      }

      updatedClient.msa_content = MSATemplate(clientData)

      await saveClient(updatedClient)

      await saveNotification({
        id: `notif-${Date.now()}`,
        title: "Documents Fully Signed",
        message: `${client.business_name} documents have been signed by agency`,
        type: "document_signed",
        read: false,
        created_at: new Date().toISOString(),
      })

      setClient(updatedClient)
      setIsSigning(false)
      setAgencySignature("")

      toast({
        title: "Success!",
        description: "Agency signature saved. Documents updated.",
      })
    } catch (error) {
      console.error("[v0] Error saving agency signature:", error)
      toast({
        title: "Error",
        description: "Failed to save signature. Please try again.",
        variant: "destructive",
      })
    }
  }

  if (!client) {
    return (
      <div className="min-h-screen bg-orage-black flex items-center justify-center">
        <p className="text-white/50 font-body text-lg">Loading client documents...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-orage-black py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4 md:gap-0">
          <div>
            <img
              src="https://storage.googleapis.com/msgsndr/651kIrlKk834C2FEl66i/media/688a8bfb5a3e648018748f5e.png"
              alt="Orage AI Agency"
              className="h-10 md:h-12 mb-4"
            />
            <h1 className="font-heading text-4xl md:text-5xl text-gold mb-2">{client.business_name}</h1>
            <p className="font-body text-white/70">Contact: {client.name}</p>
            <p className="font-body text-white/50 text-sm mt-1">
              Created: {client.created_at ? new Date(client.created_at).toLocaleDateString() : "N/A"}
            </p>
          </div>
          <div className="flex flex-wrap gap-3 w-full md:w-auto">
            <Button
              onClick={() => router.push("/c-suite/documents")}
              variant="outline"
              className="flex-1 md:flex-none bg-white/5 border-white/10 text-white hover:bg-white/10"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
            <Button
              onClick={() => setShowSignShare(true)}
              className="flex-1 md:flex-none gradient-button text-black font-semibold"
            >
              <Send className="mr-2 h-4 w-4" />
              Send for Signature
            </Button>
            <Button
              onClick={() => router.push("/c-suite/admin")}
              variant="outline"
              className="flex-1 md:flex-none bg-white/5 border-white/10 text-white hover:bg-white/10"
            >
              <Mail className="mr-2 h-4 w-4" />
              Dashboard
            </Button>
            <Button
              onClick={deleteClient}
              variant="outline"
              className="flex-1 md:flex-none bg-red-500/10 border-red-500/30 text-red-500 hover:bg-red-500/20"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Delete
            </Button>
          </div>
        </div>

        {/* Account Information section */}
        <div className="bg-white/5 backdrop-blur-sm border border-gold/20 rounded-lg p-4 md:p-6 mb-8">
          <div className="flex flex-col md:flex-row justify-between items-start mb-4 gap-4 md:gap-0">
            <h3 className="font-heading text-2xl text-gold">ACCOUNT INFORMATION</h3>
            {!client.agency_signature && (
              <Button
                onClick={() => setIsSigning(true)}
                className="w-full md:w-auto gradient-button text-black font-semibold"
              >
                <CheckCircle className="mr-2 h-4 w-4" />
                Sign as Agency
              </Button>
            )}
            {client.agency_signature && (
              <div className="flex items-center gap-2">
                <div className="flex items-center text-[#B68039] bg-[#B68039]/10 px-3 py-1 rounded-full border border-[#B68039]/20">
                  <CheckCircle className="mr-2 h-3 w-3" />
                  <span className="text-xs font-semibold">Agency Signed</span>
                </div>
                <Button
                  onClick={() => removeSignature("agency")}
                  disabled={clearingSig === "agency"}
                  variant="outline"
                  className="px-3 py-1 h-auto text-xs bg-red-500/10 border-red-500/30 text-red-400 hover:bg-red-500/20"
                  title="Remove agency signature"
                >
                  <Trash2 className="mr-1 h-3 w-3" />
                  {clearingSig === "agency" ? "Removing…" : "Remove"}
                </Button>
              </div>
            )}
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <p className="text-white/60 text-sm">Business Name</p>
              <p className="text-white">{client.business_name}</p>
            </div>
            <div>
              <p className="text-white/60 text-sm">Contact Name</p>
              <p className="text-white">{client.name}</p>
            </div>
            <div>
              <p className="text-white/60 text-sm">Email</p>
              <p className="text-white">{client.email}</p>
            </div>
            <div>
              <p className="text-white/60 text-sm">Phone</p>
              <p className="text-white">{client.phone || "N/A"}</p>
            </div>
            <div className="md:col-span-2">
              <p className="text-white/60 text-sm">Address</p>
              <p className="text-white">{client.address ? client.address : "N/A"}</p>
            </div>
            <div>
              <p className="text-white/60 text-sm">Plan</p>
              <p className="text-white">{client.plan || "N/A"}</p>
            </div>
            <div>
              <p className="text-white/60 text-sm">Fees</p>
              <p className="text-white">
                ${client.setup_fee || 0} setup / ${client.price}/mo
              </p>
            </div>
          </div>
        </div>

        {client.email && (
          <div className="bg-gradient-to-r from-[#B68039]/20 to-[#B68039]/10 border-2 border-[#B68039] rounded-lg p-6 mb-8">
            <h3 className="font-heading text-2xl text-[#B68039] mb-4">CLIENT PORTAL ACCESS</h3>

            <div className="bg-black/40 border border-gold/30 rounded-lg p-4 mb-4">
              <p className="text-gold text-sm mb-2 uppercase tracking-wide font-semibold">
                Text Ready to Send to Client:
              </p>
              <div className="text-white font-body whitespace-pre-line leading-relaxed text-base">
                {`Here is your client portal access credentials for Orage AI Agency. Please save these for your records and do not share with anyone:

Portal Login URL: ${window.location.origin}/portal/login

Login Credentials:
- Client ID: ${client.id}
- Email: ${client.email}`}
              </div>
            </div>

            <div className="flex flex-col md:flex-row gap-3">
              <Button
                onClick={shareClientCredentials}
                className="flex-1 gradient-button text-black font-semibold text-lg py-4"
              >
                <ArrowLeft className="mr-2 h-5 w-5" />
                Copy Portal Credentials
              </Button>
              <Button
                onClick={copyNextStepMessage}
                className="flex-1 gradient-button text-black font-semibold text-lg py-4"
              >
                <ArrowLeft className="mr-2 h-5 w-5" />
                Copy Next Step Onboarding
              </Button>
            </div>
          </div>
        )}

        {client.client_signature && (
          <div className="bg-[#B68039]/10 border border-[#B68039]/30 rounded-lg p-6 mb-8">
            <div className="flex items-start gap-4">
              <CheckCircle className="h-6 w-6 text-[#B68039] mt-1" />
              <div className="flex-1">
                <div className="flex flex-wrap items-start justify-between gap-3 mb-2">
                  <h3 className="font-heading text-xl text-[#B68039]">DOCUMENT SIGNED</h3>
                  <Button
                    onClick={() => removeSignature("client")}
                    disabled={clearingSig === "client"}
                    variant="outline"
                    className="px-3 py-1 h-auto text-xs bg-red-500/10 border-red-500/30 text-red-400 hover:bg-red-500/20"
                    title="Remove the client's signature so they can sign again"
                  >
                    <Trash2 className="mr-1 h-3 w-3" />
                    {clearingSig === "client" ? "Removing…" : "Remove signature"}
                  </Button>
                </div>
                <p className="text-white/70 font-body mb-3">
                  Signed by {client.name} on{" "}
                  {client.signed_at ? new Date(client.signed_at).toLocaleDateString() : "N/A"}
                </p>
                <div className="bg-white/10 rounded-lg p-4 inline-block border border-gold/30">
                  <img src={client.client_signature || "/placeholder.svg"} alt="Client Signature" className="h-20" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Document Tabs & Viewer */}
        <div className="glass-panel p-4 md:p-8 rounded-lg">
          <div className="flex gap-3 mb-6 overflow-x-auto pb-2">
            {(["msa", "invoice", "welcome"] as const).map((doc) => (
              <button
                key={doc}
                onClick={() => setSelectedDoc(doc)}
                className={`px-6 py-3 rounded-lg font-body font-semibold transition-all whitespace-nowrap ${
                  selectedDoc === doc ? "bg-[#B68039] text-black" : "bg-white/5 text-white hover:bg-white/10"
                }`}
              >
                {doc === "msa" ? "MSA" : doc === "invoice" ? "Invoice" : "Welcome"}
              </button>
            ))}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-3 mb-6">
            {!isEditing ? (
              <>
                <Button
                  onClick={() => downloadAsPDF(getDocumentContent(), `${client.business_name}_${selectedDoc}`)}
                  className="flex-1 md:flex-none gradient-button text-black font-semibold hover:opacity-90"
                >
                  <Download className="mr-2 h-4 w-4" />
                  Download PDF
                </Button>
                <Button
                  onClick={startEditing}
                  variant="outline"
                  className="flex-1 md:flex-none bg-white/5 border-[#B68039]/40 text-[#B68039] hover:bg-[#B68039]/10"
                >
                  <Pencil className="mr-2 h-4 w-4" />
                  Edit
                </Button>
                <Button
                  onClick={() => downloadDocument(getDocumentContent(), `${client.business_name}_${selectedDoc}`, "txt")}
                  variant="outline"
                  className="flex-1 md:flex-none bg-white/5 border-white/10 text-white hover:bg-white/10"
                >
                  <Download className="mr-2 h-4 w-4" />
                  TXT
                </Button>
                <Button
                  onClick={() => copyDocument(getDocumentContent(), getDocumentName())}
                  variant="outline"
                  className="flex-1 md:flex-none bg-white/5 border-white/10 text-white hover:bg-white/10"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Copy
                </Button>
              </>
            ) : (
              <>
                <Button
                  onClick={saveEditing}
                  disabled={savingEdit}
                  className="flex-1 md:flex-none gradient-button text-black font-semibold hover:opacity-90 disabled:opacity-50"
                >
                  <Save className="mr-2 h-4 w-4" />
                  {savingEdit ? "Saving…" : "Save changes"}
                </Button>
                <Button
                  onClick={cancelEditing}
                  disabled={savingEdit}
                  variant="outline"
                  className="flex-1 md:flex-none bg-white/5 border-white/10 text-white hover:bg-white/10"
                >
                  <X className="mr-2 h-4 w-4" />
                  Cancel
                </Button>
              </>
            )}
          </div>

          {/* Document Content — preview when read-only, raw HTML textarea when editing */}
          {!isEditing ? (
            <div className="bg-[#0a0a0a] p-4 md:p-8 rounded-lg border border-[#B68039]/30 max-h-[600px] overflow-y-auto shadow-xl">
              <div className="text-center mb-6 border-b-2 border-[#B68039] pb-4">
                <img
                  src="https://storage.googleapis.com/msgsndr/651kIrlKk834C2FEl66i/media/688a8bfb5a3e648018748f5e.png"
                  alt="Orage AI Agency"
                  className="h-12 mx-auto mb-4"
                />
                <h1 className="text-[#B68039] font-heading text-xl tracking-widest uppercase">Orage AI Agency</h1>
              </div>
              <div
                className="whitespace-pre-line leading-relaxed text-orage-100 font-body text-sm"
                dangerouslySetInnerHTML={{ __html: getDocumentContent() }}
              />
            </div>
          ) : (
            <div className="bg-[#0a0a0a] p-4 md:p-6 rounded-lg border border-[#B68039]/30 shadow-xl">
              <p className="text-white/60 text-xs mb-3 leading-relaxed">
                Editing <span className="text-gold">{getDocumentName()}</span>. The raw HTML below is rendered into the PDF —
                tweak any wording, dates, or names you need. Don't worry about the &lt;tags&gt;, just edit the text between them.
              </p>
              <textarea
                value={editDraft}
                onChange={(e) => setEditDraft(e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded p-3 text-white/90 font-mono text-[12px] leading-relaxed focus:outline-none focus:border-gold/50 resize-y"
                rows={26}
                spellCheck={false}
              />
              <div className="mt-4 bg-white/5 border border-white/10 rounded p-3 max-h-[280px] overflow-y-auto">
                <p className="text-white/40 text-[10px] uppercase tracking-wider mb-2">Live preview</p>
                <div
                  className="bg-white rounded p-3 text-sm"
                  dangerouslySetInnerHTML={{ __html: editDraft }}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Send-for-signature share modal */}
      {showSignShare && client && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-orage-black border border-gold/30 rounded-lg p-6 md:p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-4">
              <h3 className="font-heading text-2xl text-gold">SEND FOR SIGNATURE</h3>
              <button
                onClick={() => setShowSignShare(false)}
                className="text-white/50 hover:text-white"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <p className="text-white/70 text-sm mb-4">
              Share this link with <span className="text-gold">{client.email || client.name}</span>. They'll see the document, sign, and can download the signed PDF — no portal account needed.
            </p>
            <div className="bg-black/40 border border-white/10 rounded p-3 mb-4 break-all text-white/80 text-xs font-mono">
              {`${typeof window !== "undefined" ? window.location.origin : ""}/sign/${client.id}`}
            </div>
            <div className="grid grid-cols-2 gap-2 mb-3">
              <Button
                onClick={copySignLink}
                variant="outline"
                className="bg-white/5 border-white/10 text-white hover:bg-white/10"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Copy link
              </Button>
              <Button
                onClick={copySignMessage}
                variant="outline"
                className="bg-white/5 border-white/10 text-white hover:bg-white/10"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Copy message
              </Button>
              <Button
                onClick={downloadSignEml}
                variant="outline"
                className="bg-white/5 border-white/10 text-white hover:bg-white/10"
              >
                <FileDown className="mr-2 h-4 w-4" />
                Download .eml
              </Button>
              <Button
                onClick={openSignInEmail}
                className="gradient-button text-black font-semibold"
              >
                <Mail className="mr-2 h-4 w-4" />
                Open in Email
              </Button>
            </div>
            <p className="text-white/40 text-xs leading-relaxed">
              <span className="text-gold">Open in Email</span> launches your default mail app with the message pre-filled.{" "}
              <span className="text-gold">Download .eml</span> saves a draft you can drag into any mail client. No setup required.
            </p>
          </div>
        </div>
      )}

      {/* Agency signature modal that was missing */}
      {isSigning && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-orage-black border border-gold/30 rounded-lg p-6 md:p-8 max-w-2xl w-full">
            <h3 className="font-heading text-2xl text-gold mb-6">SIGN AS AGENCY</h3>

            <div className="mb-6">
              <p className="text-white/70 mb-4">
                Please sign below to authorize and finalize the documents for {client?.business_name}.
              </p>
              <div className="bg-white/5 border border-gold/30 rounded-lg p-4">
                <canvas
                  ref={canvasRef}
                  width={600}
                  height={200}
                  className="w-full border border-white/20 rounded cursor-crosshair bg-white/10"
                  onMouseDown={(e) => {
                    const canvas = canvasRef.current
                    if (!canvas) return
                    const rect = canvas.getBoundingClientRect()
                    const ctx = canvas.getContext("2d")
                    if (!ctx) return

                    const startX = e.clientX - rect.left
                    const startY = e.clientY - rect.top

                    ctx.beginPath()
                    ctx.moveTo(startX, startY)
                    ctx.strokeStyle = "#B68039"
                    ctx.lineWidth = 2
                    ctx.lineCap = "round"

                    const draw = (e: MouseEvent) => {
                      const x = e.clientX - rect.left
                      const y = e.clientY - rect.top
                      ctx.lineTo(x, y)
                      ctx.stroke()
                    }

                    const stopDrawing = () => {
                      canvas.removeEventListener("mousemove", draw)
                      canvas.removeEventListener("mouseup", stopDrawing)
                      canvas.removeEventListener("mouseleave", stopDrawing)
                      setAgencySignature(canvas.toDataURL())
                    }

                    canvas.addEventListener("mousemove", draw)
                    canvas.addEventListener("mouseup", stopDrawing)
                    canvas.addEventListener("mouseleave", stopDrawing)
                  }}
                  onTouchStart={(e) => {
                    const canvas = canvasRef.current
                    if (!canvas) return
                    const rect = canvas.getBoundingClientRect()
                    const ctx = canvas.getContext("2d")
                    if (!ctx) return

                    const touch = e.touches[0]
                    const startX = touch.clientX - rect.left
                    const startY = touch.clientY - rect.top

                    ctx.beginPath()
                    ctx.moveTo(startX, startY)
                    ctx.strokeStyle = "#B68039"
                    ctx.lineWidth = 2
                    ctx.lineCap = "round"

                    const draw = (e: TouchEvent) => {
                      e.preventDefault()
                      const touch = e.touches[0]
                      const x = touch.clientX - rect.left
                      const y = touch.clientY - rect.top
                      ctx.lineTo(x, y)
                      ctx.stroke()
                    }

                    const stopDrawing = () => {
                      canvas.removeEventListener("touchmove", draw)
                      canvas.removeEventListener("touchend", stopDrawing)
                      setAgencySignature(canvas.toDataURL())
                    }

                    canvas.addEventListener("touchmove", draw, { passive: false })
                    canvas.addEventListener("touchend", stopDrawing)
                  }}
                />
              </div>
              <button
                onClick={() => {
                  const canvas = canvasRef.current
                  if (!canvas) return
                  const ctx = canvas.getContext("2d")
                  if (!ctx) return
                  ctx.clearRect(0, 0, canvas.width, canvas.height)
                  setAgencySignature("")
                }}
                className="mt-2 text-white/60 hover:text-white text-sm underline"
              >
                Clear Signature
              </button>
            </div>

            <div className="flex gap-4">
              <Button
                onClick={() => {
                  setIsSigning(false)
                  setAgencySignature("")
                }}
                variant="outline"
                className="flex-1 bg-white/5 border-white/20 text-white hover:bg-white/10"
              >
                Cancel
              </Button>
              <Button
                onClick={handleAgencySign}
                disabled={!agencySignature}
                className="flex-1 gradient-button text-black font-semibold"
              >
                Confirm Signature
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
