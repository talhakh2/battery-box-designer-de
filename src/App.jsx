import './App.css'
import { useMemo, useRef, useState } from 'react'
import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'
import { BoxScene } from './components/BoxScene'
import { DetailsCard } from './components/DetailsCard'

const DEFAULTS = {
  lengthMm: 621,
  widthMm: 209,
  heightMm: 625,
  rows: 8,
  columns: 1,
  modelNo: 'CATL LFP 3.22V 228Ah - 8S1P',
  cellType: 'LFP',
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
  })

  const imgData = canvas.toDataURL('image/png')
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' })

  const pageWidth = pdf.internal.pageSize.getWidth()
  const pageHeight = pdf.internal.pageSize.getHeight()

  const margin = 28
  const maxW = pageWidth - margin * 2
  const maxH = pageHeight - margin * 2

  const imgW = canvas.width
  const imgH = canvas.height

  const scale = Math.min(maxW / imgW, maxH / imgH)
  const renderW = imgW * scale
  const renderH = imgH * scale

  pdf.addImage(imgData, 'PNG', margin, margin, renderW, renderH, undefined, 'FAST')
  pdf.save(filename)
}

function App() {
  const [form, setForm] = useState(DEFAULTS)
  const [submitted, setSubmitted] = useState(null)
  const exportRef = useRef(null)

  const preview = useMemo(() => {
    if (!submitted) return null
    const lengthMm = clampFloat(submitted.lengthMm, { min: 1, max: 5000, fallback: 1 })
    const widthMm = clampFloat(submitted.widthMm, { min: 1, max: 5000, fallback: 1 })
    const heightMm = clampFloat(submitted.heightMm, { min: 1, max: 5000, fallback: 1 })
    const rows = clampInt(submitted.rows, { min: 1, max: 60, fallback: 1 })
    const columns = clampInt(submitted.columns, { min: 1, max: 60, fallback: 1 })
    return {
      lengthMm,
      widthMm,
      heightMm,
      rows,
      columns,
      modelNo: String(submitted.modelNo || '').trim(),
      cellType: String(submitted.cellType || '').trim(),
    }
  }, [submitted])

  const onChange = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))

  const onSubmit = (e) => {
    e.preventDefault()
    setSubmitted(form)
    // Scroll to preview on small screens
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
    const safeModel = (preview.modelNo || 'design').replaceAll(/[^\w\-]+/g, '_').slice(0, 50)
    await downloadPdfFromElement(exportRef.current, `${safeModel}_box_layout.pdf`)
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
          <button type="button" className="secondary" onClick={onReset}>
            Reset
          </button>
          <button type="button" onClick={onDownload} disabled={!preview}>
            Download PDF
          </button>
        </div>
      </header>

      <main className="content">
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
                  <input inputMode="numeric" value={form.rows} onChange={onChange('rows')} placeholder="rows" />
                  <span className="times" aria-hidden="true">
                    ×
                  </span>
                  <input inputMode="numeric" value={form.columns} onChange={onChange('columns')} placeholder="columns" />
                </div>
              </div>
            </div>

            <label className="field">
              <span>Model No</span>
              <input value={form.modelNo} onChange={onChange('modelNo')} placeholder="e.g. CATL LFP ..." />
            </label>

            <label className="field">
              <span>Cell Type</span>
              <input value={form.cellType} onChange={onChange('cellType')} placeholder="e.g. LFP" />
            </label>

            <div className="formActions">
              <button type="submit">Create Diagram</button>
              <p className="hint">Tip: drag to rotate, scroll to zoom.</p>
            </div>
          </form>
        </section>

        <section className="panel previewPanel" id="preview">
          <h2 className="panelTitle">Preview</h2>

          {!preview ? (
            <div className="emptyState">
              <div className="emptyTitle">No diagram yet</div>
              <div className="emptySub">Fill the inputs and click “Create Diagram”.</div>
            </div>
          ) : (
            <div className="exportArea" ref={exportRef}>
              <div className="canvasCard">
                <div className="canvasHeader">
                  <div className="chips">
                    <span className="chip">L: {preview.lengthMm} mm</span>
                    <span className="chip">W: {preview.widthMm} mm</span>
                    <span className="chip">H: {preview.heightMm} mm</span>
                    <span className="chip">
                      Layout: {preview.rows} × {preview.columns} = {preview.rows * preview.columns}
                    </span>
                  </div>
                </div>
                <div className="canvasWrap">
                  <BoxScene
                    key={`${preview.lengthMm}-${preview.widthMm}-${preview.heightMm}-${preview.rows}-${preview.columns}`}
                    lengthMm={preview.lengthMm}
                    widthMm={preview.widthMm}
                    heightMm={preview.heightMm}
                    rows={preview.rows}
                    columns={preview.columns}
                  />
                </div>
              </div>

              <DetailsCard
                modelNo={preview.modelNo}
                cellType={preview.cellType}
              />
            </div>
          )}
        </section>
      </main>
    </div>
  )
}

export default App
