import './App.css'
import { useMemo, useRef, useState } from 'react'
import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'
import { BoxScene } from './components/BoxScene'
import { DetailsCard } from './components/DetailsCard'
import { PdfHeader } from './components/PdfHeader'
import { SpecSheet } from './components/SpecSheet'
import { parseCellType } from './utils/parseCellType'

const BOX_COLORS = [
  { id: 'black',      label: 'Black',      hex: '#0f172a' },
  { id: 'spaceGrey',  label: 'Space Grey', hex: '#6b7280' },
  { id: 'red',        label: 'Red',        hex: '#dc2626' },
  { id: 'orange',     label: 'Orange',     hex: '#ea580c' },
  { id: 'yellow',     label: 'Yellow',     hex: '#ca8a04' },
]

const DEFAULTS = {
  customerName: '',
  lengthMm:  621,
  widthMm:   209,
  heightMm:  625,
  rows:      8,
  columns:   1,
  modelNo:   'CATL LFP 3.22V 228Ah - 8S1P',
  cellType:  '4PzS500',
  boxColor:  'black',
}

function clampInt(value, { min, max, fallback }) {
  const n = Number.parseInt(String(value), 10)
  if (!Number.isFinite(n)) return fallback
  return Math.min(max, Math.max(min, n))
}

function clampFloat(value, { min, max, fallback }) {
  const n = Number.parseFloat(String(value))
  if (!Number.isFinite(n)) return fallback
  return Math.min(max, Math.max(min, n))
}

async function downloadPdfFromElement(element, filename) {
  const canvas = await html2canvas(element, {
    backgroundColor: '#ffffff',
    scale: Math.max(2, window.devicePixelRatio || 2),
    useCORS: true,
    allowTaint: true,
  })

  const imgData  = canvas.toDataURL('image/png')
  const pdf      = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' })
  const pageWidth  = pdf.internal.pageSize.getWidth()
  const pageHeight = pdf.internal.pageSize.getHeight()
  const margin   = 24
  const maxW = pageWidth  - margin * 2
  const maxH = pageHeight - margin * 2
  const imgW = canvas.width
  const imgH = canvas.height
  const scale    = Math.min(maxW / imgW, maxH / imgH)
  const renderW  = imgW * scale
  const renderH  = imgH * scale
  const xOffset  = (pageWidth - renderW) / 2
  const yOffset  = margin

  pdf.addImage(imgData, 'PNG', xOffset, yOffset, renderW, renderH, undefined, 'FAST')
  pdf.save(filename)
}

function App() {
  const [form, setForm]           = useState(DEFAULTS)
  const [submitted, setSubmitted] = useState(null)
  const [isExporting, setIsExporting] = useState(false)
  const exportRef  = useRef(null)
  const boxSceneRef = useRef(null)

  const preview = useMemo(() => {
    if (!submitted) return null

    const lengthMm = clampFloat(submitted.lengthMm, { min: 1, max: 5000, fallback: 1 })
    const widthMm  = clampFloat(submitted.widthMm,  { min: 1, max: 5000, fallback: 1 })
    const heightMm = clampFloat(submitted.heightMm, { min: 1, max: 5000, fallback: 1 })
    const rows     = clampInt(submitted.rows,    { min: 1, max: 60, fallback: 1 })
    const columns  = clampInt(submitted.columns, { min: 1, max: 60, fallback: 1 })
    const cellTypeRaw = String(submitted.cellType || '').trim()

    // Parse cell type — look up full spec from table
    const parsed = parseCellType(cellTypeRaw)
    const totalCells = rows * columns

    const boxColorId  = submitted.boxColor || 'black'
    const boxColorHex = BOX_COLORS.find(c => c.id === boxColorId)?.hex ?? '#0f172a'

    return {
      lengthMm, widthMm, heightMm, rows, columns,
      customerName: String(submitted.customerName || '').trim(),
      modelNo:      String(submitted.modelNo || '').trim(),
      cellType:     cellTypeRaw,
      boxColorId,
      boxColorHex,
      parsed,
      // Cell dimensions (null if not found in table)
      cellWidthMm:   parsed?.widthMm     ?? null,
      cellLengthMm:  parsed?.lengthMm    ?? null,
      cellHeightMm:  parsed?.heightMm    ?? null,
      cellVariant:   parsed?.variant     ?? null,
      capacityAh:    parsed?.capacityAh  ?? null,
      cellWeightKg:  parsed?.weightKg    ?? null,
      plates:        parsed?.plates      ?? null,
      is4P:          parsed?.is4P        ?? false,
      // Derived totals
      totalCells,
      totalWeightKg: parsed ? +(parsed.weightKg * totalCells).toFixed(1) : null,
    }
  }, [submitted])

  const onChange = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))

  const onSubmit = (e) => {
    e.preventDefault()
    setSubmitted(form)
    window.requestAnimationFrame(() => {
      document.getElementById('preview')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    })
  }

  const onReset = () => {
    setForm(DEFAULTS)
    setSubmitted(null)
  }

  const onDownload = async () => {
    if (!exportRef.current || !preview) return
    const safeModel = (preview.modelNo || 'design').replaceAll(/[^\w-]+/g, '_').slice(0, 50)
    setIsExporting(true)
    await new Promise((r) => window.requestAnimationFrame(r))
    await new Promise((r) => setTimeout(r, 80))
    try {
      await downloadPdfFromElement(exportRef.current, `${safeModel}_box_layout.pdf`)
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <div className="page">
      <header className="topbar">
        <div className="brand">
          <img className="brandLogo" src="/logo.svg" alt="Battery Box Designer logo" />
          <div>
            <div className="brandTitle">Battery Box Layout Designer</div>
            <div className="brandSub">Enter dimensions + layout, generate a 3D box, export as PDF.</div>
          </div>
        </div>
        <div className="topActions">
          <button type="button" className="secondary" onClick={onReset}>Reset</button>
          <button type="button" onClick={onDownload} disabled={!preview || isExporting}>
            {isExporting ? 'Generating…' : 'Download PDF'}
          </button>
        </div>
      </header>

      <main className="content">
        {/* ── Input panel ── */}
        <section className="panel">
          <h2 className="panelTitle">Inputs</h2>
          <form className="form" onSubmit={onSubmit}>

            {/* 0 — Customer Name */}
            <label className="field">
              <span>Customer Name</span>
              <input value={form.customerName} onChange={onChange('customerName')} placeholder="e.g. Acme Corporation" />
            </label>

            {/* 1 — Machine Model */}
            <label className="field">
              <span>Machine Model</span>
              <input value={form.modelNo} onChange={onChange('modelNo')} placeholder="e.g. CATL LFP 3.22V 228Ah" />
            </label>

            {/* 2 — Box Dimensions */}
            <div className="fieldGroupLabel">Box Dimensions</div>
            <div className="grid2">
              <label className="field">
                <span>Length (mm)</span>
                <input inputMode="decimal" value={form.lengthMm} onChange={onChange('lengthMm')} placeholder="e.g. 621" />
              </label>
              <label className="field">
                <span>Width (mm)</span>
                <input inputMode="decimal" value={form.widthMm} onChange={onChange('widthMm')} placeholder="e.g. 209" />
              </label>
              <label className="field">
                <span>Height (mm)</span>
                <input inputMode="decimal" value={form.heightMm} onChange={onChange('heightMm')} placeholder="e.g. 625" />
              </label>
            </div>

            {/* 3 — Box Color */}
            <div className="fieldGroupLabel">Box Color</div>
            <div className="colorRadioGroup">
              {BOX_COLORS.map(c => (
                <label
                  key={c.id}
                  className={`colorRadioOption${form.boxColor === c.id ? ' selected' : ''}`}
                >
                  <input
                    type="radio"
                    name="boxColor"
                    value={c.id}
                    checked={form.boxColor === c.id}
                    onChange={onChange('boxColor')}
                  />
                  <span className="colorSwatch" style={{ background: c.hex }} />
                  <span className="colorLabel">{c.label}</span>
                </label>
              ))}
            </div>

            {/* 4 — Cell Type */}
            <label className="field">
              <span>Cell Type</span>
              <input
                value={form.cellType}
                onChange={onChange('cellType')}
                placeholder="e.g. 4PzS500 or 4PzB500"
              />
            </label>

            {/* Live parse preview */}
            {(() => {
              const p = parseCellType(form.cellType)
              if (!p) return null
              return (
                <div className="parsedBadge">
                  <span className="parsedIcon">✓</span>
                  <div className="parsedBody">
                    <strong>{p.designation}</strong> detected
                    <div className="parsedGrid">
                      <span>Width</span>      <strong>{p.widthMm} mm</strong>
                      <span>Length</span>     <strong>{p.lengthMm} mm</strong>
                      <span>Height</span>     <strong>{p.heightMm} mm</strong>
                      <span>Capacity</span>   <strong>{p.capacityAh} Ah</strong>
                      <span>Cell weight</span><strong>{p.weightKg} kg</strong>
                      {p.is4P && <><span>Config</span><strong>4-Post</strong></>}
                    </div>
                  </div>
                </div>
              )
            })()}

            {/* 5 — Layout */}
            <div className="field">
              <span>Layout (rows × columns)</span>
              <div className="layoutRow">
                <input inputMode="numeric" value={form.rows}    onChange={onChange('rows')}    placeholder="rows" />
                <span className="times" aria-hidden="true">×</span>
                <input inputMode="numeric" value={form.columns} onChange={onChange('columns')} placeholder="cols" />
              </div>
            </div>

            <div className="formActions">
              <button type="submit">Create Diagram</button>
              <p className="hint">Tip: drag to rotate, scroll to zoom.</p>
            </div>
          </form>
        </section>

        {/* ── Preview panel ── */}
        <section className="panel previewPanel" id="preview">
          <h2 className="panelTitle">Preview</h2>

          {!preview ? (
            <div className="emptyState">
              <div className="emptyTitle">No diagram yet</div>
              <div className="emptySub">Fill the inputs and click "Create Diagram".</div>
            </div>
          ) : (
            <div className={`exportArea${isExporting ? ' pdfMode' : ''}`} ref={exportRef}>

              {/* ── PDF header ── */}
              <PdfHeader
                title="Battery Box Layout Details"
                subtitle="3D layout preview"
              />

              {/* ── Customer name ── */}
              {preview.customerName && (
                <div className="pdfCustomerName">
                  Customer Name: {preview.customerName}
                </div>
              )}

              {/* ── Spec sheet ── */}
              <SpecSheet
                modelNo={preview.modelNo}
                cellType={preview.cellType}
                cellVariant={preview.cellVariant}
                cellWidthMm={preview.cellWidthMm}
                cellLengthMm={preview.cellLengthMm}
                cellHeightMm={preview.cellHeightMm}
                capacityAh={preview.capacityAh}
                cellWeightKg={preview.cellWeightKg}
                totalWeightKg={preview.totalWeightKg}
                is4P={preview.is4P}
                lengthMm={preview.lengthMm}
                widthMm={preview.widthMm}
                heightMm={preview.heightMm}
                rows={preview.rows}
                columns={preview.columns}
                totalCells={preview.totalCells}
              />

              {/* ── 3-D diagram ── */}
              <div className="canvasCard">
                <div className="canvasHeader">
                  <div className="chips">
                    <span className="chip chipL">L: {preview.lengthMm} mm</span>
                    <span className="chip chipW">W: {preview.widthMm} mm</span>
                    <span className="chip chipH">H: {preview.heightMm} mm</span>
                    <span className="chip chipLayout">
                      Layout: {preview.rows} × {preview.columns} = {preview.rows * preview.columns} cells
                    </span>
                  </div>
                  <button
                    type="button"
                    className="stdViewBtn"
                    onClick={() => boxSceneRef.current?.resetToStandardView()}
                    title="Reset to standard isometric view"
                  >
                    ⊞ Standard View
                  </button>
                </div>
                <div className="canvasWrap">
                  <BoxScene
                    ref={boxSceneRef}
                    key={`${preview.lengthMm}-${preview.widthMm}-${preview.heightMm}-${preview.cellHeightMm}-${preview.rows}-${preview.columns}-${preview.boxColorId}`}
                    lengthMm={preview.lengthMm}
                    widthMm={preview.widthMm}
                    heightMm={preview.heightMm}
                    cellHeightMm={preview.cellHeightMm ?? preview.heightMm * 0.86}
                    rows={preview.rows}
                    columns={preview.columns}
                    boxColor={preview.boxColorHex}
                  />
                </div>
              </div>

              {/* ── Design details ── */}
              {/* <DetailsCard modelNo={preview.modelNo} cellType={preview.cellType} /> */}

              {/* ── PDF footer ── */}
              <div className="pdfFooterNote">
                <div className="pdfFooterRow">
                  <div className="pdfFooterLeft">
                    <span className="pdfFooterBadge">Direct Energy Company</span>
                    <span className="pdfFooterAddress">
                      7284 Masamh Street, Al Mashael, Riyadh 14326, Saudi Arabia
                    </span>
                  </div>
                  <div className="pdfFooterRight">
                    {/* <span className="pdfFooterContact">📞 +966 11 204 4884</span> */}
                    {/* <span className="pdfFooterContact">📧 directenergy@dahbashi.com</span> */}
                    <a className="pdfFooterUrl" href="https://directenergy.dahbashi.com">
                      🌐 directenergy.dahbashi.com
                    </a>
                  </div>
                </div>
                <div className="pdfFooterDisclaimer">
                  For battery box design inquiries contact{' '}
                  <strong>mohammad.shaadab@dahbashi.com</strong>{' '}
                  or <strong>service.mrpjed@dahbashi.com</strong>
                </div>
              </div>

            </div>
          )}
        </section>
      </main>
    </div>
  )
}

export default App
