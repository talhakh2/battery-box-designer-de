export function Disclaimer({ compact = false }) {
  return (
    <div className={`disclaimer${compact ? ' compact' : ''}`} role="note">
      <span className="disclaimerIcon" aria-hidden="true">⚠️</span>
      <span>
        <strong>Note:</strong> Reports generated from this tool are <strong>not authorized documents</strong>.
        Use them only for personal convenience.
      </span>
    </div>
  )
}
