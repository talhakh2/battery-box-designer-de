// Parts list transcribed from the Direct Energy "PARTS ISSUE FORM" (DE-PIF).
// Inter-cell connectors from both columns of the paper form are merged per size;
// parts listed in both columns with the same part number appear once.

const ICC_RAW = {
  '35 MM': [
    ['35MM/75MM', '6103510075'], ['35/85', '6103510085'], ['35/91', '7245113306'], ['35/105', '7245113308'],
    ['35/95', '6103510095'], ['35/110', '6103510110'], ['35/120', '6103510120'], ['35/140', '6103510140'],
  ],
  '50 MM': [
    ['50/85', '7245113504'], ['50/91', '7245113506'], ['50/105', '7245113508'], ['50/120', '7245113510'],
    ['50/140', '7245113512'], ['50/160', '6105010160'], ['50/330', '7245113528'],
    ['50/85', '6105010085'], ['50/95', '6105010095'], ['50/110', '6105010110'], ['50/120', '6105010120'],
    ['50/140', '6105010140'], ['50/330', '6105010330'],
  ],
  '70 MM': [
    ['70/91', '7245113706'], ['70/105', '7245113708'], ['70/120', '7245113710'], ['70/160', '7245113714'],
    ['70/350', '7245113728'],
    ['70/95', '6107010095'], ['70/110', '6107010110'], ['70/120', '6107010120'], ['70/140', '6107010140'],
    ['70/160', '6107010160'], ['70/330', '6107010330'],
  ],
  '95 MM': [
    ['95/91', '7245113906'], ['95/105', '7245113908'], ['95/120', '7245113910'], ['95/160', '7245113914'],
    ['95/175', '7245113916'],
    ['95/95', '6109510095'], ['95/110', '6109510110'], ['95/120', '6109510120'], ['95/140', '6109510140'],
    ['95/160', '6109510160'], ['95/330', '6109510330'],
  ],
}

const CABLE_RAW = {
  '25 MM': [['25/1000', '6102521000']],
  '35 MM': [['35/1000', '6103521000'], ['35/2000', '6103522000']],
  '50 MM': [['50/1600', '6105021600'], ['50/2000', '6105022000']],
  '70 MM': [['70/1600', '6107021600'], ['70/2000', '6107022000']],
  '95 MM': [['95/1600', '6109521600'], ['95/2000', '6109522000']],
}

const MATERIAL_RAW = [
  ['SCREW, M10 (HOPPECKE)', '7241600130'],
  ['SCREW, M10 (TAB)', '79090028C'],
  ['VENT CUP (SMALL)', '7245211053'],
  ['VENT CUP (BIG)', '7245211078'],
  ['WALL SHEET', '7245180350'],
  ['POSITIVE', '7143160605'],
  ['NEGATIVE', '7143160606'],
  ['TRAK UPLIFT', '7242000051'],
  ['TRAK UPLIFT AIR', '7242000052'],
  ['WARNING LABEL', '7242000942'],
  ['FROTEK BLINKY', '40340201'],
  ['AUX CONNECTOR BLACK / RED', 'X-6344X'],
  ['POST COVER', '40100002'],
]

const BFS_RAW = [
  ['CUP', 'A5100I'],
  ['FLOAT 29', '..072229'],
  ['FLOAT 34', '..072234'],
  ['FLOAT 49', '..072249'],
  ['PIPE LOCK 6MM', '08KLE6'],
  ['PIPE LOCK 10MM', '08KLE1'],
  ['HOSE PIPE 6MM', '08SCH6'],
  ['HOSE PIPE 10MM', '08SCH1'],
  ['T 6X10', '08T616'],
  ['END PIECE', '08END6'],
  ['FILTER/INDICATOR 6MM', '40060006'],
  ['FILTER/INDICATOR 10MM', '40060010'],
  ['FILTER', '09FLI1/B'],
  ['INDICATOR', '09FIL1/B'],
  ['MALE COUPLING 6MM', '09KUV6/B'],
  ['MALE COUPLING 10MM', '09KUV1/B'],
  ['FEMALE COUPLING 6MM', '09KUM6/V'],
  ['MALE COUPLING 10MM', '09KUM1/B'],
  ['GRAVITY CAN FOUCET', '85090020'],
]

const AIRMIX_RAW = [
  ['INTER TUBE', '40011060'],
  ['AIR MALE COUPLING', '40080028'],
  ['AIR FEMALE COUPLER', '40080001'],
  ['L', '40011029'],
  ['T', '40011030'],
  ['AIR FILTER', '7245210349'],
  ['T 6MM', '08T666'],
  ['AIR COUPLING BLUE 160 FEMALE', '75070-12'],
  ['AIR COUPLING BLUE 160 MALE', '75070-13'],
  ['AIR COUPLING BLUE 320 FEMALE', '75070-32'],
  ['AIR COUPLING BLUE 320 MALE', '75070-33'],
]

function lengthOf(desc) {
  const m = /\/(\d+)/.exec(desc)
  return m ? Number(m[1]) : 0
}

function sized(raw, category, prefix) {
  const out = []
  for (const [size, rows] of Object.entries(raw)) {
    const seen = new Set()
    const items = []
    for (const [desc, partNo] of rows) {
      const key = `${desc}|${partNo}`
      if (seen.has(key)) continue
      seen.add(key)
      items.push({ id: `${prefix}-${partNo}-${desc}`, category, group: size, desc, partNo })
    }
    items.sort((a, b) => lengthOf(a.desc) - lengthOf(b.desc) || a.partNo.localeCompare(b.partNo))
    out.push(...items)
  }
  return out
}

function flat(raw, category, prefix) {
  return raw.map(([desc, partNo], i) => ({ id: `${prefix}-${i}-${partNo}`, category, group: null, desc, partNo }))
}

export const CATEGORIES = [
  { id: 'icc', label: 'Inter Cell Connector', short: 'Connectors', icon: '🔗' },
  { id: 'cable', label: 'Cable', short: 'Cable', icon: '〰️' },
  { id: 'material', label: 'Material', short: 'Material', icon: '🔩' },
  { id: 'bfs', label: 'BFS (Battery Filling System)', short: 'BFS', icon: '💧' },
  { id: 'airmix', label: 'Air Mix', short: 'Air Mix', icon: '🌬️' },
]

export const PARTS = [
  ...sized(ICC_RAW, 'icc', 'icc'),
  ...sized(CABLE_RAW, 'cable', 'cab'),
  ...flat(MATERIAL_RAW, 'material', 'mat'),
  ...flat(BFS_RAW, 'bfs', 'bfs'),
  ...flat(AIRMIX_RAW, 'airmix', 'air'),
]

export const PARTS_BY_ID = Object.fromEntries(PARTS.map(p => [p.id, p]))
