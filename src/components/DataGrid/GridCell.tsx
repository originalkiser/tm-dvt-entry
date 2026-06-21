import React, { useRef } from 'react'
import { ColumnDef } from '../../config/columns'
import { useAppContext } from '../../context/AppContext'

interface Props {
  locationId: string
  date: string
  col: ColumnDef
  value: unknown
  confidence: 'certain' | 'uncertain' | 'manual' | undefined
  isPending: boolean
  onNavigate: (direction: 'right' | 'left' | 'down' | 'up') => void
  sourceCell?: string
  sourceFile?: string
}

function formatValue(value: unknown, type: ColumnDef['type']): string {
  if (value === null || value === undefined || value === '') return ''
  if (type === 'currency') return String(value)
  if (type === 'percent') return String(value)
  return String(value)
}

export function GridCell({
  locationId,
  date,
  col,
  value,
  confidence,
  isPending,
  onNavigate,
  sourceCell,
  sourceFile,
}: Props) {
  const { dispatch, savePendingEntry } = useAppContext()
  const inputRef = useRef<HTMLInputElement>(null)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value
    const parsed = col.type !== 'text' ? (raw === '' ? '' : parseFloat(raw.replace(/[$,%]/g, ''))) : raw
    dispatch({
      type: 'SET_CELL',
      locationId,
      date,
      key: col.key,
      value: isNaN(parsed as number) ? raw : parsed,
      confidence: 'manual',
    })
    savePendingEntry(locationId, date)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Tab') {
      e.preventDefault()
      onNavigate(e.shiftKey ? 'left' : 'right')
    } else if (e.key === 'Enter') {
      e.preventDefault()
      onNavigate('down')
    } else if (e.key === 'ArrowRight' && (e.target as HTMLInputElement).selectionStart === String(value ?? '').length) {
      onNavigate('right')
    } else if (e.key === 'ArrowLeft' && (e.target as HTMLInputElement).selectionStart === 0) {
      onNavigate('left')
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      onNavigate('down')
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      onNavigate('up')
    }
  }

  const confClass =
    confidence === 'certain'
      ? 'cell-certain'
      : confidence === 'uncertain'
      ? 'cell-uncertain'
      : ''

  const tooltip =
    confidence === 'uncertain' && sourceFile
      ? `Review — parsed from ${sourceFile}${sourceCell ? `, cell ${sourceCell}` : ''}`
      : undefined

  const prefix = col.type === 'currency' ? '$' : col.type === 'percent' ? '' : ''
  const suffix = col.type === 'percent' ? '%' : ''

  return (
    <td
      className={`relative ${confClass}`}
      style={{
        padding: 0,
        minWidth: col.type === 'text' ? 160 : 90,
        maxWidth: col.type === 'text' ? 240 : 130,
        borderRight: '1px solid var(--color-border)',
        borderBottom: '1px solid var(--color-border)',
      }}
      title={tooltip}
    >
      {isPending && <span className="pending-dot" />}
      {confidence === 'uncertain' && (
        <span
          className="absolute right-1 top-1 text-xs leading-none"
          style={{ color: 'var(--conf-uncertain)' }}
          title={tooltip}
        >
          ⚠
        </span>
      )}
      <div className="flex items-center">
        {prefix && (
          <span className="pl-1 text-xs" style={{ color: 'var(--color-text-secondary)', fontFamily: 'DM Mono, monospace' }}>
            {prefix}
          </span>
        )}
        <input
          ref={inputRef}
          type={col.type === 'text' ? 'text' : 'number'}
          step={col.type === 'currency' || col.type === 'percent' ? '0.01' : '1'}
          value={formatValue(value, col.type)}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          data-col={col.key}
          data-date={date}
          className="w-full bg-transparent outline-none text-sm px-1 py-1.5"
          style={{
            fontFamily: 'DM Mono, monospace',
            color: 'var(--color-text-primary)',
            minWidth: 0,
          }}
        />
        {suffix && (
          <span className="pr-1 text-xs" style={{ color: 'var(--color-text-secondary)', fontFamily: 'DM Mono, monospace' }}>
            {suffix}
          </span>
        )}
      </div>
    </td>
  )
}
