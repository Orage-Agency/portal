"use client"

import type React from "react"
import { generateAndDownloadPDF } from "@/lib/pdf"
import { useRef, useState, useEffect } from "react"
import type { OnboardingData } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { X, Check, Download } from "lucide-react"
import MSATemplate from "./templates/MSATemplate"

interface SignatureStepProps {
  formData: OnboardingData
  updateFormData: (updates: Partial<OnboardingData>) => void
}

export default function SignatureStep({ formData, updateFormData }: SignatureStepProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [hasSignature, setHasSignature] = useState(!!formData.signature)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Set canvas size
    const rect = canvas.getBoundingClientRect()
    canvas.width = rect.width * window.devicePixelRatio
    canvas.height = rect.height * window.devicePixelRatio
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio)

    // Load existing signature if available
    if (formData.signature) {
      const img = new Image()
      img.onload = () => {
        ctx.drawImage(img, 0, 0, rect.width, rect.height)
      }
      img.src = formData.signature
    } else {
      // Set up canvas styling
      ctx.strokeStyle = "#B68039"
      ctx.lineWidth = 2
      ctx.lineCap = "round"
      ctx.lineJoin = "round"
    }
  }, [formData.signature])

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
    updateFormData({
      signature: undefined,
      signature_date: undefined,
    })
  }

  const saveSignature = () => {
    const canvas = canvasRef.current
    if (!canvas) return

    const signatureData = canvas.toDataURL("image/png")
    const signatureDate = new Date().toISOString()

    updateFormData({
      signature: signatureData,
      signature_date: signatureDate,
    })
  }

  const getMSAContent = () => {
    return MSATemplate(formData)
  }

  const downloadPreview = async () => {
    await generateAndDownloadPDF(getMSAContent(), `MSA_Preview_${formData.business_name || "Document"}`)
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-heading text-4xl text-gold mb-2">REVIEW & SIGN AGREEMENT</h2>
        <p className="text-white/60 font-body">
          Please review your agreement and sign below to finalize your onboarding
        </p>
      </div>

      <div className="bg-white/10 border border-white/20 rounded-lg p-4 mb-6">
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-white font-heading text-lg">Agreement Preview</h3>
          <Button
            onClick={downloadPreview}
            variant="ghost"
            className="text-[#B68039] hover:text-[#9B6A2F] hover:bg-white/5 text-sm font-body h-auto py-1 px-2"
          >
            <Download className="mr-2 h-4 w-4" />
            Download Preview (PDF)
          </Button>
        </div>
        <div className="h-64 md:h-96 overflow-y-auto bg-black/40 p-2 rounded border border-white/10">
          <div className="bg-white rounded" dangerouslySetInnerHTML={{ __html: getMSAContent() }} />
        </div>
        <p className="text-white/50 text-xs mt-2 text-center">Scroll to review the full agreement</p>
      </div>

      <div className="bg-gold/10 border border-gold/30 rounded-lg p-6">
        <div className="space-y-4">
          <div>
            <p className="text-white font-body mb-2">
              <span className="text-gold">Client Name:</span> {formData.contact_name}
            </p>
            <p className="text-white font-body mb-2">
              <span className="text-gold">Business:</span> {formData.business_name}
            </p>
            <p className="text-white font-body mb-4">
              <span className="text-gold">Selected Plan:</span> {formData.offer_type}
            </p>
          </div>

          <div>
            <label className="block text-white font-body mb-3 text-lg">
              Sign Here: <span className="text-gold">*</span>
            </label>
            <div className="relative">
              <canvas
                ref={canvasRef}
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                onTouchStart={startDrawing}
                onTouchMove={draw}
                onTouchEnd={stopDrawing}
                className="w-full h-48 bg-white/10 border-2 border-gold/40 rounded-lg cursor-crosshair"
                style={{ touchAction: "none" }}
              />
              {!hasSignature && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <p className="text-white/30 font-body text-lg">Draw your signature here</p>
                </div>
              )}
            </div>
          </div>

          <div className="flex gap-4">
            <Button
              onClick={clearSignature}
              variant="outline"
              className="bg-white/5 border-white/10 text-white hover:bg-white/10"
            >
              <X className="mr-2 h-4 w-4" />
              Clear
            </Button>
            <Button
              onClick={saveSignature}
              disabled={!hasSignature}
              className="gradient-button text-black font-semibold"
            >
              <Check className="mr-2 h-4 w-4" />
              Confirm Signature
            </Button>
          </div>

          {formData.signature && (
            <div className="bg-[#B68039]/10 border border-[#B68039]/30 rounded-lg p-4">
              <p className="text-[#B68039] font-body flex items-center">
                <Check className="mr-2 h-5 w-5" />
                Signature saved successfully - Signed on {new Date(formData.signature_date || "").toLocaleDateString()}
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="bg-white/5 border border-white/20 rounded-lg p-6">
        <h3 className="text-white font-heading text-xl mb-3">Agreement Terms</h3>
        <p className="text-white/70 font-body text-sm leading-relaxed mb-4">
          By signing above, I acknowledge that I have read and agree to the terms of service, understand the payment
          structure, and authorize Orage AI Agency to proceed with implementation of the selected services. I understand
          that NO SERVICES WILL BEGIN UNTIL PAYMENT IS MADE AND PROCESSED.
        </p>

        <div className="flex flex-wrap gap-6 text-sm">
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
