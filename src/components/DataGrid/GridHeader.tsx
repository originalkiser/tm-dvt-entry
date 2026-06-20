import React from 'react'
import {
  SortableContext,
  useSortable,
  horizontalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { ColumnDef } from '../../config/columns'

interface HeaderCellProps {
  col: ColumnDef
}

function SortableHeaderCell({ col }: HeaderCellProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: col.key,
  })

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    position: 'relative',
    cursor: 'default',
    background: 'var(--color-topbar-bg)',
    color: 'var(--sb-sky)',
    fontFamily: 'Chakra Petch, sans-serif',
    fontWeight: 700,
    fontSize: 11,
    letterSpacing: '0.05em',
    textTransform: 'uppercase',
    padding: '8px 8px 8px 4px',
    whiteSpace: 'nowrap',
    borderRight: '1px solid var(--color-border)',
    borderBottom: '2px solid var(--sb-sky)',
    minWidth: col.type === 'text' ? 160 : 90,
    userSelect: 'none',
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
        {col.label}
      </div>
    </th>
  )
}

interface Props {
  columns: ColumnDef[]
}

export function GridHeader({ columns }: Props) {
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
            <SortableHeaderCell key={col.key} col={col} />
          ))}
        </SortableContext>
      </tr>
    </thead>
  )
}
