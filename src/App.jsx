import './App.css'
import { useMemo, useRef, useState } from 'react'
import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'
import { BoxScene } from './components/BoxScene'
import { DetailsCard } from './components/DetailsCard'
import { PdfHeader } from './components/PdfHeader'
import { SpecSheet } from './components/SpecSheet'
import { parseCellType } from './utils/parseCellType'

const DEFAULTS = {
  lengthMm: 621,
  widthMm:  209,
  heightMm: 625,
  rows:     8,
  columns:  1,
  modelNo:  'CATL LFP 3.22V 228Ah - 8S1P',
  cellType: '4PzS500',
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

  pdf.addImage(imgData, 'PNG', margin, margin, renderW, renderH, undefined, 'FAST')
  pdf.save(filename)
}

function App() {
  const [form, setForm]           = useState(DEFAULTS)
  const [submitted, setSubmitted] = useState(null)
  const [isExporting, setIsExporting] = useState(false)
  const exportRef = useRef(null)

  const preview = useMemo(() => {
    if (!submitted) return null

    const lengthMm = clampFloat(submitted.lengthMm, { min: 1, max: 5000, fallback: 1 })
    const widthMm  = clampFloat(submitted.widthMm,  { min: 1, max: 5000, fallback: 1 })
    const heightMm = clampFloat(submitted.heightMm, { min: 1, max: 5000, fallback: 1 })
    const rows     = clampInt(submitted.rows,    { min: 1, max: 60, fallback: 1 })
    const columns  = clampInt(submitted.columns, { min: 1, max: 60, fallback: 1 })
    const cellTypeRaw = String(submitted.cellType || '').trim()

    // Parse cell type — derive cell dimensions automatically
    const parsed = parseCellType(cellTypeRaw)

    return {
      lengthMm, widthMm, heightMm, rows, columns,
      modelNo:  String(submitted.modelNo || '').trim(),
      cellType: cellTypeRaw,
      // Parsed cell dimensions (null if unrecognised format)
      parsed,
      cellWidthMm:  parsed?.cellWidthMm  ?? null,
      cellLengthMm: parsed?.cellLengthMm ?? null,
      cellHeightMm: parsed?.cellHeightMm ?? null,
      cellVariant:  parsed?.cellVariant  ?? null,
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
              <div className="field">
                <span>Layout (rows × columns)</span>
                <div className="layoutRow">
                  <input inputMode="numeric" value={form.rows}    onChange={onChange('rows')}    placeholder="rows" />
                  <span className="times" aria-hidden="true">×</span>
                  <input inputMode="numeric" value={form.columns} onChange={onChange('columns')} placeholder="cols" />
                </div>
              </div>
            </div>

            <label className="field">
              <span>Model No</span>
              <input value={form.modelNo} onChange={onChange('modelNo')} placeholder="e.g. CATL LFP 3.22V 228Ah" />
            </label>

            {/* Cell Type — single field, auto-parses PzS/PzB format */}
            <label className="field">
              <span>Cell Type</span>
              <input
                value={form.cellType}
                onChange={onChange('cellType')}
                placeholder="e.g. 4PzS500 or 4PzB500"
              />
              <span className="fieldHint">
                Format: <code>[width]Pz[S|B][height]</code> — e.g. <code>4PzS500</code> or <code>4PzB500</code>
              </span>
            </label>

            {/* Live parse preview */}
            {(() => {
              const p = parseCellType(form.cellType)
              if (!p) return null
              return (
                <div className="parsedBadge">
                  <span className="parsedIcon">✓</span>
                  <span>
                    Detected <strong>{p.cellVariant}</strong>:&nbsp;
                    Cell W = <strong>{p.cellWidthMm} mm</strong>,&nbsp;
                    Cell L = <strong>{p.cellLengthMm} mm</strong>,&nbsp;
                    Cell H = <strong>{p.cellHeightMm} mm</strong> ({p.cellHeightMm - 50} + 50)
                  </span>
                </div>
              )
            })()}

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
                title="Battery Box Layout Report"
                subtitle="3D layout preview · specification sheet · contact info"
              />

              {/* ── Spec sheet ── */}
              <SpecSheet
                modelNo={preview.modelNo}
                cellType={preview.cellType}
                cellVariant={preview.cellVariant}
                cellWidthMm={preview.cellWidthMm}
                cellLengthMm={preview.cellLengthMm}
                cellHeightMm={preview.cellHeightMm}
                lengthMm={preview.lengthMm}
                widthMm={preview.widthMm}
                heightMm={preview.heightMm}
                rows={preview.rows}
                columns={preview.columns}
              />

              {/* ── 3-D diagram ── */}
              <div className="canvasCard">
                <div className="canvasHeader">
                  <div className="chips">
                    <span className="chip chipL">L: {preview.lengthMm} mm</span>
                    <span className="chip chipW">W: {preview.widthMm} mm</span>
                    <span className="chip chipH">H: {preview.heightMm} mm</span>
                    {preview.cellHeightMm && (
                      <span className="chip chipCellH">Cell H: {preview.cellHeightMm} mm</span>
                    )}
                    {preview.cellVariant && (
                      <span className="chip chipVariant">{preview.cellVariant}</span>
                    )}
                    <span className="chip chipLayout">
                      Layout: {preview.rows} × {preview.columns} = {preview.rows * preview.columns} cells
                    </span>
                  </div>
                </div>
                <div className="canvasWrap">
                  <BoxScene
                    key={`${preview.lengthMm}-${preview.widthMm}-${preview.heightMm}-${preview.cellHeightMm}-${preview.rows}-${preview.columns}`}
                    lengthMm={preview.lengthMm}
                    widthMm={preview.widthMm}
                    heightMm={preview.heightMm}
                    cellHeightMm={preview.cellHeightMm ?? preview.heightMm * 0.86}
                    rows={preview.rows}
                    columns={preview.columns}
                  />
                </div>
              </div>

              {/* ── Design details ── */}
              <DetailsCard modelNo={preview.modelNo} cellType={preview.cellType} />

              {/* ── PDF footer ── */}
              <div className="pdfFooterNote">
                <span className="pdfFooterBadge">Contact</span>
                <span>
                  For more inquiries please reach out to{' '}
                  <strong>mohammad.shaadab@dahbashi.com</strong>{' '}
                  or{' '}
                  <strong>service.mrpjed@dahbashi.com</strong>
                </span>
              </div>

            </div>
          )}
        </section>
      </main>
    </div>
  )
}

export default App
