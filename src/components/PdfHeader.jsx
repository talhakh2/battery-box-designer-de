import { useLogoDataUrl } from './useLogoDataUrl'

export function PdfHeader({ title, subtitle }) {
  const logoSrc = useLogoDataUrl()

  return (
    <section className="pdfHeader">

      {/* ── Top stripe: logo + title ── */}
      
        <div className="pdfBrand">
          <div className="pdfLogoWrap">
            <img className="pdfLogo" src={logoSrc} alt="Abdullah Farooq — Battery Field Service" crossOrigin="anonymous" />
          </div>
          <div className="pdfBrandText">
            <div className="pdfTitle">{title}</div>
            <div className="pdfSubtitle">{subtitle}</div>
          </div>
        </div>

        {/* Tag line */}
        {/* <div className="pdfTagline">
          <div className="pdfTaglineBadge">KSA's Leading Industrial Battery Supplier</div>
          <div className="pdfTaglineSub">ISO 9001 · ISO 14001 · ISO 45001 Certified</div>
        </div> */}
     


      {/* ── Orange accent bar ── */}
      <div className="pdfHeaderBar" />
    </section>
  )
}
