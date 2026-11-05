// SVG chart builders. They return SVG strings that are shown through <img>,
// which renders identically on screen and in the html2canvas PDF export.

const F = 'Arial, Helvetica, sans-serif'

function polar(cx, cy, r, deg) {
  const a = ((deg - 90) * Math.PI) / 180
  return [cx + r * Math.cos(a), cy + r * Math.sin(a)]
}

function arc(cx, cy, r, from, to) {
  const [x1, y1] = polar(cx, cy, r, from)
  const [x2, y2] = polar(cx, cy, r, to)
  const large = to - from > 180 ? 1 : 0
  return `M ${x1.toFixed(2)} ${y1.toFixed(2)} A ${r} ${r} 0 ${large} 1 ${x2.toFixed(2)} ${y2.toFixed(2)}`
}

function esc(s) {
  return String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]))
}

/** 270° performance gauge with threshold bands. */
export function gaugeSvg({ pct, color, statusLabel, thresholds }) {
  const W = 340, H = 286, cx = 170, cy = 160, r = 104
  const start = -135, sweep = 270
  const at = p => start + (Math.max(0, Math.min(100, p)) / 100) * sweep
  const t = thresholds
  const bands = [
    [0, t.poor, '#dc2626'], [t.poor, t.reduced, '#ea580c'], [t.reduced, t.good, '#f59e0b'],
    [t.good, t.excellent, '#22c55e'], [t.excellent, 100, '#16a34a'],
  ]
  const v = pct == null ? 0 : pct
  const valueArc = pct == null ? '' : `<path d="${arc(cx, cy, r, start, Math.max(start + 0.5, at(v)))}" stroke="${color}" stroke-width="22" fill="none" stroke-linecap="round"/>`
  const ticks = [0, t.poor, t.reduced, t.good, t.excellent, 100].map(p => {
    const [x1, y1] = polar(cx, cy, r + 22, at(p))
    const [x2, y2] = polar(cx, cy, r + 30, at(p))
    const [tx, ty] = polar(cx, cy, r + 40, at(p))
    return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#94a3b8" stroke-width="1.5"/>
      <text x="${tx}" y="${ty + 3}" font-family="${F}" font-size="9" fill="#64748b" text-anchor="middle">${p}</text>`
  }).join('')
  const [nx, ny] = polar(cx, cy, r - 30, at(v))
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <path d="${arc(cx, cy, r, start, start + sweep)}" stroke="#e2e8f0" stroke-width="22" fill="none" stroke-linecap="round"/>
  ${bands.map(([a, b, c]) => `<path d="${arc(cx, cy, r + 16, at(a) + 0.6, at(b) - 0.6)}" stroke="${c}" stroke-width="5" fill="none"/>`).join('')}
  ${valueArc}
  ${ticks}
  ${pct == null ? '' : `<circle cx="${nx}" cy="${ny}" r="6" fill="#fff" stroke="${color}" stroke-width="3"/>`}
  <text x="${cx}" y="${cy + 4}" font-family="${F}" font-size="46" font-weight="900" fill="#0b1f3a" text-anchor="middle">${pct == null ? '—' : `${pct.toFixed(1)}`}<tspan font-size="22" dx="2">%</tspan></text>
  <text x="${cx}" y="${cy + 28}" font-family="${F}" font-size="11" font-weight="700" fill="#64748b" text-anchor="middle" letter-spacing="1.5">CAPACITY PERFORMANCE</text>
  <rect x="${cx - 74}" y="${cy + 46}" width="148" height="30" rx="15" fill="${pct == null ? '#cbd5e1' : color}"/>
  <text x="${cx}" y="${cy + 66}" font-family="${F}" font-size="14" font-weight="900" fill="#fff" text-anchor="middle">${esc(statusLabel || 'Enter test data')}</text>
</svg>`
}

/** Horizontal bars: rated vs actual vs loss (Ah). */
export function barsSvg({ rated, actual, loss, color }) {
  const W = 460, H = 196, left = 118, right = 84, barH = 30, gap = 22, top = 30
  const max = Math.max(rated || 0, actual || 0, 1)
  const w = v => Math.max(2, ((W - left - right) * (v || 0)) / max)
  const rows = [
    ['Rated Capacity', rated, '#0b1f3a'],
    ['Actual Tested', actual, color],
    ['Capacity Loss', loss, '#dc2626'],
  ]
  const grid = [0, 0.25, 0.5, 0.75, 1].map(f => {
    const x = left + (W - left - right) * f
    return `<line x1="${x}" y1="${top - 8}" x2="${x}" y2="${top + 3 * (barH + gap) - gap + 6}" stroke="#e2e8f0" stroke-width="1"/>
      <text x="${x}" y="${top - 12}" font-family="${F}" font-size="9" fill="#94a3b8" text-anchor="middle">${Math.round(max * f)}</text>`
  }).join('')
  const bars = rows.map(([label, v, c], i) => {
    const y = top + i * (barH + gap)
    return `<text x="${left - 10}" y="${y + barH / 2 + 4}" font-family="${F}" font-size="12" font-weight="700" fill="#334155" text-anchor="end">${label}</text>
      <rect x="${left}" y="${y}" width="${W - left - right}" height="${barH}" rx="6" fill="#f1f5f9"/>
      <rect x="${left}" y="${y}" width="${w(v)}" height="${barH}" rx="6" fill="${c}"/>
      <text x="${left + w(v) + 8}" y="${y + barH / 2 + 5}" font-family="${F}" font-size="14" font-weight="900" fill="#0b1f3a">${v == null ? '—' : `${(+v).toFixed(v % 1 ? 1 : 0)} Ah`}</text>`
  }).join('')
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">${grid}${bars}
  <text x="${left}" y="${H - 6}" font-family="${F}" font-size="9" fill="#94a3b8">Ampere-hours (Ah)</text></svg>`
}

export function svgUrl(svg) {
  return `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svg)))}`
}
