/**
 * Parses a cell type string like "4PzS500", "4pzb500", "4PZS500" etc.
 *
 * Format:  {N} Pz {S|B} {M}
 *   N  = number before "Pz"   → cell width (mm)
 *   Pz = fixed letters (case-insensitive)
 *   S  → cell length = 198 mm
 *   B  → cell length = 158 mm
 *   M  = number after "Pz[S|B]" → cell height base; actual = M + 50 (mm)
 *
 * Returns null if the string doesn't match the pattern.
 */
export function parseCellType(cellType) {
  if (!cellType) return null

  // Case-insensitive match: digits, then pz, then s or b, then digits
  const match = String(cellType)
    .trim()
    .match(/^(\d+)[Pp][Zz]([SsBb])(\d+)$/)

  if (!match) return null

  const cellWidthMm   = Number(match[1])
  const typeChar      = match[2].toUpperCase()          // 'S' or 'B'
  const cellHeightMm  = Number(match[3]) + 50           // +50 mm
  const cellLengthMm  = typeChar === 'S' ? 198 : 158    // PzS=198, PzB=158
  const cellVariant   = typeChar === 'S' ? 'PzS' : 'PzB'

  return {
    cellWidthMm,
    cellLengthMm,
    cellHeightMm,
    cellVariant,
  }
}
