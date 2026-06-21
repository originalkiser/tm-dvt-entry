import React from 'react'
import { ColumnDef } from '../../config/columns'
import { DailyEntry } from '../../lib/supabase'
import { ColumnMeta, getGroupColor, evaluateFormula } from '../../types/viewMeta'

interface Props {
  columns: ColumnDef[]
  entries: Record<string, DailyEntry>
  dates: string[]
  columnMeta?: Record<string, ColumnMeta>
}

function formatCurrency(n: number): string {
  return '$' + n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function formatNumber(n: number): string {
  return n.toLocaleString('en-US', { maximumFractionDigits: 2 })
}

export function TotalsRow({ columns, entries, dates, columnMeta }: Props) {
  // First pass: compute raw sums for every non-formula column
  const rawTotals: Record<string, number> = {}
  for (const col of columns) {
    const m = columnMeta?.[col.key]
    if (!m?.formula) {
      const vals = dates.map(d => Number(entries[d]?.data?.[col.key] ?? 0)).filter(v => !isNaN(v))
      rawTotals[col.key] = vals.reduce((a, b) => a + b, 0)
    }
  }
  // Second pass: evaluate formula columns against the raw totals
  const allTotals: Record<string, number | null> = { ...rawTotals }
  for (const col of columns) {
    const m = columnMeta?.[col.key]
    if (m?.formula) allTotals[col.key] = evaluateFormula(m.formula, rawTotals)
  }

  function computeTotal(col: ColumnDef): string {
    const m = columnMeta?.[col.key]
    const effectiveType = m?.type ?? col.type

    if (m?.formula) {
      const val = allTotals[col.key]
      if (val === null || val === undefined) return ''
      if (effectiveType === 'currency') return formatCurrency(val)
      if (effectiveType === 'percent') return `${val.toFixed(1)}% formula`
      return formatNumber(val)
    }

    if (!col.includeInTotals) {
      if (effectiveType === 'text') {
        const count = dates.filter(d => {
          const v = entries[d]?.data?.[col.key]
          return v !== null && v !== undefined && v !== ''
        }).length
        return count > 0 ? `${count} entries` : ''
      }
      return ''
    }

    const vals = dates
      .map(d => Number(entries[d]?.data?.[col.key] ?? 0))
      .filter(v => !isNaN(v))
    if (vals.length === 0) return ''

    if (effectiveType === 'percent') {
      const avg = vals.reduce((a, b) => a + b, 0) / vals.length
      return `${avg.toFixed(1)}% avg`
    }
    const sum = vals.reduce((a, b) => a + b, 0)
    if (effectiveType === 'currency') return formatCurrency(sum)
    return formatNumber(sum)
  }

  const baseCellStyle: React.CSSProperties = {
    fontFamily: 'DM Mono, monospace',
    fontWeight: 700,
    fontSize: 13,
    padding: '6px 8px',
    borderRight: '1px solid var(--color-border)',
    whiteSpace: 'nowrap',
    color: 'var(--color-text-primary)',
    background: 'var(--color-totals-bg)',
  }

  return (
    <tr style={{ borderTop: '2px solid var(--sb-sky)' }}>
      <td
        style={{
          ...baseCellStyle,
          fontFamily: 'Chakra Petch, sans-serif',
          position: 'sticky',
          left: 0,
          zIndex: 2,
          minWidth: 130,
        }}
      >
        Totals
      </td>
      {columns.map(col => {
        const gc = getGroupColor(columnMeta?.[col.key]?.colorId)
        const isFormula = Boolean(columnMeta?.[col.key]?.formula)
        return (
          <td
            key={col.key}
            style={{
              ...baseCellStyle,
              background: gc ? gc.tint : 'var(--color-totals-bg)',
              color: isFormula ? (gc?.accent ?? 'var(--color-text-secondary)') : 'var(--color-text-primary)',
              fontStyle: isFormula ? 'italic' : undefined,
            }}
          >
            {computeTotal(col)}
          </td>
        )
      })}
    </tr>
  )
}
