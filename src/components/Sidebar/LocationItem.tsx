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
  pos?: string | null
  lastUpdated?: string | null
}

function parseLocationName(name: string): { main: string; sub: string | null } {
  const m = name.match(/^(.+?)\s*\((.+)\)$/)
  return m ? { main: m[1].trim(), sub: m[2].trim() } : { main: name, sub: null }
}

function formatLastUpdated(isoString: string): string {
  const date = new Date(isoString)
  const now = new Date()
  if (date.toDateString() === now.toDateString()) return 'Today'
  const yesterday = new Date(now)
  yesterday.setDate(yesterday.getDate() - 1)
  if (date.toDateString() === yesterday.toDateString()) return 'Yesterday'
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export function LocationItem({ location, isActive, hasDataToday, onClick, dragHandleProps, pos, lastUpdated }: Props) {
  const { main, sub } = parseLocationName(location.name)
  const lastUpdatedLabel = lastUpdated ? formatLastUpdated(lastUpdated) : null

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
          style={{
            background: isActive ? '#4ADE80' : 'rgba(183,224,222,0.25)',
            boxShadow: isActive ? '0 0 6px 2px rgba(74,222,128,0.7)' : undefined,
          }}
          title={hasDataToday ? 'Has entry today' : 'No entry today'}
        />
        <span className="flex flex-col leading-snug min-w-0">
          <span className="text-xs font-semibold whitespace-nowrap">{main}</span>
          {sub && (
            <span
              className="whitespace-nowrap"
              style={{
                fontSize: 10,
                opacity: 0.55,
                fontFamily: 'DM Mono, monospace',
                color: 'inherit',
                fontWeight: 400,
              }}
            >
              {sub}
            </span>
          )}
          {/* POS pill + last updated row */}
          {(pos || lastUpdatedLabel) && (
            <span className="flex items-center gap-1.5 mt-0.5 flex-wrap">
              {pos && (
                <span
                  style={{
                    fontSize: 9,
                    fontFamily: 'DM Mono, monospace',
                    fontWeight: 400,
                    padding: '0px 5px',
                    borderRadius: 99,
                    border: '1px solid rgba(183,224,222,0.2)',
                    color: isActive ? 'var(--sb-sky)' : 'rgba(183,224,222,0.5)',
                    background: 'rgba(183,224,222,0.06)',
                    letterSpacing: '0.02em',
                    lineHeight: '16px',
                  }}
                >
                  {pos}
                </span>
              )}
              {lastUpdatedLabel && (
                <span
                  style={{
                    fontSize: 9,
                    fontFamily: 'DM Mono, monospace',
                    fontWeight: 400,
                    opacity: 0.4,
                    color: 'inherit',
                  }}
                >
                  {lastUpdatedLabel}
                </span>
              )}
            </span>
          )}
        </span>
      </button>
    </div>
  )
}
