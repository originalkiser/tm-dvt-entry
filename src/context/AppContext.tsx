import React, { createContext, useContext, useReducer, useEffect, useCallback, Reducer, useRef } from 'react'
import { COLUMNS, ColumnSection } from '../config/columns'
import { LOCATIONS } from '../config/locations'
import { DailyEntry, fetchEntries, upsertEntry, fetchTodayStatus, fetchLocations, DVTLocation, fetchUserPreferences, saveUserPreferences } from '../lib/supabase'
import { today, subtractDays } from '../lib/dateUtils'
import { getColumnOrder, saveColumnOrder } from '../hooks/useColumnOrder'
import { ParseResult } from '../lib/parseEngine'

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error'

// Locations hidden by this user (sidebar preference, not a global deactivation)
function loadHiddenLocations(): Set<string> {
  try {
    const raw = localStorage.getItem('dvt_hidden_locations')
    if (raw) return new Set(JSON.parse(raw) as string[])
  } catch { /* ignore */ }
  return new Set()
}

function saveHiddenLocations(ids: Set<string>) {
  localStorage.setItem('dvt_hidden_locations', JSON.stringify([...ids]))
}

function loadLocationOrder(): string[] {
  try {
    const raw = localStorage.getItem('dvt_location_order')
    if (raw) return JSON.parse(raw) as string[]
  } catch { /* ignore */ }
  return []
}

function saveLocationOrder(order: string[]) {
  localStorage.setItem('dvt_location_order', JSON.stringify(order))
}

// Build a DVTLocation list from the static config as a fallback
function staticLocations(): DVTLocation[] {
  return LOCATIONS.map(l => ({
    id: l.id,
    location_id: l.id,
    name: l.name,
    sheet_name: l.sheetName,
    is_active: true,
  }))
}

interface AppState {
  activeLocationId: string
  activeSection: ColumnSection
  dateRange: { start: string; end: string }
  theme: 'light' | 'dark'
  entries: Record<string, Record<string, DailyEntry>>
  columnOrders: Record<string, Record<ColumnSection, string[]>>
  pendingChanges: Set<string>
  parseResults: ParseResult[]
  locationsWithDataToday: Set<string>
  saveStatus: SaveStatus
  isLoadingEntries: boolean
  isLoadingLocations: boolean
  uploadPanelOpen: boolean
  exportModalOpen: boolean
  settingsPanelOpen: boolean
  locations: DVTLocation[]
  hiddenLocationIds: Set<string>
  locationOrder: string[]
  viewRefreshTrigger: number
}

type Action =
  | { type: 'SET_LOCATION'; locationId: string }
  | { type: 'SET_SECTION'; section: ColumnSection }
  | { type: 'SET_DATE_RANGE'; start: string; end: string }
  | { type: 'SET_THEME'; theme: 'light' | 'dark' }
  | { type: 'SET_ENTRIES'; locationId: string; entries: DailyEntry[] }
  | { type: 'SET_CELL'; locationId: string; date: string; key: string; value: unknown; confidence: 'certain' | 'uncertain' | 'manual' }
  | { type: 'SET_COLUMN_ORDER'; locationId: string; section: ColumnSection; order: string[] }
  | { type: 'REMOVE_PENDING'; key: string }
  | { type: 'SET_PARSE_RESULTS'; results: ParseResult[] }
  | { type: 'APPLY_PARSE_RESULT'; locationId: string; date: string; result: ParseResult }
  | { type: 'SET_TODAY_STATUS'; locationIds: Set<string> }
  | { type: 'SET_SAVE_STATUS'; status: SaveStatus }
  | { type: 'SET_LOADING_ENTRIES'; loading: boolean }
  | { type: 'SET_LOADING_LOCATIONS'; loading: boolean }
  | { type: 'TOGGLE_UPLOAD_PANEL' }
  | { type: 'TOGGLE_EXPORT_MODAL' }
  | { type: 'CLOSE_EXPORT_MODAL' }
  | { type: 'TOGGLE_SETTINGS_PANEL' }
  | { type: 'SET_LOCATIONS'; locations: DVTLocation[] }
  | { type: 'TOGGLE_LOCATION_HIDDEN'; locationId: string }
  | { type: 'SET_HIDDEN_LOCATIONS'; ids: Set<string> }
  | { type: 'SET_LOCATION_ORDER'; order: string[] }
  | { type: 'BUMP_VIEW_REFRESH' }

function getInitialColumnOrders(locationId: string): Record<ColumnSection, string[]> {
  return {
    md:  getColumnOrder(locationId, 'md'),
    eod: getColumnOrder(locationId, 'eod'),
  }
}

function getInitialTheme(): 'light' | 'dark' {
  const stored = localStorage.getItem('dvt_theme')
  if (stored === 'dark' || stored === 'light') return stored
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function makeEmptyEntry(locationId: string, date: string): DailyEntry {
  return { location_id: locationId, entry_date: date, data: {}, confidence: {} }
}

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'SET_LOCATION':
      return { ...state, activeLocationId: action.locationId }

    case 'SET_SECTION':
      return { ...state, activeSection: action.section }

    case 'SET_DATE_RANGE':
      return { ...state, dateRange: { start: action.start, end: action.end } }

    case 'SET_THEME':
      return { ...state, theme: action.theme }

    case 'SET_ENTRIES': {
      const byDate: Record<string, DailyEntry> = {}
      for (const entry of action.entries) byDate[entry.entry_date] = entry
      return { ...state, entries: { ...state.entries, [action.locationId]: byDate } }
    }

    case 'SET_CELL': {
      const { locationId, date, key, value, confidence } = action
      const locEntries = state.entries[locationId] ?? {}
      const existing = locEntries[date] ?? makeEmptyEntry(locationId, date)
      const updated: DailyEntry = {
        ...existing,
        data: { ...existing.data, [key]: value },
        confidence: { ...existing.confidence, [key]: confidence },
      }
      const newPending = new Set(state.pendingChanges)
      newPending.add(`${locationId}:${date}`)
      return { ...state, entries: { ...state.entries, [locationId]: { ...locEntries, [date]: updated } }, pendingChanges: newPending }
    }

    case 'SET_COLUMN_ORDER': {
      const { locationId, section, order } = action
      saveColumnOrder(locationId, section, order)
      const existing = state.columnOrders[locationId] ?? getInitialColumnOrders(locationId)
      return { ...state, columnOrders: { ...state.columnOrders, [locationId]: { ...existing, [section]: order } } }
    }

    case 'REMOVE_PENDING': {
      const s = new Set(state.pendingChanges)
      s.delete(action.key)
      return { ...state, pendingChanges: s }
    }

    case 'SET_PARSE_RESULTS':
      return { ...state, parseResults: action.results }

    case 'APPLY_PARSE_RESULT': {
      const { locationId, date, result } = action
      const locEntries = state.entries[locationId] ?? {}
      const existing = locEntries[date] ?? makeEmptyEntry(locationId, date)
      const newData = { ...existing.data }
      const newConf = { ...existing.confidence }
      for (const [key, field] of Object.entries(result.fields)) {
        newData[key] = field.value
        newConf[key] = field.confidence
      }
      const newPending = new Set(state.pendingChanges)
      newPending.add(`${locationId}:${date}`)
      return { ...state, entries: { ...state.entries, [locationId]: { ...locEntries, [date]: { ...existing, data: newData, confidence: newConf } } }, pendingChanges: newPending }
    }

    case 'SET_TODAY_STATUS':
      return { ...state, locationsWithDataToday: action.locationIds }

    case 'SET_SAVE_STATUS':
      return { ...state, saveStatus: action.status }

    case 'SET_LOADING_ENTRIES':
      return { ...state, isLoadingEntries: action.loading }

    case 'SET_LOADING_LOCATIONS':
      return { ...state, isLoadingLocations: action.loading }

    case 'TOGGLE_UPLOAD_PANEL':
      return { ...state, uploadPanelOpen: !state.uploadPanelOpen }

    case 'TOGGLE_EXPORT_MODAL':
      return { ...state, exportModalOpen: !state.exportModalOpen }

    case 'CLOSE_EXPORT_MODAL':
      return { ...state, exportModalOpen: false }

    case 'TOGGLE_SETTINGS_PANEL':
      return { ...state, settingsPanelOpen: !state.settingsPanelOpen }

    case 'SET_LOCATIONS':
      return { ...state, locations: action.locations }

    case 'TOGGLE_LOCATION_HIDDEN': {
      const next = new Set(state.hiddenLocationIds)
      if (next.has(action.locationId)) next.delete(action.locationId)
      else next.add(action.locationId)
      saveHiddenLocations(next) // immediate localStorage write
      return { ...state, hiddenLocationIds: next }
    }

    case 'SET_HIDDEN_LOCATIONS':
      // Server-loaded preferences — update state + localStorage, don't re-trigger save
      saveHiddenLocations(action.ids)
      return { ...state, hiddenLocationIds: action.ids }

    case 'SET_LOCATION_ORDER':
      saveLocationOrder(action.order)
      return { ...state, locationOrder: action.order }

    case 'BUMP_VIEW_REFRESH':
      return { ...state, viewRefreshTrigger: state.viewRefreshTrigger + 1 }

    default:
      return state
  }
}

interface AppContextValue {
  state: AppState
  dispatch: React.Dispatch<Action>
  loadEntries: (locationId: string) => Promise<void>
  savePendingEntry: (locationId: string, date: string) => Promise<void>
  visibleLocations: DVTLocation[]
}

const AppContext = createContext<AppContextValue | null>(null)

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer<Reducer<AppState, Action>>(reducer, {
    activeLocationId: '',
    activeSection: 'eod',
    dateRange: { start: subtractDays(4), end: today() },
    theme: getInitialTheme(),
    entries: {},
    columnOrders: {},
    pendingChanges: new Set(),
    parseResults: [],
    locationsWithDataToday: new Set(),
    saveStatus: 'idle',
    isLoadingEntries: false,
    isLoadingLocations: true,
    uploadPanelOpen: false,
    exportModalOpen: false,
    settingsPanelOpen: false,
    locations: [],
    hiddenLocationIds: loadHiddenLocations(),
    locationOrder: loadLocationOrder(),
    viewRefreshTrigger: 0,
  })

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', state.theme)
    localStorage.setItem('dvt_theme', state.theme)
  }, [state.theme])

  // Load locations — fall back to static config if Supabase table isn't set up yet
  useEffect(() => {
    dispatch({ type: 'SET_LOADING_LOCATIONS', loading: true })

    const timer = setTimeout(() => {
      // If still loading after 6s, use static fallback
      dispatch({ type: 'SET_LOCATIONS', locations: staticLocations() })
      dispatch({ type: 'SET_LOADING_LOCATIONS', loading: false })
    }, 6000)

    fetchLocations()
      .then(locs => {
        clearTimeout(timer)
        const resolved = locs.length > 0 ? locs : staticLocations()
        dispatch({ type: 'SET_LOCATIONS', locations: resolved })
        const firstActive = resolved.find(l => l.is_active)
        if (firstActive) dispatch({ type: 'SET_LOCATION', locationId: firstActive.location_id })
      })
      .catch(() => {
        clearTimeout(timer)
        // Supabase table may not exist yet — use static config
        const fallback = staticLocations()
        dispatch({ type: 'SET_LOCATIONS', locations: fallback })
        if (fallback[0]) dispatch({ type: 'SET_LOCATION', locationId: fallback[0].location_id })
      })
      .finally(() => dispatch({ type: 'SET_LOADING_LOCATIONS', loading: false }))

    return () => clearTimeout(timer)
  }, [])

  // Load preferences from Supabase on mount — server is source of truth,
  // localStorage is just a fast cache for the initial render.
  // We track the last server value so we don't write back what we just read.
  const serverHiddenRef = useRef<string | null>(null) // JSON string for cheap comparison

  useEffect(() => {
    fetchUserPreferences()
      .then(prefs => {
        if (!prefs) return
        const ids = new Set(prefs.hidden_location_ids)
        serverHiddenRef.current = JSON.stringify([...ids].sort())
        dispatch({ type: 'SET_HIDDEN_LOCATIONS', ids })
      })
      .catch(console.error)
  }, [])

  // Debounced save to Supabase whenever hidden locations change.
  // Guard: skip if the value matches what we just loaded from server.
  useEffect(() => {
    const currentJson = JSON.stringify([...state.hiddenLocationIds].sort())
    if (serverHiddenRef.current === null) return // not yet initialized from server
    if (currentJson === serverHiddenRef.current) return // no user change, skip write

    const timer = setTimeout(() => {
      saveUserPreferences({ hidden_location_ids: [...state.hiddenLocationIds] })
        .then(() => { serverHiddenRef.current = currentJson })
        .catch(console.error)
    }, 800)
    return () => clearTimeout(timer)
  }, [state.hiddenLocationIds])

  useEffect(() => {
    const activeIds = state.locations.filter(l => l.is_active).map(l => l.location_id)
    if (activeIds.length === 0) return
    fetchTodayStatus(activeIds)
      .then(ids => dispatch({ type: 'SET_TODAY_STATUS', locationIds: ids }))
      .catch(console.error)
  }, [state.locations])

  const loadEntries = useCallback(async (locationId: string) => {
    if (!locationId) return
    dispatch({ type: 'SET_LOADING_ENTRIES', loading: true })
    try {
      const entries = await fetchEntries(locationId, state.dateRange.start, state.dateRange.end)
      dispatch({ type: 'SET_ENTRIES', locationId, entries })
    } catch (err) {
      console.error('loadEntries error:', err)
    } finally {
      dispatch({ type: 'SET_LOADING_ENTRIES', loading: false })
    }
  }, [state.dateRange.start, state.dateRange.end])

  const savePendingEntry = useCallback(async (locationId: string, date: string) => {
    const entry = state.entries[locationId]?.[date]
    if (!entry) return
    dispatch({ type: 'SET_SAVE_STATUS', status: 'saving' })
    try {
      await upsertEntry(locationId, date, entry.data, entry.confidence)
      dispatch({ type: 'REMOVE_PENDING', key: `${locationId}:${date}` })
      dispatch({ type: 'SET_SAVE_STATUS', status: 'saved' })
      setTimeout(() => dispatch({ type: 'SET_SAVE_STATUS', status: 'idle' }), 1500)
    } catch (err) {
      console.error('savePendingEntry error:', err)
      dispatch({ type: 'SET_SAVE_STATUS', status: 'error' })
    }
  }, [state.entries])

  useEffect(() => {
    loadEntries(state.activeLocationId)
  }, [state.activeLocationId, state.dateRange.start, state.dateRange.end])

  // Active locations that this user hasn't hidden, sorted by custom order
  const visibleLocations = (() => {
    const active = state.locations.filter(
      l => l.is_active && !state.hiddenLocationIds.has(l.location_id)
    )
    if (state.locationOrder.length === 0) return active
    const orderMap = new Map(state.locationOrder.map((id, i) => [id, i]))
    return [...active].sort((a, b) => {
      const ai = orderMap.has(a.location_id) ? (orderMap.get(a.location_id) as number) : Infinity
      const bi = orderMap.has(b.location_id) ? (orderMap.get(b.location_id) as number) : Infinity
      return ai - bi
    })
  })()

  return (
    <AppContext.Provider value={{ state, dispatch, loadEntries, savePendingEntry, visibleLocations }}>
      {children}
    </AppContext.Provider>
  )
}

export function useAppContext(): AppContextValue {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useAppContext must be used within AppProvider')
  return ctx
}

export { COLUMNS }
export type { AppState, Action }
