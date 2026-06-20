import React from 'react'
import { LocationDef } from '../../config/locations'

interface Props {
  location: LocationDef
  isActive: boolean
  hasDataToday: boolean
  onClick: () => void
}

export function LocationItem({ location, isActive, hasDataToday, onClick }: Props) {
  return (
    <button
      onClick={onClick}
      className="w-full text-left flex items-center gap-2 px-3 py-2 rounded transition-colors duration-100"
      style={{
        borderLeft: isActive ? '3px solid var(--sb-sky)' : '3px solid transparent',
        background: isActive ? 'rgba(183,224,222,0.12)' : 'transparent',
        color: isActive ? 'var(--sb-sky)' : 'var(--color-sidebar-text-muted)',
        fontWeight: isActive ? 700 : 400,
      }}
    >
      <span
        className="w-2 h-2 rounded-full flex-shrink-0"
        style={{ background: hasDataToday ? '#4ADE80' : 'rgba(183,224,222,0.25)' }}
        title={hasDataToday ? 'Has entry today' : 'No entry today'}
      />
      <span className="text-sm leading-tight">{location.name}</span>
    </button>
  )
}
