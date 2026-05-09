"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Trash2, ArrowLeft, Search, FolderOpen, CheckSquare } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"
import { getClients, deleteClient as deleteClientFromStorage } from "@/lib/storage"

// Skip static generation - requires client-side auth and database access
export const dynamic = "force-dynamic"
interface ClientFolder {
  id: string
  clientName: string
  contactName: string
  dateCreated: string
  documents: {
    msa: string
    invoice: string
    welcome: string
  }
}

export default function DocumentsPortalPage() {
  const [clients, setClients] = useState<ClientFolder[]>([])
  const [filteredClients, setFilteredClients] = useState<ClientFolder[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [selectMode, setSelectMode] = useState(false)
  const [selectedClients, setSelectedClients] = useState<Set<string>>(new Set())
  const { toast } = useToast()
  const router = useRouter()

  useEffect(() => {
    async function loadClients() {
      const data = await getClients()
      console.log("[v0] Loaded clients from Supabase:", data)
      const mapped = data.map((client) => ({
        id: client.id,
        clientName: client.business_name,
        contactName: client.name,
        dateCreated: client.created_at || new Date().toISOString(),
        documents: {
          msa: client.msa_content || "",
          invoice: client.invoice_content || "",
          welcome: client.welcome_content || "",
        },
      }))
      setClients(mapped)
      setFilteredClients(mapped)
    }
    loadClients()
  }, [])

  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredClients(clients)
    } else {
      const query = searchQuery.toLowerCase()
      const filtered = clients.filter(
        (client) => client.clientName.toLowerCase().includes(query) || client.contactName.toLowerCase().includes(query),
      )
      setFilteredClients(filtered)
    }
  }, [searchQuery, clients])

  const downloadAsPDF = (content: string, filename: string) => {
    const printWindow = window.open("", "", "height=800,width=800")
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>${filename}</title>
            <style>
              body {
                font-family: 'Montserrat', Arial, sans-serif;
                padding: 40px;
                line-height: 1.6;
                color: #000;
                background: #fff;
              }
              pre {
                white-space: pre-wrap;
                word-wrap: break-word;
                font-family: 'Montserrat', Arial, sans-serif;
                font-size: 12px;
              }
            </style>
          </head>
          <body>
            <pre>${content}</pre>
          </body>
        </html>
      `)
      printWindow.document.close()

      setTimeout(() => {
        printWindow.print()
        toast({
          title: "PDF Ready",
          description: "Use Print dialog to save as PDF",
        })
      }, 250)
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

  const deleteClient = async (clientId: string) => {
    if (confirm(`Delete all documents for client with ID ${clientId}? This cannot be undone.`)) {
      await deleteClientFromStorage(clientId)
      const updated = await getClients()
      setClients(updated as any)
      setFilteredClients(updated as any)
      toast({
        title: "Deleted",
        description: `Client with ID ${clientId}'s documents have been deleted`,
      })
    }
  }

  const deleteSelected = async () => {
    if (selectedClients.size === 0) return

    if (confirm(`Delete ${selectedClients.size} client(s) and all their documents? This cannot be undone.`)) {
      for (const clientId of selectedClients) {
        await deleteClientFromStorage(clientId)
      }
      const updated = await getClients()
      setClients(updated as any)
      setFilteredClients(updated as any)
      setSelectedClients(new Set())
      setSelectMode(false)
      toast({
        title: "Deleted",
        description: `${selectedClients.size} client(s) deleted`,
      })
    }
  }

  const toggleSelectMode = () => {
    setSelectMode(!selectMode)
    if (selectMode) {
      setSelectedClients(new Set())
    }
  }

  const handleClientClick = (clientId: string) => {
    console.log("[v0] Client clicked:", clientId, "Select mode:", selectMode)

    if (selectMode) {
      const newSelected = new Set(selectedClients)
      if (newSelected.has(clientId)) {
        newSelected.delete(clientId)
      } else {
        newSelected.add(clientId)
      }
      setSelectedClients(newSelected)
    } else {
      console.log("[v0] Navigating to:", `/c-suite/documents/${clientId}`)
      router.push(`/c-suite/documents/${clientId}`)
    }
  }

  const getDocumentContent = () => {
    // Placeholder for selectedClient and selectedDoc logic
    return ""
  }

  const getDocumentName = () => {
    // Placeholder for selectedDoc logic
    return ""
  }

  const openClientFolder = (clientId: string) => {
    router.push(`/c-suite/documents/${encodeURIComponent(clientId)}`)
  }

  return (
    <div className="min-h-screen bg-orage-black py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4 md:gap-0">
          <div>
            <img
              src="https://storage.googleapis.com/msgsndr/651kIrlKk834C2FEl66i/media/688a8bfb5a3e648018748f5e.png"
              alt="Orage AI Agency"
              className="h-10 md:h-12 mb-4"
            />
            <h1 className="font-heading text-4xl md:text-5xl text-gold mb-2">DOCUMENT PORTAL</h1>
            <p className="font-body text-white/70">Manage all client documents in one place</p>
          </div>
          <div className="flex gap-3 w-full md:w-auto">
            {filteredClients.length > 0 && (
              <Button
                onClick={toggleSelectMode}
                className={`flex-1 md:flex-none ${selectMode ? "gradient-button text-black font-semibold" : "bg-white/5 border border-white/10 text-white hover:bg-white/10"}`}
              >
                <CheckSquare className="mr-2 h-4 w-4" />
                {selectMode ? "Exit" : "Select"}
              </Button>
            )}
            <Button
              onClick={() => router.push("/c-suite/admin")}
              variant="outline"
              className="flex-1 md:flex-none bg-white/5 border-white/10 text-white hover:bg-white/10"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Dashboard
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Client Folders Sidebar */}
          <div className="lg:col-span-4 glass-panel p-4 md:p-6 rounded-lg">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 gap-4 md:gap-0">
              <h2 className="font-heading text-2xl text-gold">CLIENT FOLDERS</h2>
              {selectMode && selectedClients.size > 0 && (
                <Button
                  onClick={deleteSelected}
                  variant="outline"
                  className="w-full md:w-auto bg-red-500/10 border-red-500/30 text-red-500 hover:bg-red-500/20"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete Selected ({selectedClients.size})
                </Button>
              )}
            </div>

            <div className="relative mb-6">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
              <Input
                type="text"
                placeholder="Search by business name or contact name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-white/40 focus:border-[#B68039]"
              />
            </div>

            {filteredClients.length === 0 && searchQuery === "" ? (
              <p className="text-white/50 text-sm font-body">
                No clients yet. Complete an onboarding to add documents.
              </p>
            ) : filteredClients.length === 0 && searchQuery !== "" ? (
              <p className="text-white/50 text-sm font-body">No clients found matching "{searchQuery}"</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredClients.map((client) => (
                  <button
                    key={client.id}
                    onClick={() => handleClientClick(client.id)}
                    className={`p-5 rounded-lg text-left transition-all ${
                      selectedClients.has(client.id)
                        ? "bg-[#B68039]/20 border-2 border-[#B68039]"
                        : "bg-white/5 border-2 border-white/10 hover:border-white/30 hover:scale-105"
                    }`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <FolderOpen
                        className={`h-10 w-10 transition-transform ${
                          selectedClients.has(client.id) ? "text-[#B68039]" : "text-[#B68039]/70"
                        }`}
                      />
                      {selectMode && selectedClients.has(client.id) && (
                        <CheckSquare className="h-5 w-5 text-[#B68039]" />
                      )}
                    </div>
                    <h3 className="font-body font-bold text-white mb-1 text-lg">{client.clientName}</h3>
                    <p className="text-white/60 text-sm mb-2">{client.contactName}</p>
                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/10">
                      <p className="text-white/40 text-xs">3 documents</p>
                      <p className="text-white/40 text-xs">{new Date(client.dateCreated).toLocaleDateString()}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
