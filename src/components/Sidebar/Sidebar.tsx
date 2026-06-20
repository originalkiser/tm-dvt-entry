import React from 'react'
import { LOCATIONS } from '../../config/locations'
import { useAppContext } from '../../context/AppContext'
import { LocationItem } from './LocationItem'
import sbLogoUrl from '../../assets/sb-logo.svg'

export function Sidebar() {
  const { state, dispatch } = useAppContext()

  return (
    <aside
      className="flex flex-col flex-shrink-0 h-full overflow-hidden"
      style={{
        width: 220,
        background: 'var(--color-sidebar-bg)',
        borderRight: '1px solid rgba(183,224,222,0.15)',
      }}
    >
      {/* Logo + title */}
      <div className="flex items-center gap-2 px-4 py-4 border-b" style={{ borderColor: 'rgba(183,224,222,0.15)' }}>
        <img src={sbLogoUrl} alt="SB" className="w-8 h-8 flex-shrink-0" />
        <span className="font-display font-bold text-base tracking-wide" style={{ color: 'var(--sb-sky)' }}>
          DVT-Entry
        </span>
      </div>

      {/* Location list */}
      <nav className="flex-1 overflow-y-auto py-2 px-2">
        <p className="px-2 py-1 text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: 'rgba(183,224,222,0.4)' }}>
          Locations
        </p>
        {LOCATIONS.map((loc) => (
          <LocationItem
            key={loc.id}
            location={loc}
            isActive={state.activeLocationId === loc.id}
            hasDataToday={state.locationsWithDataToday.has(loc.id)}
            onClick={() => dispatch({ type: 'SET_LOCATION', locationId: loc.id })}
          />
        ))}
      </nav>
    </aside>
  )
}
