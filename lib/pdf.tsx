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
 * Walk all <img> elements inside the container and replace any external src
 * (http/https) with a base64 data URI. This eliminates the most common
 * html2canvas failure mode: a cross-origin image taints the canvas, so
 * canvas.toDataURL() throws a SecurityError ("Failed to generate PDF").
 *
 * Failures here are swallowed — if a single image can't be fetched
 * (network blip, CORS), html2canvas will still try to render it directly.
 */
async function inlineExternalImages(container: HTMLElement): Promise<void> {
  const imgs = Array.from(container.querySelectorAll("img")) as HTMLImageElement[]
  await Promise.all(
    imgs.map(async (img) => {
      const src = img.getAttribute("src")
      if (!src) return
      if (src.startsWith("data:")) return
      if (!/^https?:\/\//i.test(src)) return
      try {
        const r = await fetch(src, { mode: "cors", credentials: "omit" })
        if (!r.ok) return
        const blob = await r.blob()
        const dataUri = await new Promise<string>((resolve, reject) => {
          const fr = new FileReader()
          fr.onload = () => resolve(String(fr.result))
          fr.onerror = () => reject(fr.error)
          fr.readAsDataURL(blob)
        })
        img.setAttribute("src", dataUri)
      } catch {
        // best-effort; html2canvas will fall through to its own loader
      }
    }),
  )
}

/**
 * Render an HTML string into a PDF Blob using html2canvas + jsPDF.
 *
 * The template HTML is mounted inside a same-origin iframe so it renders in
 * isolation from the host page's stylesheet. This matters because the app
 * uses Tailwind v4, whose tokens are defined with `oklch()` — a color
 * function html2canvas v1 cannot parse. Inheriting those variables (via
 * `:root` / `*` rules) would crash the snapshot with
 * "Attempting to parse an unsupported color function 'oklch'".
 */
async function renderHtmlToPdfBlob(htmlContent: string): Promise<Blob> {
  const iframe = document.createElement("iframe")
  iframe.setAttribute("aria-hidden", "true")
  iframe.style.position = "fixed"
  iframe.style.left = "-99999px"
  iframe.style.top = "0"
  iframe.style.width = "210mm"
  iframe.style.height = "297mm"
  iframe.style.border = "0"
  iframe.style.pointerEvents = "none"
  iframe.style.opacity = "0"

  document.body.appendChild(iframe)

  const doc = iframe.contentDocument
  const win = iframe.contentWindow
  if (!doc || !win) {
    document.body.removeChild(iframe)
    throw new Error("Unable to initialize PDF rendering frame")
  }

  // Build a self-contained document. No <link> back to the host page's CSS,
  // so no oklch variables leak in. Fonts are loaded directly from Google.
  doc.open()
  doc.write(`<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Montserrat:wght@400;500;600;700&display=swap" rel="stylesheet" />
    <style>
      html, body {
        margin: 0;
        padding: 0;
        background: #FFFFFF;
        color: #2C1A00;
        font-family: 'Montserrat', -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif;
        font-size: 13px;
        line-height: 1.65;
        -webkit-font-smoothing: antialiased;
      }
      #pdf-root {
        width: 210mm;
        min-height: 297mm;
        background: #FFFFFF;
        box-sizing: border-box;
      }
    </style>
  </head>
  <body><div id="pdf-root">${htmlContent}</div></body>
</html>`)
  doc.close()

  try {
    const container = doc.getElementById("pdf-root") as HTMLElement | null
    if (!container) throw new Error("PDF root element missing")

    // Inline external images so html2canvas doesn't taint the canvas.
    await inlineExternalImages(container)

    // Wait for fonts to settle inside the iframe.
    const iframeDoc = doc as Document & { fonts?: { ready: Promise<unknown> } }
    if (iframeDoc.fonts && iframeDoc.fonts.ready) {
      try {
        await iframeDoc.fonts.ready
      } catch {
        // fall back to system fonts via the template's fallback chain
      }
    }

    // Give the iframe one paint cycle so layout settles.
    await new Promise<void>((resolve) => {
      win.requestAnimationFrame(() => resolve())
    })

    const canvas = await html2canvas(container, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: "#FFFFFF",
      logging: false,
      imageTimeout: 15000,
      windowWidth: container.scrollWidth,
      windowHeight: container.scrollHeight,
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
    document.body.removeChild(iframe)
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
    const msg = (error as Error)?.message || String(error) || "Unknown error"
    console.error("PDF generation failed:", error)
    // Surface the real reason so we can diagnose at a glance instead of the
    // useless "Please try again" message.
    alert(`Failed to generate PDF: ${msg}`)
  }
}
