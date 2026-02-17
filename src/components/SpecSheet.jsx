function SpecItem({ label, value, accent, wide }) {
  return (
    <div className={`specItem${wide ? ' specItemWide' : ''}`} style={{ '--accent': accent }}>
      <div className="specLabel">{label}</div>
      <div className="specValue">{value}</div>
    </div>
  )
}

export function SpecSheet({
  modelNo, cellType, cellVariant, is4P,
  cellWidthMm, cellLengthMm, cellHeightMm,
  capacityAh, cellWeightKg, totalWeightKg,
  lengthMm, widthMm, heightMm,
  rows, columns, totalCells,
}) {
  const hasParsed = cellVariant != null

  return (
    <section className="specSheet">
      <div className="specTitleRow">
        <div className="specTitle">Specification Sheet</div>
        {/* <div className="specHint"></div> */}
      </div>

      {/* ── Box dimensions ── */}
      <div className="specSectionLabel">Box Dimensions</div>
      <div className="specGrid">
        <SpecItem label="Machine Model"   value={modelNo || '—'}                      accent="#4f46e5" />
        <SpecItem label="Cell Type"  value={cellType || '—'}                     accent="#06b6d4" />
        <SpecItem label="Box Length" value={`${lengthMm} mm`}                    accent="#8b5cf6" />
        <SpecItem label="Box Width"  value={`${widthMm} mm`}                     accent="#f97316" />
        <SpecItem label="Box Height" value={`${heightMm} mm`}                    accent="#22c55e" />
        <SpecItem label="Layout"     value={`${rows} × ${columns} = ${totalCells} cells`} accent="#0f172a" />
      </div>

      {/* ── Cell specification (only when lookup matched) ── */}
      {hasParsed && (
        <>
          <div className="specSectionLabel" style={{ marginTop: 10 }}>Cell Specification</div>
          <div className="specGrid">
            {/* <SpecItem label="Variant"       value={`${cellVariant}${is4P ? ' (4-Post)' : ''}`} accent="#7c3aed" /> */}
            <SpecItem label="Capacity"      value={`${capacityAh} Ah`}                          accent="#0891b2" />
            {/* <SpecItem label="Cell Width"    value={`${cellWidthMm} mm`}                          accent="#0891b2" /> */}
            {/* <SpecItem label="Cell Length"   value={`${cellLengthMm} mm`}                         accent="#059669" />
            <SpecItem label="Cell Height"   value={`${cellHeightMm} mm`}                         accent="#e11d48" />
            <SpecItem label="Cell Weight"   value={`${cellWeightKg} kg`}                         accent="#b45309" /> */}
            <SpecItem label="Total Cells"   value={totalCells}                                    accent="#0f172a" />
            <SpecItem label="Total Cells Weight"  value={`${totalWeightKg} kg`}                         accent="#dc2626" />
          </div>

          {/* <div className="specSectionLabel" style={{ marginTop: 10 }}>Pack Totals</div>
          <div className="specGrid">
            <SpecItem label="Total Cells"   value={totalCells}                                    accent="#0f172a" />
            <SpecItem label="Total Cells Weight"  value={`${totalWeightKg} kg`}                         accent="#dc2626" wide />
          </div> */}
        </>
      )}
    </section>
  )
}
