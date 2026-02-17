import { useEffect, useState } from 'react'

function useLogoDataUrl() {
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

export function PdfHeader({ title, subtitle }) {
  const logoSrc = useLogoDataUrl()

  return (
    <section className="pdfHeader">

      {/* ── Top stripe: logo + title ── */}
      <div className="pdfHeaderTop">
        <div className="pdfBrand">
          <div className="pdfLogoWrap">
            <img className="pdfLogo" src={logoSrc} alt="Direct Energy" crossOrigin="anonymous" />
          </div>
          <div className="pdfBrandText">
            <div className="pdfTitle">{title}</div>
            <div className="pdfSubtitle">{subtitle}</div>
          </div>
        </div>

        {/* Tag line */}
        <div className="pdfTagline">
          <div className="pdfTaglineBadge">KSA's Leading Industrial Battery Supplier</div>
          <div className="pdfTaglineSub">ISO 9001 · ISO 14001 · ISO 45001 Certified</div>
        </div>
      </div>


      {/* ── Orange accent bar ── */}
      <div className="pdfHeaderBar" />
    </section>
  )
}
