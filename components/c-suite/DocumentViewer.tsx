"use client"

import type { OnboardingData } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Copy, FolderOpen, Download, Check, Mail, KeyRound, ExternalLink } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import MSATemplate from "./templates/MSATemplate"
import InvoiceTemplate from "./templates/InvoiceTemplate"
import WelcomeTemplate from "./templates/WelcomeTemplate"
import { saveClient, saveClientLogin, saveNotification } from "@/lib/storage"

interface DocumentViewerProps {
  formData: OnboardingData
}

export default function DocumentViewer({ formData }: DocumentViewerProps) {
  const { toast } = useToast()
  const router = useRouter()
  const [clientId, setClientId] = useState<string>("")
  const [portalUrl, setPortalUrl] = useState<string>("")

  const [hasAutoSaved, setHasAutoSaved] = useState(false)

  useEffect(() => {
    // Generate unique client ID
    const id = `OAA-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`
    setClientId(id)

    // Generate portal URL
    const url = `${window.location.origin}/portal/login`
    setPortalUrl(url)
  }, [])

  // Auto-save client folder when component mounts (when "Generate Documents" is clicked)
  useEffect(() => {
    if (clientId && !hasAutoSaved) {
      console.log("[v0] DocumentViewer: Auto-saving client folder to document portal")
      saveToPortal()
      setHasAutoSaved(true)
    }
  }, [clientId, hasAutoSaved])

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
    toast({
      title: "Copied!",
      description: `${label} copied to clipboard`,
    })
  }

  const copyAllCredentials = () => {
    const credentials = `Here is your client portal access credentials for Orage AI Agency. Please save these for your records and do not share with anyone:

Portal Login URL: ${portalUrl}

Login Credentials:
- Client ID: ${clientId}
- Email: ${formData.client_email}`

    navigator.clipboard.writeText(credentials)
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

  const copyDocument = (content: string, docName: string) => {
    navigator.clipboard.writeText(content)
    toast({
      title: "Copied!",
      description: `${docName} copied to clipboard`,
    })
  }

  const downloadAsPDF = (content: string, filename: string) => {
    const printWindow = window.open("", "", "height=800,width=800")
    if (printWindow) {
      // Prepare content with signature if it's the MSA and signature exists
      let finalContent = content
      const signatureHtml = ""

      if (filename.includes("MSA") && formData.signature) {
        const signatureBlock = `${formData.business_name}\nSignature: ________________________`
        const signatureImg = `${formData.business_name}\nSignature: <img src="${formData.signature}" alt="Client Signature" style="max-height: 60px; vertical-align: middle; border-bottom: 1px solid #B68039;" />`

        finalContent = finalContent.replace(signatureBlock, signatureImg)
      }

      printWindow.document.write(`
        <html>
          <head>
            <title>${filename}</title>
            <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;600;700&display=swap" rel="stylesheet">
            <style>
              body {
                font-family: 'Montserrat', sans-serif;
                padding: 40px;
                line-height: 1.6;
                color: #e5e5e5;
                background-color: #0a0a0a;
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
              }
              .header {
                text-align: center;
                margin-bottom: 40px;
                border-bottom: 2px solid #B68039;
                padding-bottom: 20px;
              }
              .header img {
                max-height: 60px;
                margin-bottom: 10px;
              }
              .header h1 {
                color: #B68039;
                font-size: 24px;
                letter-spacing: 2px;
                margin: 0;
                text-transform: uppercase;
              }
              .content {
                white-space: pre-line;
                word-wrap: break-word;
                font-family: 'Montserrat', sans-serif;
                font-size: 12px;
                color: #e5e5e5;
              }
              /* Custom scrollbar for webkit */
              ::-webkit-scrollbar {
                width: 8px;
              }
              ::-webkit-scrollbar-track {
                background: #0a0a0a; 
              }
              ::-webkit-scrollbar-thumb {
                background: #333; 
                border-radius: 4px;
              }
              @media print {
                body {
                  background-color: #0a0a0a !important;
                  color: #e5e5e5 !important;
                }
                .header {
                  border-bottom-color: #B68039 !important;
                }
              }
            </style>
          </head>
          <body>
            <div class="header">
              <img src="https://storage.googleapis.com/msgsndr/651kIrlKk834C2FEl66i/media/688a8bfb5a3e648018748f5e.png" alt="Orage AI Agency Logo" />
              <h1>Orage AI Agency</h1>
            </div>
            <div class="content">${finalContent}</div>
          </body>
        </html>
      `)
      printWindow.document.close()

      // Wait for images to load before printing
      setTimeout(() => {
        printWindow.focus()
        printWindow.print()
        toast({
          title: "PDF Ready",
          description: 'Save as PDF in the print dialog. Ensure "Background graphics" is enabled.',
        })
      }, 500)
    }
  }

  const saveToPortal = async () => {
    try {
      console.log("[v0] DocumentViewer: Starting saveToPortal for:", formData.business_name)
      
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
        msa_content: MSATemplate(formData),
        invoice_content: InvoiceTemplate(formData),
        welcome_content: WelcomeTemplate(formData),
        client_signature: formData.signature,
        signed_at: formData.signature_date,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }

      console.log("[v0] DocumentViewer: Saving client record:", clientRecord)
      await saveClient(clientRecord)
      console.log("[v0] DocumentViewer: Client saved successfully")

      console.log("[v0] DocumentViewer: Saving client login")
      await saveClientLogin({
        id: clientId,
        client_id: clientId,
        password: formData.client_email,
        created_at: new Date().toISOString(),
      })
      console.log("[v0] DocumentViewer: Client login saved successfully")

      console.log("[v0] DocumentViewer: Creating notification")
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
      console.log("[v0] DocumentViewer: Notification created successfully")

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
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="font-heading text-3xl md:text-4xl text-gold mb-2">GENERATED DOCUMENTS</h2>
        <p className="text-white/60 font-body">Your client onboarding documents are ready</p>
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
          {/* Portal URL */}
          <div className="bg-black/30 rounded-lg p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
            <div className="w-full overflow-hidden">
              <label className="text-white/60 font-body text-xs uppercase tracking-wider block mb-1">
                Portal Login URL
              </label>
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
            {/* Client ID */}
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

            {/* Email */}
            <div className="bg-black/30 rounded-lg p-3 flex items-center justify-between">
              <div className="overflow-hidden">
                <label className="text-white/60 font-body text-xs uppercase tracking-wider block mb-1">
                  Login Email
                </label>
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

          {/* Copy All Button */}
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

      {/* MSA Document */}
      <div className="space-y-3">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-2 md:gap-0">
          <h3 className="font-heading text-xl md:text-2xl text-[#B68039]">MASTER SERVICE AGREEMENT</h3>
          <div className="flex gap-2 w-full md:w-auto">
            <Button
              onClick={() => downloadAsPDF(MSATemplate(formData), `${formData.business_name}_MSA`)}
              variant="outline"
              size="sm"
              className="flex-1 md:flex-none gradient-button text-black font-semibold"
            >
              <Download className="mr-2 h-4 w-4" />
              PDF
            </Button>
            <Button
              onClick={() => copyDocument(MSATemplate(formData), "MSA")}
              variant="outline"
              size="sm"
              className="flex-1 md:flex-none bg-white/5 border-white/10 text-white hover:bg-white/10"
            >
              <Copy className="mr-2 h-4 w-4" />
              Copy
            </Button>
          </div>
        </div>
        <div className="bg-[#0a0a0a] p-4 md:p-8 rounded-lg border border-[#B68039]/30 max-h-96 overflow-y-auto shadow-xl">
          <div className="text-center mb-6 border-b-2 border-[#B68039] pb-4">
            <img
              src="https://storage.googleapis.com/msgsndr/651kIrlKk834C2FEl66i/media/688a8bfb5a3e648018748f5e.png"
              alt="Orage AI Agency"
              className="h-12 mx-auto mb-4"
            />
            <h1 className="text-[#B68039] font-heading text-xl tracking-widest uppercase">Orage AI Agency</h1>
          </div>
          <div
            className="whitespace-pre-wrap leading-relaxed text-orage-100 font-body text-sm"
            dangerouslySetInnerHTML={{ __html: MSATemplate(formData) }}
          />
        </div>
      </div>

      {/* Invoice Document */}
      <div className="space-y-3">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-2 md:gap-0">
          <h3 className="font-heading text-xl md:text-2xl text-[#B68039]">INVOICE</h3>
          <div className="flex gap-2 w-full md:w-auto">
            <Button
              onClick={() => downloadAsPDF(InvoiceTemplate(formData), `${formData.business_name}_Invoice`)}
              variant="outline"
              size="sm"
              className="flex-1 md:flex-none gradient-button text-black font-semibold"
            >
              <Download className="mr-2 h-4 w-4" />
              PDF
            </Button>
            <Button
              onClick={() => copyDocument(InvoiceTemplate(formData), "Invoice")}
              variant="outline"
              size="sm"
              className="flex-1 md:flex-none bg-white/5 border-white/10 text-white hover:bg-white/10"
            >
              <Copy className="mr-2 h-4 w-4" />
              Copy
            </Button>
          </div>
        </div>
        <div className="bg-[#0a0a0a] p-4 md:p-8 rounded-lg border border-[#B68039]/30 max-h-96 overflow-y-auto shadow-xl">
          <div className="text-center mb-6 border-b-2 border-[#B68039] pb-4">
            <img
              src="https://storage.googleapis.com/msgsndr/651kIrlKk834C2FEl66i/media/688a8bfb5a3e648018748f5e.png"
              alt="Orage AI Agency"
              className="h-12 mx-auto mb-4"
            />
            <h1 className="text-[#B68039] font-heading text-xl tracking-widest uppercase">Orage AI Agency</h1>
          </div>
          <div
            className="whitespace-pre-wrap leading-relaxed text-orage-100 font-body text-sm"
            dangerouslySetInnerHTML={{ __html: InvoiceTemplate(formData) }}
          />
        </div>
      </div>

      {/* Welcome Packet */}
      <div className="space-y-3">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-2 md:gap-0">
          <h3 className="font-heading text-xl md:text-2xl text-[#B68039]">WELCOME PACKET</h3>
          <div className="flex gap-2 w-full md:w-auto">
            <Button
              onClick={() => downloadAsPDF(WelcomeTemplate(formData), `${formData.business_name}_Welcome`)}
              variant="outline"
              size="sm"
              className="flex-1 md:flex-none gradient-button text-black font-semibold"
            >
              <Download className="mr-2 h-4 w-4" />
              PDF
            </Button>
            <Button
              onClick={() => copyDocument(WelcomeTemplate(formData), "Welcome Packet")}
              variant="outline"
              size="sm"
              className="flex-1 md:flex-none bg-white/5 border-white/10 text-white hover:bg-white/10"
            >
              <Copy className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <div className="bg-[#0a0a0a] p-4 md:p-8 rounded-lg border border-[#B68039]/30 max-h-96 overflow-y-auto shadow-xl">
          <div className="text-center mb-6 border-b-2 border-[#B68039] pb-4">
            <img
              src="https://storage.googleapis.com/msgsndr/651kIrlKk834C2FEl66i/media/688a8bfb5a3e648018748f5e.png"
              alt="Orage AI Agency"
              className="h-12 mx-auto mb-4"
            />
            <h1 className="text-[#B68039] font-heading text-xl tracking-widest uppercase">Orage AI Agency</h1>
          </div>
          <div
            className="whitespace-pre-wrap leading-relaxed text-orage-100 font-body text-sm"
            dangerouslySetInnerHTML={{ __html: WelcomeTemplate(formData) }}
          />
        </div>
      </div>

      <div className="p-6 rounded-lg bg-[#B68039]/10 border border-[#B68039]/30">
        <p className="text-white font-body mb-6 text-center">
          All documents have been generated successfully. Save to the document portal for easy access, or use the Copy
          buttons to copy each document individually.
        </p>
        <div className="flex flex-col md:flex-row gap-4 justify-center">
          <Button onClick={saveToPortal} className="gradient-button text-black font-semibold px-8 w-full md:w-auto">
            <FolderOpen className="mr-2 h-5 w-5" />
            Save to Document Portal
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
