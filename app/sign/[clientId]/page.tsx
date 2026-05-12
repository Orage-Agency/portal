"use client"

import type React from "react"
import { use, useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { Download } from "lucide-react"
import { generateAndDownloadPDF } from "@/lib/pdf"
import {
  getClientForSigning,
  submitClientSignature,
  type PublicClientForSign,
} from "@/lib/storage"

export const dynamic = "force-dynamic"

type DocKey = "msa" | "welcome" | "invoice"

export default function PublicSignPage({
  params,
}: {
  params: Promise<{ clientId: string }>
}) {
  const { clientId } = use(params)
  const router = useRouter()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [mounted, setMounted] = useState(false)
  const [loading, setLoading] = useState(true)
  const [client, setClient] = useState<PublicClientForSign | null>(null)
  const [docKey, setDocKey] = useState<DocKey>("msa")
  const [signature, setSignature] = useState<string | undefined>()
  const [hasSignature, setHasSignature] = useState(false)
  const [drawing, setDrawing] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)
  const [termsAccepted, setTermsAccepted] = useState(false)

  useEffect(() => {
    setMounted(true)
    load()
  }, [])

  const load = async () => {
    setLoading(true)
    try {
      const data = await getClientForSigning(clientId)
      if (!data) {
        alert("Invalid or expired sign link.")
        router.push("/")
        return
      }
      setClient(data)
      if (data.client_signature) setDone(true)
    } catch (e) {
      console.error("[sign] load failed:", e)
      alert("We couldn't load this document. Please try again or contact team@orage.agency.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (loading || done) return
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
  }, [loading, done, docKey])

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    setDrawing(true)
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
    if (!drawing) return
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
    if (!drawing) return
    setDrawing(false)
    const canvas = canvasRef.current
    if (canvas) {
      setHasSignature(true)
      setSignature(canvas.toDataURL("image/png"))
    }
  }

  const clearCanvas = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    setHasSignature(false)
    setSignature(undefined)
  }

  const getContent = (): string => {
    if (!client) return ""
    if (docKey === "msa") return client.msa_content || ""
    if (docKey === "welcome") return client.welcome_content || ""
    if (docKey === "invoice") return client.invoice_content || ""
    return ""
  }

  /** Inline the captured signatures into the MSA HTML before rendering the PDF. */
  const renderForPdf = (): string => {
    let html = getContent()
    if (!client) return html
    const clientSig = signature || client.client_signature
    if (clientSig) {
      const placeholder = `${client.business_name}\nSignature: ________________________`
      const replacement = `${client.business_name}\nSignature: <img src="${clientSig}" alt="Client Signature" style="max-height:60px;vertical-align:middle;border-bottom:1px solid #B68039;" />`
      html = html.replace(placeholder, replacement)
    }
    if (client.agency_signature) {
      const placeholder = `ORAGE AI AGENCY\nSignature: ________________________`
      const replacement = `ORAGE AI AGENCY\nSignature: <img src="${client.agency_signature}" alt="Agency Signature" style="max-height:60px;vertical-align:middle;border-bottom:1px solid #B68039;" />`
      html = html.replace(placeholder, replacement)
    }
    return html
  }

  const downloadPdf = async () => {
    if (!client) return
    const filename = `${client.business_name}_${docKey}_signed`
    try {
      await generateAndDownloadPDF(renderForPdf(), filename)
    } catch (e) {
      console.error("[sign] PDF download failed:", e)
      alert("Couldn't generate the PDF. Please try again.")
    }
  }

  const handleSubmit = async () => {
    if (!signature) {
      alert("Please sign before submitting.")
      return
    }
    if (!termsAccepted) {
      alert("Please accept the Terms of Service to continue.")
      return
    }
    setSubmitting(true)
    try {
      await submitClientSignature(clientId, signature)
      // Reflect locally so the success screen + PDF show the new signature.
      setClient((c) => (c ? { ...c, client_signature: signature, signed_at: new Date().toISOString() } : c))
      setDone(true)
    } catch (e) {
      console.error("[sign] submit failed:", e)
      alert(`Couldn't save your signature: ${(e as Error).message}`)
    } finally {
      setSubmitting(false)
    }
  }

  if (!mounted || loading) {
    return (
      <div className="min-h-screen bg-orage-black flex items-center justify-center">
        <div className="text-center">
          <img
            src="https://storage.googleapis.com/msgsndr/651kIrlKk834C2FEl66i/media/688a8bfb5a3e648018748f5e.png"
            alt="Orage AI Agency"
            className="h-16 mx-auto mb-4 animate-pulse"
          />
          <p className="text-white/70 font-body">Loading document…</p>
        </div>
      </div>
    )
  }

  if (!client) return null

  const docContent = getContent()
  const hasDoc = docContent.trim().length > 0

  if (done) {
    return (
      <div className="min-h-screen bg-orage-black p-4 md:p-8 flex items-center justify-center overflow-x-hidden">
        <div className="max-w-2xl w-full bg-white/5 backdrop-blur-sm border border-gold/20 rounded-lg p-4 md:p-8 text-center overflow-hidden">
          <img
            src="https://storage.googleapis.com/msgsndr/651kIrlKk834C2FEl66i/media/688a8bfb5a3e648018748f5e.png"
            alt="Orage AI Agency"
            className="h-12 md:h-16 mx-auto mb-6 md:mb-8"
          />
          <h1 className="font-heading text-2xl md:text-4xl text-gold mb-4 break-words">SIGNED</h1>
          <p className="font-body text-white/70 mb-8 break-words">
            Thank you, {client.name || client.business_name}. Your signed copy is ready to download.
          </p>
          <button
            onClick={downloadPdf}
            className="w-full bg-gradient-to-r from-[#B68039] to-[#8B6028] hover:from-[#9B6A2F] hover:to-[#7A5222] text-white font-heading text-lg md:text-xl px-4 md:px-8 py-4 rounded-lg transition-all duration-300 transform hover:scale-105 flex items-center justify-center gap-2"
          >
            <Download className="h-5 w-5" />
            DOWNLOAD SIGNED PDF
          </button>
          <p className="text-white/50 text-sm mt-6">
            Need anything else? Just reply to the email — team@orage.agency.
          </p>
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
          <div className="flex flex-col items-center mb-6">
            <h1 className="font-heading text-2xl md:text-4xl text-gold mb-2 break-words text-center">REVIEW &amp; SIGN</h1>
            <h2 className="font-heading text-lg md:text-xl text-gold/80 mb-4 break-words text-center">
              {client.business_name}
            </h2>
            <div className="w-24 h-0.5 bg-gradient-to-r from-transparent via-gold to-transparent" />
          </div>

          {/* Doc tabs — only show non-empty ones */}
          <div className="flex flex-wrap gap-2 mb-4 justify-center">
            {(["msa", "welcome", "invoice"] as const)
              .filter((k) => {
                if (k === "msa") return !!client.msa_content
                if (k === "welcome") return !!client.welcome_content
                if (k === "invoice") return !!client.invoice_content
                return false
              })
              .map((k) => (
                <button
                  key={k}
                  onClick={() => setDocKey(k)}
                  className={`px-4 py-2 rounded-lg text-sm font-body font-semibold transition-all ${
                    docKey === k ? "bg-[#B68039] text-black" : "bg-white/5 text-white hover:bg-white/10"
                  }`}
                >
                  {k === "msa" ? "Agreement" : k === "welcome" ? "Welcome" : "Invoice"}
                </button>
              ))}
          </div>

          {hasDoc ? (
            <div className="bg-white/10 border border-white/20 rounded-lg p-4 mb-6">
              <div className="h-64 md:h-96 overflow-y-auto bg-black/40 p-2 rounded border border-white/10">
                <div className="bg-white rounded" dangerouslySetInnerHTML={{ __html: docContent }} />
              </div>
              <p className="text-white/50 text-xs mt-2 text-center">Scroll to review the full document</p>
            </div>
          ) : (
            <p className="text-white/60 text-sm text-center my-6">No content available for this document.</p>
          )}

          {/* Only MSA gets the sign pad — Welcome / Invoice are review-only */}
          {docKey === "msa" && (
            <div className="bg-gold/10 border border-gold/30 rounded-lg p-4 md:p-6 w-full overflow-hidden">
              <h2 className="font-heading text-xl md:text-2xl text-white mb-2">Sign here</h2>
              <p className="text-white/70 font-body mb-4 text-sm md:text-base">
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
                  onClick={clearCanvas}
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
                className="w-full bg-gradient-to-r from-[#B68039] to-[#8B6028] hover:from-[#9B6A2F] hover:to-[#7A5222] text-white font-heading text-lg py-3 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? "SIGNING…" : "SIGN & SUBMIT"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
