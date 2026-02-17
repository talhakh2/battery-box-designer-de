export function DetailsCard({ modelNo, cellType }) {
  return (
    <section className="detailsCard">
      <div className="detailsHeader">
        <div>
          <div className="detailsTitle">Design Details</div>
          <div className="detailsSub">Included in PDF export</div>
        </div>
      </div>

      <div className="detailsGrid">
        <div className="kv">
          <div className="k">Machine Model</div>
          <div className="v">{modelNo || '—'}</div>
        </div>
        <div className="kv">
          <div className="k">Cell Type</div>
          <div className="v">{cellType || '—'}</div>
        </div>
      </div>
    </section>
  )
}

