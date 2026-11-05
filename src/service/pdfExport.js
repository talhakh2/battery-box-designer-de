import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'

export const ACCESSED_BY = 'Accessed by Engr. Abdullah Farooq'

/**
 * Export a report element as a multi-page A4 PDF.
 * Every child marked with [data-pdf-block] is rasterised on its own and placed
 * top-to-bottom; a block that doesn't fit on the current page starts a new page,
 * so tables, photos and the stamp are never cut in half.
 */
export async function exportReportPdf(root, filename, { footerLeft = '' } = {}) {
  const blocks = [...root.querySelectorAll('[data-pdf-block]')]
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' })
  const pageW = pdf.internal.pageSize.getWidth()
  const pageH = pdf.internal.pageSize.getHeight()
  const margin = 26
  const footerH = 18
  const usableW = pageW - margin * 2
  const bottom = pageH - margin - footerH
  const gap = 6
  let y = margin

  for (const block of blocks) {
    const canvas = await html2canvas(block, {
      backgroundColor: '#ffffff',
      scale: 2,
      useCORS: true,
      allowTaint: true,
      windowWidth: Math.max(window.innerWidth, 1280),
      onclone: (doc) => {
        // On-screen preview is scaled down to fit; render the clone at full size.
        doc.querySelectorAll('[data-pdf-scaler]').forEach(el => { el.style.transform = 'none' })
        // The PDF copy lives off-screen; bring it into view in the clone so it renders.
        doc.querySelectorAll('[data-pdf-offscreen]').forEach(el => { el.style.left = '0px' })
      },
    })
    const isPhoto = block.hasAttribute('data-pdf-photo')
    const h = (canvas.height * usableW) / canvas.width
    const pageUsable = bottom - margin

    if (h <= pageUsable) {
      if (y + h > bottom && y > margin) { pdf.addPage(); y = margin }
      const data = isPhoto ? canvas.toDataURL('image/jpeg', 0.9) : canvas.toDataURL('image/png')
      pdf.addImage(data, isPhoto ? 'JPEG' : 'PNG', margin, y, usableW, h, undefined, 'FAST')
      y += h + gap
      continue
    }

    // Taller than a page: slice it.
    const pxPerPt = canvas.width / usableW
    let srcY = 0
    while (srcY < canvas.height) {
      if (y > margin + 40) { pdf.addPage(); y = margin }
      const slicePt = Math.min(bottom - y, (canvas.height - srcY) / pxPerPt)
      const slicePx = Math.round(slicePt * pxPerPt)
      const part = document.createElement('canvas')
      part.width = canvas.width
      part.height = slicePx
      part.getContext('2d').drawImage(canvas, 0, srcY, canvas.width, slicePx, 0, 0, canvas.width, slicePx)
      pdf.addImage(part.toDataURL('image/jpeg', 0.92), 'JPEG', margin, y, usableW, slicePt, undefined, 'FAST')
      srcY += slicePx
      y += slicePt + gap
    }
  }

  const total = pdf.getNumberOfPages()
  for (let i = 1; i <= total; i++) {
    pdf.setPage(i)
    pdf.setFontSize(8)
    pdf.setTextColor(120)
    if (footerLeft) pdf.text(footerLeft, margin, pageH - margin + 4)
    pdf.text(`Page ${i} of ${total}`, pageW - margin, pageH - margin + 4, { align: 'right' })
    pdf.setFontSize(7)
    pdf.setTextColor(165)
    pdf.text(ACCESSED_BY, pageW / 2, pageH - margin + 4, { align: 'center' })
  }

  const blob = pdf.output('blob')
  pdf.save(filename)
  return { blob, filename }
}
