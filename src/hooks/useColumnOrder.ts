import { useCallback } from 'react'
import { COLUMNS } from '../config/columns'

const STORAGE_KEY = (locationId: string) => `dvt_col_order_${locationId}`

export function getColumnOrder(locationId: string): string[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY(locationId))
    if (stored) {
      const parsed = JSON.parse(stored) as string[]
      // Merge: add any new columns not yet in stored order
      const knownKeys = new Set(parsed)
      const newCols = COLUMNS.filter((c) => !knownKeys.has(c.key)).map((c) => c.key)
      return [...parsed, ...newCols]
    }
  } catch {
    // ignore
  }
  return COLUMNS.slice().sort((a, b) => a.defaultOrder - b.defaultOrder).map((c) => c.key)
}

export function saveColumnOrder(locationId: string, order: string[]): void {
  localStorage.setItem(STORAGE_KEY(locationId), JSON.stringify(order))
}

export function useColumnOrderPersistence() {
  const save = useCallback((locationId: string, order: string[]) => {
    saveColumnOrder(locationId, order)
  }, [])

  return { save }
}
