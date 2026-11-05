import { useEffect, useMemo, useRef, useState } from 'react'
import { Spinner } from '../components/Spinner'
import { CapacityDocument } from '../capacity/CapacityDocument'
import {
  CHEMISTRY, CONDITION_FIELDS, DEFAULT_THRESHOLDS, REC_OPTIONS, analyse, fmtHours, suggest, validThresholds,
} from '../capacity/calc'
import { barsSvg, gaugeSvg } from '../capacity/charts'
import { SvgImage } from '../capacity/SvgImage'
import { WhatsAppDialog } from '../parts/WhatsAppDialog'
import { PasswordDialog } from '../service/PasswordDialog'
import { exportReportPdf } from '../service/pdfExport'
import { ENGINEER_NAME, todayIso } from '../service/readings'
import { Field, PreviewSection, SignOffPanel } from '../service/shared'
import { useSignOff } from '../service/useSignOff'

const DRAFT_KEY = 'de_capacity_draft_v1'
const THRESH_KEY = 'de_capacity_thresholds_v1'

const EMPTY_FORM = {
  reportNo: '', type: 'leadacid', typeOther: '', voltage: '', ratedAh: '', actualAh: '', rate: 'C5',
  durH: '', durM: '', loadA: '', tempC: '', dodPct: '', ageYears: '', model: '', serial: '',
  customer: '', site: '', testDate: '', observations: '',
}
const EMPTY_COND = { cells: 'ok', deadCells: '', physical: 'none', electrolyte: 'normal', internal: 'none', feasibility: 'feasible' }
const EMPTY_REC = { option: null, items: {}, other: '', remarks: '', statement: '', statementEdited: false }

function load(key, fallback) {
  try { const v = JSON.parse(localStorage.getItem(key) || 'null'); return v ?? fallback } catch { return fallback }
}

function Seg({ value, options, onChange, name }) {
  return (
    <div className="segmentedGroup cpSeg">
      {options.map(([v, label]) => (
        <label key={v} className={`segmentedOption${value === v ? ' selected' : ''}`}>
          <input type="radio" name={name} checked={value === v} onChange={() => onChange(v)} />
          <span className="segmentedLabel">{label}</span>
        </label>
      ))}
    </div>
  )
}

export function CapacityReport({ addToast }) {
  const draft = useMemo(() => load(DRAFT_KEY, null), [])
  const [form, setForm] = useState(() => ({ ...EMPTY_FORM, testDate: todayIso(), ...(draft?.form || {}) }))
  const [cond, setCond] = useState(() => ({ ...EMPTY_COND, ...(draft?.cond || {}) }))
  const [rec, setRec] = useState(() => ({ ...EMPTY_REC, ...(draft?.rec || {}) }))
  const [techName, setTechName] = useState(() => draft?.techName ?? '')
  const [designation, setDesignation] = useState(() => draft?.designation ?? '')
  const [thresholds, setThresholds] = useState(() => ({ ...DEFAULT_THRESHOLDS, ...load(THRESH_KEY, {}) }))
  const [thDraft, setThDraft] = useState(null) // editing copy
  const [isExporting, setIsExporting] = useState(false)
  const [sharePdf, setSharePdf] = useState(null)

  const reportRef = useRef(null)
  const techNameRef = useRef(null)
  const so = useSignOff({ addToast, techNameRef })
  const { role, verified, verifiedAt, signature, pwPrompt, setPwPrompt, chooseRole, onPasswordOk, toggleVerify } = so

  useEffect(() => {
    const t = setTimeout(() => {
      try { localStorage.setItem(DRAFT_KEY, JSON.stringify({ form, cond, rec, techName, designation })) } catch { /* ignore */ }
    }, 400)
    return () => clearTimeout(t)
  }, [form, cond, rec, techName, designation])

  const a = useMemo(() => analyse(form, thresholds), [form, thresholds])
  const hint = useMemo(() => suggest(a, cond, thresholds), [a, cond, thresholds])
  const color = a.status?.color || '#94a3b8'
  const chem = CHEMISTRY[form.type]
  const autoDesignation = role === 'engineer' ? 'Field Service Engineer' : 'Service Technician'
  const shownDesignation = designation || autoDesignation

  const set = (key) => (e) => setForm(f => ({ ...f, [key]: e.target.value }))
  const setC = (key) => (v) => setCond(c => ({ ...c, [key]: v }))

  const chooseOption = (option, items) => {
    setRec(r => ({
      ...r,
      option,
      items: items ? Object.fromEntries(items.map(i => [i, true])) : (r.option === option ? r.items : {}),
      statement: r.statementEdited && r.option === option ? r.statement : REC_OPTIONS[option].statement,
      statementEdited: r.statementEdited && r.option === option,
    }))
  }

  const applySuggestion = () => {
    if (!hint) return
    chooseOption(hint.option, hint.items)
    addToast(`Suggestion applied: ${REC_OPTIONS[hint.option].short} — review and adjust as needed`, 'info', 3500)
  }

  const saveThresholds = () => {
    const t = Object.fromEntries(Object.entries(thDraft).map(([k, v]) => [k, Number(v)]))
    if (!validThresholds(t)) { addToast('Thresholds must decrease: Excellent > Good > Reduced > Poor > 0', 'error', 4000); return }
    setThresholds(t)
    try { localStorage.setItem(THRESH_KEY, JSON.stringify(t)) } catch { /* ignore */ }
    setThDraft(null)
    addToast('Thresholds updated', 'success')
  }

  const onDownload = async () => {
    if (!a.ready) { addToast('Enter rated capacity and actual test output first', 'error', 3500); return }
    if (role !== 'engineer' && !techName.trim()) {
      addToast("Enter the technician's name first", 'error', 3500)
      techNameRef.current?.focus()
      return
    }
    if (!reportRef.current) return
    const safe = (s) => String(s || '').trim().replaceAll(/[^\w-]+/g, '_')
    const filename = ['CapacityTest', safe(form.reportNo), safe(form.customer), form.testDate || todayIso()]
      .filter(Boolean).join('_').slice(0, 100) + '.pdf'
    setIsExporting(true)
    await new Promise(r => setTimeout(r, 60))
    try {
      const out = await exportReportPdf(reportRef.current, filename, {
        footerLeft: `Battery Capacity Test Report${form.reportNo ? ` · ${form.reportNo}` : ''}${verified ? ' · Verified' : ''}`,
      })
      setSharePdf(out)
    } catch (err) {
      console.error(err)
      addToast('Failed to generate PDF', 'error', 4000)
    } finally {
      setIsExporting(false)
    }
  }

  const newReport = () => {
    if (!window.confirm('Start a new capacity test report? All fields will be cleared.')) return
    setForm({ ...EMPTY_FORM, testDate: todayIso() })
    setCond(EMPTY_COND)
    setRec(EMPTY_REC)
    so.resetVerify()
  }

  const downloadBtn = (
    <button type="button" className="primaryBtn" onClick={onDownload} disabled={isExporting}>
      {isExporting ? <><Spinner size="sm" /><span>Generating PDF…</span></> : 'Download PDF'}
    </button>
  )

  const opt = rec.option ? REC_OPTIONS[rec.option] : null

  return (
    <>
      <div className="tabToolbar">
        <div>
          <div className="tabToolbarTitle">Battery Capacity Test Report</div>
          <div className="tabToolbarSub">Capacity analysis &amp; condition assessment — enter rated and tested capacity, the dashboard updates instantly.</div>
        </div>
        <div className="topActions">
          <button type="button" className="secondary" onClick={newReport}>New Report</button>
          {downloadBtn}
        </div>
      </div>

      <main className="srLayout cpLayout">
        <div className="srMain">
          {/* ── Specifications ── */}
          <section className="panel srOrder1">
            <h2 className="panelTitle">Battery Information</h2>
            <div className="form">
              <section className="formSection">
                <div className="fieldGroupLabel">Battery Type</div>
                <Seg name="cpType" value={form.type} options={Object.entries(CHEMISTRY).map(([k, c]) => [k, c.label])} onChange={(v) => setForm(f => ({ ...f, type: v }))} />
                {form.type === 'other' && (
                  <Field label="Specify battery type"><input value={form.typeOther} onChange={set('typeOther')} /></Field>
                )}
              </section>

              <section className="formSection">
                <div className="fieldGroupLabel">Capacity Test</div>
                <div className="srGrid srGrid3">
                  <Field label="Battery Voltage (V)"><input inputMode="decimal" value={form.voltage} onChange={set('voltage')} placeholder="e.g. 48" /></Field>
                  <Field label="Rated Capacity (Ah) *"><input inputMode="decimal" value={form.ratedAh} onChange={set('ratedAh')} placeholder="e.g. 500" /></Field>
                  <Field label="Actual Test Output (Ah) *"><input inputMode="decimal" value={form.actualAh} onChange={set('actualAh')} placeholder={a.actualFromDuration ? `${a.actual.toFixed(1)} (from duration)` : 'e.g. 410'} /></Field>
                </div>
                <div className="fieldGroupLabel" style={{ marginTop: 12 }}>Discharge Rate (test rate)</div>
                <Seg name="cpRate" value={form.rate} options={[['C5', 'C5'], ['C10', 'C10'], ['C20', 'C20']]} onChange={(v) => setForm(f => ({ ...f, rate: v }))} />
                <div className="srCellHelp" style={{ marginTop: 8 }}>
                  {a.testCurrent ? <>Test current at {form.rate} ≈ <b>{a.testCurrent.toFixed(1)} A</b> (rated ÷ {a.rateHours}). </> : null}
                  The rate describes the test, not the backup time in service.
                </div>
                <div className="srGrid srGrid3">
                  <Field label="Measured test duration (h)"><input inputMode="numeric" value={form.durH} onChange={set('durH')} placeholder="optional" /></Field>
                  <Field label="(min)"><input inputMode="numeric" value={form.durM} onChange={set('durM')} placeholder="optional" /></Field>
                  <div className="cpHintBox">{a.actualFromDuration ? `Actual capacity calculated from duration: ${a.actual.toFixed(1)} Ah` : 'Leave "Actual Test Output" empty to calculate it from the test duration.'}</div>
                </div>
              </section>

              <section className="formSection">
                <div className="fieldGroupLabel">Backup Estimate (optional)</div>
                <div className="srGrid srGrid3">
                  <Field label="Load Current (A)"><input inputMode="decimal" value={form.loadA} onChange={set('loadA')} placeholder="e.g. 80" /></Field>
                  <Field label="Operating Temp (°C)"><input inputMode="decimal" value={form.tempC} onChange={set('tempC')} placeholder="25 = reference" /></Field>
                  <Field label="Usable Depth of Discharge (%)"><input inputMode="decimal" value={form.dodPct} onChange={set('dodPct')} placeholder={`${chem.dod} (default)`} /></Field>
                </div>
              </section>

              <section className="formSection">
                <div className="fieldGroupLabel">Details (optional)</div>
                <div className="srGrid srGrid3">
                  <Field label="Report No."><input value={form.reportNo} onChange={set('reportNo')} placeholder="e.g. CT-2026-031" /></Field>
                  <Field label="Test Date"><input type="date" value={form.testDate} onChange={set('testDate')} /></Field>
                  <Field label="Battery Age (Years)"><input inputMode="decimal" value={form.ageYears} onChange={set('ageYears')} /></Field>
                  <Field label="Battery Model"><input value={form.model} onChange={set('model')} /></Field>
                  <Field label="Serial Number"><input value={form.serial} onChange={set('serial')} /></Field>
                  <Field label="Customer Name"><input value={form.customer} onChange={set('customer')} /></Field>
                  <Field label="Site / Location" wide><input value={form.site} onChange={set('site')} /></Field>
                </div>
              </section>
            </div>
          </section>

          {/* ── Dashboard ── */}
          <section className="panel srOrder3 cpDash">
            <h2 className="panelTitle">Battery Performance Dashboard</h2>
            {!a.ready ? (
              <div className="emptyState">
                <div className="emptyTitle">Waiting for test data</div>
                <div className="emptySub">Enter Rated Capacity and Actual Test Output (or test duration) to see the analysis.</div>
              </div>
            ) : (
              <>
                <div className="cpOverview">
                  <div className="cpGaugeBox"><SvgImage className="cpGauge" alt="Performance gauge" svg={gaugeSvg({ pct: a.pct, color, statusLabel: a.status.label, thresholds })} /></div>
                  <div className="cpBarsBox">
                    <div className="cpBoxTitle">Rated vs Actual Capacity</div>
                    <SvgImage className="cpBars" alt="Capacity comparison" svg={barsSvg({ rated: a.rated, actual: a.actual, loss: a.lossAh, color })} />
                  </div>
                </div>
                <div className="rpKpis cpKpis">
                  <div className="rpKpi kSlate"><span>Rated</span><strong>{a.rated.toFixed(0)}<small> Ah</small></strong></div>
                  <div className="rpKpi" style={{ background: `linear-gradient(135deg, ${color}, #0b1f3a)` }}><span>Actual</span><strong>{a.actual.toFixed(1)}<small> Ah</small></strong></div>
                  <div className="rpKpi kRed"><span>Loss</span><strong>{a.lossAh.toFixed(1)}<small> Ah</small></strong></div>
                  <div className="rpKpi kIndigo"><span>Loss</span><strong>{a.lossPct.toFixed(1)}<small> %</small></strong></div>
                  <div className="rpKpi kBlue"><span>Performance</span><strong>{a.pct.toFixed(1)}<small> %</small></strong></div>
                </div>
                <div className="cpBackup cpBackupUi">
                  <div className="cpBackupCard">
                    <span>Measured Test Duration</span>
                    <strong>{a.measuredDuration ? fmtHours(a.measuredDuration) : 'Not entered'}</strong>
                    <em>{form.rate} capacity test</em>
                  </div>
                  {a.backup ? (
                    <>
                      <div className="cpBackupCard cpMain">
                        <span>Estimated Backup @ {a.load} A</span>
                        <strong>{fmtHours(a.backup.formulaH)}</strong>
                        <em>Actual Ah ÷ load current</em>
                      </div>
                      <div className="cpBackupCard cpPractical">
                        <span>Practical Estimate</span>
                        <strong>{fmtHours(a.backup.practicalH)}</strong>
                        <em>{a.backup.dod}% DoD{a.backup.rateFactor < 0.999 ? ` · rate ×${a.backup.rateFactor.toFixed(2)}` : ''}{a.temp != null ? ` · temp ×${a.backup.tempFactor.toFixed(2)}` : ''}</em>
                      </div>
                    </>
                  ) : (
                    <div className="cpBackupCard cpMuted"><span>Estimated Backup</span><strong>—</strong><em>Load current required to estimate backup duration.</em></div>
                  )}
                </div>
                {a.backup?.heavier && (
                  <div className="srCellHelp" style={{ marginTop: 8 }}>
                    Load ({a.load} A) is heavier than the {form.rate} test current ({a.testCurrent.toFixed(1)} A), so the practical estimate includes the {chem.label} discharge-rate effect.
                  </div>
                )}
              </>
            )}

            <div className="cpThresh">
              <div className="cpThreshHead">
                <span>Health thresholds</span>
                {thDraft
                  ? <div className="cpThreshBtns"><button type="button" className="secondary" onClick={() => setThDraft(null)}>Cancel</button><button type="button" className="primaryBtn" onClick={saveThresholds}>Save</button></div>
                  : <button type="button" className="secondary" onClick={() => setThDraft({ ...thresholds })}>Customize</button>}
              </div>
              <div className="cpThreshRow">
                {[['excellent', 'Excellent', '#16a34a'], ['good', 'Good', '#22c55e'], ['reduced', 'Reduced', '#f59e0b'], ['poor', 'Poor', '#ea580c']].map(([k, label, c]) => (
                  <div key={k} className="cpThreshItem" style={{ borderColor: c }}>
                    <b style={{ color: c }}>{label}</b>
                    {thDraft
                      ? <span>≥ <input inputMode="numeric" value={thDraft[k]} onChange={(e) => setThDraft(d => ({ ...d, [k]: e.target.value.replace(/[^\d.]/g, '') }))} aria-label={`${label} threshold`} /> %</span>
                      : <span>≥ {thresholds[k]}%</span>}
                  </div>
                ))}
                <div className="cpThreshItem" style={{ borderColor: '#dc2626' }}><b style={{ color: '#dc2626' }}>Critical</b><span>&lt; {thDraft ? thDraft.poor : thresholds.poor}%</span></div>
              </div>
            </div>
          </section>

          {/* ── Condition ── */}
          <section className="panel srOrder4">
            <h2 className="panelTitle">Battery Condition Assessment</h2>
            <div className="formSection cpCond">
              {Object.entries(CONDITION_FIELDS).map(([k, f]) => (
                <div key={k} className="cpCondRow">
                  <div className="cpCondLabel">{f.label}</div>
                  <Seg name={`cp-${k}`} value={cond[k]} options={f.options} onChange={setC(k)} />
                  {k === 'cells' && cond.cells !== 'ok' && (
                    <Field label="Number of affected cells (optional)"><input inputMode="numeric" value={cond.deadCells} onChange={(e) => setCond(c => ({ ...c, deadCells: e.target.value.replace(/\D/g, '') }))} /></Field>
                  )}
                </div>
              ))}
              {a.age != null && (
                <div className={`cpAge${a.endOfLife ? ' warn' : ''}`}>
                  Age {a.age} yr vs typical {chem.label} service life ≈ {a.life} yr{a.endOfLife ? ' — end of service life reached' : ''}
                </div>
              )}
              <Field label="Technical Observations">
                <textarea rows={3} value={form.observations} onChange={set('observations')} placeholder="e.g. Cells 4 and 7 low SG; terminals corroded; charger output normal" />
              </Field>
            </div>
          </section>

          {/* ── Recommendation ── */}
          <section className="panel srOrder5">
            <h2 className="panelTitle">Battery Service / Repair / Replacement Recommendation</h2>
            {hint && (
              <div className="cpHint" style={{ borderColor: REC_OPTIONS[hint.option].color }}>
                <div>
                  <div className="cpHintTitle">💡 Suggested: <b style={{ color: REC_OPTIONS[hint.option].color }}>{REC_OPTIONS[hint.option].label}</b></div>
                  {hint.reasons.map(r => <div key={r} className="cpHintText">{r}</div>)}
                  <div className="cpHintText cpHintMuted">Suggestion only — the final decision stays with the service engineer.</div>
                </div>
                <button type="button" className="secondary" onClick={applySuggestion}>Apply suggestion</button>
              </div>
            )}

            <div className="cpRecOptions">
              {Object.entries(REC_OPTIONS).map(([k, o], i) => (
                <button key={k} type="button" className={`cpRecOpt${rec.option === k ? ' on' : ''}`} style={{ '--rc': o.color }} onClick={() => chooseOption(k)}>
                  <span className="cpRecNo">Option {i + 1}</span>
                  <strong>{o.label}</strong>
                </button>
              ))}
            </div>

            {opt && (
              <div className="formSection cpRecBody">
                <div className="fieldGroupLabel">{rec.option === 'replace' ? 'Reasons' : 'Required work'}</div>
                <div className="cpChecks">
                  {opt.items.map(([id, label]) => (
                    <label key={id} className={`cpCheck${rec.items[id] ? ' on' : ''}`} style={{ '--rc': opt.color }}>
                      <input type="checkbox" checked={!!rec.items[id]} onChange={(e) => setRec(r => ({ ...r, items: { ...r.items, [id]: e.target.checked } }))} />
                      <span>{label}</span>
                    </label>
                  ))}
                </div>
                <Field label="Other (custom description)"><input value={rec.other} onChange={(e) => setRec(r => ({ ...r, other: e.target.value }))} /></Field>
                <Field label="Additional technical remarks"><textarea rows={2} value={rec.remarks} onChange={(e) => setRec(r => ({ ...r, remarks: e.target.value }))} /></Field>
                <Field label="Final engineering recommendation (editable)">
                  <textarea className="cpStatement" rows={2} style={{ borderColor: opt.color, color: opt.color }} value={rec.statement} onChange={(e) => setRec(r => ({ ...r, statement: e.target.value, statementEdited: true }))} />
                </Field>
                {rec.statementEdited && (
                  <button type="button" className="srLinkBtn" onClick={() => setRec(r => ({ ...r, statement: opt.statement, statementEdited: false }))}>Reset to default wording</button>
                )}
              </div>
            )}
          </section>

          <SignOffPanel
            className="srOrder6"
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
          <section className="panel srOrder6">
            <h2 className="panelTitle">Designation</h2>
            <Field label={`Designation (default: ${autoDesignation})`}>
              <input value={designation} onChange={(e) => setDesignation(e.target.value)} placeholder={autoDesignation} />
            </Field>
          </section>

          <PreviewSection
            className="srOrder6"
            title="Report Preview"
            reportRef={reportRef}
            downloadBtn={downloadBtn}
            document={(
              <CapacityDocument
                form={form}
                a={a}
                thresholds={thresholds}
                cond={cond}
                rec={rec}
                sign={{ role, techName: role === 'engineer' ? ENGINEER_NAME : techName, verified, verifiedAt, signature, designation: shownDesignation }}
              />
            )}
          />
        </div>

        {/* ── Sidebar ── */}
        <aside className="srSide">
          <section className="panel cpSide">
            <h2 className="panelTitle">Live Result</h2>
            <SvgImage className="cpSideGauge" alt="Performance gauge" svg={gaugeSvg({ pct: a.pct, color, statusLabel: a.status?.label, thresholds })} />
            <div className="srStatGrid">
              <div className="srStat"><span>Actual</span><strong>{a.actual != null ? `${a.actual.toFixed(1)} Ah` : '—'}</strong></div>
              <div className="srStat"><span>Loss</span><strong>{a.lossAh != null ? `${a.lossAh.toFixed(1)} Ah` : '—'}</strong></div>
              <div className="srStat"><span>Backup</span><strong>{a.backup ? fmtHours(a.backup.formulaH) : '—'}</strong></div>
              <div className="srStat"><span>Practical</span><strong>{a.backup ? fmtHours(a.backup.practicalH) : '—'}</strong></div>
            </div>
            {opt && <div className="cpSideRec" style={{ background: opt.color }}>{opt.short} recommended</div>}
          </section>
          <section className="panel srSideActions">{downloadBtn}</section>
        </aside>
      </main>

      {sharePdf && (
        <WhatsAppDialog
          file={sharePdf}
          shareText={`Battery Capacity Test Report${form.reportNo ? ` ${form.reportNo}` : ''}${form.customer ? ` — ${form.customer}` : ''}`}
          onClose={() => setSharePdf(null)}
        />
      )}

      {pwPrompt && (
        <PasswordDialog
          title={pwPrompt === 'engineer' ? `Engineer access — ${ENGINEER_NAME}` : `Verify as ${ENGINEER_NAME}`}
          message={pwPrompt === 'engineer' ? 'Enter the password to switch to Engineer mode.' : 'Enter the password to verify this report and add the signature.'}
          confirmLabel={pwPrompt === 'engineer' ? 'Unlock' : 'Verify'}
          onSuccess={onPasswordOk}
          onCancel={() => setPwPrompt(null)}
        />
      )}
    </>
  )
}
