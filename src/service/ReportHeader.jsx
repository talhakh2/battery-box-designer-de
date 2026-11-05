import { useLogoDataUrl } from '../components/useLogoDataUrl'

/**
 * PDF header used by the service reports and parts issue form.
 * meta: [{ label, value }] shown on the right; status: { label, tone: 'ok' | 'muted' | 'warn' }
 */
export function ReportHeader({ title, subtitle, meta = [], status }) {
  const logo = useLogoDataUrl()
  return (
    <div className="rhWrap">
      <div className="rhBand">
        <div className="rhLogo"><img src={logo} alt="Abdullah Farooq — Battery Field Service" crossOrigin="anonymous" /></div>
        <div className="rhTitles">
          <div className="rhKicker">Abdullah Farooq · Battery Field Service</div>
          <div className="rhTitle">{title}</div>
          {subtitle && <div className="rhSub">{subtitle}</div>}
        </div>
        <div className="rhMeta">
          {meta.map(m => (
            <div className="rhMetaItem" key={m.label}>
              <span>{m.label}</span>
              <strong>{m.value || '—'}</strong>
            </div>
          ))}
          {status && <div className={`rhStatus rh-${status.tone}`}>{status.label}</div>}
        </div>
      </div>
      <div className="rhAccent" />
    </div>
  )
}
