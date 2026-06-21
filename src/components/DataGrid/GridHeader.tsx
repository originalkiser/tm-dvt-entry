import React from 'react'
import {
  SortableContext,
  useSortable,
  horizontalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { ColumnDef } from '../../config/columns'
import { ColumnMeta, getGroupColor } from '../../types/viewMeta'

interface HeaderCellProps {
  col: ColumnDef
  meta?: ColumnMeta
}

function SortableHeaderCell({ col, meta }: HeaderCellProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: col.key,
  })

  const effectiveType = meta?.type ?? col.type
  const gc = getGroupColor(meta?.colorId)
  const hasNote = Boolean(meta?.note?.trim())
  const hasFormula = Boolean(meta?.formula?.trim())

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    position: 'relative',
    cursor: 'default',
    background: 'var(--color-topbar-bg)',
    color: gc ? gc.accent : 'var(--sb-sky)',
    fontFamily: 'Chakra Petch, sans-serif',
    fontWeight: 700,
    fontSize: 11,
    letterSpacing: '0.05em',
    textTransform: 'uppercase',
    padding: '8px 8px 6px 4px',
    whiteSpace: 'nowrap',
    borderRight: '1px solid var(--color-border)',
    borderBottom: gc ? `3px solid ${gc.accent}` : '2px solid var(--sb-sky)',
    minWidth: effectiveType === 'text' ? 160 : 90,
    userSelect: 'none',
  }

  const typeTag = effectiveType !== col.type ? (
    <span style={{ fontSize: 8, opacity: 0.6, marginLeft: 3, fontFamily: 'DM Mono, monospace' }}>
      {effectiveType === 'currency' ? '$' : effectiveType === 'percent' ? '%' : '#'}
    </span>
  ) : null

  return (
    <th ref={setNodeRef} style={style}>
      <div className="flex items-center gap-1">
        <span
          {...attributes}
          {...listeners}
          className="drag-handle text-sm"
          style={{ color: 'var(--sb-inky)', cursor: 'grab' }}
          title="Drag to reorder"
        >
          ⠿
        </span>
        <span className="truncate">{col.label}</span>
        {typeTag}
        {hasFormula && (
          <span style={{ fontSize: 10, opacity: 0.7, color: gc?.accent ?? 'var(--sb-sky)', flexShrink: 0 }} title="Computed column (formula)">
            ƒ
          </span>
        )}
        {hasNote && (
          <span
            style={{ fontSize: 10, opacity: 0.65, flexShrink: 0, cursor: 'help' }}
            title={meta!.note}
          >
            ℹ
          </span>
        )}
      </div>
    </th>
  )
}

interface Props {
  columns: ColumnDef[]
  columnMeta?: Record<string, ColumnMeta>
}

export function GridHeader({ columns, columnMeta }: Props) {
  return (
    <thead>
      <tr>
        {/* Pinned date header */}
        <th
          style={{
            position: 'sticky',
            left: 0,
            zIndex: 3,
            background: 'var(--color-topbar-bg)',
            color: 'var(--sb-sky)',
            fontFamily: 'Chakra Petch, sans-serif',
            fontWeight: 700,
            fontSize: 11,
            letterSpacing: '0.05em',
            textTransform: 'uppercase',
            padding: '8px 10px',
            whiteSpace: 'nowrap',
            borderRight: '2px solid var(--sb-sky)',
            borderBottom: '2px solid var(--sb-sky)',
            minWidth: 130,
          }}
        >
          Date
        </th>
        <SortableContext items={columns.map((c) => c.key)} strategy={horizontalListSortingStrategy}>
          {columns.map((col) => (
            <SortableHeaderCell key={col.key} col={col} meta={columnMeta?.[col.key]} />
          ))}
        </SortableContext>
      </tr>
    </thead>
  )
}
