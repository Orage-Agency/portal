"use client"

import { useState, useEffect } from "react"
import type { OnboardingData } from "@/lib/types"
import StepIndicator from "./StepIndicator"
import Step1OfferInfo from "./Step1OfferInfo"
import Step3ClientDetails from "./Step3ClientDetails"
import Step4Payment from "./Step4Payment"
import Step5Customizations from "./Step5Customizations"
import SignatureStep from "./SignatureStep"
import DocumentViewer from "./DocumentViewer"
import { Button } from "@/components/ui/button"
import { ArrowLeft, ArrowRight, Home } from "lucide-react"
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

        <div className="flex justify-end mb-4">
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
    </div>
  )
}
