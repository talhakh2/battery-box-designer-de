import { useEffect, useState } from 'react'

/** Logo as an inline data URL so html2canvas can draw it into the PDF. */
export function useLogoDataUrl() {
  const [src, setSrc] = useState('/logo.svg')
  useEffect(() => {
    fetch('/logo.svg')
      .then(r => r.text())
      .then(svgText => {
        const b64 = btoa(unescape(encodeURIComponent(svgText)))
        setSrc(`data:image/svg+xml;base64,${b64}`)
      })
      .catch(() => {})
  }, [])
  return src
}
