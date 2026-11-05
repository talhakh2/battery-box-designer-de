import { useEffect, useMemo, useRef, useState } from 'react'
import { Spinner } from '../components/Spinner'
import { PasswordDialog } from '../service/PasswordDialog'
import { ReportDocument } from '../service/ReportDocument'
import { exportReportPdf } from '../service/pdfExport'
import {
  ENGINEER_NAME, MAX_CELLS, abnormalReason, autoFill, computeStats, makeCells, todayIso,
} from '../service/readings'
import { Field, PhotosPanel, PreviewSection, SignOffPanel } from '../service/shared'
import { useSignOff } from '../service/useSignOff'

const DRAFT_KEY = 'de_service_report_draft_v1'

const EMPTY_FORM = {
  reportNo: '', date: '', customer: '', age: '',
  batteryType: '', batterySno: '',
  equipMake: '', equipModel: '', equipSno: '',
  chargerMake: '', chargerModel: '', chargerSno: '',
  complaint: '', assessment: '', replaced: '',
  inputChargeAh: '', tempC: '', tocVolts: '', tocAmps: '', ocVolts: '',
  statusPct: '', lastToppingDate: '',
}

const DEFAULT_FILL = {
  vMin: '2.09', vMax: '2.13', fillV: true,
  sgMin: '1.270', sgMax: '1.290', fillSg: false,
  from: '1', to: '', onlyEmpty: false,
}

const CELL_PRESETS = [12, 18, 24, 36, 40, 48]

function loadDraft() {
  try {
    const d = JSON.parse(localStorage.getItem(DRAFT_KEY) || 'null')
    if (!d) return null
    const cells = makeCells().map((c, i) => ({ ...c, ...(d.cells?.[i] || {}) }))
    return { ...d, form: { ...EMPTY_FORM, ...d.form }, cells, fill: { ...DEFAULT_FILL, ...d.fill } }
  } catch {
    return null
  }
}

export function ServiceReport({ addToast }) {
  const draft = useMemo(loadDraft, [])
  const [form, setForm] = useState(() => draft?.form ?? { ...EMPTY_FORM, date: todayIso() })
  const [cellCount, setCellCount] = useState(() => draft?.cellCount ?? '24')
  const [cells, setCells] = useState(() => draft?.cells ?? makeCells())
  const [techName, setTechName] = useState(() => draft?.techName ?? '')
  const [fill, setFill] = useState(() => draft?.fill ?? DEFAULT_FILL)
  const [photos, setPhotos] = useState([])
  const [isExporting, setIsExporting] = useState(false)

  const reportRef = useRef(null)
  const techNameRef = useRef(null)
  const so = useSignOff({ addToast, techNameRef })
  const { role, verified, verifiedAt, signature, pwPrompt, setPwPrompt, chooseRole, onPasswordOk, toggleVerify } = so

  const n = Math.min(MAX_CELLS, Math.max(1, Number.parseInt(cellCount, 10) || 1))
  const stats = useMemo(() => computeStats(cells, n), [cells, n])
  const isEngineer = role === 'engineer'

  // Keep a draft of the text/readings so a refresh on site doesn't lose work.
  useEffect(() => {
    const t = setTimeout(() => {
      try {
        localStorage.setItem(DRAFT_KEY, JSON.stringify({ form, cellCount, cells, techName, fill }))
      } catch { /* storage full or blocked */ }
    }, 400)
    return () => clearTimeout(t)
  }, [form, cellCount, cells, techName, fill])

  const set = (key) => (e) => setForm(f => ({ ...f, [key]: e.target.value }))

  const setCell = (i, patch) => setCells(cs => cs.map((c, j) => (j === i ? { ...c, ...patch } : c)))

  const onCellKeyDown = (e, i, kind) => {
    if (e.key !== 'Enter') return
    e.preventDefault()
    const next = document.querySelector(`[data-cell-input="${kind}-${i + 1}"]`)
    if (next) { next.focus(); next.select?.() }
  }

  // ── Auto-fill (engineer only) ──
  const vMin = Number.parseFloat(fill.vMin)
  const vMax = Number.parseFloat(fill.vMax)
  const sgMin = Number.parseFloat(fill.sgMin)
  const sgMax = Number.parseFloat(fill.sgMax)
  const fillFrom = Math.max(1, Number.parseInt(fill.from, 10) || 1)
  const fillTo = Math.min(n, Number.parseInt(fill.to, 10) || n)
  const vRangeBad = fill.fillV && (!Number.isFinite(vMin) || !Number.isFinite(vMax) || vMin > vMax || vMin < 1 || vMax > 3)
  const sgRangeBad = fill.fillSg && (!Number.isFinite(sgMin) || !Number.isFinite(sgMax) || sgMin > sgMax || sgMin < 1 || sgMax > 1.4)
  const fillBad = vRangeBad || sgRangeBad || (!fill.fillV && !fill.fillSg) || fillFrom > fillTo

  const runAutoFill = () => {
    if (!isEngineer || fillBad) return
    setCells(cs => autoFill(cs, {
      from: fillFrom, to: fillTo,
      fillV: fill.fillV, vMin, vMax,
      fillSg: fill.fillSg, sgMin, sgMax,
      onlyEmpty: fill.onlyEmpty,
    }))
    const what = [fill.fillV && 'voltage', fill.fillSg && 'SG'].filter(Boolean).join(' + ')
    addToast(`Filled ${what} for cells ${fillFrom}–${fillTo} (dead cells skipped)`, 'success')
  }

  const clearReadings = () => {
    if (!window.confirm('Clear all cell readings and dead-cell marks?')) return
    setCells(makeCells())
  }

  // ── PDF ──
  const onDownload = async () => {
    if (!isEngineer && !techName.trim()) {
      addToast("Enter the technician's name first", 'error', 3500)
      techNameRef.current?.focus()
      return
    }
    if (!reportRef.current) return
    const safe = (s) => String(s || '').trim().replaceAll(/[^\w-]+/g, '_')
    const filename = ['ServiceReport', safe(form.reportNo), safe(form.customer), form.date || todayIso()]
      .filter(Boolean).join('_').slice(0, 100) + '.pdf'
    setIsExporting(true)
    await new Promise(r => setTimeout(r, 60))
    try {
      await exportReportPdf(reportRef.current, filename, {
        footerLeft: `Battery Service Report${form.reportNo ? ` · ${form.reportNo}` : ''}${verified ? ' · Verified' : ''}`,
      })
      addToast(`PDF downloaded: ${filename}`, 'success', 4000)
    } catch (err) {
      console.error(err)
      addToast('Failed to generate PDF', 'error', 4000)
    } finally {
      setIsExporting(false)
    }
  }

  const newReport = () => {
    if (!window.confirm('Start a new report? All fields, readings and photos will be cleared.')) return
    setForm({ ...EMPTY_FORM, date: todayIso() })
    setCells(makeCells())
    setPhotos([])
    so.resetVerify()
    setFill(f => ({ ...f, from: '1', to: '' }))
  }

  const downloadBtn = (
    <button type="button" className="primaryBtn" onClick={onDownload} disabled={isExporting}>
      {isExporting ? <><Spinner size="sm" /><span>Generating PDF…</span></> : 'Download PDF'}
    </button>
  )

  return (
    <>
      <div className="tabToolbar">
        <div>
          <div className="tabToolbarTitle">Battery Service Report</div>
          <div className="tabToolbarSub">Annexure to the main service report — fill readings, attach photos, export as PDF.</div>
        </div>
        <div className="topActions">
          <button type="button" className="secondary" onClick={newReport}>New Report</button>
          {downloadBtn}
        </div>
      </div>

      <main className="srLayout">
        <div className="srMain">
          {/* ── Report details ── */}
          <section className="panel srOrder1">
            <h2 className="panelTitle">Report Details</h2>
            <div className="form">
              <section className="formSection">
                <div className="fieldGroupLabel">Service</div>
                <div className="srGrid">
                  <Field label="Service Report No. / W.O. No."><input value={form.reportNo} onChange={set('reportNo')} placeholder="e.g. SR-2026-0142" /></Field>
                  <Field label="Date"><input type="date" value={form.date} onChange={set('date')} /></Field>
                  <Field label="Customer" wide><input value={form.customer} onChange={set('customer')} placeholder="Customer / site name" /></Field>
                </div>
              </section>

              <section className="formSection">
                <div className="fieldGroupLabel">Battery</div>
                <div className="srGrid srGrid3">
                  <Field label="Battery Type"><input value={form.batteryType} onChange={set('batteryType')} placeholder="e.g. 48V 4PzS500" /></Field>
                  <Field label="S.No."><input value={form.batterySno} onChange={set('batterySno')} /></Field>
                  <Field label="Age"><input value={form.age} onChange={set('age')} placeholder="e.g. 3 years" /></Field>
                </div>
              </section>

              <section className="formSection">
                <div className="fieldGroupLabel">Equipment &amp; Charger</div>
                <div className="srGrid srGrid3">
                  <Field label="Equipment Make"><input value={form.equipMake} onChange={set('equipMake')} placeholder="e.g. Toyota" /></Field>
                  <Field label="Model"><input value={form.equipModel} onChange={set('equipModel')} /></Field>
                  <Field label="S.No."><input value={form.equipSno} onChange={set('equipSno')} /></Field>
                  <Field label="Charger Make"><input value={form.chargerMake} onChange={set('chargerMake')} /></Field>
                  <Field label="Model"><input value={form.chargerModel} onChange={set('chargerModel')} /></Field>
                  <Field label="S.No."><input value={form.chargerSno} onChange={set('chargerSno')} /></Field>
                </div>
              </section>

              <section className="formSection">
                <div className="fieldGroupLabel">Findings</div>
                <div className="srStack">
                  <Field label="Nature of Complaint"><textarea rows={2} value={form.complaint} onChange={set('complaint')} placeholder="What the customer reported" /></Field>
                  <Field label={isEngineer ? "Engineer's Assessment" : "Technician's Assessment"}><textarea rows={3} value={form.assessment} onChange={set('assessment')} placeholder="Findings after inspection" /></Field>
                  <Field label="Cells / Components Replaced / Required"><textarea rows={2} value={form.replaced} onChange={set('replaced')} placeholder="e.g. Replace C5, C17; top-up all cells" /></Field>
                </div>
              </section>
            </div>
          </section>

          {/* ── Readings ── */}
          <section className="panel srOrder3">
            <h2 className="panelTitle">Battery State / Readings</h2>
            <div className="form">
              <section className="formSection">
                <div className="fieldGroupLabel">Charge Conditions</div>
                <div className="srGrid srGrid3">
                  <Field label="Input Charge (AH)"><input inputMode="decimal" value={form.inputChargeAh} onChange={set('inputChargeAh')} /></Field>
                  <Field label="Temp (°C)"><input inputMode="decimal" value={form.tempC} onChange={set('tempC')} /></Field>
                  <Field label="Open Circuit (Volts)"><input inputMode="decimal" value={form.ocVolts} onChange={set('ocVolts')} /></Field>
                  <Field label="Top-of-Charge (Volts)"><input inputMode="decimal" value={form.tocVolts} onChange={set('tocVolts')} /></Field>
                  <Field label="@ (Amps)"><input inputMode="decimal" value={form.tocAmps} onChange={set('tocAmps')} /></Field>
                </div>
              </section>

              <section className="formSection">
                <div className="fieldGroupLabel">Cells</div>
                <div className="srCellCount">
                  <Field label="No. of Cells">
                    <input inputMode="numeric" value={cellCount} onChange={(e) => setCellCount(e.target.value.replace(/\D/g, '').slice(0, 2))} onBlur={() => setCellCount(String(n))} />
                  </Field>
                  <div className="presetRow">
                    {CELL_PRESETS.map(p => (
                      <button key={p} type="button" className={`presetBtn${n === p ? ' active' : ''}`} onClick={() => setCellCount(String(p))}>
                        {p} cells · {p * 2}V
                      </button>
                    ))}
                  </div>
                </div>
                <div className="srCellHelp">
                  Enter SG and voltage per cell. <kbd>Enter</kbd> jumps to the next cell. Tap <span className="srDeadIcon">✕</span> to mark a cell dead — it shows red in the report.
                  Readings that look abnormal are highlighted in amber.
                </div>
                <div className="srCellGrid">
                  {cells.slice(0, n).map((c, i) => {
                    const reason = abnormalReason(c, stats)
                    return (
                      <div key={i} className={`srCell${c.dead ? ' isDead' : ''}${reason ? ' isWarn' : ''}`}>
                        <div className="srCellNo">C{i + 1}</div>
                        <input
                          aria-label={`Cell ${i + 1} specific gravity`}
                          className="srCellInput"
                          inputMode="decimal"
                          placeholder="SG"
                          value={c.sg}
                          data-cell-input={`sg-${i}`}
                          onKeyDown={(e) => onCellKeyDown(e, i, 'sg')}
                          onChange={(e) => setCell(i, { sg: e.target.value })}
                        />
                        <input
                          aria-label={`Cell ${i + 1} voltage`}
                          className="srCellInput"
                          inputMode="decimal"
                          placeholder="Volt"
                          value={c.v}
                          data-cell-input={`v-${i}`}
                          onKeyDown={(e) => onCellKeyDown(e, i, 'v')}
                          onChange={(e) => setCell(i, { v: e.target.value })}
                        />
                        <button
                          type="button"
                          className={`srDeadBtn${c.dead ? ' on' : ''}`}
                          onClick={() => setCell(i, { dead: !c.dead })}
                          title={c.dead ? 'Unmark dead cell' : 'Mark cell as dead'}
                          aria-pressed={c.dead}
                        >
                          {c.dead ? 'DEAD' : '✕'}
                        </button>
                        {reason && (
                          <div className="srCellWarn">
                            ⚠ {reason}
                            <button type="button" className="srLinkBtn" onClick={() => setCell(i, { dead: true })}>Mark dead</button>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </section>

              <section className="formSection">
                <div className="fieldGroupLabel">Status</div>
                <div className="srGrid">
                  <Field label="Status During Inspection (% Charged)">
                    <input inputMode="decimal" value={form.statusPct} onChange={set('statusPct')} placeholder={stats.socFromSg != null ? `≈ ${Math.round(stats.socFromSg)} from avg SG` : 'e.g. 80'} />
                  </Field>
                  <Field label="Last Topping-up Date"><input type="date" value={form.lastToppingDate} onChange={set('lastToppingDate')} /></Field>
                </div>
              </section>
            </div>
          </section>

          <PhotosPanel className="srOrder4" photos={photos} setPhotos={setPhotos} addToast={addToast} />

          <SignOffPanel
            className="srOrder5"
            role={role}
            signature={signature}
            techName={techName}
            setTechName={setTechName}
            techNameRef={techNameRef}
            verified={verified}
            verifiedAt={verifiedAt}
            onChooseRole={chooseRole}
            onToggleVerify={toggleVerify}
          />

          {/* ── Preview ── */}
          <PreviewSection
            className="srOrder6"
            title="Report Preview"
            reportRef={reportRef}
            downloadBtn={downloadBtn}
            document={(
            <ReportDocument
              form={form}
              cells={cells}
              cellCount={n}
              stats={stats}
              photos={photos}
              role={role}
              techName={techName}
              verified={verified}
              verifiedAt={verifiedAt}
              signatureSrc={signature}
            />
            )}
          />
        </div>

        {/* ── Sidebar ── */}
        <aside className="srSide">
          <section className="panel srStats">
            <h2 className="panelTitle">Live Readings</h2>
            <div className="srStatGrid">
              <div className="srStat srStatMain"><span>Average Voltage</span><strong>{stats.avgV != null ? stats.avgV.toFixed(3) : '—'}<small> V</small></strong></div>
              <div className="srStat srStatMain"><span>Average SG</span><strong>{stats.avgSg != null ? stats.avgSg.toFixed(3) : '—'}</strong></div>
              <div className="srStat"><span>Min V</span><strong>{stats.minV ? `${stats.minV.value.toFixed(2)}` : '—'}</strong>{stats.minV && <em>C{stats.minV.no}</em>}</div>
              <div className="srStat"><span>Max V</span><strong>{stats.maxV ? `${stats.maxV.value.toFixed(2)}` : '—'}</strong>{stats.maxV && <em>C{stats.maxV.no}</em>}</div>
              <div className="srStat"><span>Spread</span><strong>{stats.spreadV != null ? `${stats.spreadV.toFixed(2)} V` : '—'}</strong></div>
              <div className="srStat"><span>Sum of cells</span><strong>{stats.sumV != null ? `${stats.sumV.toFixed(2)} V` : '—'}</strong></div>
              <div className="srStat"><span>Entered</span><strong>{stats.enteredV}/{n}</strong><em>voltage</em></div>
              <div className="srStat"><span>SOC from SG</span><strong>{stats.socFromSg != null ? `≈ ${Math.round(stats.socFromSg)} %` : '—'}</strong></div>
            </div>
            <div className={`srDeadList${stats.dead.length ? ' has' : ''}`}>
              <span>Dead cells</span>
              {stats.dead.length ? stats.dead.map(no => <b key={no}>C{no}</b>) : <em>None</em>}
            </div>
          </section>

          <section className={`panel srFill${isEngineer ? '' : ' locked'}`}>
            <h2 className="panelTitle">Auto-fill Readings {isEngineer ? '' : '🔒'}</h2>
            {!isEngineer ? (
              <div className="srLocked">
                <p>Auto-fill is for {ENGINEER_NAME} only.</p>
                <button type="button" className="secondary" onClick={() => chooseRole('engineer')}>Unlock as Engineer</button>
              </div>
            ) : (
              <div className="srFillBody">
                <label className="srCheck">
                  <input type="checkbox" checked={fill.fillV} onChange={(e) => setFill(f => ({ ...f, fillV: e.target.checked }))} />
                  <span>Voltage range (V)</span>
                </label>
                <div className="srRange">
                  <input inputMode="decimal" value={fill.vMin} disabled={!fill.fillV} onChange={(e) => setFill(f => ({ ...f, vMin: e.target.value }))} aria-label="Minimum voltage" />
                  <span>–</span>
                  <input inputMode="decimal" value={fill.vMax} disabled={!fill.fillV} onChange={(e) => setFill(f => ({ ...f, vMax: e.target.value }))} aria-label="Maximum voltage" />
                </div>
                {vRangeBad && <div className="inlineError">Enter a valid voltage range, e.g. 2.09 – 2.13</div>}

                <label className="srCheck">
                  <input type="checkbox" checked={fill.fillSg} onChange={(e) => setFill(f => ({ ...f, fillSg: e.target.checked }))} />
                  <span>Specific gravity range</span>
                </label>
                <div className="srRange">
                  <input inputMode="decimal" value={fill.sgMin} disabled={!fill.fillSg} onChange={(e) => setFill(f => ({ ...f, sgMin: e.target.value }))} aria-label="Minimum SG" />
                  <span>–</span>
                  <input inputMode="decimal" value={fill.sgMax} disabled={!fill.fillSg} onChange={(e) => setFill(f => ({ ...f, sgMax: e.target.value }))} aria-label="Maximum SG" />
                </div>
                {sgRangeBad && <div className="inlineError">Enter a valid SG range, e.g. 1.270 – 1.290</div>}

                <div className="srCheckLabel">Cells</div>
                <div className="srRange">
                  <input inputMode="numeric" value={fill.from} onChange={(e) => setFill(f => ({ ...f, from: e.target.value.replace(/\D/g, '') }))} aria-label="From cell" />
                  <span>to</span>
                  <input inputMode="numeric" value={fill.to} placeholder={String(n)} onChange={(e) => setFill(f => ({ ...f, to: e.target.value.replace(/\D/g, '') }))} aria-label="To cell" />
                </div>
                <label className="srCheck">
                  <input type="checkbox" checked={fill.onlyEmpty} onChange={(e) => setFill(f => ({ ...f, onlyEmpty: e.target.checked }))} />
                  <span>Only fill empty cells</span>
                </label>
                <div className="srFillActions">
                  <button type="button" className="primaryBtn" onClick={runAutoFill} disabled={fillBad}>Auto-fill</button>
                  <button type="button" className="secondary" onClick={clearReadings}>Clear</button>
                </div>
                <div className="hint">Dead cells are never overwritten.</div>
              </div>
            )}
          </section>

          <section className="panel srSideActions">
            {downloadBtn}
            <div className="hint">{verified ? '✓ Verified — signature will appear on the report' : 'Not verified yet'}</div>
          </section>
        </aside>
      </main>

      {pwPrompt && (
        <PasswordDialog
          title={pwPrompt === 'engineer' ? `Engineer access — ${ENGINEER_NAME}` : `Verify as ${ENGINEER_NAME}`}
          message={pwPrompt === 'engineer'
            ? 'Enter the password to switch to Engineer mode and unlock auto-fill.'
            : 'Enter the password to verify this report and add the signature.'}
          confirmLabel={pwPrompt === 'engineer' ? 'Unlock' : 'Verify'}
          onSuccess={onPasswordOk}
          onCancel={() => setPwPrompt(null)}
        />
      )}
    </>
  )
}

