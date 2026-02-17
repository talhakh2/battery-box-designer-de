export function DetailsCard({ modelNo, cellType, lengthMm, widthMm, heightMm, rows, columns }) {
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
          <div className="k">Model No</div>
          <div className="v">{modelNo || '—'}</div>
        </div>
        <div className="kv">
          <div className="k">Cell Type</div>
          <div className="v">{cellType || '—'}</div>
        </div>
        <div className="kv">
          <div className="k">Length</div>
          <div className="v">{lengthMm} mm</div>
        </div>
        <div className="kv">
          <div className="k">Width</div>
          <div className="v">{widthMm} mm</div>
        </div>
        <div className="kv">
          <div className="k">Height</div>
          <div className="v">{heightMm} mm</div>
        </div>
        <div className="kv">
          <div className="k">Layout</div>
          <div className="v">
            {rows} rows × {columns} columns ({rows * columns} cells)
          </div>
        </div>
      </div>
    </section>
  )
}

