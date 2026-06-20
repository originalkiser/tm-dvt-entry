import React, { createContext, useContext, useReducer, useEffect, useCallback, Reducer } from 'react'
import { LOCATIONS } from '../config/locations'
import { COLUMNS } from '../config/columns'
import { DailyEntry, fetchEntries, upsertEntry, fetchTodayStatus } from '../lib/supabase'
import { today, subtractDays } from '../lib/dateUtils'
import { getColumnOrder, saveColumnOrder } from '../hooks/useColumnOrder'
import { ParseResult } from '../lib/parseEngine'

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error'

interface AppState {
  activeLocationId: string
  dateRange: { start: string; end: string }
  theme: 'light' | 'dark'
  entries: Record<string, Record<string, DailyEntry>>
  columnOrders: Record<string, string[]>
  pendingChanges: Set<string>
  parseResults: ParseResult[]
  locationsWithDataToday: Set<string>
  saveStatus: SaveStatus
  isLoadingEntries: boolean
  uploadPanelOpen: boolean
  exportModalOpen: boolean
}

type Action =
  | { type: 'SET_LOCATION'; locationId: string }
  | { type: 'SET_DATE_RANGE'; start: string; end: string }
  | { type: 'SET_THEME'; theme: 'light' | 'dark' }
  | { type: 'SET_ENTRIES'; locationId: string; entries: DailyEntry[] }
  | { type: 'SET_CELL'; locationId: string; date: string; key: string; value: unknown; confidence: 'certain' | 'uncertain' | 'manual' }
  | { type: 'SET_COLUMN_ORDER'; locationId: string; order: string[] }
  | { type: 'ADD_PENDING'; key: string }
  | { type: 'REMOVE_PENDING'; key: string }
  | { type: 'SET_PARSE_RESULTS'; results: ParseResult[] }
  | { type: 'APPLY_PARSE_RESULT'; locationId: string; date: string; result: ParseResult }
  | { type: 'SET_TODAY_STATUS'; locationIds: Set<string> }
  | { type: 'SET_SAVE_STATUS'; status: SaveStatus }
  | { type: 'SET_LOADING_ENTRIES'; loading: boolean }
  | { type: 'TOGGLE_UPLOAD_PANEL' }
  | { type: 'TOGGLE_EXPORT_MODAL' }
  | { type: 'CLOSE_EXPORT_MODAL' }

function getInitialColumnOrders(): Record<string, string[]> {
  const orders: Record<string, string[]> = {}
  for (const loc of LOCATIONS) {
    orders[loc.id] = getColumnOrder(loc.id)
  }
  return orders
}

function getInitialTheme(): 'light' | 'dark' {
  const stored = localStorage.getItem('dvt_theme')
  if (stored === 'dark' || stored === 'light') return stored
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function makeEmptyEntry(locationId: string, date: string): DailyEntry {
  return {
    location_id: locationId,
    entry_date: date,
    data: {},
    confidence: {},
  }
}

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'SET_LOCATION':
      return { ...state, activeLocationId: action.locationId }

    case 'SET_DATE_RANGE':
      return { ...state, dateRange: { start: action.start, end: action.end } }

    case 'SET_THEME':
      return { ...state, theme: action.theme }

    case 'SET_ENTRIES': {
      const byDate: Record<string, DailyEntry> = {}
      for (const entry of action.entries) {
        byDate[entry.entry_date] = entry
      }
      return {
        ...state,
        entries: {
          ...state.entries,
          [action.locationId]: byDate,
        },
      }
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
      const pendingKey = `${locationId}:${date}`
      const newPending = new Set(state.pendingChanges)
      newPending.add(pendingKey)
      return {
        ...state,
        entries: {
          ...state.entries,
          [locationId]: { ...locEntries, [date]: updated },
        },
        pendingChanges: newPending,
      }
    }

    case 'SET_COLUMN_ORDER': {
      saveColumnOrder(action.locationId, action.order)
      return {
        ...state,
        columnOrders: { ...state.columnOrders, [action.locationId]: action.order },
      }
    }

    case 'ADD_PENDING': {
      const s = new Set(state.pendingChanges)
      s.add(action.key)
      return { ...state, pendingChanges: s }
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
      const newConfidence = { ...existing.confidence }
      for (const [key, field] of Object.entries(result.fields)) {
        newData[key] = field.value
        newConfidence[key] = field.confidence
      }
      const updated: DailyEntry = { ...existing, data: newData, confidence: newConfidence }
      const pendingKey = `${locationId}:${date}`
      const newPending = new Set(state.pendingChanges)
      newPending.add(pendingKey)
      return {
        ...state,
        entries: {
          ...state.entries,
          [locationId]: { ...locEntries, [date]: updated },
        },
        pendingChanges: newPending,
      }
    }

    case 'SET_TODAY_STATUS':
      return { ...state, locationsWithDataToday: action.locationIds }

    case 'SET_SAVE_STATUS':
      return { ...state, saveStatus: action.status }

    case 'SET_LOADING_ENTRIES':
      return { ...state, isLoadingEntries: action.loading }

    case 'TOGGLE_UPLOAD_PANEL':
      return { ...state, uploadPanelOpen: !state.uploadPanelOpen }

    case 'TOGGLE_EXPORT_MODAL':
      return { ...state, exportModalOpen: !state.exportModalOpen }

    case 'CLOSE_EXPORT_MODAL':
      return { ...state, exportModalOpen: false }

    default:
      return state
  }
}

interface AppContextValue {
  state: AppState
  dispatch: React.Dispatch<Action>
  loadEntries: (locationId: string) => Promise<void>
  savePendingEntry: (locationId: string, date: string) => Promise<void>
}

const AppContext = createContext<AppContextValue | null>(null)

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer<Reducer<AppState, Action>>(reducer, {
    activeLocationId: LOCATIONS[0].id,
    dateRange: { start: subtractDays(4), end: today() },
    theme: getInitialTheme(),
    entries: {},
    columnOrders: getInitialColumnOrders(),
    pendingChanges: new Set(),
    parseResults: [],
    locationsWithDataToday: new Set(),
    saveStatus: 'idle',
    isLoadingEntries: false,
    uploadPanelOpen: false,
    exportModalOpen: false,
  })

  // Apply theme to document
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', state.theme)
    localStorage.setItem('dvt_theme', state.theme)
  }, [state.theme])

  // Load today's status for sidebar dots
  useEffect(() => {
    fetchTodayStatus(LOCATIONS.map((l) => l.id))
      .then((ids) => dispatch({ type: 'SET_TODAY_STATUS', locationIds: ids }))
      .catch(console.error)
  }, [])

  const loadEntries = useCallback(async (locationId: string) => {
    dispatch({ type: 'SET_LOADING_ENTRIES', loading: true })
    try {
      const entries = await fetchEntries(
        locationId,
        state.dateRange.start,
        state.dateRange.end
      )
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

  // Load entries when location or date range changes
  useEffect(() => {
    loadEntries(state.activeLocationId)
  }, [state.activeLocationId, state.dateRange.start, state.dateRange.end])

  return (
    <AppContext.Provider value={{ state, dispatch, loadEntries, savePendingEntry }}>
      {children}
    </AppContext.Provider>
  )
}

export function useAppContext(): AppContextValue {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useAppContext must be used within AppProvider')
  return ctx
}

export type { AppState, Action }
// Re-export COLUMNS for convenience
export { COLUMNS }
