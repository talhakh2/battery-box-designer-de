import { useMemo, useRef, useState } from 'react'
import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'
import { BoxScene } from '../components/BoxScene'
import { DetailsCard } from '../components/DetailsCard'
import { PdfHeader } from '../components/PdfHeader'
import { SpecSheet } from '../components/SpecSheet'
import { findAlternativeCells, parseCellType } from '../utils/parseCellType'
import { Spinner } from '../components/Spinner'

const BOX_COLORS = [
  { id: 'black',      label: 'Black',      hex: '#0f172a' },
  { id: 'spaceGrey',  label: 'Space Grey', hex: '#6b7280' },
  { id: 'red',        label: 'Red',        hex: '#dc2626' },
  { id: 'orange',     label: 'Orange',     hex: '#ea580c' },
  { id: 'yellow',     label: 'Yellow',     hex: '#ca8a04' },
]

const DEFAULTS = {
  customerName:  '',
  lengthMm:      621,
  widthMm:       209,
  h1Mm:          625,
  h2Mm:          '',    // empty = same as H1
  rows:          8,
  columns:       1,
  modelNo:       'CATL LFP 3.22V 228Ah - 8S1P',
  plugType:      '',
  cellType:      '4PzS500',
  boxColor:      'black',
  cellMake:      'TAB',  // HOP | TAB | EXI
  holeCount:     '0',   // 0 | 1 | 2
  holeDiameterMm: 50,
  altMinHeightMm: '',
  altMaxHeightMm: '',
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

function trackPdfDownload({ preview, form }) {
  const url = import.meta.env.VITE_PDF_TRACKING_URL
  const token = import.meta.env.VITE_PDF_TRACKING_TOKEN

  if (!url || !token || !preview || !form) return

  const boxColor = BOX_COLORS.find(c => c.id === form.boxColor)

  const payload = {
    token,
    customerName: String(form.customerName || '').trim(),
    modelNo: String(form.modelNo || '').trim(),
    plugType: String(form.plugType || '').trim(),
    lengthMm: form.lengthMm,
    widthMm: form.widthMm,
    h1Mm: form.h1Mm,
    h2Mm: form.h2Mm,
    boxColor: boxColor?.label || form.boxColor,
    cellType: String(form.cellType || '').trim(),
    cellMake: form.cellMake,
    holeCount: form.holeCount,
    holeDiameterMm: form.holeDiameterMm,
    rows: form.rows,
    columns: form.columns,
    layout: `${preview.rows} x ${preview.columns}`,
    totalCells: preview.totalCells,
    altMinHeightMm: form.altMinHeightMm,
    altMaxHeightMm: form.altMaxHeightMm,
    userAgent: navigator.userAgent,
  }

  fetch(url, {
    method: 'POST',
    mode: 'no-cors',
    keepalive: true,
    headers: {
      'Content-Type': 'text/plain;charset=utf-8',
    },
    body: JSON.stringify(payload),
  }).catch(() => {})
}

export function BoxDesigner({ addToast }) {
  const [form, setForm]           = useState(DEFAULTS)
  const [hasCreated, setHasCreated] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [showAlternatives, setShowAlternatives] = useState(false)
  const [expandedAlternatives, setExpandedAlternatives] = useState({})
  const [altSortBy, setAltSortBy] = useState('heightAsc')
  const [createdAt, setCreatedAt] = useState(null)
  const exportRef  = useRef(null)
  const boxSceneRef = useRef(null)

  const parsedLiveCellType = useMemo(() => parseCellType(form.cellType), [form.cellType])
  const alternativeCells = useMemo(
    () => findAlternativeCells(parsedLiveCellType, form.altMinHeightMm, form.altMaxHeightMm),
    [parsedLiveCellType, form.altMinHeightMm, form.altMaxHeightMm]
  )
  const sortedAlternativeCells = useMemo(() => {
    const list = [...alternativeCells]
    if (altSortBy === 'capacityDesc') return list.sort((a, b) => b.capacityAh - a.capacityAh || a.heightMm - b.heightMm)
    if (altSortBy === 'closestHeight' && parsedLiveCellType) {
      return list.sort((a, b) =>
        Math.abs(a.heightMm - parsedLiveCellType.heightMm) - Math.abs(b.heightMm - parsedLiveCellType.heightMm)
      )
    }
    return list.sort((a, b) => a.heightMm - b.heightMm || a.capacityAh - b.capacityAh)
  }, [alternativeCells, altSortBy, parsedLiveCellType])
  const closestAlternativeDesignation = sortedAlternativeCells[0]?.designation ?? null

  const rawRows = Number.parseInt(String(form.rows), 10)
  const rawCols = Number.parseInt(String(form.columns), 10)
  const isLayoutInvalid = !Number.isFinite(rawRows) || !Number.isFinite(rawCols) || rawRows < 1 || rawCols < 1
  const isCellTypeInvalid = String(form.cellType || '').trim() !== '' && !parsedLiveCellType
  const altMin = Number.parseFloat(String(form.altMinHeightMm))
  const altMax = Number.parseFloat(String(form.altMaxHeightMm))
  const hasAltInputs = form.altMinHeightMm !== '' || form.altMaxHeightMm !== ''
  const isAltRangeInvalid = hasAltInputs && (!Number.isFinite(altMin) || !Number.isFinite(altMax) || altMin > altMax)

  // preview is always derived from the LIVE form — no submit needed after first creation
  const preview = useMemo(() => {
    if (!hasCreated) return null

    const lengthMm = clampFloat(form.lengthMm, { min: 1, max: 5000, fallback: 1 })
    const widthMm  = clampFloat(form.widthMm,  { min: 1, max: 5000, fallback: 1 })
    const h1Mm     = clampFloat(form.h1Mm,     { min: 1, max: 5000, fallback: 1 })
    const h2Mm     = (form.h2Mm !== '' && form.h2Mm != null)
      ? clampFloat(form.h2Mm, { min: 1, max: 5000, fallback: h1Mm })
      : h1Mm
    const rows     = clampInt(form.rows,    { min: 1, max: 60, fallback: 1 })
    const columns  = clampInt(form.columns, { min: 1, max: 60, fallback: 1 })
    const cellTypeRaw = String(form.cellType || '').trim()

    const parsed = parseCellType(cellTypeRaw)
    const totalCells = rows * columns

    const boxColorId  = form.boxColor || 'black'
    const boxColorHex = BOX_COLORS.find(c => c.id === boxColorId)?.hex ?? '#0f172a'

    return {
      lengthMm, widthMm, h1Mm, h2Mm, rows, columns,
      customerName:  String(form.customerName || '').trim(),
      modelNo:       String(form.modelNo || '').trim(),
      plugType:      String(form.plugType || '').trim(),
      cellType:      cellTypeRaw,
      boxColorId,
      boxColorHex,
      parsed,
      cellWidthMm:   parsed?.widthMm     ?? null,
      cellLengthMm:  parsed?.lengthMm    ?? null,
      cellHeightMm:  parsed?.heightMm    ?? null,
      cellVariant:   parsed?.variant     ?? null,
      capacityAh:    parsed?.capacityAh  ?? null,
      cellWeightKg:  parsed?.weightKg    ?? null,
      plates:        parsed?.plates      ?? null,
      is4P:          parsed?.is4P        ?? false,
      totalCells,
      totalWeightKg:  parsed ? +(parsed.weightKg * totalCells).toFixed(1) : null,
      cellMake:       form.cellMake      || 'TAB',
      holeCount:      Number(form.holeCount || 0),
      holeDiameterMm: clampFloat(form.holeDiameterMm, { min: 10, max: 500, fallback: 50 }),
      altMinHeightMm: String(form.altMinHeightMm || '').trim(),
      altMaxHeightMm: String(form.altMaxHeightMm || '').trim(),
    }
  }, [form, hasCreated])

  const onChange = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))

  const onSubmit = (e) => {
    e.preventDefault()
    if (isLayoutInvalid) return
    setHasCreated(true)
    setCreatedAt(new Date())
    window.requestAnimationFrame(() => {
      document.getElementById('preview')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    })
  }

  const onReset = () => {
    setForm(DEFAULTS)
    setHasCreated(false)
    setShowAlternatives(false)
    setExpandedAlternatives({})
    setAltSortBy('heightAsc')
    setCreatedAt(null)
  }

  const onDownload = async () => {
    if (!exportRef.current || !preview) return
    const safeName  = (preview.customerName || '').replaceAll(/[^\w-]+/g, '_')
    const safeModel = (preview.modelNo      || 'design').replaceAll(/[^\w-]+/g, '_')
    const filename  = [safeName, safeModel].filter(Boolean).join('_').slice(0, 80) + '.pdf'
    setIsExporting(true)
    await new Promise((r) => window.requestAnimationFrame(r))
    await new Promise((r) => setTimeout(r, 80))
    try {
      await downloadPdfFromElement(exportRef.current, filename)
      trackPdfDownload({ preview, form })
      addToast(`PDF downloaded: ${filename}`, 'success', 4000)
    } catch (err) {
      addToast('Failed to download PDF', 'error', 4000)
      console.error(err)
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <>
      <div className="tabToolbar">
        <div>
          <div className="tabToolbarTitle">Battery Box Layout Designer</div>
          <div className="tabToolbarSub">Enter dimensions + layout, generate a 3D box, export as PDF.</div>
        </div>
        <div className="topActions">
          <button type="button" className="secondary" onClick={onReset}>Reset</button>
          <button type="button" onClick={onDownload} disabled={!preview || isExporting} className="primaryBtn">
            {isExporting ? (
              <>
                <Spinner size="sm" />
                <span>Generating PDF…</span>
              </>
            ) : (
              'Download PDF'
            )}
          </button>
        </div>
      </div>

      <main className="content">
        {/* ── Input panel ── */}
        <section className="panel">
          <h2 className="panelTitle">Inputs</h2>
          <form className="form" onSubmit={onSubmit}>
            <section className="formSection">
              <div className="fieldGroupLabel">Project Details</div>
              <label className="field">
                <span>Customer Name</span>
                <input value={form.customerName} onChange={onChange('customerName')} placeholder="e.g. Acme Corporation" />
              </label>
              <label className="field">
                <span>Machine Model</span>
                <input value={form.modelNo} onChange={onChange('modelNo')} placeholder="e.g. CATL LFP 3.22V 228Ah" />
              </label>
              <label className="field">
                <span>Plug Type</span>
                <input value={form.plugType} onChange={onChange('plugType')} placeholder="e.g. SB175" />
              </label>
            </section>

            <section className="formSection">
              <div className="fieldGroupLabel">Box Configuration</div>
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
                  <span>H1 — Height along Length (mm)</span>
                  <input inputMode="decimal" value={form.h1Mm} onChange={onChange('h1Mm')} placeholder="e.g. 625" />
                </label>
                <label className="field">
                  <span>H2 — Height along Width (mm)</span>
                  <input inputMode="decimal" value={form.h2Mm} onChange={onChange('h2Mm')} placeholder="Same as H1" />
                </label>
              </div>
            </section>

            <section className="formSection">
              <div className="fieldGroupLabel">Color & Cell</div>
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

            <label className="field">
              <span>Cell Type</span>
              <input
                value={form.cellType}
                onChange={onChange('cellType')}
                placeholder="e.g. 4PzS500 or 4PzB500"
              />
            </label>
            {isCellTypeInvalid && (
              <div className="inlineError">Cell type not found in table. Use a valid PzS/PzB format.</div>
            )}

            {/* Live parse preview */}
            {(() => {
              const p = parsedLiveCellType
              if (!p) return null
              return (
                <>
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
                  <div className="altPanel">
                    <button
                      type="button"
                      className="altToggleBtn"
                      onClick={() => setShowAlternatives(v => !v)}
                    >
                      {showAlternatives ? 'Hide Alternative Cells' : 'Show Alternative Cells'}
                    </button>
                    {showAlternatives && (
                      <div className="altBody">
                        <div className="grid2">
                          <label className="field">
                            <span>Min Height (mm)</span>
                            <input
                              inputMode="decimal"
                              value={form.altMinHeightMm}
                              onChange={onChange('altMinHeightMm')}
                              placeholder="e.g. 500"
                            />
                          </label>
                          <label className="field">
                            <span>Max Height (mm)</span>
                            <input
                              inputMode="decimal"
                              value={form.altMaxHeightMm}
                              onChange={onChange('altMaxHeightMm')}
                              placeholder="e.g. 750"
                            />
                          </label>
                        </div>
                        {isAltRangeInvalid && (
                          <div className="inlineError">Enter a valid height range (min must be less than or equal to max).</div>
                        )}
                        <div className="altTools">
                          <span className="altToolsLabel">Sort</span>
                          <div className="segmentedGroup">
                            <label className={`segmentedOption${altSortBy === 'heightAsc' ? ' selected' : ''}`}>
                              <input type="radio" name="altSortBy" value="heightAsc" checked={altSortBy === 'heightAsc'} onChange={() => setAltSortBy('heightAsc')} />
                              <span className="segmentedLabel">Height ↑</span>
                            </label>
                            <label className={`segmentedOption${altSortBy === 'closestHeight' ? ' selected' : ''}`}>
                              <input type="radio" name="altSortBy" value="closestHeight" checked={altSortBy === 'closestHeight'} onChange={() => setAltSortBy('closestHeight')} />
                              <span className="segmentedLabel">Closest</span>
                            </label>
                            <label className={`segmentedOption${altSortBy === 'capacityDesc' ? ' selected' : ''}`}>
                              <input type="radio" name="altSortBy" value="capacityDesc" checked={altSortBy === 'capacityDesc'} onChange={() => setAltSortBy('capacityDesc')} />
                              <span className="segmentedLabel">Capacity ↓</span>
                            </label>
                          </div>
                        </div>
                        {!isAltRangeInvalid && sortedAlternativeCells.length > 0 ? (
                          <div className="altResults">
                            {sortedAlternativeCells.map(cell => (
                              <div className="altResultCard" key={cell.designation}>
                                <button
                                  type="button"
                                  className="altResultToggle"
                                  onClick={() =>
                                    setExpandedAlternatives((prev) => ({
                                      ...prev,
                                      [cell.designation]: !prev[cell.designation],
                                    }))
                                  }
                                >
                                  <span className="parsedIcon">✓</span>
                                  <span className="altResultTitle">{cell.designation}</span>
                                  {closestAlternativeDesignation === cell.designation && (
                                    <span className="altClosestBadge">Best Match</span>
                                  )}
                                  <span className="altResultState">
                                    {expandedAlternatives[cell.designation] ? 'Hide' : 'Show'}
                                  </span>
                                </button>
                                {expandedAlternatives[cell.designation] && (
                                  <div className="parsedBadge">
                                    <div className="parsedBody">
                                      <div className="parsedGrid">
                                        <span>Width</span>      <strong>{cell.widthMm} mm</strong>
                                        <span>Length</span>     <strong>{cell.lengthMm} mm</strong>
                                        <span>Height</span>     <strong>{cell.heightMm} mm</strong>
                                        <span>Capacity</span>   <strong>{cell.capacityAh} Ah</strong>
                                        <span>Cell weight</span><strong>{cell.weightKg} kg</strong>
                                        {cell.is4P && <><span>Config</span><strong>4-Post</strong></>}
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        ) : !isAltRangeInvalid ? (
                          <div className="altEmpty">
                            No alternatives found in this height range for the same plate/series and dimensions.
                          </div>
                        ) : null}
                      </div>
                    )}
                  </div>
                </>
              )
            })()}
            </section>

            <section className="formSection">
              <div className="fieldGroupLabel">Cell Layout</div>
              <div className="fieldGroupLabel">Cell Make</div>
              <div className="segmentedGroup">
                {[
                  { value: 'HOP', label: 'HOP', desc: 'Green cells' },
                  { value: 'TAB', label: 'TAB', desc: 'Grey cells'  },
                  { value: 'EXI', label: 'EXI', desc: 'Grey cells'  },
                ].map(({ value, label, desc }) => (
                  <label key={value} className={`segmentedOption${form.cellMake === value ? ' selected' : ''} cellMake${value}`}>
                    <input type="radio" name="cellMake" value={value} checked={form.cellMake === value} onChange={onChange('cellMake')} />
                    <span className="segmentedLabel">{label}</span>
                    <span className="segmentedDesc">{desc}</span>
                  </label>
                ))}
              </div>

              <div className="fieldGroupLabel">Side Holes (Width Wall)</div>
              <div className="segmentedGroup">
                {[
                  { value: '0', label: 'None'    },
                  { value: '1', label: '1 Hole'  },
                  { value: '2', label: '2 Holes' },
                ].map(opt => (
                  <label key={opt.value} className={`segmentedOption${form.holeCount === opt.value ? ' selected' : ''}`}>
                    <input type="radio" name="holeCount" value={opt.value} checked={form.holeCount === opt.value} onChange={onChange('holeCount')} />
                    <span className="segmentedLabel">{opt.label}</span>
                  </label>
                ))}
              </div>
              {form.holeCount !== '0' && (
                <label className="field">
                  <span>Hole Diameter (mm)</span>
                  <input inputMode="decimal" value={form.holeDiameterMm} onChange={onChange('holeDiameterMm')} placeholder="e.g. 50" />
                </label>
              )}

              <div className="field">
                <span>Layout (rows × columns)</span>
                <div className="layoutRow">
                  <input inputMode="numeric" value={form.rows}    onChange={onChange('rows')}    placeholder="rows" />
                  <span className="times" aria-hidden="true">×</span>
                  <input inputMode="numeric" value={form.columns} onChange={onChange('columns')} placeholder="cols" />
                </div>
                {isLayoutInvalid && (
                  <div className="inlineError">Rows and columns must be whole numbers greater than 0.</div>
                )}
              </div>
              <div className="presetRow">
                {[
                  { label: '8 × 1', rows: 8, columns: 1 },
                  { label: '10 × 1', rows: 10, columns: 1 },
                  { label: '12 × 1', rows: 12, columns: 1 },
                  { label: '6 × 2', rows: 6, columns: 2 },
                ].map((preset) => (
                  <button
                    key={preset.label}
                    type="button"
                    className={`presetBtn${Number(form.rows) === preset.rows && Number(form.columns) === preset.columns ? ' active' : ''}`}
                    onClick={() => setForm((f) => ({ ...f, rows: String(preset.rows), columns: String(preset.columns) }))}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </section>

            <section className="formSection">
              <div className="fieldGroupLabel">Output</div>
              <div className="formActions">
                <button type="submit" className="primaryBtn" disabled={isLayoutInvalid}>Create Diagram</button>
                <p className="hint">Tip: drag to rotate, scroll to zoom.</p>
              </div>
            </section>
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
                plugType={preview.plugType}
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
                h1Mm={preview.h1Mm}
                h2Mm={preview.h2Mm}
                rows={preview.rows}
                columns={preview.columns}
                totalCells={preview.totalCells}
                cellMake={preview.cellMake}
              />

              {/* ── 3-D diagram ── */}
              <div className="canvasCard">
                <div className="canvasHeader">
                  <div className="chips">
                    <span className="chip chipProject">Model: {preview.modelNo || '—'}</span>
                    <span className="chip chipProject">Plug: {preview.plugType || '—'}</span>
                    <span className="chip chipProject">Cell: {preview.cellType || '—'}</span>
                    <span className="chip chipL">L: {preview.lengthMm} mm</span>
                    <span className="chip chipW">W: {preview.widthMm} mm</span>
                    <span className="chip chipH">H1: {preview.h1Mm} mm</span>
                    {preview.h2Mm !== preview.h1Mm && (
                      <span className="chip chipH2">H2: {preview.h2Mm} mm</span>
                    )}
                    <span className="chip chipLayout">
                      Layout: {preview.rows} × {preview.columns} = {preview.rows * preview.columns} cells
                    </span>
                  </div>
                  <div className="viewControls">
                    <button type="button" className="stdViewBtn" onClick={() => boxSceneRef.current?.resetToStandardView()} title="Reset to standard isometric view">
                      Standard
                    </button>
                    <button type="button" className="stdViewBtn" onClick={() => boxSceneRef.current?.setView('top')} title="Top view">
                      Top
                    </button>
                    <button type="button" className="stdViewBtn" onClick={() => boxSceneRef.current?.setView('front')} title="Front view">
                      Front
                    </button>
                    <button type="button" className="stdViewBtn" onClick={() => boxSceneRef.current?.setView('side')} title="Side view">
                      Side
                    </button>
                  </div>
                </div>
                <div className="canvasWrap">
                  <BoxScene
                    ref={boxSceneRef}
                    lengthMm={preview.lengthMm}
                    widthMm={preview.widthMm}
                    h1Mm={preview.h1Mm}
                    h2Mm={preview.h2Mm}
                    cellHeightMm={preview.cellHeightMm ?? preview.h1Mm * 0.86}
                    rows={preview.rows}
                    columns={preview.columns}
                    boxColor={preview.boxColorHex}
                    cellMake={preview.cellMake}
                    holeCount={preview.holeCount}
                    holeDiameterMm={preview.holeDiameterMm}
                  />
                </div>
              </div>

              {/* ── Design details ── */}
              {/* <DetailsCard modelNo={preview.modelNo} cellType={preview.cellType} /> */}

              {/* ── PDF footer ── */}
              <div className="pdfFooterNote">
                <div className="pdfFooterRow">
                  <div className="pdfFooterLeft">
                    <span className="pdfFooterBadge">Abdullah Farooq</span>
                    <span className="pdfFooterAddress">Battery &amp; Charger Field Service</span>
                  </div>
                  <div className="pdfFooterRight">
                    <span className="pdfFooterUrl">For personal convenience only — not an authorized document</span>
                  </div>
                </div>
                <div className="pdfFooterDisclaimer">
                  {createdAt && (
                    <>
                      Generated on <strong>{createdAt.toLocaleString()}</strong>.{' '}
                    </>
                  )}
                  For battery box design inquiries contact <strong>Abdullah Farooq</strong>.
                </div>
              </div>

            </div>
          )}
        </section>
      </main>
    </>
  )
}
