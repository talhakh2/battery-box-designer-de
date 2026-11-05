import { PdfHeader } from '../components/PdfHeader'
import { fmtDate } from './readings'
import { ReportPhotos, ReportSignOff } from './shared'

function V({ children, className = '', ...rest }) {
  const empty = children === '' || children == null
  return <td className={`rpVal ${className}`} {...rest}>{empty ? ' ' : children}</td>
}

function L({ children, ...rest }) {
  return <td className="rpLabel" {...rest}>{children}</td>
}

export function ChargerDocument({ form, photos, role, techName, verified, verifiedAt, signatureSrc }) {
  const replace = form.recommendReplace === 'yes'
  return (
    <div className="rpDoc">
      <div data-pdf-block className="rpBlock">
        <PdfHeader title="Charger Service Report" subtitle="Annexure to the main service report" />
        <table className="rpTable rpInfo">
          <colgroup>
            <col style={{ width: '20%' }} /><col style={{ width: '30%' }} />
            <col style={{ width: '18%' }} /><col style={{ width: '32%' }} />
          </colgroup>
          <tbody>
            <tr><L>Service Report No. / W.O. No.</L><V className="rpStrong">{form.reportNo}</V><L>Date</L><V>{fmtDate(form.date)}</V></tr>
            <tr><L>Customer</L><V className="rpStrong" colSpan={3}>{form.customer}</V></tr>
          </tbody>
        </table>

        <div className="rpSectionBar" style={{ marginTop: 10 }}>Charger Details</div>
        <table className="rpTable rpInfo">
          <colgroup>
            <col style={{ width: '20%' }} /><col style={{ width: '30%' }} />
            <col style={{ width: '18%' }} /><col style={{ width: '32%' }} />
          </colgroup>
          <tbody>
            <tr><L>Charger Make</L><V className="rpStrong">{form.chargerMake}</V><L>Charger Type</L><V>{form.chargerType}</V></tr>
            <tr><L>Charger S.No.</L><V>{form.chargerSno}</V><L>Plug Type</L><V>{form.plugType}</V></tr>
          </tbody>
        </table>
      </div>

      <div data-pdf-block className="rpBlock">
        <div className="rpSectionBar">Fault &amp; Assessment</div>
        <table className="rpTable">
          <colgroup><col style={{ width: '24%' }} /><col style={{ width: '76%' }} /></colgroup>
          <tbody>
            <tr><L>Charger Fault (As Told by Customer)</L><V className="rpMulti rpTall">{form.fault}</V></tr>
            <tr><L>{role === 'engineer' ? "Engineer's" : "Technician's"} Assessment</L><V className="rpMulti rpTall">{form.assessment}</V></tr>
          </tbody>
        </table>

        <div className={`rpRecommend ${replace ? 'isYes' : 'isNo'}`}>
          <div className="rpRecommendHead">
            <span className="rpRecommendLabel">Recommended for Replacement</span>
            <span className="rpRecommendValue">{replace ? 'YES — Replacement Recommended' : 'NO — Replacement Not Required'}</span>
          </div>
          {form.replaceRemarks?.trim() && (
            <div className="rpRecommendRemarks"><strong>Remarks:</strong> {form.replaceRemarks}</div>
          )}
        </div>
      </div>

      <ReportPhotos photos={photos} heading="Attached Photos of Inspected Charger for reference" />
      <ReportSignOff role={role} techName={techName} verified={verified} verifiedAt={verifiedAt} signatureSrc={signatureSrc} />
    </div>
  )
}
