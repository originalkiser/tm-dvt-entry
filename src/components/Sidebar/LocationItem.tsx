import React from 'react'
import { LocationDef } from '../../config/locations'
import { DraggableAttributes } from '@dnd-kit/core'
import { SyntheticListenerMap } from '@dnd-kit/core/dist/hooks/utilities'

interface DragHandleProps {
  attributes: DraggableAttributes
  listeners: SyntheticListenerMap | undefined
}

interface Props {
  location: LocationDef
  isActive: boolean
  hasDataToday: boolean
  onClick: () => void
  dragHandleProps?: DragHandleProps
}

function parseLocationName(name: string): { main: string; sub: string | null } {
  const m = name.match(/^(.+?)\s*\((.+)\)$/)
  return m ? { main: m[1].trim(), sub: m[2].trim() } : { main: name, sub: null }
}

export function LocationItem({ location, isActive, hasDataToday, onClick, dragHandleProps }: Props) {
  const { main, sub } = parseLocationName(location.name)

  return (
    <div
      className="flex items-center"
      style={{
        borderLeft: isActive ? '3px solid var(--sb-sky)' : '3px solid transparent',
        background: isActive ? 'rgba(183,224,222,0.12)' : 'transparent',
      }}
    >
      {dragHandleProps && (
        <span
          {...dragHandleProps.attributes}
          {...dragHandleProps.listeners}
          className="flex-shrink-0 flex items-center justify-center w-5 cursor-grab active:cursor-grabbing select-none"
          style={{ color: 'rgba(183,224,222,0.35)', fontSize: 13 }}
          title="Drag to reorder"
        >
          ⠿
        </span>
      )}

      <button
        onClick={onClick}
        className="flex-1 text-left flex items-center gap-2 px-3 py-1.5 transition-colors duration-100"
        style={{
          color: isActive ? 'var(--sb-sky)' : 'var(--color-sidebar-text-muted)',
          fontWeight: isActive ? 700 : 400,
          paddingLeft: dragHandleProps ? 4 : undefined,
        }}
      >
        <span
          className="w-2 h-2 rounded-full flex-shrink-0"
          style={{ background: hasDataToday ? '#4ADE80' : 'rgba(183,224,222,0.25)' }}
          title={hasDataToday ? 'Has entry today' : 'No entry today'}
        />
        <span className="flex flex-col leading-snug">
          <span className="text-xs font-semibold whitespace-nowrap">{main}</span>
          {sub && (
            <span
              className="whitespace-nowrap"
              style={{
                fontSize: 10,
                opacity: 0.55,
                fontFamily: 'DM Mono, monospace',
                color: 'inherit',
              }}
            >
              {sub}
            </span>
          )}
        </span>
      </button>
    </div>
  )
}
