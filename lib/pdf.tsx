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
 * (http/https) with a base64 data URI. Eliminates the most common
 * html2canvas failure mode: a cross-origin image taints the canvas, so
 * canvas.toDataURL() throws a SecurityError.
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
        // best-effort
      }
    }),
  )
}

/**
 * Render an HTML string into a PDF Blob using html2canvas + jsPDF.
 *
 * Templates emit self-contained, light-mode HTML. We mount them inside an
 * isolated same-origin iframe so the host page's Tailwind v4 + shadcn CSS
 * (which defines colors via `oklch()` / `lab()`) does NOT cascade in —
 * html2canvas can't parse those modern color functions and dies with
 * "Attempting to parse an unsupported color function ...".
 */
async function renderHtmlToPdfBlob(htmlContent: string): Promise<Blob> {
  const iframe = document.createElement("iframe")
  iframe.style.position = "fixed"
  iframe.style.left = "-9999px"
  iframe.style.top = "0"
  iframe.style.width = "210mm"
  iframe.style.height = "297mm"
  iframe.style.border = "0"
  iframe.style.background = "#FFFFFF"
  // No sandbox — we need same-origin access so html2canvas can read the iframe's DOM.
  document.body.appendChild(iframe)

  // Wait for the iframe document to be available
  await new Promise<void>((resolve) => {
    if (iframe.contentDocument && iframe.contentDocument.readyState === "complete") {
      resolve()
      return
    }
    iframe.addEventListener("load", () => resolve(), { once: true })
    // Trigger a load by writing the doc.
    iframe.src = "about:blank"
  })

  const doc = iframe.contentDocument
  if (!doc) {
    document.body.removeChild(iframe)
    throw new Error("PDF iframe document was not accessible")
  }

  // Bare-bones isolated stylesheet — only safe legacy CSS, no oklch/lab/color-mix.
  doc.open()
  doc.write(`<!DOCTYPE html>
<html><head>
<meta charset="utf-8" />
<link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Montserrat:wght@500;600;700&display=swap" rel="stylesheet" />
<style>
  *, *::before, *::after { box-sizing: border-box; }
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
  img { max-width: 100%; }
</style>
</head><body><div id="pdf-root">${htmlContent}</div></body></html>`)
  doc.close()

  // Wait for stylesheets to attach
  await new Promise((r) => setTimeout(r, 30))

  const root = doc.getElementById("pdf-root") as HTMLElement | null
  if (!root) {
    document.body.removeChild(iframe)
    throw new Error("PDF iframe root not found")
  }

  try {
    await inlineExternalImages(root)

    if ("fonts" in doc) {
      try {
        await (doc as Document & { fonts: { ready: Promise<unknown> } }).fonts.ready
      } catch {
        // fall back to fallback chain
      }
    }

    // Per-block snapshotting so page breaks land between sections, never
    // through the middle of a paragraph or table row. We take the visible top
    // <div> (the "paper" container) and walk its direct children — each is a
    // logical chunk (header, parties table, section block, footer). For each
    // chunk we snapshot to its own canvas, then pack chunks into pages.
    const paper =
      (root.firstElementChild as HTMLElement) ?? root // template wraps in a single div
    const blocks: HTMLElement[] = Array.from(paper.children) as HTMLElement[]

    const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" })
    const pageWidthMm = 210
    const pageHeightMm = 297
    const marginMm = 14 // top + bottom + left + right white margin
    const usableWidthMm = pageWidthMm - marginMm * 2
    const usableHeightMm = pageHeightMm - marginMm * 2

    let cursorMm = marginMm
    let firstPage = true

    async function snapshot(el: HTMLElement) {
      return html2canvas(el, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: "#FFFFFF",
        logging: false,
        imageTimeout: 15000,
        windowWidth: el.scrollWidth || paper.scrollWidth,
        windowHeight: el.scrollHeight || paper.scrollHeight,
      })
    }

    function startPage() {
      if (!firstPage) pdf.addPage()
      firstPage = false
      cursorMm = marginMm
    }

    startPage()

    for (const block of blocks) {
      const bounds = block.getBoundingClientRect()
      if (bounds.width === 0 || bounds.height === 0) continue
      const canvas = await snapshot(block)
      const heightMm = (canvas.height * usableWidthMm) / canvas.width

      // If the block is taller than a single page, slice it across pages
      // (still better than slicing inside a paragraph — large items are usually
      // tables of pricing or signature blocks, which are reasonable to slice).
      if (heightMm > usableHeightMm) {
        const pxPerMm = canvas.width / usableWidthMm
        const sliceHeightPx = Math.floor(usableHeightMm * pxPerMm)
        let yPx = 0
        while (yPx < canvas.height) {
          const remainingPx = canvas.height - yPx
          const thisSlicePx = Math.min(sliceHeightPx, remainingPx)
          const sliceCanvas = document.createElement("canvas")
          sliceCanvas.width = canvas.width
          sliceCanvas.height = thisSlicePx
          const ctx = sliceCanvas.getContext("2d")
          if (!ctx) break
          ctx.drawImage(canvas, 0, -yPx)
          const sliceImg = sliceCanvas.toDataURL("image/jpeg", 0.95)
          const sliceMm = (thisSlicePx * usableWidthMm) / canvas.width
          if (cursorMm + sliceMm > marginMm + usableHeightMm + 0.5) startPage()
          pdf.addImage(sliceImg, "JPEG", marginMm, cursorMm, usableWidthMm, sliceMm)
          cursorMm += sliceMm
          yPx += thisSlicePx
          if (yPx < canvas.height) startPage()
        }
        continue
      }

      // Normal block: page-break before placing if it wouldn't fit on the
      // current page. 0.5mm slack avoids spurious breaks from rounding.
      if (cursorMm + heightMm > marginMm + usableHeightMm + 0.5) {
        startPage()
      }
      const imgData = canvas.toDataURL("image/jpeg", 0.95)
      pdf.addImage(imgData, "JPEG", marginMm, cursorMm, usableWidthMm, heightMm)
      cursorMm += heightMm
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
