import React from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { LocationItem } from './LocationItem'
import { LocationDef } from '../../config/locations'

interface Props {
  location: LocationDef
  isActive: boolean
  hasDataToday: boolean
  onClick: () => void
  editMode: boolean
  pos?: string | null
  lastUpdated?: string | null
}

export function SortableLocationItem({ editMode, ...rest }: Props) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: rest.location.id,
  })

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.45 : 1,
        position: 'relative',
        zIndex: isDragging ? 50 : undefined,
      }}
    >
      <LocationItem
        {...rest}
        dragHandleProps={editMode ? { attributes, listeners } : undefined}
      />
    </div>
  )
}
