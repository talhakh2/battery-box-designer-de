import { useEffect, useMemo, useRef, useState } from 'react'
import { Spinner } from '../components/Spinner'
import { ChargerDocument } from '../service/ChargerDocument'
import { PasswordDialog } from '../service/PasswordDialog'
import { exportReportPdf } from '../service/pdfExport'
import { ENGINEER_NAME, todayIso } from '../service/readings'
import { Field, PhotosPanel, PreviewSection, SignOffPanel } from '../service/shared'
import { useSignOff } from '../service/useSignOff'

const DRAFT_KEY = 'de_charger_report_draft_v1'

const EMPTY_FORM = {
  reportNo: '', date: '', customer: '',
  chargerType: '', chargerSno: '', chargerMake: '', plugType: '',
  fault: '', assessment: '',
  recommendReplace: 'no', replaceRemarks: '',
}

function loadDraft() {
  try {
    const d = JSON.parse(localStorage.getItem(DRAFT_KEY) || 'null')
    return d ? { ...d, form: { ...EMPTY_FORM, ...d.form } } : null
  } catch {
    return null
  }
}

export function ChargerReport({ addToast }) {
  const draft = useMemo(loadDraft, [])
  const [form, setForm] = useState(() => draft?.form ?? { ...EMPTY_FORM, date: todayIso() })
  const [techName, setTechName] = useState(() => draft?.techName ?? '')
  const [photos, setPhotos] = useState([])
  const [isExporting, setIsExporting] = useState(false)

  const reportRef = useRef(null)
  const techNameRef = useRef(null)
  const so = useSignOff({ addToast, techNameRef })
  const { role, verified, verifiedAt, signature, pwPrompt, setPwPrompt, chooseRole, onPasswordOk, toggleVerify } = so
  const isEngineer = role === 'engineer'
  const replace = form.recommendReplace === 'yes'

  useEffect(() => {
    const t = setTimeout(() => {
      try { localStorage.setItem(DRAFT_KEY, JSON.stringify({ form, techName })) } catch { /* ignore */ }
    }, 400)
    return () => clearTimeout(t)
  }, [form, techName])

  const set = (key) => (e) => setForm(f => ({ ...f, [key]: e.target.value }))

  const onDownload = async () => {
    if (!isEngineer && !techName.trim()) {
      addToast("Enter the technician's name first", 'error', 3500)
      techNameRef.current?.focus()
      return
    }
    if (!reportRef.current) return
    const safe = (s) => String(s || '').trim().replaceAll(/[^\w-]+/g, '_')
    const filename = ['ChargerReport', safe(form.reportNo), safe(form.customer), form.date || todayIso()]
      .filter(Boolean).join('_').slice(0, 100) + '.pdf'
    setIsExporting(true)
    await new Promise(r => setTimeout(r, 60))
    try {
      await exportReportPdf(reportRef.current, filename, {
        footerLeft: `Charger Service Report${form.reportNo ? ` · ${form.reportNo}` : ''}${verified ? ' · Verified' : ''}`,
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
    if (!window.confirm('Start a new charger report? All fields and photos will be cleared.')) return
    setForm({ ...EMPTY_FORM, date: todayIso() })
    setPhotos([])
    so.resetVerify()
  }

  const downloadBtn = (
    <button type="button" className="primaryBtn" onClick={onDownload} disabled={isExporting}>
      {isExporting ? <><Spinner size="sm" /><span>Generating PDF…</span></> : 'Download PDF'}
    </button>
  )

  const checks = [
    { ok: !!form.customer.trim(), label: 'Customer' },
    { ok: !!(form.chargerMake.trim() && form.chargerSno.trim()), label: 'Charger make & S.No.' },
    { ok: !!form.fault.trim(), label: 'Fault told by customer' },
    { ok: !!form.assessment.trim(), label: 'Assessment' },
    { ok: isEngineer || !!techName.trim(), label: 'Inspected by' },
    { ok: verified, label: 'Verified' },
  ]

  return (
    <>
      <div className="tabToolbar">
        <div>
          <div className="tabToolbarTitle">Charger Service Report</div>
          <div className="tabToolbarSub">Charger details, customer complaint, assessment and replacement recommendation — export as PDF.</div>
        </div>
        <div className="topActions">
          <button type="button" className="secondary" onClick={newReport}>New Report</button>
          {downloadBtn}
        </div>
      </div>

      <main className="srLayout">
        <div className="srMain">
          <section className="panel srOrder1">
            <h2 className="panelTitle">Report Details</h2>
            <div className="form">
              <section className="formSection">
                <div className="fieldGroupLabel">Service</div>
                <div className="srGrid">
                  <Field label="Service Report No. / W.O. No."><input value={form.reportNo} onChange={set('reportNo')} placeholder="e.g. SR-2026-0143" /></Field>
                  <Field label="Date"><input type="date" value={form.date} onChange={set('date')} /></Field>
                  <Field label="Customer" wide><input value={form.customer} onChange={set('customer')} placeholder="Customer / site name" /></Field>
                </div>
              </section>

              <section className="formSection">
                <div className="fieldGroupLabel">Charger</div>
                <div className="srGrid">
                  <Field label="Charger Make (Brand)"><input value={form.chargerMake} onChange={set('chargerMake')} placeholder="e.g. Hoppecke, Fronius, Zivan" /></Field>
                  <Field label="Charger Type"><input value={form.chargerType} onChange={set('chargerType')} placeholder="e.g. 48V 120A HF" /></Field>
                  <Field label="Charger Serial No."><input value={form.chargerSno} onChange={set('chargerSno')} /></Field>
                  <Field label="Plug Type"><input value={form.plugType} onChange={set('plugType')} placeholder="e.g. SB175 Grey" /></Field>
                </div>
              </section>
            </div>
          </section>

          <section className="panel srOrder3">
            <h2 className="panelTitle">Fault &amp; Assessment</h2>
            <div className="form">
              <section className="formSection">
                <div className="srStack">
                  <Field label="Charger Fault (As Told by Customer)">
                    <textarea rows={3} value={form.fault} onChange={set('fault')} placeholder="What the customer reported, e.g. charger not starting, trips after 10 min" />
                  </Field>
                  <Field label={isEngineer ? "Engineer's Assessment" : "Technician's Assessment"}>
                    <textarea rows={4} value={form.assessment} onChange={set('assessment')} placeholder="What was found during inspection" />
                  </Field>
                </div>
              </section>

              <section className="formSection">
                <div className="fieldGroupLabel">Recommended for Replacement</div>
                <div className="segmentedGroup">
                  <label className={`segmentedOption${!replace ? ' selected' : ''}`}>
                    <input type="radio" checked={!replace} onChange={() => setForm(f => ({ ...f, recommendReplace: 'no' }))} />
                    <span className="segmentedLabel">No</span>
                    <span className="segmentedDesc">Not required</span>
                  </label>
                  <label className={`segmentedOption srReplaceYes${replace ? ' selected' : ''}`}>
                    <input type="radio" checked={replace} onChange={() => setForm(f => ({ ...f, recommendReplace: 'yes' }))} />
                    <span className="segmentedLabel">Yes</span>
                    <span className="segmentedDesc">Recommend replacement</span>
                  </label>
                </div>
                <Field label={replace ? 'Replacement remarks (reason / suggested model)' : 'Remarks (optional)'}>
                  <textarea rows={2} value={form.replaceRemarks} onChange={set('replaceRemarks')} placeholder={replace ? 'e.g. Main PCB burnt, spare not available — replace with 48V 120A HF charger' : ''} />
                </Field>
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

          <PreviewSection
            className="srOrder6"
            title="Report Preview"
            reportRef={reportRef}
            downloadBtn={downloadBtn}
            document={(
            <ChargerDocument
              form={form}
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

        <aside className="srSide">
          <section className="panel">
            <h2 className="panelTitle">Report Status</h2>
            <div className={`srRecBadge ${replace ? 'isYes' : 'isNo'}`}>
              <span>Replacement</span>
              <strong>{replace ? 'Recommended' : 'Not required'}</strong>
            </div>
            <ul className="srChecklist">
              {checks.map(c => (
                <li key={c.label} className={c.ok ? 'ok' : ''}><span>{c.ok ? '✓' : '○'}</span>{c.label}</li>
              ))}
              <li className={photos.length ? 'ok' : ''}><span>{photos.length ? '✓' : '○'}</span>Photos ({photos.length})</li>
            </ul>
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
            ? 'Enter the password to switch to Engineer mode.'
            : 'Enter the password to verify this report and add the signature.'}
          confirmLabel={pwPrompt === 'engineer' ? 'Unlock' : 'Verify'}
          onSuccess={onPasswordOk}
          onCancel={() => setPwPrompt(null)}
        />
      )}
    </>
  )
}
