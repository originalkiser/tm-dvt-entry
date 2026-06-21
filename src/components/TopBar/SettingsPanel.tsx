import React, { useEffect, useRef } from 'react'
import { useAppContext } from '../../context/AppContext'

export function SettingsPanel() {
  const { state, dispatch, visibleLocations } = useAppContext()
  const { locations, hiddenLocationIds, settingsPanelOpen, isLoadingLocations } = state
  const panelRef = useRef<HTMLDivElement>(null)

  const activeLocations = locations.filter(l => l.is_active)

  useEffect(() => {
    if (!settingsPanelOpen) return
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        dispatch({ type: 'TOGGLE_SETTINGS_PANEL' })
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [settingsPanelOpen, dispatch])

  const hiddenCount = hiddenLocationIds.size

  return (
    <div ref={panelRef} className="relative">
      {/* Gear button */}
      <button
        onClick={() => dispatch({ type: 'TOGGLE_SETTINGS_PANEL' })}
        title="Location visibility settings"
        className="flex items-center justify-center w-8 h-8 rounded-md transition-colors relative"
        style={{
          background: settingsPanelOpen ? 'rgba(183,224,222,0.2)' : 'rgba(183,224,222,0.08)',
          color: 'var(--sb-sky)',
          border: '1px solid rgba(183,224,222,0.2)',
        }}
      >
        ⚙
      </button>

      {/* Dropdown panel */}
      {settingsPanelOpen && (
        <div
          className="absolute top-full mt-2 right-0 z-40 rounded-xl shadow-2xl overflow-hidden"
          style={{
            width: 280,
            background: 'var(--color-card-bg)',
            border: '1px solid var(--color-border)',
          }}
        >
          {/* Header */}
          <div
            className="flex items-center justify-between px-4 py-3 border-b"
            style={{ borderColor: 'var(--color-border)', background: 'var(--color-topbar-bg)' }}
          >
            <span className="font-display font-bold text-sm" style={{ color: 'var(--sb-sky)' }}>
              Sidebar Locations
            </span>
            <div className="flex items-center gap-2">
              {hiddenCount > 0 && (
                <button
                  className="text-xs"
                  style={{ color: 'var(--sb-inky)', fontFamily: 'DM Mono, monospace' }}
                  onClick={() => {
                    activeLocations.forEach(l => {
                      if (hiddenLocationIds.has(l.location_id)) {
                        dispatch({ type: 'TOGGLE_LOCATION_HIDDEN', locationId: l.location_id })
                      }
                    })
                  }}
                >
                  Show all
                </button>
              )}
              {visibleLocations.length > 0 && (
                <button
                  className="text-xs"
                  style={{ color: 'var(--sb-inky)', fontFamily: 'DM Mono, monospace' }}
                  onClick={() => {
                    activeLocations.forEach(l => {
                      if (!hiddenLocationIds.has(l.location_id)) {
                        dispatch({ type: 'TOGGLE_LOCATION_HIDDEN', locationId: l.location_id })
                      }
                    })
                  }}
                >
                  Hide all
                </button>
              )}
            </div>
          </div>

          {/* Location list */}
          <div className="overflow-y-auto" style={{ maxHeight: 360 }}>
            {isLoadingLocations ? (
              <div className="px-4 py-6 text-xs text-center" style={{ color: 'var(--color-text-secondary)', fontFamily: 'DM Mono, monospace' }}>
                Loading locations…
              </div>
            ) : activeLocations.length === 0 ? (
              <div className="px-4 py-6 text-xs text-center" style={{ color: 'var(--color-text-secondary)', fontFamily: 'DM Mono, monospace' }}>
                No active locations
              </div>
            ) : (
              activeLocations.map(loc => {
                const isHidden = hiddenLocationIds.has(loc.location_id)
                const isSelected = state.activeLocationId === loc.location_id
                return (
                  <label
                    key={loc.location_id}
                    className="flex items-center gap-3 px-4 py-2.5 cursor-pointer transition-colors"
                    style={{
                      borderBottom: '1px solid var(--color-border)',
                      background: isSelected ? 'rgba(183,224,222,0.06)' : 'transparent',
                      opacity: isHidden ? 0.45 : 1,
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={!isHidden}
                      onChange={() => dispatch({ type: 'TOGGLE_LOCATION_HIDDEN', locationId: loc.location_id })}
                      style={{ accentColor: 'var(--sb-sky)', width: 14, height: 14, flexShrink: 0 }}
                    />
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <span
                        className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                        style={{ background: state.locationsWithDataToday.has(loc.location_id) ? '#4ADE80' : 'rgba(183,224,222,0.2)' }}
                      />
                      <span
                        className="text-sm truncate"
                        style={{
                          color: isSelected ? 'var(--sb-sky)' : 'var(--color-text-primary)',
                          fontFamily: 'Inter, sans-serif',
                          fontWeight: isSelected ? 600 : 400,
                        }}
                      >
                        {loc.name}
                      </span>
                    </div>
                    <span
                      className="text-xs flex-shrink-0"
                      style={{ color: 'var(--color-text-secondary)', fontFamily: 'DM Mono, monospace', opacity: 0.5 }}
                    >
                      {loc.location_id.split('-')[0]}
                    </span>
                  </label>
                )
              })
            )}
          </div>

          {/* Footer hint */}
          {!isLoadingLocations && activeLocations.length > 0 && (
            <div
              className="px-4 py-2 text-xs"
              style={{ color: 'var(--color-text-secondary)', borderTop: '1px solid var(--color-border)', fontFamily: 'DM Mono, monospace' }}
            >
              {visibleLocations.length} of {activeLocations.length} shown · saved locally
            </div>
          )}
        </div>
      )}
    </div>
  )
}
