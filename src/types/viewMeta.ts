import { ColumnType } from '../config/columns'

export interface ColumnMeta {
  colorId?: string       // references a GROUP_COLORS id
  note?: string          // tooltip on the column header
  type?: ColumnType      // overrides the column's default type for display
  formula?: string       // e.g. "[retail_washes]+[member_washes]" — makes cell read-only
}

export interface LegendEntry {
  colorId: string
  label: string          // user-defined label, e.g. "POS Report"
}

export interface GroupColor {
  id: string
  label: string
  accent: string         // header bottom-border color
  tint: string           // very light cell background
}

export const GROUP_COLORS: GroupColor[] = [
  { id: 'sky',    label: 'Sky',    accent: '#B7E0DE', tint: 'rgba(183,224,222,0.12)' },
  { id: 'blue',   label: 'Blue',   accent: '#60A5FA', tint: 'rgba(96,165,250,0.10)'  },
  { id: 'teal',   label: 'Teal',   accent: '#2DD4BF', tint: 'rgba(45,212,191,0.10)'  },
  { id: 'green',  label: 'Green',  accent: '#4ADE80', tint: 'rgba(74,222,128,0.10)'  },
  { id: 'amber',  label: 'Amber',  accent: '#FBBF24', tint: 'rgba(251,191,36,0.10)'  },
  { id: 'orange', label: 'Orange', accent: '#FB923C', tint: 'rgba(251,146,60,0.10)'  },
  { id: 'rose',   label: 'Rose',   accent: '#FB7185', tint: 'rgba(251,113,133,0.10)' },
  { id: 'purple', label: 'Purple', accent: '#C084FC', tint: 'rgba(192,132,252,0.10)' },
]

export function getGroupColor(id: string | undefined): GroupColor | undefined {
  return id ? GROUP_COLORS.find(g => g.id === id) : undefined
}

// Evaluate a formula string against a data map.
// Syntax: [column_key] references are replaced with numeric values.
// Only basic arithmetic (+, -, *, /) and parentheses are supported.
export function evaluateFormula(formula: string, data: Record<string, unknown>): number | null {
  try {
    let expr = formula
    const matches = [...formula.matchAll(/\[([^\]]+)\]/g)]
    for (const [fullMatch, key] of matches) {
      const val = Number(data[key] ?? 0)
      if (!isFinite(val)) return null
      expr = expr.split(fullMatch).join(String(val))
    }
    // Sanitize: allow only digits, arithmetic operators, parens, decimal points
    const safe = expr.replace(/[^0-9+\-*/().\s]/g, '')
    if (!safe.trim()) return null
    // eslint-disable-next-line no-new-func
    const result = new Function(`"use strict"; return (${safe})`)()
    return typeof result === 'number' && isFinite(result) ? Math.round(result * 1e6) / 1e6 : null
  } catch {
    return null
  }
}

// Parse formula references into column keys
export function formulaRefs(formula: string): string[] {
  return [...formula.matchAll(/\[([^\]]+)\]/g)].map(m => m[1])
}
