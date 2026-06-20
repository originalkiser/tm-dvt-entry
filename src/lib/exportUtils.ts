import { COLUMNS } from '../config/columns'
import { LocationDef } from '../config/locations'
import { DailyEntry } from './supabase'

export interface ExportPayload {
  exportedAt: string
  locations: LocationExport[]
}

export interface LocationExport {
  locationId: string
  sheetName: string
  dateRange: { start: string; end: string }
  rows: { date: string; data: Record<string, unknown> }[]
  totals: Record<string, unknown>
}

export function buildExportPayload(
  locations: LocationDef[],
  entriesByLocation: Record<string, Record<string, DailyEntry>>,
  startDate: string,
  endDate: string
): ExportPayload {
  return {
    exportedAt: new Date().toISOString(),
    locations: locations.map((loc) => {
      const locEntries = entriesByLocation[loc.id] ?? {}
      const rows = Object.entries(locEntries)
        .filter(([date]) => date >= startDate && date <= endDate)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([date, entry]) => ({ date, data: entry.data }))

      const totals: Record<string, unknown> = {}
      for (const col of COLUMNS) {
        if (!col.includeInTotals) continue
        if (col.type === 'percent') {
          const vals = rows.map((r) => Number(r.data[col.key] ?? 0)).filter((v) => !isNaN(v))
          totals[col.key] = vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0
        } else {
          totals[col.key] = rows.reduce((sum, r) => sum + Number(r.data[col.key] ?? 0), 0)
        }
      }

      return {
        locationId: loc.id,
        sheetName: loc.sheetName,
        dateRange: { start: startDate, end: endDate },
        rows,
        totals,
      }
    }),
  }
}

export function exportToCSV(locationExport: LocationExport, locationName: string): void {
  const headers = ['Date', ...COLUMNS.map((c) => c.label)]
  const csvRows = [
    headers.join(','),
    ...locationExport.rows.map((row) =>
      [
        row.date,
        ...COLUMNS.map((col) => {
          const val = row.data[col.key] ?? ''
          const str = String(val)
          return str.includes(',') || str.includes('"') ? `"${str.replace(/"/g, '""')}"` : str
        }),
      ].join(',')
    ),
  ]

  const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${locationName}_${locationExport.dateRange.start}_${locationExport.dateRange.end}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

export async function postToPowerAutomate(payload: ExportPayload): Promise<void> {
  const url = import.meta.env.VITE_POWER_AUTOMATE_URL
  if (!url) throw new Error('VITE_POWER_AUTOMATE_URL is not configured')

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })

  if (!res.ok) throw new Error(`Power Automate responded with ${res.status}`)
}
