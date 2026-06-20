import React, { useMemo } from 'react'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import { sortableKeyboardCoordinates, arrayMove } from '@dnd-kit/sortable'
import { useAppContext, COLUMNS } from '../../context/AppContext'
import { datesInRange } from '../../lib/dateUtils'
import { GridHeader } from './GridHeader'
import { GridRow } from './GridRow'
import { TotalsRow } from './TotalsRow'

export function DataGrid() {
  const { state, dispatch } = useAppContext()
  const { activeLocationId, dateRange, entries, columnOrders, pendingChanges, parseResults, isLoadingEntries } = state

  const locEntries = entries[activeLocationId] ?? {}
  const dates = useMemo(() => datesInRange(dateRange.start, dateRange.end), [dateRange.start, dateRange.end])

  const colOrder = columnOrders[activeLocationId] ?? COLUMNS.map((c) => c.key)
  const orderedColumns = useMemo(
    () =>
      colOrder
        .map((key) => COLUMNS.find((c) => c.key === key))
        .filter(Boolean) as typeof COLUMNS,
    [colOrder]
  )

  // Build parse source map from most recent parse result
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
    const newOrder = arrayMove(colOrder, oldIdx, newIdx)
    dispatch({ type: 'SET_COLUMN_ORDER', locationId: activeLocationId, order: newOrder })
  }

  if (isLoadingEntries) {
    return (
      <div className="flex-1 flex items-center justify-center" style={{ color: 'var(--color-text-secondary)' }}>
        <span className="font-mono-data text-sm">Loading entries…</span>
      </div>
    )
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <div className="flex-1 overflow-auto relative" style={{ minHeight: 0 }}>
        <table
          style={{
            borderCollapse: 'collapse',
            width: 'max-content',
            minWidth: '100%',
          }}
        >
          <GridHeader columns={orderedColumns} />
          <tbody>
            {dates.length === 0 ? (
              <tr>
                <td
                  colSpan={orderedColumns.length + 1}
                  className="text-center py-12 text-sm"
                  style={{ color: 'var(--color-text-secondary)', fontFamily: 'DM Mono, monospace' }}
                >
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
      </div>
    </DndContext>
  )
}
