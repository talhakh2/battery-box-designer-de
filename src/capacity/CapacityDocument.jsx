import { ReportHeader } from '../service/ReportHeader'
import { fmtDate } from '../service/readings'
import { ReportSignOff } from '../service/shared'
import { CHEMISTRY, CONDITION_FIELDS, REC_OPTIONS, fmtHours, optionLabel } from './calc'
import { barsSvg, gaugeSvg } from './charts'
import { SvgImage } from './SvgImage'

function V({ children, className = '', ...rest }) {
  const empty = children === '' || children == null
  return <td className={`rpVal ${className}`} {...rest}>{empty ? ' ' : children}</td>
}
function L({ children, ...rest }) {
  return <td className="rpLabel" {...rest}>{children}</td>
}

const ah = v => (v == null ? '—' : `${(+v).toFixed(Number.isInteger(+v) ? 0 : 1)} Ah`)

export function CapacityDocument({ form, a, thresholds, cond, rec, sign }) {
  const st = a.status
  const color = st?.color || '#94a3b8'
  const opt = rec.option ? REC_OPTIONS[rec.option] : null
  const chosen = opt ? opt.items.filter(([id]) => rec.items[id]) : []
  const header = (
    <ReportHeader
      title="Battery Capacity Test Report"
      subtitle="Capacity Analysis & Condition Assessment"
      meta={[{ label: 'Report No.', value: form.reportNo }, { label: 'Test Date', value: fmtDate(form.testDate) }]}
      status={st ? { label: st.label, tone: st.tone } : { label: 'No test data', tone: 'muted' }}
    />
  )

  return (
    <div className="rpDoc cpDoc">
      {/* ═════ Page 1 – Battery Performance Overview ═════ */}
      <div data-pdf-block className="rpBlock">
        {header}
        <div className="rpSectionBar">Battery Specifications</div>
        <table className="rpTable rpInfo">
          <colgroup><col style={{ width: '19%' }} /><col style={{ width: '31%' }} /><col style={{ width: '19%' }} /><col style={{ width: '31%' }} /></colgroup>
          <tbody>
            <tr><L>Battery Type</L><V className="rpStrong">{CHEMISTRY[form.type]?.label}{form.type === 'other' && form.typeOther ? ` — ${form.typeOther}` : ''}</V><L>Battery Voltage</L><V className="rpStrong">{form.voltage ? `${form.voltage} V` : ''}</V></tr>
            <tr><L>Rated Capacity</L><V className="rpStrong">{a.rated != null ? ah(a.rated) : ''}</V><L>Discharge Rate</L><V className="rpStrong">{form.rate}{a.testCurrent ? ` (≈ ${a.testCurrent.toFixed(1)} A test current)` : ''}</V></tr>
            <tr><L>Battery Model</L><V>{form.model}</V><L>Serial Number</L><V>{form.serial}</V></tr>
            <tr><L>Battery Age</L><V>{form.ageYears ? `${form.ageYears} years` : ''}</V><L>Test Date</L><V>{fmtDate(form.testDate)}</V></tr>
            <tr><L>Customer</L><V className="rpStrong">{form.customer}</V><L>Site / Location</L><V>{form.site}</V></tr>
          </tbody>
        </table>
      </div>

      <div data-pdf-block className="rpBlock">
        <div className="rpSectionBar">Battery Performance Overview</div>
        <div className="cpOverview">
          <div className="cpGaugeBox">
            <SvgImage className="cpGauge" alt="Capacity performance gauge" svg={gaugeSvg({ pct: a.pct, color, statusLabel: st?.label, thresholds })} />
          </div>
          <div className="cpBarsBox">
            <div className="cpBoxTitle">Rated vs Actual Capacity</div>
            <SvgImage className="cpBars" alt="Capacity comparison chart" svg={barsSvg({ rated: a.rated, actual: a.actual, loss: a.lossAh, color })} />
          </div>
        </div>
        <div className="rpKpis cpKpis">
          <div className="rpKpi kSlate"><span>Rated Capacity</span><strong>{a.rated != null ? a.rated.toFixed(0) : '—'}<small> Ah</small></strong></div>
          <div className="rpKpi" style={{ background: `linear-gradient(135deg, ${color}, #0b1f3a)` }}><span>Actual Tested</span><strong>{a.actual != null ? a.actual.toFixed(1) : '—'}<small> Ah</small></strong></div>
          <div className="rpKpi kRed"><span>Capacity Loss</span><strong>{a.lossAh != null ? a.lossAh.toFixed(1) : '—'}<small> Ah</small></strong></div>
          <div className="rpKpi kIndigo"><span>Loss</span><strong>{a.lossPct != null ? a.lossPct.toFixed(1) : '—'}<small> %</small></strong></div>
          <div className="rpKpi kBlue"><span>Performance</span><strong>{a.pct != null ? a.pct.toFixed(1) : '—'}<small> %</small></strong></div>
        </div>
        {st && (
          <div className="cpStatus" style={{ borderColor: color, background: `${color}14` }}>
            <span className="cpStatusDot" style={{ background: color }} />
            <div>
              <div className="cpStatusTitle" style={{ color }}>Battery Condition: {st.label}</div>
              <div className="cpStatusText">
                Tested capacity is {a.pct.toFixed(1)}% of rated ({ah(a.actual)} of {ah(a.rated)}).
                Classification: Excellent ≥ {thresholds.excellent}% · Good ≥ {thresholds.good}% · Reduced ≥ {thresholds.reduced}% · Poor ≥ {thresholds.poor}% · Critical below {thresholds.poor}%.
              </div>
            </div>
          </div>
        )}
      </div>

      <div data-pdf-block className="rpBlock">
        <div className="rpSectionBar">Test Duration &amp; Estimated Backup</div>
        <div className="cpBackup">
          <div className="cpBackupCard">
            <span>Measured Test Duration</span>
            <strong>{a.measuredDuration ? fmtHours(a.measuredDuration) : 'Not recorded'}</strong>
            <em>Actual discharge time during the {form.rate} capacity test{a.actualFromDuration ? ' (capacity calculated from this duration)' : ''}</em>
          </div>
          {a.backup ? (
            <>
              <div className="cpBackupCard cpMain">
                <span>Estimated Backup @ {a.load} A</span>
                <strong>{fmtHours(a.backup.formulaH)}</strong>
                <em>Actual tested capacity ÷ load current ({ah(a.actual)} ÷ {a.load} A)</em>
              </div>
              <div className="cpBackupCard cpPractical">
                <span>Practical Estimate</span>
                <strong>{fmtHours(a.backup.practicalH)}</strong>
                <em>Adjusted: {a.backup.dod}% usable depth of discharge{a.backup.rateFactor < 0.999 ? `, discharge-rate effect ×${a.backup.rateFactor.toFixed(2)}` : ''}{a.temp != null ? `, temperature ${a.temp} °C ×${a.backup.tempFactor.toFixed(2)}` : ''}</em>
              </div>
            </>
          ) : (
            <div className="cpBackupCard cpMuted">
              <span>Estimated Backup</span>
              <strong>—</strong>
              <em>Load current required to estimate backup duration.</em>
            </div>
          )}
        </div>
        <div className="cpNote">
          {form.rate} is the discharge rate used for the capacity test (≈ {a.rateHours} h at rated capacity). It is not the backup time of the battery in service; backup depends on the actual load current, battery chemistry and operating conditions.
        </div>
      </div>

      {/* ═════ Page 2 – Technical Assessment ═════ */}
      <div data-pdf-block data-pdf-newpage className="rpBlock">
        {header}
        <div className="rpSectionBar">Technical Assessment — Battery Condition</div>
        <table className="rpTable rpInfo">
          <colgroup><col style={{ width: '26%' }} /><col style={{ width: '74%' }} /></colgroup>
          <tbody>
            <tr><L>Capacity Test Result</L><V className="rpStrong" style={{ color }}>{a.pct != null ? `${a.pct.toFixed(1)}% — ${st.label}` : ''}</V></tr>
            {Object.keys(CONDITION_FIELDS).map(k => (
              <tr key={k}><L>{CONDITION_FIELDS[k].label}</L><V>{optionLabel(k, cond[k])}{k === 'cells' && cond.deadCells ? ` (${cond.deadCells} cell${cond.deadCells === '1' ? '' : 's'})` : ''}</V></tr>
            ))}
            <tr><L>Battery Age</L><V>{a.age != null ? `${a.age} years (typical service life ≈ ${a.life} years${a.endOfLife ? ' — reached' : ''})` : 'Not recorded'}</V></tr>
          </tbody>
        </table>
      </div>

      <div data-pdf-block className="rpBlock">
        <div className="rpSectionBar">Service / Repair / Replacement Recommendation</div>
        {opt ? (
          <div className="cpRec" style={{ borderColor: opt.color }}>
            <div className="cpRecHead" style={{ background: opt.color }}>{opt.label}</div>
            <ul className="cpRecList">
              {chosen.map(([id, label]) => <li key={id}><span style={{ color: opt.color }}>✔</span>{label}</li>)}
              {rec.other?.trim() && <li><span style={{ color: opt.color }}>✔</span>{rec.other.trim()}</li>}
              {!chosen.length && !rec.other?.trim() && <li className="cpMutedText">No activities selected</li>}
            </ul>
          </div>
        ) : (
          <div className="cpMutedText">No recommendation selected.</div>
        )}
      </div>

      <div data-pdf-block className="rpBlock">
        <table className="rpTable">
          <colgroup><col style={{ width: '26%' }} /><col style={{ width: '74%' }} /></colgroup>
          <tbody>
            <tr><L>Technical Observations</L><V className="rpMulti rpTall">{form.observations}</V></tr>
            <tr><L>Additional Remarks</L><V className="rpMulti">{rec.remarks}</V></tr>
          </tbody>
        </table>
      </div>

      <div data-pdf-block className="rpBlock">
        <div className="cpFinal" style={{ borderColor: opt?.color || '#0b1f3a' }}>
          <span>Final Engineering Recommendation</span>
          <strong style={{ color: opt?.color || '#0b1f3a' }}>{rec.statement || '—'}</strong>
        </div>
      </div>

      <ReportSignOff
        role={sign.role}
        techName={sign.techName}
        verified={sign.verified}
        verifiedAt={sign.verifiedAt}
        signatureSrc={sign.signature}
        designation={sign.designation}
        dateText={form.testDate ? `Test date ${fmtDate(form.testDate)}` : ''}
      />
    </div>
  )
}
