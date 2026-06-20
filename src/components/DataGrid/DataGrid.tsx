import React, { useMemo, useState } from 'react'
import {
  DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent,
} from '@dnd-kit/core'
import { sortableKeyboardCoordinates, arrayMove } from '@dnd-kit/sortable'
import { useAppContext, COLUMNS } from '../../context/AppContext'
import { datesInRange } from '../../lib/dateUtils'
import { ColumnSection } from '../../config/columns'
import { ColumnView } from '../../lib/supabase'
import { GridHeader } from './GridHeader'
import { GridRow } from './GridRow'
import { TotalsRow } from './TotalsRow'
import { SaveViewModal } from '../ViewManager/SaveViewModal'
import { ViewSelector } from '../ViewManager/ViewSelector'
import { getColumnOrder } from '../../hooks/useColumnOrder'

export function DataGrid() {
  const { state, dispatch } = useAppContext()
  const { activeLocationId, activeSection, dateRange, entries, columnOrders, pendingChanges, parseResults, isLoadingEntries } = state

  const [showSaveView, setShowSaveView] = useState(false)
  const [viewRefreshTrigger, setViewRefreshTrigger] = useState(0)

  const locEntries = entries[activeLocationId] ?? {}
  const dates = useMemo(() => datesInRange(dateRange.start, dateRange.end), [dateRange.start, dateRange.end])

  const sectionCols = COLUMNS.filter(c => c.section === activeSection)

  const colOrder = columnOrders[activeLocationId]?.[activeSection]
    ?? getColumnOrder(activeLocationId, activeSection)

  const orderedColumns = useMemo(
    () => colOrder.map(key => COLUMNS.find(c => c.key === key)).filter(Boolean) as typeof COLUMNS,
    [colOrder]
  )

  const parseSourceMap = useMemo(() => {
    const map: Record<string, { filename: string; sourceCell?: string }> = {}
    for (const result of parseResults) {
      for (const [key, field] of Object.entries(result.fields)) {
        map[key] = { filename: result.filename, sourceCell: field.sourceCell }
      }
    }
    return map
  }, [parseResults])

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIdx = colOrder.indexOf(String(active.id))
    const newIdx = colOrder.indexOf(String(over.id))
    dispatch({ type: 'SET_COLUMN_ORDER', locationId: activeLocationId, section: activeSection, order: arrayMove(colOrder, oldIdx, newIdx) })
  }

  const applyView = (view: ColumnView) => {
    const validKeys = view.column_keys.filter(k => sectionCols.some(c => c.key === k))
    const missing = sectionCols.filter(c => !validKeys.includes(c.key)).map(c => c.key)
    dispatch({ type: 'SET_COLUMN_ORDER', locationId: activeLocationId, section: activeSection, order: [...validKeys, ...missing] })
  }

  const sectionTabStyle = (s: ColumnSection): React.CSSProperties => ({
    padding: '6px 16px',
    fontSize: 12,
    fontFamily: 'Chakra Petch, sans-serif',
    fontWeight: 700,
    letterSpacing: '0.05em',
    borderRadius: 6,
    cursor: 'pointer',
    border: 'none',
    background: activeSection === s ? 'var(--sb-sky)' : 'rgba(183,224,222,0.08)',
    color: activeSection === s ? 'var(--sb-navy)' : 'var(--sb-sky)',
    transition: 'all 0.15s',
  })

  return (
    <div className="flex-1 flex flex-col overflow-hidden" style={{ minHeight: 0 }}>
      {/* Section tabs + view controls toolbar */}
      <div
        className="flex items-center gap-3 px-4 py-2 flex-wrap flex-shrink-0"
        style={{ borderBottom: '1px solid var(--color-border)', background: 'var(--color-card-bg)' }}
      >
        {/* Section tabs */}
        <div className="flex items-center gap-1">
          <button style={sectionTabStyle('eod')} onClick={() => dispatch({ type: 'SET_SECTION', section: 'eod' })}>
            End of Day
          </button>
          <button style={sectionTabStyle('md')} onClick={() => dispatch({ type: 'SET_SECTION', section: 'md' })}>
            Mid-Day
          </button>
        </div>

        <div style={{ flex: 1 }} />

        {/* View controls */}
        <div className="flex items-center gap-2">
          <ViewSelector section={activeSection} onApply={applyView} refreshTrigger={viewRefreshTrigger} />
          <button
            onClick={() => setShowSaveView(true)}
            className="text-xs px-3 py-1.5 rounded-md font-semibold transition-colors"
            style={{
              background: 'rgba(183,224,222,0.08)',
              border: '1px solid rgba(183,224,222,0.2)',
              color: 'var(--sb-sky)',
              fontFamily: 'DM Mono, monospace',
            }}
          >
            Save View As…
          </button>
        </div>
      </div>

      {/* Grid */}
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <div className="flex-1 overflow-auto relative" style={{ minHeight: 0 }}>
          {isLoadingEntries ? (
            <div className="flex items-center justify-center h-32" style={{ color: 'var(--color-text-secondary)' }}>
              <span className="font-mono-data text-sm">Loading entries…</span>
            </div>
          ) : (
            <table style={{ borderCollapse: 'collapse', width: 'max-content', minWidth: '100%' }}>
              <GridHeader columns={orderedColumns} />
              <tbody>
                {dates.length === 0 ? (
                  <tr>
                    <td colSpan={orderedColumns.length + 1} className="text-center py-12 text-sm" style={{ color: 'var(--color-text-secondary)', fontFamily: 'DM Mono, monospace' }}>
                      No dates in selected range
                    </td>
                  </tr>
                ) : (
                  dates.map((date, idx) => (
                    <GridRow
                      key={date}
                      locationId={activeLocationId}
                      date={date}
                      entry={locEntries[date]}
                      columns={orderedColumns}
                      isPendingRow={pendingChanges.has(`${activeLocationId}:${date}`)}
                      colKeys={colOrder}
                      rowIndex={idx}
                      totalRows={dates.length}
                      parseSourceMap={parseSourceMap}
                    />
                  ))
                )}
                <TotalsRow columns={orderedColumns} entries={locEntries} dates={dates} />
              </tbody>
            </table>
          )}
        </div>
      </DndContext>

      {showSaveView && (
        <SaveViewModal
          section={activeSection}
          currentColumnOrder={colOrder}
          onSaved={() => { setShowSaveView(false); setViewRefreshTrigger(t => t + 1) }}
          onClose={() => setShowSaveView(false)}
        />
      )}
    </div>
  )
}
