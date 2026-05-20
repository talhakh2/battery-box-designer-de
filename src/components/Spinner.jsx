export function Spinner({ size = 'md' }) {
  return (
    <div className={`spinner spinner-${size}`}>
      <div className="spinnerRing"></div>
      <div className="spinnerRing"></div>
      <div className="spinnerRing"></div>
    </div>
  )
}
