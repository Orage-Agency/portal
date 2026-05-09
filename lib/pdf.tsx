import jsPDF from "jspdf"
import html2canvas from "html2canvas"
import MSATemplateDefault from "@/components/c-suite/templates/MSATemplate"
import InvoiceTemplateDefault from "@/components/c-suite/templates/InvoiceTemplate"
import WelcomeTemplateDefault from "@/components/c-suite/templates/WelcomeTemplate"

// Re-export templates as named exports for use in invitations
export const MSATemplate = MSATemplateDefault
export const InvoiceTemplate = InvoiceTemplateDefault
export const WelcomeTemplate = WelcomeTemplateDefault

export const generatePDFFromText = async (textContent: string, filename: string): Promise<Blob> => {
  try {
    console.log("[v0] Starting PDF generation for:", filename)
    
    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    })

    // Add Bebas Neue font (using courier as fallback for bold effect)
    pdf.setFont("courier")

    // Fetch and convert logo to base64 - with robust error handling
    let logoBase64 = ""
    try {
      const logoResponse = await fetch("https://storage.googleapis.com/msgsndr/651kIrlKk834C2FEl66i/media/688a8bfb5a3e648018748f5e.png", {
        mode: "cors",
        credentials: "omit",
      })
      if (logoResponse.ok) {
        const logoBlob = await logoResponse.blob()
        const logoReader = new FileReader()
        logoBase64 = await new Promise((resolve, reject) => {
          logoReader.onloadend = () => resolve(logoReader.result as string)
          logoReader.onerror = () => resolve("") // Resolve empty on error instead of rejecting
          logoReader.readAsDataURL(logoBlob)
        })
      }
    } catch {
      // Continue without logo - do not fail PDF generation
    }

    // Set up the document dimensions
    const pageWidth = pdf.internal.pageSize.getWidth()
    const pageHeight = pdf.internal.pageSize.getHeight()
    const sideMargin = 15
    const topMargin = 12
    const contentWidth = pageWidth - 2 * sideMargin
    
    // Header constants
    const logoSize = 20 // Logo width and height
    const logoPadding = 8
    const titleSize = 18
    const subtitleSize = 14
    const separatorThickness = 0.5
    const headerPadding = 5 // Padding below header before content
    
    // Calculate header positions
    const logoX = pageWidth / 2 - logoSize / 2
    const logoY = topMargin + 2
    const titleY = logoY + logoSize + logoPadding
    const separatorY = titleY + 12
    const contentStartY = separatorY + 6

    // Apply styling function for consistent header on all pages
    const applyPageHeader = () => {
      // White background
      pdf.setFillColor(255, 255, 255)
      pdf.rect(0, 0, pageWidth, pageHeight, "F")
      
      // Add logo with proper sizing and centering
      if (logoBase64) {
        try {
          pdf.addImage(logoBase64, "PNG", logoX, logoY, logoSize, logoSize)
        } catch (imgError) {
          console.error("[v0] Failed to add image to PDF:", imgError)
        }
      }
      
      // Add title "ORAGE AI AGENCY" in bold, large font - keep gold color
      pdf.setTextColor(182, 128, 57) // Gold color
      pdf.setFontSize(titleSize)
      pdf.setFont("helvetica", "bold")
      pdf.text("ORAGE AI AGENCY", pageWidth / 2, titleY, { align: "center" })
      
      // Add separator line - keep gold color
      pdf.setDrawColor(182, 128, 57)
      pdf.setLineWidth(separatorThickness)
      pdf.line(sideMargin, separatorY, pageWidth - sideMargin, separatorY)
      
      // Reset to body text - black text on white background
      pdf.setTextColor(0, 0, 0) // Black text
      pdf.setFontSize(10)
      pdf.setFont("helvetica", "normal")
    }

    // Apply header to first page
    applyPageHeader()

    // Split text into lines
    const lines = textContent.split("\n")
    let yPosition = contentStartY
    const bottomMargin = 15
    const maxContentHeight = pageHeight - bottomMargin

    console.log("[v0] Starting text rendering. Content will start at Y:", contentStartY)

    for (const line of lines) {
      // Split long lines into wrapped text
      const wrappedLines = pdf.splitTextToSize(line || " ", contentWidth)

      for (const wrappedLine of wrappedLines) {
        // Check if we need a new page
        if (yPosition > maxContentHeight) {
          console.log("[v0] Adding new page at Y position:", yPosition)
          pdf.addPage()
          applyPageHeader()
          yPosition = contentStartY
        }

        pdf.text(wrappedLine, sideMargin, yPosition)
        yPosition += 5 // Line height
      }
    }

    console.log("[v0] PDF generated successfully for:", filename)
    return pdf.output("blob")
  } catch (error) {
    console.error("[v0] PDF generation failed:", error)
    throw new Error("Failed to generate PDF from text")
  }
}

export const generateAndDownloadPDF = async (htmlContent: string, filename: string): Promise<void> => {
  // Create a temporary container for the PDF content
  const container = document.createElement("div")
  container.style.position = "absolute"
  container.style.left = "-9999px"
  container.style.top = "0"
  container.style.width = "210mm" // A4 width
  container.style.minHeight = "297mm" // A4 height
  container.style.backgroundColor = "#ffffff" // White background
  container.style.color = "#000000" // Black text
  container.style.padding = "20mm"
  container.style.fontFamily = "'Montserrat', sans-serif"
  container.style.fontSize = "12px"
  container.style.lineHeight = "1.6"
  container.style.boxSizing = "border-box"

  // Add the content
  container.innerHTML = `
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;600;700&display=swap');
      
      /* Override CSS variables for white background PDF */
      :root, body, * {
        --background: #ffffff !important;
        --foreground: #000000 !important;
        --card: #f5f5f5 !important;
        --card-foreground: #000000 !important;
        --popover: #ffffff !important;
        --popover-foreground: #000000 !important;
        --primary: #b68039 !important;
        --primary-foreground: #ffffff !important;
        --secondary: #f0f0f0 !important;
        --secondary-foreground: #000000 !important;
        --muted: #e5e5e5 !important;
        --muted-foreground: #666666 !important;
        --accent: #b68039 !important;
        --accent-foreground: #ffffff !important;
        --destructive: #ef4444 !important;
        --destructive-foreground: #ffffff !important;
        --border: #cccccc !important;
        --input: #f0f0f0 !important;
        --ring: #b68039 !important;
      }

      body { font-family: 'Montserrat', sans-serif; background-color: #ffffff; color: #000000; }
      h1, h2, h3, h4, h5, h6 { color: #B68039; }
      
      /* Updated header layout for perfect centering */
      .header-container {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        width: 100%;
        margin-bottom: 20px;
        border-bottom: 2px solid #B68039;
        padding-bottom: 10px;
        text-align: center;
      }
      
      .header-container img { 
        max-height: 60px; 
        margin-bottom: 10px;
        display: block;
      }
      
      .header-container h1 { 
        font-size: 24px; 
        letter-spacing: 2px; 
        text-transform: uppercase; 
        margin: 0; 
        width: 100%;
        text-align: center;
        color: #B68039 !important;
      }
      
      /* Using pre-wrap to preserve all formatting */
      .content { 
        white-space: pre-wrap; 
        word-wrap: break-word;
        color: #000000;
      }
      
      /* Ensure text colors are explicit for PDF */
      .text-gold { color: #B68039 !important; }
      .text-orage-100 { color: #000000 !important; }
      .bg-orage-black { background-color: #ffffff !important; }
    </style>
    <div class="header-container">
      <img src="https://storage.googleapis.com/msgsndr/651kIrlKk834C2FEl66i/media/688a8bfb5a3e648018748f5e.png" alt="Orage AI Agency Logo" />
      <h1>ORAGE AI AGENCY</h1>
    </div>
    <div class="content">${htmlContent}</div>
  `

  document.body.appendChild(container)

  try {
    const canvas = await html2canvas(container, {
      scale: 2, // Higher scale for better quality
      useCORS: true,
      backgroundColor: "#ffffff", // White background
      logging: false,
    })

    const imgData = canvas.toDataURL("image/jpeg", 1.0)
    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    })

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

    pdf.save(`${filename}.pdf`)
  } catch (error) {
    console.error("PDF generation failed:", error)
    alert("Failed to generate PDF. Please try again.")
  } finally {
    document.body.removeChild(container)
  }
}
