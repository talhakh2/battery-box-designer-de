// Helpers for battery cell readings (lead-acid traction cells).

export const MAX_CELLS = 60

export const ENGINEER_NAME = 'Engr. Abdullah Farooq'

// Thresholds used to flag a reading as abnormal in the editor.
export const LIMITS = {
  minVoltage: 1.80,      // below this a lead-acid cell is considered failed / deep discharged
  maxVoltDeviation: 0.10, // V away from the pack median
  minSg: 1.150,
  maxSgDeviation: 0.030,
}

export function emptyCell() {
  return { sg: '', v: '', dead: false }
}

export function makeCells() {
  return Array.from({ length: MAX_CELLS }, emptyCell)
}

export function num(value) {
  if (value === '' || value == null) return null
  const n = Number.parseFloat(String(value).replace(',', '.'))
  return Number.isFinite(n) ? n : null
}

function median(values) {
  if (!values.length) return null
  const s = [...values].sort((a, b) => a - b)
  const mid = Math.floor(s.length / 2)
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2
}

function minMax(entries) {
  if (!entries.length) return { min: null, max: null }
  let min = entries[0]
  let max = entries[0]
  for (const e of entries) {
    if (e.value < min.value) min = e
    if (e.value > max.value) max = e
  }
  return { min, max }
}

/**
 * Compute pack statistics for the first `count` cells.
 * Averages exclude cells marked dead so one failed cell doesn't skew the pack picture.
 */
export function computeStats(cells, count) {
  const active = cells.slice(0, count)
  const volts = []
  const sgs = []
  const healthyVolts = []
  const healthySgs = []
  const dead = []
  let sumV = 0

  active.forEach((c, i) => {
    const no = i + 1
    const v = num(c.v)
    const sg = num(c.sg)
    if (c.dead) dead.push(no)
    if (v != null) {
      volts.push({ no, value: v })
      sumV += v
      if (!c.dead) healthyVolts.push({ no, value: v })
    }
    if (sg != null) {
      sgs.push({ no, value: sg })
      if (!c.dead) healthySgs.push({ no, value: sg })
    }
  })

  const avg = (arr) => (arr.length ? arr.reduce((a, e) => a + e.value, 0) / arr.length : null)
  const vMM = minMax(healthyVolts)
  const sgMM = minMax(healthySgs)
  const avgSg = avg(healthySgs)

  return {
    count,
    enteredV: volts.length,
    enteredSg: sgs.length,
    avgV: avg(healthyVolts),
    avgSg,
    minV: vMM.min,
    maxV: vMM.max,
    minSg: sgMM.min,
    maxSg: sgMM.max,
    spreadV: vMM.min && vMM.max ? vMM.max.value - vMM.min.value : null,
    sumV: volts.length ? sumV : null,
    medianV: median(healthyVolts.map(e => e.value)),
    medianSg: median(healthySgs.map(e => e.value)),
    dead,
    // Rough state-of-charge estimate from average SG (1.120 ≈ 0 %, 1.280 ≈ 100 %).
    socFromSg: avgSg != null ? Math.max(0, Math.min(100, ((avgSg - 1.12) / (1.28 - 1.12)) * 100)) : null,
  }
}

/** Returns a short reason string if the reading looks abnormal, otherwise null. */
export function abnormalReason(cell, stats) {
  if (cell.dead) return null
  const v = num(cell.v)
  const sg = num(cell.sg)
  if (v != null) {
    if (v < LIMITS.minVoltage) return `Low voltage (< ${LIMITS.minVoltage.toFixed(2)} V)`
    if (stats.medianV != null && stats.enteredV >= 3 && Math.abs(v - stats.medianV) > LIMITS.maxVoltDeviation) {
      return `Voltage off pack median by ${(v - stats.medianV).toFixed(2)} V`
    }
  }
  if (sg != null) {
    if (sg < LIMITS.minSg) return `Low SG (< ${LIMITS.minSg.toFixed(3)})`
    if (stats.medianSg != null && stats.enteredSg >= 3 && Math.abs(sg - stats.medianSg) > LIMITS.maxSgDeviation) {
      return `SG off pack median by ${(sg - stats.medianSg).toFixed(3)}`
    }
  }
  return null
}

function randomStep(min, max, step) {
  const lo = Math.round(Math.min(min, max) / step)
  const hi = Math.round(Math.max(min, max) / step)
  const k = lo + Math.floor(Math.random() * (hi - lo + 1))
  return k * step
}

/**
 * Fill readings with random values inside the given ranges.
 * Dead cells are never touched.
 */
export function autoFill(cells, opts) {
  const { from, to, fillV, vMin, vMax, fillSg, sgMin, sgMax, onlyEmpty } = opts
  return cells.map((c, i) => {
    const no = i + 1
    if (no < from || no > to || c.dead) return c
    const next = { ...c }
    if (fillV && (!onlyEmpty || c.v === '')) next.v = randomStep(vMin, vMax, 0.01).toFixed(2)
    if (fillSg && (!onlyEmpty || c.sg === '')) next.sg = randomStep(sgMin, sgMax, 0.005).toFixed(3)
    return next
  })
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

/** yyyy-mm-dd → 05-Nov-2026 */
export function fmtDate(iso) {
  if (!iso) return ''
  const [y, m, d] = String(iso).split('-').map(Number)
  if (!y || !m || !d) return String(iso)
  return `${String(d).padStart(2, '0')}-${MONTHS[m - 1]}-${y}`
}

export function todayIso() {
  const d = new Date()
  const off = d.getTimezoneOffset()
  return new Date(d.getTime() - off * 60000).toISOString().slice(0, 10)
}
