"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Download, Copy, Check, Edit2, Save, X } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { getClients, saveClient, saveNotification } from "@/lib/storage"

// Skip static generation - requires client-side auth and database access
export const dynamic = "force-dynamic"

export default function ClientDashboard() {
  const router = useRouter()
  const { toast } = useToast()
  const [mounted, setMounted] = useState(false)
  const [client, setClient] = useState<any>(null)
  const [activeTab, setActiveTab] = useState<"info" | "msa" | "invoice" | "welcome">("info")
  const [isEditing, setIsEditing] = useState(false)
  const [editedData, setEditedData] = useState<any>(null)

  useEffect(() => {
    setMounted(true)
    loadClientData()
  }, [])

  const loadClientData = async () => {
    const stored = localStorage.getItem("current_client")
    if (stored) {
      const clientData = JSON.parse(stored)

      try {
        const clients = await getClients()
        const latestClient = clients.find((c: any) => c.id === clientData.id)

        if (latestClient) {
          // Use the latest data from Supabase to ensure signatures are current
          setClient(latestClient)
          setEditedData(latestClient)
          // Update current_client with latest data
          localStorage.setItem("current_client", JSON.stringify(latestClient))
        } else {
          setClient(clientData)
          setEditedData(clientData)
        }
      } catch (error) {
        console.error("[v0] Error loading client data:", error)
        setClient(clientData)
        setEditedData(clientData)
      }
    } else {
      router.push("/portal/login")
    }
  }

  const handleLogout = () => {
    localStorage.removeItem("current_client")
    router.push("/portal/login")
  }

  const handleSaveChanges = async () => {
    try {
      const updatedClient = {
        ...client,
        name: editedData.contact_name || client.name,
        email: editedData.client_email || client.email,
        address: `${editedData.client_address || ""}, ${editedData.client_city || ""}, ${editedData.client_state || ""} ${editedData.client_zip || ""}`,
        updated_at: new Date().toISOString(),
      }

      await saveClient(updatedClient)

      await saveNotification({
        id: `notif-${Date.now()}`,
        title: "Client Info Updated",
        message: `${client.business_name} updated their account information`,
        type: "info_updated",
        read: false,
        created_at: new Date().toISOString(),
      })

      // Update current client in localStorage
      localStorage.setItem("current_client", JSON.stringify(updatedClient))
      setClient(updatedClient)

      setIsEditing(false)
      toast({
        title: "Information Updated",
        description: "Your account information has been saved",
      })
    } catch (error) {
      console.error("[v0] Error saving changes:", error)
      toast({
        title: "Error",
        description: "Failed to save changes. Please try again.",
        variant: "destructive",
      })
    }
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
      printWindow.document.write(`
        <html>
          <head>
            <title>${filename}</title>
            <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;600;700&display=swap" rel="stylesheet">
            <style>
              body {
                font-family: 'Montserrat', Arial, sans-serif;
                padding: 40px;
                line-height: 1.6;
                color: #000000;
                background-color: #ffffff;
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
              }
              .header {
                text-align: center;
                margin-bottom: 40px;
                border-bottom: 2px solid #B68039;
                padding-bottom: 20px;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
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
                white-space: pre-wrap;
                word-wrap: break-word;
                font-family: 'Montserrat', sans-serif;
                font-size: 12px;
                color: #000000;
              }
              @media print {
                body {
                  background-color: #ffffff !important;
                  color: #000000 !important;
                }
                .header {
                  border-bottom-color: #B68039 !important;
                }
                .header h1 {
                  color: #B68039 !important;
                }
              }
            </style>
          </head>
          <body>
            <div class="header">
              <img src="https://storage.googleapis.com/msgsndr/651kIrlKk834C2FEl66i/media/688a8bfb5a3e648018748f5e.png" alt="Orage AI Agency Logo" />
              <h1>ORAGE AI AGENCY</h1>
            </div>
            <div class="content">${content}</div>
          </body>
        </html>
      `)
      printWindow.document.close()

      setTimeout(() => {
        printWindow.focus()
        printWindow.print()
        toast({
          title: "PDF Ready",
          description: 'Save as PDF in the print dialog.',
        })
      }, 500)
    }
  }

  if (!mounted || !client) return null

  return (
    <div className="min-h-screen bg-orage-black p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4 md:gap-0">
          <div>
            <img
              src="https://storage.googleapis.com/msgsndr/651kIrlKk834C2FEl66i/media/688a8bfb5a3e648018748f5e.png"
              alt="Orage AI Agency"
              className="h-10 md:h-12 mb-4"
            />
            <h1 className="font-heading text-3xl md:text-4xl text-gold">{client.business_name}</h1>
            <p className="text-white/70 text-sm md:text-base">Client ID: {client.id}</p>
          </div>
          <button
            onClick={handleLogout}
            className="w-full md:w-auto px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-all"
          >
            Logout
          </button>
        </div>

        {client.client_signature && (
          <div className="bg-[#B68039]/10 border border-[#B68039]/30 rounded-lg p-6 mb-8">
            <div className="flex items-start gap-4">
              <Check className="h-6 w-6 text-[#B68039] mt-1" />
              <div className="flex-1">
                <h3 className="font-heading text-xl text-[#B68039] mb-2">Agreement Signed</h3>
                <p className="text-white/70 font-body mb-3">
                  Signed on {client.signed_at ? new Date(client.signed_at).toLocaleDateString() : "N/A"}
                </p>
                <div className="bg-white/10 rounded-lg p-4 inline-block">
                  <img src={client.client_signature || "/placeholder.svg"} alt="Signature" className="h-16" />
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {(["info", "msa", "invoice", "welcome"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-3 rounded-lg font-heading transition-all whitespace-nowrap ${
                activeTab === tab
                  ? "bg-[#B68039] text-black font-bold shadow-lg scale-105"
                  : "bg-white/10 text-white hover:bg-white/20"
              }`}
            >
              {tab === "info" ? "YOUR INFO" : tab.toUpperCase()}
            </button>
          ))}
        </div>

        <div className="bg-white/5 backdrop-blur-sm border border-gold/20 rounded-lg p-4 md:p-8">
          {activeTab === "info" && (
            <div className="space-y-6">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-4 gap-4 md:gap-0">
                <h3 className="font-heading text-2xl text-gold">Account Information</h3>
                {!isEditing ? (
                  <Button
                    onClick={() => setIsEditing(true)}
                    className="w-full md:w-auto bg-gold/20 hover:bg-gold/30 text-gold border border-gold/30"
                  >
                    <Edit2 className="mr-2 h-4 w-4" />
                    Edit Information
                  </Button>
                ) : (
                  <div className="flex flex-col md:flex-row gap-2 w-full md:w-auto">
                    <Button onClick={handleSaveChanges} className="gradient-button text-black font-semibold">
                      <Save className="mr-2 h-4 w-4" />
                      Save Changes
                    </Button>
                    <Button
                      onClick={() => {
                        setIsEditing(false)
                        setEditedData(client)
                      }}
                      variant="outline"
                      className="bg-white/5 border-white/10 text-white hover:bg-white/10"
                    >
                      <X className="mr-2 h-4 w-4" />
                      Cancel
                    </Button>
                  </div>
                )}
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <p className="text-white/60 text-sm mb-2">Business Name</p>
                  <p className="text-white text-lg">{client.business_name}</p>
                </div>
                <div>
                  <p className="text-white/60 text-sm mb-2">Contact Name</p>
                  <p className="text-white text-lg">{client.name}</p>
                </div>
                <div>
                  <p className="text-white/60 text-sm mb-2">Email</p>
                  <p className="text-white text-lg">{client.email}</p>
                </div>
                <div>
                  <p className="text-white/60 text-sm mb-2">Address</p>
                  <p className="text-white text-lg">{client.address || "N/A"}</p>
                </div>
                <div>
                  <p className="text-white/60 text-sm">Plan</p>
                  <p className="text-white text-lg">{client.plan}</p>
                </div>
                <div>
                  <p className="text-white/60 text-sm">Setup Fee</p>
                  <p className="text-white text-lg">${client.setup_fee || 0}</p>
                </div>
                <div>
                  <p className="text-white/60 text-sm">Monthly Fee</p>
                  <p className="text-white text-lg">${client.price}</p>
                </div>
              </div>
            </div>
          )}

          {activeTab === "msa" && (
            <div className="space-y-4">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-4 gap-4 md:gap-0">
                <h3 className="font-heading text-2xl text-gold">MASTER SERVICE AGREEMENT</h3>
                <div className="flex gap-2 w-full md:w-auto">
                  <Button
                    onClick={() => downloadAsPDF(client.msa_content || "", `${client.business_name}_MSA`)}
                    className="flex-1 md:flex-none gradient-button text-black font-semibold"
                  >
                    <Download className="mr-2 h-4 w-4" />
                    PDF
                  </Button>
                  <Button
                    onClick={() => copyDocument(client.msa_content || "", "MSA")}
                    variant="outline"
                    className="flex-1 md:flex-none bg-white/5 border-white/10 text-white hover:bg-white/10"
                  >
                    <Copy className="mr-2 h-4 w-4" />
                    Copy
                  </Button>
                </div>
              </div>
              <div className="flex gap-2 mb-4">
                {client.client_signature && (
                  <div className="bg-[#B68039]/20 border border-[#B68039]/50 rounded px-3 py-1 text-sm text-[#B68039]">
                    ✓ Client Signed
                  </div>
                )}
                {client.agency_signature && (
                  <div className="bg-gold/20 border border-gold/50 rounded px-3 py-1 text-sm text-gold">
                    ✓ Agency Signed
                  </div>
                )}
              </div>
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
                  className="whitespace-pre-wrap leading-relaxed text-orage-100 font-body text-sm"
                  dangerouslySetInnerHTML={{ __html: client.msa_content || "" }}
                />
              </div>
            </div>
          )}

          {activeTab === "invoice" && (
            <div className="space-y-4">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-4 gap-4 md:gap-0">
                <h3 className="font-heading text-2xl text-gold">INVOICE</h3>
                <div className="flex gap-2 w-full md:w-auto">
                  <Button
                    onClick={() => downloadAsPDF(client.invoice_content || "", `${client.business_name}_Invoice`)}
                    className="flex-1 md:flex-none gradient-button text-black font-semibold"
                  >
                    <Download className="mr-2 h-4 w-4" />
                    PDF
                  </Button>
                  <Button
                    onClick={() => copyDocument(client.invoice_content || "", "Invoice")}
                    variant="outline"
                    className="flex-1 md:flex-none bg-white/5 border-white/10 text-white hover:bg-white/10"
                  >
                    <Copy className="mr-2 h-4 w-4" />
                    Copy
                  </Button>
                </div>
              </div>
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
                  className="whitespace-pre-wrap leading-relaxed text-orage-100 font-body text-sm"
                  dangerouslySetInnerHTML={{ __html: client.invoice_content || "" }}
                />
              </div>
            </div>
          )}

          {activeTab === "welcome" && (
            <div className="space-y-4">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-4 gap-4 md:gap-0">
                <h3 className="font-heading text-2xl text-gold">WELCOME PACKET</h3>
                <div className="flex gap-2 w-full md:w-auto">
                  <Button
                    onClick={() => downloadAsPDF(client.welcome_content || "", `${client.business_name}_Welcome`)}
                    className="flex-1 md:flex-none gradient-button text-black font-semibold"
                  >
                    <Download className="mr-2 h-4 w-4" />
                    PDF
                  </Button>
                  <Button
                    onClick={() => copyDocument(client.welcome_content || "", "Welcome Packet")}
                    variant="outline"
                    className="flex-1 md:flex-none bg-white/5 border-white/10 text-white hover:bg-white/10"
                  >
                    <Copy className="mr-2 h-4 w-4" />
                    Copy
                  </Button>
                </div>
              </div>
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
                  className="whitespace-pre-wrap leading-relaxed text-orage-100 font-body text-sm"
                  dangerouslySetInnerHTML={{ __html: client.welcome_content || "" }}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
