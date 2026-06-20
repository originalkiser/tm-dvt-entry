import React from 'react'
import { ColumnDef } from '../../config/columns'
import { DailyEntry } from '../../lib/supabase'

interface Props {
  columns: ColumnDef[]
  entries: Record<string, DailyEntry>
  dates: string[]
}

function formatCurrency(n: number): string {
  return '$' + n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function formatNumber(n: number): string {
  return n.toLocaleString('en-US', { maximumFractionDigits: 2 })
}

export function TotalsRow({ columns, entries, dates }: Props) {
  const cellStyle: React.CSSProperties = {
    fontFamily: 'DM Mono, monospace',
    fontWeight: 700,
    fontSize: 13,
    padding: '6px 8px',
    borderRight: '1px solid var(--color-border)',
    whiteSpace: 'nowrap',
    color: 'var(--color-text-primary)',
    background: 'var(--color-totals-bg)',
  }

  function computeTotal(col: ColumnDef): string {
    if (!col.includeInTotals) {
      if (col.type === 'text') {
        const count = dates.filter((d) => {
          const v = entries[d]?.data?.[col.key]
          return v !== null && v !== undefined && v !== ''
        }).length
        return count > 0 ? `${count} entries` : ''
      }
      return ''
    }

    const vals = dates
      .map((d) => Number(entries[d]?.data?.[col.key] ?? 0))
      .filter((v) => !isNaN(v))

    if (vals.length === 0) return ''

    if (col.type === 'percent') {
      const avg = vals.reduce((a, b) => a + b, 0) / vals.length
      return `${avg.toFixed(1)}% avg`
    }

    const sum = vals.reduce((a, b) => a + b, 0)
    if (col.type === 'currency') return formatCurrency(sum)
    return formatNumber(sum)
  }

  return (
    <tr style={{ borderTop: '2px solid var(--sb-sky)' }}>
      <td
        style={{
          ...cellStyle,
          fontFamily: 'Chakra Petch, sans-serif',
          position: 'sticky',
          left: 0,
          zIndex: 2,
          minWidth: 130,
        }}
      >
        Totals
      </td>
      {columns.map((col) => (
        <td key={col.key} style={cellStyle}>
          {computeTotal(col)}
        </td>
      ))}
    </tr>
  )
}
