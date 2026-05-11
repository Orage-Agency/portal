import jsPDF from "jspdf"
import html2canvas from "html2canvas"
import MSATemplateDefault from "@/components/c-suite/templates/MSATemplate"
import InvoiceTemplateDefault from "@/components/c-suite/templates/InvoiceTemplate"
import WelcomeTemplateDefault from "@/components/c-suite/templates/WelcomeTemplate"

// Re-export templates as named exports for use in invitations
export const MSATemplate = MSATemplateDefault
export const InvoiceTemplate = InvoiceTemplateDefault
export const WelcomeTemplate = WelcomeTemplateDefault

/**
 * Render an HTML string into a PDF Blob using html2canvas + jsPDF.
 * Templates emit self-contained, light-mode HTML — we just frame it on A4 paper.
 */
async function renderHtmlToPdfBlob(htmlContent: string): Promise<Blob> {
  const container = document.createElement("div")
  container.style.position = "absolute"
  container.style.left = "-9999px"
  container.style.top = "0"
  container.style.width = "210mm" // A4 width
  container.style.minHeight = "297mm" // A4 height
  container.style.backgroundColor = "#FFFFFF"
  container.style.color = "#2C1A00"
  container.style.fontFamily =
    "'Montserrat', -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif"
  container.style.fontSize = "13px"
  container.style.lineHeight = "1.65"
  container.style.boxSizing = "border-box"
  container.style.padding = "0"

  container.innerHTML = `
    <link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Montserrat:wght@500;600;700&display=swap" rel="stylesheet" />
    <div style="background:#FFFFFF;">${htmlContent}</div>
  `

  document.body.appendChild(container)

  try {
    // Wait for any web fonts referenced in the template to settle before snapshotting.
    if ("fonts" in document) {
      try {
        await (document as Document & { fonts: { ready: Promise<unknown> } }).fonts.ready
      } catch {
        // ignore — fall back to system fonts via the template's fallback chain
      }
    }

    const canvas = await html2canvas(container, {
      scale: 2,
      useCORS: true,
      backgroundColor: "#FFFFFF",
      logging: false,
    })

    const imgData = canvas.toDataURL("image/jpeg", 0.95)
    const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" })

    const imgWidth = 210
    const pageHeight = 297
    const imgHeight = (canvas.height * imgWidth) / canvas.width
    let heightLeft = imgHeight
    let position = 0

    pdf.addImage(imgData, "JPEG", 0, position, imgWidth, imgHeight)
    heightLeft -= pageHeight

    while (heightLeft >= 0) {
      position = heightLeft - imgHeight
      pdf.addPage()
      pdf.addImage(imgData, "JPEG", 0, position, imgWidth, imgHeight)
      heightLeft -= pageHeight
    }

    return pdf.output("blob")
  } finally {
    document.body.removeChild(container)
  }
}

/**
 * Generate a PDF from HTML content (templates now emit HTML, not plain text).
 * Returns a Blob. Used by the invitation creation flow to pre-bake PDFs that
 * are stored as base64 in localStorage and downloaded by the client later.
 */
export const generatePDFFromText = async (
  htmlContent: string,
  _filename: string,
): Promise<Blob> => {
  return renderHtmlToPdfBlob(htmlContent)
}

/**
 * Generate a PDF from HTML content AND trigger a download in the browser.
 */
export const generateAndDownloadPDF = async (
  htmlContent: string,
  filename: string,
): Promise<void> => {
  try {
    const blob = await renderHtmlToPdfBlob(htmlContent)
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${filename}.pdf`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  } catch (error) {
    console.error("PDF generation failed:", error)
    alert("Failed to generate PDF. Please try again.")
  }
}
