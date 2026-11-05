import { PdfHeader } from '../components/PdfHeader'
import { ENGINEER_NAME, fmtDate, num } from './readings'

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

function chunk(arr, size) {
  const out = []
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size))
  return out
}

export function ReportDocument({
  form, cells, cellCount, stats, photos,
  role, techName, verified, verifiedAt, signatureSrc,
}) {
  const n = cellCount
  const rowsPerGroup = Math.max(1, Math.ceil(n / 4))
  const groups = [0, 1, 2, 3]
  const inspector = role === 'engineer' ? ENGINEER_NAME : (techName || '').trim()
  const inspectorRole = role === 'engineer' ? 'Engineer' : 'Technician'
  const photoRows = chunk(photos, 2)

  return (
    <div className="rpDoc">
      {/* ── Block 1: header + details ── */}
      <div data-pdf-block className="rpBlock">
        <PdfHeader title="Battery Service Report" subtitle="Annexure to the main service report" />
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

        <table className="rpTable rpSummary">
          <tbody>
            <tr>
              <L>Average Voltage</L><V className="rpNum">{stats.avgV != null ? `${stats.avgV.toFixed(3)} V` : ''}</V>
              <L>Min / Max Voltage</L>
              <V className="rpNum">
                {stats.minV ? `${stats.minV.value.toFixed(2)} V (C${stats.minV.no}) / ${stats.maxV.value.toFixed(2)} V (C${stats.maxV.no})` : ''}
              </V>
            </tr>
            <tr>
              <L>Average SG</L><V className="rpNum">{stats.avgSg != null ? stats.avgSg.toFixed(3) : ''}</V>
              <L>Total of Cell Voltages</L><V className="rpNum">{stats.sumV != null ? `${stats.sumV.toFixed(2)} V` : ''}</V>
            </tr>
            <tr>
              <L>Dead Cells</L>
              <V colSpan={3} className={stats.dead.length ? 'rpDeadText' : ''}>
                {stats.dead.length ? `${stats.dead.length} — C.No. ${stats.dead.join(', ')}` : 'None'}
              </V>
            </tr>
          </tbody>
        </table>
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

      {/* ── Photos ── */}
      {photoRows.map((row, ri) => (
        <div data-pdf-block data-pdf-photo className="rpBlock" key={row[0].id}>
          {ri === 0 && <div className="rpSectionBar">Attached Photos of Inspected Battery for reference</div>}
          <div className="rpPhotoRow">
            {row.map((p, pi) => (
              <figure className="rpPhoto" key={p.id}>
                <div className="rpPhotoFrame">
                  <img src={p.dataUrl} alt={p.caption || `Photo ${ri * 2 + pi + 1}`} />
                </div>
                <figcaption>
                  <strong>Photo {ri * 2 + pi + 1}</strong>{p.caption ? ` — ${p.caption}` : ''}
                </figcaption>
              </figure>
            ))}
            {row.length === 1 && <div className="rpPhoto rpPhotoEmpty" />}
          </div>
        </div>
      ))}

      {/* ── Sign-off ── */}
      <div data-pdf-block className="rpBlock">
        <div className="rpSign">
          <div className="rpSignBox">
            <div className="rpSignLabel">{inspectorRole}&apos;s Name &amp; Signature</div>
            <div className="rpSignName">{inspector || ' '}</div>
            <div className="rpSignRole">{inspector ? inspectorRole : ''}</div>
            <div className="rpSignLine" />
            <div className="rpSignHint">Signature</div>
          </div>
          <div className={`rpSignBox rpVerifyBox${verified ? ' isVerified' : ''}`}>
            <div className="rpSignLabel">Verified By</div>
            {verified ? (
              <>
                <div className="rpVerifiedBadge">✓ Verified</div>
                {signatureSrc && <img className="rpSignature" src={signatureSrc} alt="Signature of Engr. Abdullah Farooq" />}
                <div className="rpSignLine" />
                <div className="rpSignName">{ENGINEER_NAME}</div>
                <div className="rpSignRole">Verified on {verifiedAt}</div>
              </>
            ) : (
              <>
                <div className="rpSignName rpPending">{ENGINEER_NAME}</div>
                <div className="rpSignRole">Pending verification</div>
              </>
            )}
          </div>
        </div>

        <div className="pdfFooterNote">
          <div className="pdfFooterRow">
            <div className="pdfFooterLeft">
              <span className="pdfFooterBadge">Direct Energy Company</span>
              <span className="pdfFooterAddress">7284 Masamh Street, Al Mashael, Riyadh 14326, Saudi Arabia</span>
            </div>
            <div className="pdfFooterRight">
              <a className="pdfFooterUrl" href="https://directenergy.dahbashi.com">directenergy.dahbashi.com</a>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
