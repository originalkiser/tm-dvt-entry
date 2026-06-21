import React, { useState, useRef, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable'
import { useAppContext } from '../../context/AppContext'
import { useAuth } from '../../context/AuthContext'
import { SortableLocationItem } from './SortableLocationItem'
import sbLogoUrl from '../../assets/sb-trademark-logo.svg'

const EXPANDED_WIDTH = 248
const COLLAPSED_WIDTH = 52

function loadCollapsed(): boolean {
  return localStorage.getItem('dvt_sidebar_collapsed') === 'true'
}

export function Sidebar() {
  const { state, dispatch, visibleLocations } = useAppContext()
  const { role, signOut } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [collapsed, setCollapsed] = useState(loadCollapsed)
  const [editMode, setEditMode] = useState(false)
  const [collapsedDropdownOpen, setCollapsedDropdownOpen] = useState(false)
  const collapsedBadgeRef = useRef<HTMLDivElement>(null)

  const { isLoadingLocations } = state

  useEffect(() => {
    if (!collapsedDropdownOpen) return
    function onClickOutside(e: MouseEvent) {
      if (collapsedBadgeRef.current && !collapsedBadgeRef.current.contains(e.target as Node)) {
        setCollapsedDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [collapsedDropdownOpen])

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }))

  function toggleCollapsed() {
    setCollapsed(c => {
      const next = !c
      localStorage.setItem('dvt_sidebar_collapsed', String(next))
      if (next) setEditMode(false) // exit edit mode when collapsing
      return next
    })
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const ids = visibleLocations.map(l => l.location_id)
    const oldIndex = ids.indexOf(active.id as string)
    const newIndex = ids.indexOf(over.id as string)
    if (oldIndex === -1 || newIndex === -1) return
    dispatch({ type: 'SET_LOCATION_ORDER', order: arrayMove(ids, oldIndex, newIndex) })
  }

  const activeLocation = state.locations.find(l => l.location_id === state.activeLocationId)
  const activeNumber = activeLocation?.location_id.split('-')[0] ?? ''

  return (
    <aside
      className="flex flex-col flex-shrink-0 h-full overflow-hidden transition-all duration-200"
      style={{
        width: collapsed ? COLLAPSED_WIDTH : EXPANDED_WIDTH,
        background: 'var(--color-sidebar-bg)',
        borderRight: '1px solid rgba(183,224,222,0.15)',
      }}
    >
      {/* Logo + title + collapse toggle */}
      <div
        className="flex items-center gap-2 px-3 py-4 border-b flex-shrink-0"
        style={{ borderColor: 'rgba(183,224,222,0.15)' }}
      >
        {!collapsed && (
          <>
            <img src={sbLogoUrl} alt="SB" className="w-7 h-7 flex-shrink-0" />
            <span className="font-display font-bold text-sm tracking-wide flex-1" style={{ color: 'var(--sb-sky)' }}>
              DVT-Entry
            </span>
          </>
        )}
        <button
          onClick={toggleCollapsed}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className="flex items-center justify-center rounded transition-colors flex-shrink-0"
          style={{
            width: 24,
            height: 24,
            color: 'rgba(183,224,222,0.5)',
            background: 'rgba(183,224,222,0.07)',
            border: '1px solid rgba(183,224,222,0.15)',
            fontSize: 11,
          }}
        >
          {collapsed ? '→' : '←'}
        </button>
      </div>

      {collapsed ? (
        /* Collapsed: location number badge with dropdown picker */
        <div ref={collapsedBadgeRef} className="flex flex-col items-center pt-3 overflow-visible" style={{ position: 'relative' }}>
          {activeNumber && (
            <button
              onClick={() => setCollapsedDropdownOpen(o => !o)}
              className="font-mono font-bold select-none px-2 py-1 rounded transition-opacity hover:opacity-80"
              style={{
                color: '#4ADE80',
                fontSize: 11,
                letterSpacing: '0.08em',
                border: '1px solid #4ADE80',
                boxShadow: collapsedDropdownOpen ? '0 0 12px rgba(74,222,128,0.6)' : '0 0 8px rgba(74,222,128,0.4)',
                background: 'transparent',
                cursor: 'pointer',
              }}
              title="Switch location"
            >
              {activeNumber}
            </button>
          )}

          {collapsedDropdownOpen && visibleLocations.length > 0 && (
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: COLLAPSED_WIDTH + 6,
                zIndex: 200,
                background: 'var(--color-card-bg)',
                border: '1px solid rgba(183,224,222,0.25)',
                borderRadius: 10,
                boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
                minWidth: 200,
                overflow: 'hidden',
              }}
            >
              <div
                className="px-3 py-2 text-xs font-semibold"
                style={{ color: 'rgba(183,224,222,0.4)', fontFamily: 'DM Mono, monospace', borderBottom: '1px solid rgba(183,224,222,0.1)' }}
              >
                LOCATIONS
              </div>
              {visibleLocations.map(loc => {
                const isActive = state.activeLocationId === loc.location_id
                return (
                  <button
                    key={loc.location_id}
                    onClick={() => {
                      dispatch({ type: 'SET_LOCATION', locationId: loc.location_id })
                      if (location.pathname !== '/') navigate('/')
                      setCollapsedDropdownOpen(false)
                    }}
                    className="w-full text-left px-3 py-2.5 flex items-center gap-2 transition-colors"
                    style={{
                      background: isActive ? 'rgba(183,224,222,0.1)' : 'transparent',
                      borderLeft: isActive ? '2px solid var(--sb-sky)' : '2px solid transparent',
                    }}
                    onMouseEnter={e => { if (!isActive) (e.currentTarget as HTMLElement).style.background = 'rgba(183,224,222,0.06)' }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = isActive ? 'rgba(183,224,222,0.1)' : 'transparent' }}
                  >
                    <span
                      className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                      style={{
                        background: isActive ? '#4ADE80' : state.locationsWithDataToday.has(loc.location_id) ? '#4ADE80' : 'rgba(183,224,222,0.25)',
                        boxShadow: isActive ? '0 0 4px rgba(74,222,128,0.7)' : undefined,
                      }}
                    />
                    <span
                      className="text-xs"
                      style={{
                        color: isActive ? 'var(--sb-sky)' : 'var(--color-sidebar-text-muted)',
                        fontWeight: isActive ? 700 : 400,
                        fontFamily: 'Chakra Petch, sans-serif',
                      }}
                    >
                      {loc.name}
                    </span>
                  </button>
                )
              })}
            </div>
          )}
        </div>
      ) : (
        /* Expanded: full location list */
        <nav className="flex-1 overflow-y-auto py-2 px-2 flex flex-col">
          <div className="flex items-center justify-between px-2 py-1 mb-1">
            <p
              className="text-xs font-semibold uppercase tracking-widest"
              style={{ color: 'rgba(183,224,222,0.4)' }}
            >
              Locations
            </p>
            {!isLoadingLocations && visibleLocations.length > 1 && (
              <button
                onClick={() => setEditMode(m => !m)}
                title={editMode ? 'Done reordering' : 'Reorder locations'}
                className="text-xs px-2 py-0.5 rounded transition-colors"
                style={{
                  color: editMode ? 'var(--sb-sky)' : 'rgba(183,224,222,0.4)',
                  background: editMode ? 'rgba(183,224,222,0.12)' : 'transparent',
                  border: '1px solid',
                  borderColor: editMode ? 'rgba(183,224,222,0.3)' : 'transparent',
                  fontFamily: 'DM Mono, monospace',
                }}
              >
                {editMode ? 'Done' : 'Edit'}
              </button>
            )}
          </div>

          {isLoadingLocations ? (
            <div className="px-2 py-4 space-y-2">
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className="h-9 rounded-md animate-pulse"
                  style={{ background: 'rgba(183,224,222,0.07)', width: `${75 + (i % 3) * 10}%` }}
                />
              ))}
            </div>
          ) : visibleLocations.length === 0 ? (
            <div className="px-2 py-3 text-xs" style={{ color: 'rgba(183,224,222,0.3)', fontFamily: 'DM Mono, monospace' }}>
              {state.locations.length === 0 ? 'No locations found' : 'All locations hidden — use ⚙ to show'}
            </div>
          ) : (
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext
                items={visibleLocations.map(l => l.location_id)}
                strategy={verticalListSortingStrategy}
              >
                {visibleLocations.map(loc => (
                  <SortableLocationItem
                    key={loc.location_id}
                    location={{ id: loc.location_id, name: loc.name, sheetName: loc.sheet_name }}
                    isActive={state.activeLocationId === loc.location_id}
                    hasDataToday={state.locationsWithDataToday.has(loc.location_id)}
                    editMode={editMode}
                    onClick={() => {
                      if (editMode) return
                      dispatch({ type: 'SET_LOCATION', locationId: loc.location_id })
                      if (location.pathname !== '/') navigate('/')
                    }}
                  />
                ))}
              </SortableContext>
            </DndContext>
          )}
        </nav>
      )}

      {/* Bottom admin + user section — hidden when collapsed */}
      {!collapsed && (
        <div className="border-t px-2 py-2 space-y-1 flex-shrink-0" style={{ borderColor: 'rgba(183,224,222,0.15)' }}>
          {role === 'admin' && (
            <button
              onClick={() => navigate('/admin')}
              className="w-full text-left flex items-center gap-2 px-3 py-2 rounded text-xs transition-colors"
              style={{ color: 'var(--color-sidebar-text-muted)', background: 'rgba(183,224,222,0.06)' }}
            >
              ⚙ Admin
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
      )}
    </aside>
  )
}
