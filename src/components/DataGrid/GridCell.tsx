import React, { useRef } from 'react'
import { ColumnDef } from '../../config/columns'
import { useAppContext } from '../../context/AppContext'
import { ColumnMeta, getGroupColor } from '../../types/viewMeta'

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
  meta?: ColumnMeta
  formulaValue?: number | null
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
  meta,
  formulaValue,
}: Props) {
  const { dispatch, savePendingEntry } = useAppContext()
  const inputRef = useRef<HTMLInputElement>(null)

  const effectiveType = meta?.type ?? col.type
  const isFormula = formulaValue !== undefined
  const gc = getGroupColor(meta?.colorId)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isFormula) return
    const raw = e.target.value
    const parsed = effectiveType !== 'text' ? (raw === '' ? '' : parseFloat(raw.replace(/[$,%]/g, ''))) : raw
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
    if (isFormula) return
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

  const prefix = effectiveType === 'currency' ? '$' : ''
  const suffix = effectiveType === 'percent' ? '%' : ''

  // For formula cells: display the computed value, formatted by effectiveType
  const displayValue = isFormula
    ? formulaValue !== null && formulaValue !== undefined
      ? String(formulaValue)
      : ''
    : formatValue(value, effectiveType)

  const minWidth = effectiveType === 'text' ? 160 : 90
  const maxWidth = effectiveType === 'text' ? 240 : 130

  return (
    <td
      className={`relative ${confClass}`}
      style={{
        padding: 0,
        minWidth,
        maxWidth,
        borderRight: '1px solid var(--color-border)',
        borderBottom: '1px solid var(--color-border)',
        background: gc ? gc.tint : undefined,
      }}
      title={isFormula ? `= ${meta?.formula}` : tooltip}
    >
      {isPending && !isFormula && <span className="pending-dot" />}
      {confidence === 'uncertain' && !isFormula && (
        <span
          className="absolute right-1 top-1 text-xs leading-none"
          style={{ color: 'var(--conf-uncertain)' }}
          title={tooltip}
        >
          ⚠
        </span>
      )}
      {isFormula && (
        <span
          className="absolute left-1 top-1 leading-none"
          style={{ color: gc?.accent ?? 'var(--sb-sky)', fontSize: 8, opacity: 0.5 }}
        >
          ƒ
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
          type={effectiveType === 'text' ? 'text' : 'number'}
          step={effectiveType === 'currency' || effectiveType === 'percent' ? '0.01' : '1'}
          value={displayValue}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          readOnly={isFormula}
          tabIndex={isFormula ? -1 : undefined}
          data-col={col.key}
          data-date={date}
          className="w-full bg-transparent outline-none text-sm px-1 py-1.5"
          style={{
            fontFamily: 'DM Mono, monospace',
            color: isFormula ? (gc?.accent ?? 'var(--color-text-secondary)') : 'var(--color-text-primary)',
            minWidth: 0,
            opacity: isFormula ? 0.8 : 1,
            cursor: isFormula ? 'default' : undefined,
            fontStyle: isFormula ? 'italic' : undefined,
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
