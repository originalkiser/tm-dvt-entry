import React from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAppContext } from '../../context/AppContext'
import { useAuth } from '../../context/AuthContext'
import { LocationItem } from './LocationItem'
import sbLogoUrl from '../../assets/sb-trademark-logo.svg'

export function Sidebar() {
  const { state, dispatch } = useAppContext()
  const { role, signOut } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const activeLocations = state.locations.filter(l => l.is_active)

  return (
    <aside
      className="flex flex-col flex-shrink-0 h-full overflow-hidden"
      style={{ width: 220, background: 'var(--color-sidebar-bg)', borderRight: '1px solid rgba(183,224,222,0.15)' }}
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

        {state.locations.length === 0 ? (
          <div className="px-2 py-3 text-xs" style={{ color: 'rgba(183,224,222,0.3)', fontFamily: 'DM Mono, monospace' }}>
            Loading…
          </div>
        ) : activeLocations.length === 0 ? (
          <div className="px-2 py-3 text-xs" style={{ color: 'rgba(183,224,222,0.3)', fontFamily: 'DM Mono, monospace' }}>
            No active locations
          </div>
        ) : (
          activeLocations.map(loc => (
            <LocationItem
              key={loc.location_id}
              location={{ id: loc.location_id, name: loc.name, sheetName: loc.sheet_name }}
              isActive={state.activeLocationId === loc.location_id}
              hasDataToday={state.locationsWithDataToday.has(loc.location_id)}
              onClick={() => {
                dispatch({ type: 'SET_LOCATION', locationId: loc.location_id })
                if (location.pathname !== '/') navigate('/')
              }}
            />
          ))
        )}
      </nav>

      {/* Bottom admin + user section */}
      <div className="border-t px-2 py-2 space-y-1" style={{ borderColor: 'rgba(183,224,222,0.15)' }}>
        {role === 'admin' && (
          <button
            onClick={() => navigate('/admin/locations')}
            className="w-full text-left flex items-center gap-2 px-3 py-2 rounded text-xs transition-colors"
            style={{ color: 'var(--color-sidebar-text-muted)', background: 'rgba(183,224,222,0.06)' }}
          >
            ⚙ Manage Locations
          </button>
        )}
        <button
          onClick={() => signOut()}
          className="w-full text-left flex items-center gap-2 px-3 py-2 rounded text-xs transition-colors"
          style={{ color: 'var(--color-sidebar-text-muted)' }}
        >
          ↩ Sign Out
        </button>
      </div>
    </aside>
  )
}
