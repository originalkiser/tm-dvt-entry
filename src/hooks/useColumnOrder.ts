import { COLUMNS, ColumnSection } from '../config/columns'

const STORAGE_KEY = (locationId: string, section: ColumnSection) =>
  `dvt_col_order_${locationId}_${section}`

export function getColumnOrder(locationId: string, section: ColumnSection): string[] {
  const sectionCols = COLUMNS.filter(c => c.section === section)
  try {
    const stored = localStorage.getItem(STORAGE_KEY(locationId, section))
    if (stored) {
      const parsed = JSON.parse(stored) as string[]
      const known = new Set(parsed)
      const newCols = sectionCols.filter(c => !known.has(c.key)).map(c => c.key)
      return [...parsed.filter(k => sectionCols.some(c => c.key === k)), ...newCols]
    }
  } catch { /* ignore */ }
  return sectionCols.slice().sort((a, b) => a.defaultOrder - b.defaultOrder).map(c => c.key)
}

export function saveColumnOrder(locationId: string, section: ColumnSection, order: string[]): void {
  localStorage.setItem(STORAGE_KEY(locationId, section), JSON.stringify(order))
}
