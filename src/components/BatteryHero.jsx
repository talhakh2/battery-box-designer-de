import { useEffect, useState } from 'react'

/**
 * Animated illustration: a traction battery being charged by a field-service charger.
 * Pure SVG + CSS animations (see theme.css); respects prefers-reduced-motion.
 */
export function BatteryHero({ compact = false }) {
  const [reduce] = useState(() => !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches)
  const [soc, setSoc] = useState(() => (reduce ? 100 : 20))

  useEffect(() => {
    if (reduce) return
    const id = setInterval(() => setSoc(s => (s >= 100 ? 20 : s + 2)), 90)
    return () => clearInterval(id)
  }, [reduce])

  const cells = [0, 1, 2, 3, 4, 5]
  const level = soc / 100
  const fillColor = soc < 40 ? 'url(#bhLow)' : soc < 75 ? 'url(#bhMid)' : 'url(#bhFull)'

  return (
    <svg className={`bh${compact ? ' bhCompact' : ''}`} viewBox="0 0 440 280" role="img" aria-label="Battery charging illustration">
      <defs>
        <linearGradient id="bhFull" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stopColor="#16a34a" /><stop offset="1" stopColor="#4ade80" /></linearGradient>
        <linearGradient id="bhMid" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stopColor="#ca8a04" /><stop offset="1" stopColor="#facc15" /></linearGradient>
        <linearGradient id="bhLow" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stopColor="#dc2626" /><stop offset="1" stopColor="#fb923c" /></linearGradient>
        <linearGradient id="bhTray" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#334155" /><stop offset="1" stopColor="#0f172a" /></linearGradient>
        <linearGradient id="bhCharger" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#f97316" /><stop offset="1" stopColor="#c2410c" /></linearGradient>
        <radialGradient id="bhGlow"><stop offset="0" stopColor="#38bdf8" stopOpacity="0.55" /><stop offset="1" stopColor="#38bdf8" stopOpacity="0" /></radialGradient>
      </defs>

      {/* glow + floor */}
      <circle className="bhGlowPulse" cx="160" cy="150" r="130" fill="url(#bhGlow)" />
      <ellipse cx="220" cy="252" rx="190" ry="12" fill="#000" opacity="0.25" />

      {/* charging cable with flowing current */}
      <path d="M 320 170 C 300 230, 250 236, 238 200" fill="none" stroke="#0f172a" strokeWidth="9" strokeLinecap="round" />
      <path className="bhCurrent" d="M 320 170 C 300 230, 250 236, 238 200" fill="none" stroke="#38bdf8" strokeWidth="3.5" strokeLinecap="round" strokeDasharray="4 14" />
      <rect x="226" y="186" width="26" height="18" rx="4" fill="#64748b" stroke="#0f172a" strokeWidth="2" />

      {/* battery tray */}
      <rect x="40" y="88" width="220" height="150" rx="12" fill="url(#bhTray)" stroke="#0b1220" strokeWidth="3" />
      <rect x="40" y="88" width="220" height="16" rx="8" fill="#475569" />
      {cells.map(i => {
        const x = 54 + i * 34
        const h = 104
        const fh = h * level
        return (
          <g key={i}>
            <rect x={x} y="112" width="28" height={h} rx="4" fill="#1e293b" stroke="#0b1220" strokeWidth="1.5" />
            <rect x={x + 2} y={112 + h - fh} width="24" height={fh} rx="3" fill={fillColor} />
            <rect x={x + 4} y="114" width="5" height={h - 6} rx="2" fill="#fff" opacity="0.08" />
            {/* terminals */}
            <rect x={x + 4} y="104" width="7" height="9" rx="1.5" fill="#ef4444" />
            <rect x={x + 17} y="104" width="7" height="9" rx="1.5" fill="#111827" />
          </g>
        )
      })}
      {/* inter-cell connectors */}
      {cells.slice(0, -1).map(i => (
        <rect key={`c${i}`} x={54 + i * 34 + 19} y="100" width="21" height="5" rx="2.5" fill="#f59e0b" />
      ))}

      {/* SOC badge */}
      <g transform="translate(108 52)">
        <rect width="104" height="30" rx="15" fill="#0b1f3a" stroke="#38bdf8" strokeWidth="2" />
        <text x="52" y="20" textAnchor="middle" fontSize="14" fontWeight="800" fill="#e0f2fe" fontFamily="Inter, Arial, sans-serif">⚡ {soc}%</text>
      </g>

      {/* charger */}
      <g className="bhFloat">
        <rect x="300" y="72" width="104" height="112" rx="12" fill="url(#bhCharger)" stroke="#7c2d12" strokeWidth="3" />
        <rect x="314" y="86" width="76" height="34" rx="6" fill="#0b1f3a" />
        <text x="352" y="109" textAnchor="middle" fontSize="15" fontWeight="800" fill="#4ade80" fontFamily="ui-monospace, Menlo, monospace">48.6V</text>
        <circle className="bhLed" cx="322" cy="138" r="5" fill="#22c55e" />
        <circle cx="338" cy="138" r="5" fill="#7c2d12" />
        <rect x="314" y="152" width="76" height="6" rx="3" fill="#7c2d12" opacity="0.6" />
        <rect x="314" y="163" width="52" height="6" rx="3" fill="#7c2d12" opacity="0.6" />
      </g>

      {/* lightning bolt */}
      <path className="bhBolt" d="M 278 40 L 262 74 L 276 74 L 266 104 L 294 64 L 280 64 L 290 40 Z" fill="#facc15" stroke="#a16207" strokeWidth="2" strokeLinejoin="round" />

      {/* open-end wrench (field service) */}
      <mask id="bhWrenchMask">
        <rect x="-30" y="-30" width="140" height="60" fill="#fff" />
        <rect x="-26" y="-5.5" width="16" height="11" fill="#000" />
      </mask>
      <g className="bhWrench">
        <g mask="url(#bhWrenchMask)" fill="#e2e8f0" stroke="#64748b" strokeWidth="2">
          <circle cx="-8" cy="0" r="13" />
          <rect x="-2" y="-5" width="70" height="10" rx="5" />
          <circle cx="70" cy="0" r="9" />
        </g>
        <circle cx="70" cy="0" r="4" fill="#64748b" />
      </g>
    </svg>
  )
}
