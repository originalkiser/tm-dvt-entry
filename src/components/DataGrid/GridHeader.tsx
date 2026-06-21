import React, { useRef, useState } from 'react'
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
  onUpdateNote?: (key: string, note: string) => void
}

function SortableHeaderCell({ col, meta, onUpdateNote }: HeaderCellProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: col.key,
  })
  const [noteHover, setNoteHover] = useState(false)
  const [noteEditing, setNoteEditing] = useState(false)
  const [noteDraft, setNoteDraft] = useState('')

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

  // Only show % for percent type override; skip $ and # indicators
  const typeTag = (effectiveType === 'percent' && effectiveType !== col.type) ? (
    <span style={{ fontSize: 8, opacity: 0.6, marginLeft: 3, fontFamily: 'DM Mono, monospace' }}>%</span>
  ) : null

  const commitNote = () => {
    onUpdateNote?.(col.key, noteDraft)
    setNoteEditing(false)
  }

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

        {/* Note label — far right, hover tooltip + click to edit */}
        {hasNote && (
          <div style={{ marginLeft: 'auto', position: 'relative', flexShrink: 0 }}>
            {noteEditing ? (
              <input
                value={noteDraft}
                onChange={e => setNoteDraft(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') commitNote()
                  if (e.key === 'Escape') setNoteEditing(false)
                }}
                onBlur={commitNote}
                onClick={e => e.stopPropagation()}
                autoFocus
                style={{
                  width: 130,
                  fontSize: 10,
                  padding: '2px 5px',
                  background: 'var(--color-input-bg)',
                  border: '1px solid var(--sb-sky)',
                  borderRadius: 4,
                  color: 'var(--color-text-primary)',
                  fontFamily: 'DM Mono, monospace',
                  outline: 'none',
                  fontWeight: 400,
                  letterSpacing: 0,
                  textTransform: 'none',
                }}
              />
            ) : (
              <>
                <span
                  onMouseEnter={() => setNoteHover(true)}
                  onMouseLeave={() => setNoteHover(false)}
                  onClick={e => { e.stopPropagation(); setNoteDraft(meta!.note ?? ''); setNoteEditing(true) }}
                  style={{
                    fontSize: 9,
                    fontFamily: 'DM Mono, monospace',
                    fontWeight: 400,
                    letterSpacing: 0,
                    textTransform: 'none',
                    opacity: 0.55,
                    cursor: 'pointer',
                    padding: '1px 5px',
                    borderRadius: 3,
                    border: `1px solid ${gc?.accent ?? 'rgba(183,224,222,0.25)'}`,
                    color: gc?.accent ?? 'var(--sb-sky)',
                  }}
                >
                  Note
                </span>
                {noteHover && (
                  <div
                    style={{
                      position: 'absolute',
                      top: '100%',
                      right: 0,
                      zIndex: 100,
                      marginTop: 6,
                      padding: '7px 10px',
                      background: 'var(--color-card-bg)',
                      border: '1px solid rgba(183,224,222,0.25)',
                      borderRadius: 7,
                      boxShadow: '0 4px 14px rgba(0,0,0,0.45)',
                      fontSize: 11,
                      fontFamily: 'DM Mono, monospace',
                      fontWeight: 400,
                      letterSpacing: 0,
                      textTransform: 'none',
                      color: 'var(--color-text-primary)',
                      whiteSpace: 'pre-wrap',
                      maxWidth: 240,
                    }}
                  >
                    {meta!.note}
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </th>
  )
}

interface Props {
  columns: ColumnDef[]
  columnMeta?: Record<string, ColumnMeta>
  onUpdateNote?: (key: string, note: string) => void
}

export function GridHeader({ columns, columnMeta, onUpdateNote }: Props) {
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
            <SortableHeaderCell key={col.key} col={col} meta={columnMeta?.[col.key]} onUpdateNote={onUpdateNote} />
          ))}
        </SortableContext>
      </tr>
    </thead>
  )
}
