export function PdfHeader({ title, subtitle }) {
  return (
    <section className="pdfHeader">
      <div className="pdfHeaderTop">
        <div className="pdfBrand">
          <img className="pdfLogo" src="/logo.svg" alt="Company logo" />
          <div className="pdfBrandText">
            <div className="pdfTitle">{title}</div>
            <div className="pdfSubtitle">{subtitle}</div>
          </div>
        </div>

        <div className="pdfContacts">
          <div className="pdfContactsTitle">For more inquiries</div>
          <div className="pdfContactsBody">
            <div className="pdfContactLine">
              <span className="pdfDot" aria-hidden="true" />
              <span>mohammad.shaadab@dahbashi.com</span>
            </div>
            <div className="pdfContactLine">
              <span className="pdfDot" aria-hidden="true" />
              <span>service.mrpjed@dahbashi.com</span>
            </div>
          </div>
        </div>
      </div>
      <div className="pdfHeaderBar" aria-hidden="true" />
    </section>
  )
}
