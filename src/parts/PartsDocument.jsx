import { ReportHeader } from '../service/ReportHeader'
import { fmtDate } from '../service/readings'
import { ReportPhotos } from '../service/shared'

function V({ children, className = '', ...rest }) {
  const empty = children === '' || children == null
  return <td className={`rpVal ${className}`} {...rest}>{empty ? ' ' : children}</td>
}

function L({ children, ...rest }) {
  return <td className="rpLabel" {...rest}>{children}</td>
}

const COLS = (
  <colgroup>
    <col style={{ width: '8%' }} /><col style={{ width: '24%' }} /><col style={{ width: '34%' }} />
    <col style={{ width: '22%' }} /><col style={{ width: '12%' }} />
  </colgroup>
)

/**
 * groups: [{ id, label, items: [{ desc, partNo, qty, group }] }] — only selected parts.
 */
export function PartsDocument({ form, groups, totalLines, totalQty, photos }) {
  // running serial number across categories
  const starts = []
  groups.reduce((n, g) => { starts.push(n); return n + g.items.length }, 0)
  return (
    <div className="rpDoc">
      <div data-pdf-block className="rpBlock">
        <ReportHeader
          title="Parts Issue Form"
          subtitle="Document Ref ##"
          meta={[{ label: 'DE-PIF-REF', value: form.docRef }, { label: 'W.O. Date', value: fmtDate(form.woDate) }]}
          status={{ label: `${totalLines} item${totalLines === 1 ? '' : 's'} · Qty ${totalQty}`, tone: 'warn' }}
        />
        <table className="rpTable rpInfo">
          <colgroup>
            <col style={{ width: '22%' }} /><col style={{ width: '33%' }} />
            <col style={{ width: '15%' }} /><col style={{ width: '30%' }} />
          </colgroup>
          <tbody>
            <tr>
              <L>Work Order No. &amp; Date</L>
              <V className="rpStrong">{[form.woNo, fmtDate(form.woDate)].filter(Boolean).join('  ·  ')}</V>
              <L>Invoice No.</L><V>{form.invoiceNo}</V>
            </tr>
            <tr><L>Customer Name</L><V className="rpStrong">{form.customer}</V><L>D.O. No.</L><V>{form.doNo}</V></tr>
            <tr><L>Battery / Charger Type</L><V>{form.batteryType}</V><L>Prepared By</L><V className="rpStrong">{form.preparedBy}</V></tr>
            <tr><L>Serial Number</L><V>{form.serialNo}</V><L>Sign</L><V className="rpSignCell" /></tr>
          </tbody>
        </table>
      </div>

      <div data-pdf-block className="rpBlock">
        <div className="rpSectionBar">Parts Issued</div>
        <table className="rpTable rpParts">
          {COLS}
          <thead>
            <tr><th>S.No.</th><th>Category</th><th>Description</th><th>Part No.</th><th>Qty</th></tr>
          </thead>
          {groups.length === 0 && (
            <tbody><tr><td colSpan={5} className="rpEmptyRow">No parts selected</td></tr></tbody>
          )}
        </table>
      </div>

      {groups.map((g, gi) => (
        <div data-pdf-block className="rpBlock rpPartsBlock" key={g.id}>
          <table className="rpTable rpParts">
            {COLS}
            <tbody>
              <tr className="rpCatRow"><td colSpan={5}>{g.label}</td></tr>
              {g.items.map((it, ii) => {
                return (
                  <tr key={it.key}>
                    <td className="rpC">{starts[gi] + ii + 1}</td>
                    <td className="rpMuted">{it.group || g.short}</td>
                    <td className="rpStrong">{it.desc}</td>
                    <td className="rpMono">{it.partNo || '—'}</td>
                    <td className="rpC rpQty">{it.qty}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      ))}

      {groups.length > 0 && (
        <div data-pdf-block className="rpBlock">
          <table className="rpTable rpParts rpTotals">
            {COLS}
            <tbody>
              <tr>
                <td colSpan={3} className="rpLabel">Total — {totalLines} line item{totalLines === 1 ? '' : 's'}</td>
                <td className="rpLabel" style={{ textAlign: 'right' }}>Total Qty</td>
                <td className="rpC rpQty">{totalQty}</td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      <ReportPhotos photos={photos} heading="Attached Photo of Battery for reference" />

      <div data-pdf-block className="rpBlock">
        <div className="rpSectionBar">Final Review &amp; Delivery</div>
        <table className="rpTable rpInfo">
          <colgroup>
            <col style={{ width: '24%' }} /><col style={{ width: '30%' }} />
            <col style={{ width: '12%' }} /><col style={{ width: '34%' }} />
          </colgroup>
          <tbody>
            <tr><L>Name (Inventory Incharge)</L><V className="rpStrong">{form.inventoryIncharge}</V><L>Sign</L><V className="rpSignCell" /></tr>
            <tr><L>Delivery Date</L><V className="rpStrong" colSpan={3}>{fmtDate(form.deliveryDate)}</V></tr>
            <tr><L>Delivered By (Driver)</L><V className="rpStrong">{form.driverName}</V><L>Sign</L><V className="rpSignCell" /></tr>
            <tr><L>Received By (Customer)</L><V>{form.receivedBy}</V><L>Sign</L><V className="rpSignCell" /></tr>
          </tbody>
        </table>

        <div className="pdfFooterNote" style={{ marginTop: 12 }}>
          <div className="pdfFooterRow">
            <div className="pdfFooterLeft">
              <span className="pdfFooterBadge">Abdullah Farooq</span>
              <span className="pdfFooterAddress">Battery &amp; Charger Field Service</span>
            </div>
            <div className="pdfFooterRight">
              <span className="pdfFooterUrl">For personal convenience only — not an authorized document</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

