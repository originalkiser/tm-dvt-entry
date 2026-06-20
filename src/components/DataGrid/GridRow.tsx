import React, { useCallback } from 'react'
import { ColumnDef } from '../../config/columns'
import { DailyEntry } from '../../lib/supabase'
import { GridCell } from './GridCell'
import { formatDateShort } from '../../lib/dateUtils'

interface Props {
  locationId: string
  date: string
  entry: DailyEntry | undefined
  columns: ColumnDef[]
  isPendingRow: boolean
  colKeys: string[]
  rowIndex: number
  totalRows: number
  parseSourceMap: Record<string, { filename: string; sourceCell?: string }>
}

export function GridRow({
  locationId,
  date,
  entry,
  columns,
  isPendingRow,
  colKeys,
  rowIndex,
  totalRows,
  parseSourceMap,
}: Props) {
  const handleNavigate = useCallback(
    (colKey: string, direction: 'right' | 'left' | 'down' | 'up') => {
      const colIdx = colKeys.indexOf(colKey)
      let targetColKey = colKey
      let targetDate = date

      if (direction === 'right') targetColKey = colKeys[Math.min(colIdx + 1, colKeys.length - 1)]
      else if (direction === 'left') targetColKey = colKeys[Math.max(colIdx - 1, 0)]
      else if (direction === 'down') {
        // focus same column in next row — handled by parent via DOM
        const nextInput = document.querySelector<HTMLInputElement>(
          `input[data-col="${colKey}"][data-date="${getNextDate(date, rowIndex, totalRows)}"]`
        )
        nextInput?.focus()
        return
      } else if (direction === 'up') {
        const prevInput = document.querySelector<HTMLInputElement>(
          `input[data-col="${colKey}"][data-date="${getPrevDate(date, rowIndex)}"]`
        )
        prevInput?.focus()
        return
      }

      const target = document.querySelector<HTMLInputElement>(
        `input[data-col="${targetColKey}"][data-date="${targetDate}"]`
      )
      target?.focus()
    },
    [colKeys, date, rowIndex, totalRows]
  )

  const rowBg = rowIndex % 2 === 0 ? 'var(--color-card-bg)' : 'var(--color-content-bg)'

  return (
    <tr style={{ background: rowBg }}>
      {/* Pinned date cell */}
      <td
        style={{
          position: 'sticky',
          left: 0,
          zIndex: 2,
          background: rowBg,
          borderRight: '2px solid var(--color-border)',
          borderBottom: '1px solid var(--color-border)',
          padding: '6px 10px',
          minWidth: 130,
          whiteSpace: 'nowrap',
          fontFamily: 'DM Mono, monospace',
          fontSize: 12,
          color: 'var(--color-text-secondary)',
          fontWeight: isPendingRow ? 600 : 400,
        }}
      >
        {formatDateShort(date)}
        {isPendingRow && (
          <span className="ml-1" style={{ color: 'var(--pending-dot)', fontSize: 16, lineHeight: 1 }}>·</span>
        )}
      </td>

      {columns.map((col) => {
        const confidence = entry?.confidence?.[col.key]
        const parseSource = parseSourceMap[col.key]
        return (
          <GridCell
            key={col.key}
            locationId={locationId}
            date={date}
            col={col}
            value={entry?.data?.[col.key]}
            confidence={confidence}
            isPending={false}
            sourceCell={parseSource?.sourceCell}
            sourceFile={parseSource?.filename}
            onNavigate={(dir) => handleNavigate(col.key, dir)}
          />
        )
      })}
    </tr>
  )
}

function getNextDate(currentDate: string, rowIndex: number, totalRows: number): string {
  // dates are rendered most-recent first, so "down" = earlier date
  if (rowIndex >= totalRows - 1) return currentDate
  // We can't easily get dates here without prop drilling — using DOM approach
  const allDateInputs = document.querySelectorAll<HTMLInputElement>(`input[data-col][data-date]`)
  const dates = [...new Set([...allDateInputs].map((el) => el.dataset.date!))]
  const idx = dates.indexOf(currentDate)
  return dates[Math.min(idx + 1, dates.length - 1)] ?? currentDate
}

function getPrevDate(currentDate: string, rowIndex: number): string {
  if (rowIndex <= 0) return currentDate
  const allDateInputs = document.querySelectorAll<HTMLInputElement>(`input[data-col][data-date]`)
  const dates = [...new Set([...allDateInputs].map((el) => el.dataset.date!))]
  const idx = dates.indexOf(currentDate)
  return dates[Math.max(idx - 1, 0)] ?? currentDate
}
