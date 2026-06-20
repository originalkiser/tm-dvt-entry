import * as XLSX from 'xlsx'
import Papa from 'papaparse'
import { COLUMNS } from '../config/columns'

export interface ParsedField {
  value: string | number
  confidence: 'certain' | 'uncertain'
  sourceCell?: string
}

export interface ParseResult {
  filename: string
  date: string | null
  fields: Record<string, ParsedField>
  rawHeaders: string[]
  unmappedColumns: string[]
  warnings: string[]
}

function normalize(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function levenshtein(a: string, b: string): number {
  const m = a.length
  const n = b.length
  const dp: number[][] = Array.from({ length: m + 1 }, (_, i) =>
    Array.from({ length: n + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
  )
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] =
        a[i - 1] === b[j - 1]
          ? dp[i - 1][j - 1]
          : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1])
    }
  }
  return dp[m][n]
}

function similarity(a: string, b: string): number {
  const na = normalize(a)
  const nb = normalize(b)
  if (na === nb) return 1
  const maxLen = Math.max(na.length, nb.length)
  if (maxLen === 0) return 1
  return 1 - levenshtein(na, nb) / maxLen
}

function parseNumeric(val: unknown): number | null {
  if (val == null || val === '') return null
  const cleaned = String(val).replace(/[$,%\s]/g, '')
  const n = parseFloat(cleaned)
  return isNaN(n) ? null : n
}

function detectDate(rows: unknown[][]): string | null {
  const candidates: Date[] = []
  for (const row of rows) {
    for (const cell of row) {
      if (cell instanceof Date) {
        candidates.push(cell)
      } else if (typeof cell === 'string' || typeof cell === 'number') {
        const d = new Date(String(cell))
        if (!isNaN(d.getTime()) && String(cell).includes('-') || String(cell).includes('/')) {
          candidates.push(d)
        }
      }
    }
  }
  if (candidates.length === 0) return null
  const now = Date.now()
  const closest = candidates.reduce((a, b) =>
    Math.abs(a.getTime() - now) < Math.abs(b.getTime() - now) ? a : b
  )
  return closest.toISOString().split('T')[0]
}

function colIndexToLetter(idx: number): string {
  let result = ''
  let n = idx + 1
  while (n > 0) {
    result = String.fromCharCode(((n - 1) % 26) + 65) + result
    n = Math.floor((n - 1) / 26)
  }
  return result
}

function parseSheetRows(workbook: XLSX.WorkBook): unknown[][] {
  const sheetName = workbook.SheetNames[0]
  const sheet = workbook.Sheets[sheetName]
  return XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, defval: '' })
}

export function parseFile(file: File): Promise<ParseResult> {
  return new Promise((resolve) => {
    const reader = new FileReader()

    reader.onload = (e) => {
      const result: ParseResult = {
        filename: file.name,
        date: null,
        fields: {},
        rawHeaders: [],
        unmappedColumns: [],
        warnings: [],
      }

      try {
        const data = e.target?.result

        let rows: unknown[][]

        if (file.name.endsWith('.csv') || file.name.endsWith('.txt')) {
          const text = typeof data === 'string' ? data : new TextDecoder().decode(data as ArrayBuffer)
          const parsed = Papa.parse<unknown[]>(text, { header: false, skipEmptyLines: true })
          rows = parsed.data
        } else {
          const workbook = XLSX.read(data, { type: 'array', cellDates: true })
          rows = parseSheetRows(workbook)
        }

        if (rows.length === 0) {
          result.warnings.push('File appears to be empty')
          resolve(result)
          return
        }

        // Detect date
        result.date = detectDate(rows)

        // Find header row (first row with ≥2 non-empty strings)
        let headerRowIdx = 0
        for (let i = 0; i < Math.min(rows.length, 10); i++) {
          const nonEmpty = rows[i].filter((c) => c !== '' && c !== null && c !== undefined)
          if (nonEmpty.length >= 2) {
            headerRowIdx = i
            break
          }
        }

        const headerRow = rows[headerRowIdx].map((h) => String(h ?? ''))
        result.rawHeaders = headerRow.filter((h) => h !== '')

        // Find data row (first non-empty row after header)
        const dataRowIdx = headerRowIdx + 1
        const dataRow = rows[dataRowIdx] ?? []

        // Match headers to known columns
        const matched = new Set<string>()

        for (let colIdx = 0; colIdx < headerRow.length; colIdx++) {
          const header = headerRow[colIdx]
          if (!header) continue

          let bestKey: string | null = null
          let bestSim = 0

          for (const col of COLUMNS) {
            const sim = similarity(header, col.label)
            if (sim > bestSim) {
              bestSim = sim
              bestKey = col.key
            }
          }

          const cellRef = `${colIndexToLetter(colIdx)}${dataRowIdx + 1}`
          const rawVal = dataRow[colIdx]

          if (bestKey && bestSim >= 0.85) {
            const col = COLUMNS.find((c) => c.key === bestKey)!
            const parsed =
              col.type !== 'text' ? parseNumeric(rawVal) : String(rawVal ?? '')
            result.fields[bestKey] = {
              value: parsed ?? String(rawVal ?? ''),
              confidence: 'certain',
              sourceCell: cellRef,
            }
            matched.add(header)
          } else if (bestKey && bestSim >= 0.6) {
            const col = COLUMNS.find((c) => c.key === bestKey)!
            const parsed =
              col.type !== 'text' ? parseNumeric(rawVal) : String(rawVal ?? '')
            result.fields[bestKey] = {
              value: parsed ?? String(rawVal ?? ''),
              confidence: 'uncertain',
              sourceCell: cellRef,
            }
            matched.add(header)
            result.warnings.push(`Low-confidence match: "${header}" → "${col.label}" (${Math.round(bestSim * 100)}%)`)
          } else if (header) {
            result.unmappedColumns.push(header)
          }
        }

        // Positional fallback if nothing matched
        if (Object.keys(result.fields).length === 0 && dataRow.length > 0) {
          result.warnings.push('No header matches found — attempting positional mapping')
          COLUMNS.forEach((col, idx) => {
            if (idx < dataRow.length && dataRow[idx] !== '' && dataRow[idx] != null) {
              const parsed =
                col.type !== 'text'
                  ? parseNumeric(dataRow[idx])
                  : String(dataRow[idx])
              result.fields[col.key] = {
                value: parsed ?? String(dataRow[idx]),
                confidence: 'uncertain',
                sourceCell: `${colIndexToLetter(idx)}${dataRowIdx + 1}`,
              }
            }
          })
        }
      } catch (err) {
        result.warnings.push(`Parse error: ${String(err)}`)
      }

      resolve(result)
    }

    if (file.name.endsWith('.csv') || file.name.endsWith('.txt')) {
      reader.readAsText(file)
    } else {
      reader.readAsArrayBuffer(file)
    }
  })
}

export function mergeParseResults(results: ParseResult[]): ParseResult {
  const merged: ParseResult = {
    filename: results.map((r) => r.filename).join(', '),
    date: null,
    fields: {},
    rawHeaders: [],
    unmappedColumns: [],
    warnings: [],
  }

  for (const result of results) {
    if (result.date && !merged.date) merged.date = result.date
    merged.rawHeaders.push(...result.rawHeaders)
    merged.unmappedColumns.push(...result.unmappedColumns)
    merged.warnings.push(...result.warnings)

    for (const [key, field] of Object.entries(result.fields)) {
      const existing = merged.fields[key]
      if (!existing) {
        merged.fields[key] = field
      } else if (field.confidence === 'certain' && existing.confidence === 'uncertain') {
        merged.fields[key] = field
      } else if (field.confidence === 'certain' && existing.confidence === 'certain') {
        merged.warnings.push(`Conflict on "${key}": both files provided certain values — keeping first`)
      }
    }
  }

  return merged
}
