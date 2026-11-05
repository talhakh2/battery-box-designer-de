import { ReportHeader } from './ReportHeader'
import { fmtDate, num } from './readings'
import { ReportPhotos, ReportSignOff } from './shared'

function V({ children, className = '', ...rest }) {
  const empty = children === '' || children == null
  return <td className={`rpVal ${className}`} {...rest}>{empty ? ' ' : children}</td>
}

function L({ children, ...rest }) {
  return <td className="rpLabel" {...rest}>{children}</td>
}

function fmtV(v) {
  const n = num(v)
  return n == null ? '' : n.toFixed(2)
}

function fmtSg(v) {
  const n = num(v)
  return n == null ? '' : n.toFixed(3)
}

export function ReportDocument({
  form, cells, cellCount, stats, photos,
  role, techName, verified, verifiedAt, signatureSrc,
}) {
  const n = cellCount
  const rowsPerGroup = Math.max(1, Math.ceil(n / 4))
  const groups = [0, 1, 2, 3]

  return (
    <div className="rpDoc">
      {/* ── Block 1: header + details ── */}
      <div data-pdf-block className="rpBlock">
        <ReportHeader
          title="Battery Service Report"
          subtitle="Annexure to the main service report"
          meta={[{ label: 'Report No.', value: form.reportNo }, { label: 'Date', value: fmtDate(form.date) }]}
          status={verified ? { label: '✓ Verified', tone: 'ok' } : { label: 'Not verified', tone: 'muted' }}
        />
        <table className="rpTable rpInfo">
          <colgroup>
            <col style={{ width: '17%' }} /><col style={{ width: '17%' }} /><col style={{ width: '10%' }} />
            <col style={{ width: '17%' }} /><col style={{ width: '9%' }} /><col style={{ width: '30%' }} />
          </colgroup>
          <tbody>
            <tr><L>Service Report No. / W.O. No.</L><V className="rpStrong" colSpan={3}>{form.reportNo}</V><L>Date</L><V>{fmtDate(form.date)}</V></tr>
            <tr><L>Customer</L><V className="rpStrong" colSpan={3}>{form.customer}</V><L>Age</L><V>{form.age}</V></tr>
            <tr><L>Battery Type</L><V colSpan={3}>{form.batteryType}</V><L>S.No.</L><V>{form.batterySno}</V></tr>
            <tr><L>Equipment Make</L><V>{form.equipMake}</V><L>Model</L><V>{form.equipModel}</V><L>S.No.</L><V>{form.equipSno}</V></tr>
            <tr><L>Charger Make</L><V>{form.chargerMake}</V><L>Model</L><V>{form.chargerModel}</V><L>S.No.</L><V>{form.chargerSno}</V></tr>
            <tr><L>Nature of Complaint</L><V className="rpMulti" colSpan={5}>{form.complaint}</V></tr>
            <tr><L>{role === 'engineer' ? "Engineer's" : "Technician's"} Assessment</L><V className="rpMulti" colSpan={5}>{form.assessment}</V></tr>
            <tr><L>Cells / Components Replaced / Required</L><V className="rpMulti" colSpan={5}>{form.replaced}</V></tr>
          </tbody>
        </table>
      </div>

      {/* ── Block 2: battery state + cell readings ── */}
      <div data-pdf-block className="rpBlock">
        <div className="rpSectionBar">Battery State / Readings</div>
        <table className="rpTable rpState">
          <tbody>
            <tr>
              <L>Input Charge</L><V className="rpNum">{form.inputChargeAh}</V><td className="rpUnit">AH</td>
              <L>Temp</L><V className="rpNum">{form.tempC}</V><td className="rpUnit">°C</td>
            </tr>
            <tr>
              <L>Top-of-Charge</L><V className="rpNum">{form.tocVolts}</V><td className="rpUnit">Volts</td>
              <L>@</L><V className="rpNum">{form.tocAmps}</V><td className="rpUnit">Amps</td>
            </tr>
            <tr>
              <L>Open Circuit</L><V className="rpNum">{form.ocVolts}</V><td className="rpUnit">Volts</td>
              <L>No. of Cells</L><V className="rpNum">{n}</V><td className="rpUnit">Cells</td>
            </tr>
          </tbody>
        </table>

        <table className="rpTable rpCells">
          <thead>
            <tr>
              {groups.map(g => (
                <th key={g} colSpan={3} className={g ? 'rpGroupStart' : ''}>
                  <span className="rpCellHead"><span>C.No.</span><span>Specific Gravity</span><span>Voltage</span></span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: rowsPerGroup }, (_, r) => (
              <tr key={r}>
                {groups.map(g => {
                  const no = g * rowsPerGroup + r + 1
                  const inRange = no <= n
                  const c = inRange ? cells[no - 1] : null
                  const dead = c?.dead
                  const cls = `${g ? 'rpGroupStart ' : ''}${dead ? 'rpDead' : ''}${!inRange ? 'rpUnused' : ''}`
                  return [
                    <td key={`n${g}`} className={`rpCno ${cls}`}>{inRange ? no : ''}</td>,
                    <td key={`s${g}`} className={`rpCval ${dead ? 'rpDead' : ''}${!inRange ? 'rpUnused' : ''}`}>{c ? fmtSg(c.sg) : ''}</td>,
                    <td key={`v${g}`} className={`rpCval ${dead ? 'rpDead' : ''}${!inRange ? 'rpUnused' : ''}`}>{c ? fmtV(c.v) : ''}</td>,
                  ]
                })}
              </tr>
            ))}
          </tbody>
        </table>

        <div className="rpKpis">
          <div className="rpKpi kBlue"><span>Average Voltage</span><strong>{stats.avgV != null ? stats.avgV.toFixed(3) : '—'}<small> V</small></strong></div>
          <div className="rpKpi kTeal"><span>Average SG</span><strong>{stats.avgSg != null ? stats.avgSg.toFixed(3) : '—'}</strong></div>
          <div className="rpKpi kSlate">
            <span>Min / Max Voltage</span>
            <strong className="rpKpiSmall">
              {stats.minV ? <>{stats.minV.value.toFixed(2)} <em>C{stats.minV.no}</em> / {stats.maxV.value.toFixed(2)} <em>C{stats.maxV.no}</em></> : '—'}
            </strong>
          </div>
          <div className="rpKpi kIndigo"><span>Total of Cells</span><strong>{stats.sumV != null ? stats.sumV.toFixed(2) : '—'}<small> V</small></strong></div>
          <div className={`rpKpi ${stats.dead.length ? 'kRed' : 'kGreen'}`}>
            <span>Dead Cells</span>
            <strong>{stats.dead.length || 'None'}</strong>
            {stats.dead.length > 0 && <em className="rpKpiNote">C.No. {stats.dead.join(', ')}</em>}
          </div>
        </div>
        <div className="rpLegend">
          <span className="rpLegendSwatch" /> Cell marked dead by the inspector. Averages exclude dead cells.
        </div>
      </div>

      {/* ── Block 3: status ── */}
      <div data-pdf-block className="rpBlock">
        <table className="rpTable">
          <colgroup><col style={{ width: '42%' }} /><col style={{ width: '18%' }} /><col style={{ width: '22%' }} /><col style={{ width: '18%' }} /></colgroup>
          <tbody>
            <tr>
              <L>Status of Battery During Inspection (% Charged)</L>
              <V className="rpNum rpStrong">{form.statusPct !== '' ? `${form.statusPct} %` : ''}</V>
              <L>Last Topping-up Date</L>
              <V>{fmtDate(form.lastToppingDate)}</V>
            </tr>
          </tbody>
        </table>
      </div>

      <ReportPhotos photos={photos} heading="Attached Photos of Inspected Battery for reference" />
      <ReportSignOff role={role} techName={techName} verified={verified} verifiedAt={verifiedAt} signatureSrc={signatureSrc} />
    </div>
  )
}
