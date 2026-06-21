import React, { useMemo, useState } from 'react'
import {
  DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent,
} from '@dnd-kit/core'
import { sortableKeyboardCoordinates, arrayMove } from '@dnd-kit/sortable'
import { useAppContext, COLUMNS } from '../../context/AppContext'
import { datesInRange } from '../../lib/dateUtils'
import { ColumnSection } from '../../config/columns'
import { ColumnView } from '../../lib/supabase'
import { ColumnMeta, LegendEntry, getGroupColor } from '../../types/viewMeta'
import { GridHeader } from './GridHeader'
import { GridRow } from './GridRow'
import { TotalsRow } from './TotalsRow'
import { SaveViewModal } from '../ViewManager/SaveViewModal'
import { ViewSelector } from '../ViewManager/ViewSelector'
import { ColumnSettingsModal } from '../ColumnEditor/ColumnSettingsModal'
import { getColumnOrder } from '../../hooks/useColumnOrder'

export function DataGrid() {
  const { state, dispatch } = useAppContext()
  const { activeLocationId, activeSection, dateRange, entries, columnOrders, pendingChanges, parseResults, isLoadingEntries } = state

  const [showSaveView, setShowSaveView] = useState(false)
  const [showColumnSettings, setShowColumnSettings] = useState(false)
  const [viewRefreshTrigger, setViewRefreshTrigger] = useState(0)
  const [columnMeta, setColumnMeta] = useState<Record<string, ColumnMeta>>({})
  const [legend, setLegend] = useState<LegendEntry[]>([])

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
    setColumnMeta(view.column_meta ?? {})
    setLegend(view.legend ?? [])
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

        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {activeLocationId && (() => {
            const loc = state.locations.find(l => l.location_id === activeLocationId)
            return loc ? (
              <span
                className="text-sm font-semibold font-display truncate"
                style={{ color: 'var(--sb-sky)', letterSpacing: '0.03em', maxWidth: 300 }}
              >
                {loc.name}
              </span>
            ) : null
          })()}
        </div>

        {/* View controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowColumnSettings(true)}
            className="text-xs px-3 py-1.5 rounded-md font-semibold transition-colors"
            style={{
              background: 'rgba(183,224,222,0.08)',
              border: '1px solid rgba(183,224,222,0.2)',
              color: 'var(--sb-sky)',
              fontFamily: 'DM Mono, monospace',
            }}
            title="Color groups, notes, type overrides, formulas"
          >
            ⚙ Columns
          </button>
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

      {/* Legend bar — only shown when the active view has legend entries */}
      {legend.length > 0 && (
        <div
          className="flex items-center gap-3 px-4 py-1.5 flex-wrap flex-shrink-0"
          style={{ borderBottom: '1px solid var(--color-border)', background: 'var(--color-card-bg)' }}
        >
          <span className="text-xs font-semibold" style={{ color: 'rgba(183,224,222,0.4)', fontFamily: 'DM Mono, monospace', letterSpacing: '0.06em', flexShrink: 0 }}>
            LEGEND
          </span>
          {legend.map(entry => {
            const gc = getGroupColor(entry.colorId)
            return (
              <div
                key={entry.colorId}
                className="flex items-center gap-1.5 px-2 py-0.5 rounded"
                style={{ background: gc?.tint ?? 'rgba(183,224,222,0.06)', border: `1px solid ${gc?.accent ?? 'var(--color-border)'}` }}
              >
                <span
                  style={{ width: 8, height: 8, borderRadius: '50%', background: gc?.accent ?? 'var(--sb-sky)', flexShrink: 0, display: 'inline-block' }}
                />
                <span className="text-xs" style={{ color: gc?.accent ?? 'var(--sb-sky)', fontFamily: 'DM Mono, monospace' }}>
                  {entry.label}
                </span>
              </div>
            )
          })}
        </div>
      )}

      {/* Grid */}
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <div className="flex-1 overflow-auto relative" style={{ minHeight: 0 }}>
          {isLoadingEntries ? (
            <div className="flex items-center justify-center h-32" style={{ color: 'var(--color-text-secondary)' }}>
              <span className="font-mono-data text-sm">Loading entries…</span>
            </div>
          ) : (
            <table style={{ borderCollapse: 'collapse', width: 'max-content', minWidth: '100%' }}>
              <GridHeader columns={orderedColumns} columnMeta={columnMeta} />
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
                      columnMeta={columnMeta}
                    />
                  ))
                )}
                <TotalsRow columns={orderedColumns} entries={locEntries} dates={dates} columnMeta={columnMeta} />
              </tbody>
            </table>
          )}
        </div>
      </DndContext>

      {showColumnSettings && (
        <ColumnSettingsModal
          section={activeSection}
          columns={orderedColumns}
          initialMeta={columnMeta}
          initialLegend={legend}
          onApply={(meta, leg) => { setColumnMeta(meta); setLegend(leg); setShowColumnSettings(false) }}
          onClose={() => setShowColumnSettings(false)}
        />
      )}

      {showSaveView && (
        <SaveViewModal
          section={activeSection}
          currentColumnOrder={colOrder}
          columnMeta={columnMeta}
          legend={legend}
          onSaved={() => { setShowSaveView(false); setViewRefreshTrigger(t => t + 1) }}
          onClose={() => setShowSaveView(false)}
        />
      )}
    </div>
  )
}
