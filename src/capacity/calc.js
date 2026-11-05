// Battery capacity analysis: calculations, classification and recommendation assistance.

export const CHEMISTRY = {
  leadacid: { label: 'Lead Acid (Flooded)', peukert: 1.25, tempCoef: 0.006, life: 5, dod: 80, liquid: true },
  tubular:  { label: 'Tubular',             peukert: 1.20, tempCoef: 0.006, life: 6, dod: 80, liquid: true },
  agm:      { label: 'AGM (VRLA)',          peukert: 1.12, tempCoef: 0.006, life: 4, dod: 80, liquid: false },
  gel:      { label: 'GEL (VRLA)',          peukert: 1.15, tempCoef: 0.006, life: 5, dod: 80, liquid: false },
  liion:    { label: 'Lithium-ion',         peukert: 1.05, tempCoef: 0.003, life: 8, dod: 90, liquid: false },
  nicd:     { label: 'Nickel Cadmium (Ni-Cd)', peukert: 1.10, tempCoef: 0.004, life: 15, dod: 80, liquid: true },
  other:    { label: 'Other',               peukert: 1.20, tempCoef: 0.005, life: 5, dod: 80, liquid: true },
}

export const RATES = { C5: 5, C10: 10, C20: 20 }

export const DEFAULT_THRESHOLDS = { excellent: 90, good: 80, reduced: 70, poor: 50 }

export const STATUS = {
  excellent: { label: 'Excellent', color: '#16a34a', tone: 'ok' },
  good:      { label: 'Good', color: '#22c55e', tone: 'ok' },
  reduced:   { label: 'Reduced Capacity', color: '#f59e0b', tone: 'warn' },
  poor:      { label: 'Poor', color: '#ea580c', tone: 'warn' },
  critical:  { label: 'Critical', color: '#dc2626', tone: 'bad' },
}

export function num(v) {
  if (v === '' || v == null) return null
  const n = Number.parseFloat(String(v).replace(',', '.'))
  return Number.isFinite(n) ? n : null
}

export function classify(pct, t = DEFAULT_THRESHOLDS) {
  if (pct == null) return null
  if (pct >= t.excellent) return 'excellent'
  if (pct >= t.good) return 'good'
  if (pct >= t.reduced) return 'reduced'
  if (pct >= t.poor) return 'poor'
  return 'critical'
}

export function validThresholds(t) {
  const v = [t.excellent, t.good, t.reduced, t.poor].map(Number)
  return v.every(Number.isFinite) && v[0] <= 100 && v[0] > v[1] && v[1] > v[2] && v[2] > v[3] && v[3] > 0
}

export function fmtHours(h) {
  if (h == null || !Number.isFinite(h) || h < 0) return '—'
  const total = Math.round(h * 60)
  const hh = Math.floor(total / 60)
  const mm = total % 60
  return `${hh} h ${String(mm).padStart(2, '0')} min`
}

/**
 * Core calculations.
 * Backup has two figures:
 *  - formula: Actual Ah ÷ Load A (100 % of the tested capacity)
 *  - practical: corrected for discharge rate (Peukert), temperature and usable depth of discharge.
 *    No credit is taken when the load is lighter than the test current (conservative).
 */
export function analyse(input, thresholds) {
  const chem = CHEMISTRY[input.type] || CHEMISTRY.other
  const rated = num(input.ratedAh)
  const rateHours = RATES[input.rate] || 5
  const testCurrent = rated ? rated / rateHours : null
  const durH = (num(input.durH) || 0) + (num(input.durM) || 0) / 60
  const measuredDuration = durH > 0 ? durH : null

  let actual = num(input.actualAh)
  let actualFromDuration = false
  if (actual == null && measuredDuration && testCurrent) {
    actual = testCurrent * measuredDuration
    actualFromDuration = true
  }

  const ready = rated != null && rated > 0 && actual != null && actual >= 0
  const pct = ready ? (actual / rated) * 100 : null
  const lossAh = ready ? Math.max(0, rated - actual) : null
  const lossPct = ready ? Math.max(0, 100 - pct) : null
  const statusKey = classify(pct, thresholds)

  const load = num(input.loadA)
  const temp = num(input.tempC)
  const dod = num(input.dodPct) ?? chem.dod
  let backup = null
  if (ready && load && load > 0) {
    const formulaH = actual / load
    const rateFactor = testCurrent ? Math.min(1, Math.pow(testCurrent / load, chem.peukert - 1)) : 1
    const tempFactor = temp != null ? Math.max(0.5, Math.min(1.05, 1 + chem.tempCoef * (temp - 25))) : 1
    const dodFactor = Math.max(0.1, Math.min(1, dod / 100))
    const practicalH = (actual * rateFactor * tempFactor * dodFactor) / load
    backup = {
      formulaH, practicalH, rateFactor, tempFactor, dodFactor, dod,
      heavier: testCurrent ? load > testCurrent : false,
      cRateOfLoad: rated ? rated / load : null,
    }
  }

  const age = num(input.ageYears)
  return {
    chem, rated, actual, actualFromDuration, rateHours, testCurrent, measuredDuration,
    ready, pct, lossAh, lossPct, statusKey, status: statusKey ? STATUS[statusKey] : null,
    load, temp, backup, age, life: chem.life, endOfLife: age != null && age >= chem.life,
    impliedCurrent: ready && measuredDuration ? actual / measuredDuration : null,
  }
}

// ── Recommendation options ──
export const REC_OPTIONS = {
  repair: {
    label: 'Repair Recommended',
    short: 'Repair',
    color: '#ea580c',
    items: [
      ['cells', 'Replacement of damaged cells'],
      ['electrolyte', 'Electrolyte replacement or correction'],
      ['terminal', 'Terminal replacement'],
      ['connector', 'Connector / cable replacement'],
      ['intercell', 'Inter-cell connection repair'],
      ['corrosion', 'Corrosion removal and cleaning'],
      ['leak', 'Electrolyte leakage correction'],
      ['harness', 'Damaged cable harness replacement'],
    ],
    statement: 'REPAIR RECOMMENDED – BATTERY CAN BE RESTORED BY THE REPAIR WORK LISTED ABOVE.',
  },
  service: {
    label: 'Service Recommended',
    short: 'Service',
    color: '#0369a1',
    items: [
      ['lowamp', 'Low-ampere charging'],
      ['equalize', 'Equalization charging'],
      ['level', 'Electrolyte level correction'],
      ['tighten', 'Terminal cleaning and tightening'],
      ['wash', 'Cleaning and washing'],
      ['preventive', 'Preventive maintenance'],
      ['corrective', 'Corrective maintenance'],
    ],
    statement: 'SERVICE RECOMMENDED – BATTERY TO BE SERVICED AS LISTED ABOVE AND RE-TESTED.',
  },
  replace: {
    label: 'Complete Battery Replacement Recommended',
    short: 'Replacement',
    color: '#dc2626',
    items: [
      ['beyond', 'Battery beyond economical repair'],
      ['endlife', 'Battery reached end of service life'],
      ['multicells', 'Multiple cells damaged'],
      ['severecap', 'Severe capacity reduction'],
      ['internal', 'Internal damage'],
      ['physical', 'Electrolyte leakage / physical damage'],
      ['poorperf', 'Replacement required due to poor performance'],
    ],
    statement: 'COMPLETE BATTERY REPLACEMENT RECOMMENDED – BATTERY BEYOND REPAIR.',
  },
}

export const CONDITION_FIELDS = {
  cells: { label: 'Cell condition', options: [['ok', 'All cells healthy'], ['few', 'Few weak / dead cells'], ['many', 'Multiple cells damaged']] },
  physical: { label: 'Physical damage', options: [['none', 'None'], ['minor', 'Minor (corrosion, loose / worn parts)'], ['severe', 'Severe (cracked, swollen, burnt)']] },
  electrolyte: { label: 'Electrolyte condition', options: [['normal', 'Normal'], ['low', 'Low level'], ['contaminated', 'Contaminated / wrong SG'], ['leak', 'Leakage'], ['na', 'Not applicable (sealed)']] },
  internal: { label: 'Internal faults', options: [['none', 'None found'], ['suspected', 'Suspected (sulphation, short)'], ['confirmed', 'Confirmed internal fault']] },
  feasibility: { label: 'Repair feasibility', options: [['feasible', 'Repair feasible'], ['uncertain', 'Uncertain'], ['notfeasible', 'Not economical / not feasible']] },
}

export function optionLabel(field, value) {
  return CONDITION_FIELDS[field].options.find(o => o[0] === value)?.[1] || '—'
}

/**
 * Suggest Repair / Service / Replacement from capacity AND condition.
 * Replacement is never suggested from capacity alone: it needs at least one
 * condition finding (cells, internal, physical, feasibility or end of life).
 */
export function suggest(a, cond, thresholds = DEFAULT_THRESHOLDS) {
  if (!a.ready) return null
  const pct = a.pct
  const reasons = []
  const evidence = []
  if (cond.cells === 'many') evidence.push(['multicells', 'multiple cells are damaged'])
  if (cond.internal === 'confirmed') evidence.push(['internal', 'an internal fault is confirmed'])
  if (cond.physical === 'severe') evidence.push(['physical', 'severe physical damage'])
  if (cond.feasibility === 'notfeasible') evidence.push(['beyond', 'repair is not economical'])
  if (a.endOfLife) evidence.push(['endlife', `age ${a.age} yr reached typical life (~${a.life} yr)`])
  if (cond.electrolyte === 'leak' && cond.physical === 'severe') evidence.push(['physical', 'electrolyte leakage'])

  const low = pct < thresholds.reduced
  const critical = pct < thresholds.poor

  if (evidence.length && (low || evidence.length >= 2 || cond.feasibility === 'notfeasible')) {
    const items = [...new Set(evidence.map(e => e[0]))]
    if (critical) items.push('severecap')
    if (low) items.push('poorperf')
    reasons.push(`Capacity ${pct.toFixed(1)}% and ${evidence.map(e => e[1]).join(', ')}.`)
    return { option: 'replace', items: [...new Set(items)], reasons }
  }

  const repairItems = []
  if (cond.cells === 'few' || cond.cells === 'many') repairItems.push('cells')
  if (cond.electrolyte === 'contaminated') repairItems.push('electrolyte')
  if (cond.electrolyte === 'leak') repairItems.push('leak')
  if (cond.physical === 'minor') repairItems.push('corrosion', 'connector')
  if (cond.physical === 'severe') repairItems.push('harness', 'terminal')
  if (cond.internal === 'suspected' && (cond.cells === 'few' || cond.cells === 'many')) repairItems.push('intercell')

  if (repairItems.length) {
    reasons.push(`Capacity ${pct.toFixed(1)}% with repairable findings (${[
      cond.cells !== 'ok' && 'cells', cond.electrolyte === 'contaminated' && 'electrolyte', cond.electrolyte === 'leak' && 'leakage',
      cond.physical !== 'none' && 'physical wear', cond.internal === 'suspected' && 'suspected internal fault',
    ].filter(Boolean).join(', ')}).`)
    if (critical) reasons.push('Capacity is critical: re-test after repair before considering replacement.')
    return { option: 'repair', items: [...new Set(repairItems)], reasons }
  }

  const serviceItems = ['tighten', 'preventive']
  if (pct < thresholds.good) serviceItems.unshift('equalize', 'lowamp')
  if (cond.electrolyte === 'low') serviceItems.push('level')
  if (cond.internal === 'suspected') serviceItems.push('equalize')
  if (low) serviceItems.push('corrective')
  if (pct < thresholds.good) serviceItems.push('wash')
  reasons.push(pct >= thresholds.good
    ? `Capacity ${pct.toFixed(1)}% is healthy; routine service keeps it that way.`
    : `Capacity ${pct.toFixed(1)}% is reduced with no physical or cell damage recorded; charging and maintenance may recover capacity.`)
  if (critical) reasons.push('Capacity is critical but no cell, physical or internal evidence was entered: equalize and re-test before deciding on replacement.')
  return { option: 'service', items: [...new Set(serviceItems)], reasons }
}
