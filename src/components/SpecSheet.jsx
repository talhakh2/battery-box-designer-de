function SpecItem({ label, value, accent }) {
  return (
    <div className="specItem" style={{ '--accent': accent }}>
      <div className="specLabel">{label}</div>
      <div className="specValue">{value}</div>
    </div>
  )
}

export function SpecSheet({
  modelNo, cellType, cellVariant,
  cellWidthMm, cellLengthMm, cellHeightMm,
  lengthMm, widthMm, heightMm,
  rows, columns,
}) {
  const total = rows * columns
  const hasParsed = cellVariant != null

  return (
    <section className="specSheet">
      <div className="specTitleRow">
        <div className="specTitle">Specification Sheet</div>
        <div className="specHint">Auto-generated from inputs</div>
      </div>

      <div className="specGrid">
        {/* Box dimensions */}
        <SpecItem label="Model No"     value={modelNo || '—'}          accent="#4f46e5" />
        <SpecItem label="Cell Type"    value={cellType || '—'}         accent="#06b6d4" />
        <SpecItem label="Box Length"   value={`${lengthMm} mm`}        accent="#8b5cf6" />
        <SpecItem label="Box Width"    value={`${widthMm} mm`}         accent="#f97316" />
        <SpecItem label="Box Height"   value={`${heightMm} mm`}        accent="#22c55e" />
        <SpecItem label="Layout"       value={`${rows} × ${columns} = ${total} cells`} accent="#0f172a" />

        {/* Cell-type derived dimensions — only shown when parsed successfully */}
        {hasParsed && (
          <>
            <SpecItem label="Cell Variant"  value={cellVariant}            accent="#7c3aed" />
            <SpecItem label="Cell Width"    value={`${cellWidthMm} mm`}   accent="#0891b2" />
            <SpecItem label="Cell Length"   value={`${cellLengthMm} mm`}  accent="#059669" />
            <SpecItem label="Cell Height"   value={`${cellHeightMm} mm`}  accent="#e11d48" />
          </>
        )}
      </div>
    </section>
  )
}
