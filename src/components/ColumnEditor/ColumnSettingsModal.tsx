import React, { useState, useMemo, useRef } from 'react'
import { ColumnDef, ColumnType } from '../../config/columns'
import { ColumnMeta, LegendEntry, GROUP_COLORS, getGroupColor } from '../../types/viewMeta'

interface Props {
  section: 'md' | 'eod'
  columns: ColumnDef[]
  initialMeta: Record<string, ColumnMeta>
  initialLegend: LegendEntry[]
  onApply: (meta: Record<string, ColumnMeta>, legend: LegendEntry[]) => void
  onClose: () => void
}

const TYPE_OPTIONS: { value: ColumnType; label: string }[] = [
  { value: 'number',   label: 'Number'   },
  { value: 'currency', label: 'Currency' },
  { value: 'percent',  label: 'Percent'  },
  { value: 'text',     label: 'Text'     },
]

// Inserts text at the input cursor position
function insertAtCursor(el: HTMLInputElement, text: string) {
  const start = el.selectionStart ?? el.value.length
  const end   = el.selectionEnd   ?? el.value.length
  const newVal = el.value.slice(0, start) + text + el.value.slice(end)
  const nativeInputValue = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')!
  nativeInputValue.set!.call(el, newVal)
  el.dispatchEvent(new Event('input', { bubbles: true }))
  requestAnimationFrame(() => {
    el.selectionStart = el.selectionEnd = start + text.length
    el.focus()
  })
}

export function ColumnSettingsModal({ section, columns, initialMeta, initialLegend, onApply, onClose }: Props) {
  const [meta, setMeta] = useState<Record<string, ColumnMeta>>(() =>
    Object.fromEntries(columns.map(c => [c.key, { ...(initialMeta[c.key] ?? {}) }]))
  )
  const [legend, setLegend] = useState<LegendEntry[]>(() => [...initialLegend])
  const [filter, setFilter] = useState('')
  const [expandedFormula, setExpandedFormula] = useState<string | null>(null)
  const formulaRefs = useRef<Record<string, HTMLInputElement | null>>({})

  const updateMeta = (key: string, patch: Partial<ColumnMeta>) =>
    setMeta(prev => ({ ...prev, [key]: { ...prev[key], ...patch } }))

  const filteredCols = useMemo(() =>
    filter.trim() ? columns.filter(c => c.label.toLowerCase().includes(filter.toLowerCase())) : columns,
    [columns, filter]
  )

  // Legend helpers
  const usedColorIds = new Set(legend.map(l => l.colorId))
  const availableColors = GROUP_COLORS.filter(g => !usedColorIds.has(g.id))

  const addLegendEntry = () => {
    if (availableColors.length === 0) return
    setLegend(prev => [...prev, { colorId: availableColors[0].id, label: '' }])
  }
  const updateLegend = (i: number, patch: Partial<LegendEntry>) =>
    setLegend(prev => prev.map((e, idx) => idx === i ? { ...e, ...patch } : e))
  const removeLegend = (i: number) =>
    setLegend(prev => prev.filter((_, idx) => idx !== i))

  const handleApply = () => {
    // Strip empty/default meta entries to keep the object lean
    const cleaned: Record<string, ColumnMeta> = {}
    for (const [k, m] of Object.entries(meta)) {
      const entry: ColumnMeta = {}
      if (m.colorId) entry.colorId = m.colorId
      if (m.note?.trim()) entry.note = m.note.trim()
      if (m.type) entry.type = m.type
      if (m.formula?.trim()) entry.formula = m.formula.trim()
      if (Object.keys(entry).length > 0) cleaned[k] = entry
    }
    onApply(cleaned, legend.filter(l => l.label.trim()))
  }

  const inputSm: React.CSSProperties = {
    background: 'var(--color-input-bg)',
    border: '1px solid var(--color-border)',
    borderRadius: 5,
    padding: '3px 7px',
    color: 'var(--color-text-primary)',
    fontSize: 11,
    fontFamily: 'DM Mono, monospace',
    outline: 'none',
    width: '100%',
  }

  const selectSm: React.CSSProperties = {
    ...inputSm,
    cursor: 'pointer',
    paddingRight: 4,
  }

  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-50"
      style={{ background: 'rgba(0,0,0,0.65)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        className="flex flex-col rounded-xl shadow-2xl overflow-hidden"
        style={{
          width: 'min(96vw, 860px)',
          maxHeight: '88vh',
          background: 'var(--color-card-bg)',
          border: '1px solid var(--color-border)',
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-5 py-3 flex-shrink-0"
          style={{ background: 'var(--color-topbar-bg)', borderBottom: '1px solid var(--color-border)' }}
        >
          <h2 className="font-display font-bold text-base" style={{ color: 'var(--sb-sky)' }}>
            Column Settings
          </h2>
          <div className="flex items-center gap-3">
            <span className="text-xs px-2 py-0.5 rounded" style={{ background: 'rgba(183,224,222,0.1)', color: 'var(--sb-sky)', fontFamily: 'DM Mono, monospace' }}>
              {section === 'md' ? 'Mid-Day' : 'End of Day'} · {columns.length} cols
            </span>
            <button onClick={onClose} style={{ color: 'var(--color-text-secondary)', fontSize: 22, lineHeight: 1 }}>×</button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {/* Legend section */}
          <div className="px-5 py-3" style={{ borderBottom: '1px solid var(--color-border)' }}>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-semibold" style={{ color: 'rgba(183,224,222,0.5)', fontFamily: 'DM Mono, monospace', letterSpacing: '0.07em' }}>
                LEGEND
              </span>
              <button
                onClick={addLegendEntry}
                disabled={availableColors.length === 0}
                className="text-xs px-2 py-0.5 rounded transition-opacity"
                style={{
                  background: 'rgba(183,224,222,0.08)',
                  border: '1px solid rgba(183,224,222,0.2)',
                  color: 'var(--sb-sky)',
                  fontFamily: 'DM Mono, monospace',
                  opacity: availableColors.length === 0 ? 0.4 : 1,
                  cursor: availableColors.length === 0 ? 'default' : 'pointer',
                }}
              >
                + Add Group
              </button>
            </div>

            {legend.length === 0 ? (
              <p className="text-xs" style={{ color: 'rgba(183,224,222,0.3)', fontFamily: 'DM Mono, monospace' }}>
                No legend groups yet. Add a group, assign a color, and give it a label.
              </p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {legend.map((entry, i) => {
                  const gc = getGroupColor(entry.colorId)
                  return (
                    <div
                      key={i}
                      className="flex items-center gap-1.5 px-2 py-1 rounded-lg"
                      style={{ background: gc?.tint ?? 'rgba(183,224,222,0.06)', border: `1px solid ${gc?.accent ?? 'var(--color-border)'}` }}
                    >
                      {/* Color picker for this legend entry */}
                      <div className="flex items-center gap-1">
                        {GROUP_COLORS.filter(g => g.id === entry.colorId || !usedColorIds.has(g.id) || g.id === entry.colorId).map(g => (
                          <button
                            key={g.id}
                            onClick={() => updateLegend(i, { colorId: g.id })}
                            title={g.label}
                            style={{
                              width: 10,
                              height: 10,
                              borderRadius: '50%',
                              background: g.accent,
                              border: g.id === entry.colorId ? `2px solid #fff` : '1px solid transparent',
                              outline: g.id === entry.colorId ? `2px solid ${g.accent}` : 'none',
                              cursor: 'pointer',
                              flexShrink: 0,
                            }}
                          />
                        ))}
                      </div>
                      <input
                        value={entry.label}
                        onChange={e => updateLegend(i, { label: e.target.value })}
                        placeholder="Label…"
                        style={{ ...inputSm, width: 120, border: 'none', background: 'transparent', padding: '1px 2px' }}
                      />
                      <button onClick={() => removeLegend(i)} style={{ color: 'rgba(183,224,222,0.4)', fontSize: 14, lineHeight: 1 }}>×</button>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Column filter */}
          <div className="px-5 pt-3 pb-2 flex-shrink-0" style={{ borderBottom: '1px solid var(--color-border)' }}>
            <input
              value={filter}
              onChange={e => setFilter(e.target.value)}
              placeholder="Filter columns…"
              style={{ ...inputSm, width: 240 }}
            />
          </div>

          {/* Column table */}
          <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
            <colgroup>
              <col style={{ width: '26%' }} />
              <col style={{ width: '18%' }} />
              <col style={{ width: '18%' }} />
              <col style={{ width: '11%' }} />
              <col style={{ width: '27%' }} />
            </colgroup>
            <thead>
              <tr style={{ background: 'var(--color-topbar-bg)', position: 'sticky', top: 0, zIndex: 10 }}>
                {['COLUMN', 'COLOR GROUP', 'NOTE', 'TYPE', 'FORMULA'].map(h => (
                  <th
                    key={h}
                    className="text-left text-xs font-semibold px-3 py-2"
                    style={{ color: 'rgba(183,224,222,0.4)', fontFamily: 'DM Mono, monospace', borderBottom: '1px solid var(--color-border)', letterSpacing: '0.06em' }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredCols.map((col, idx) => {
                const m = meta[col.key] ?? {}
                const gc = getGroupColor(m.colorId)
                const isFormulaExpanded = expandedFormula === col.key

                return (
                  <tr
                    key={col.key}
                    style={{ background: idx % 2 === 0 ? 'var(--color-card-bg)' : 'var(--color-content-bg)', borderBottom: '1px solid var(--color-border)' }}
                  >
                    {/* Column name */}
                    <td className="px-3 py-2">
                      <div className="text-xs font-semibold truncate" style={{ color: gc?.accent ?? 'var(--color-text-primary)', fontFamily: 'Chakra Petch, sans-serif' }}>
                        {col.label}
                      </div>
                      <div className="text-xs" style={{ color: 'rgba(183,224,222,0.3)', fontFamily: 'DM Mono, monospace', fontSize: 9 }}>
                        {col.key}
                      </div>
                    </td>

                    {/* Color swatches */}
                    <td className="px-3 py-2">
                      <div className="flex flex-wrap gap-1 items-center">
                        <button
                          onClick={() => updateMeta(col.key, { colorId: undefined })}
                          title="None"
                          style={{
                            width: 12,
                            height: 12,
                            borderRadius: '50%',
                            background: 'transparent',
                            border: !m.colorId ? '2px solid var(--sb-sky)' : '1px solid rgba(183,224,222,0.3)',
                            cursor: 'pointer',
                          }}
                        />
                        {GROUP_COLORS.map(g => (
                          <button
                            key={g.id}
                            onClick={() => updateMeta(col.key, { colorId: g.id })}
                            title={g.label}
                            style={{
                              width: 12,
                              height: 12,
                              borderRadius: '50%',
                              background: g.accent,
                              border: m.colorId === g.id ? '2px solid #fff' : '1px solid transparent',
                              outline: m.colorId === g.id ? `2px solid ${g.accent}` : 'none',
                              cursor: 'pointer',
                              flexShrink: 0,
                            }}
                          />
                        ))}
                      </div>
                    </td>

                    {/* Note */}
                    <td className="px-3 py-2">
                      <input
                        value={m.note ?? ''}
                        onChange={e => updateMeta(col.key, { note: e.target.value })}
                        placeholder="Note…"
                        style={inputSm}
                      />
                    </td>

                    {/* Type */}
                    <td className="px-3 py-2">
                      <select
                        value={m.type ?? col.type}
                        onChange={e => updateMeta(col.key, { type: e.target.value as ColumnType })}
                        style={selectSm}
                      >
                        {TYPE_OPTIONS.map(o => (
                          <option key={o.value} value={o.value}>{o.label}</option>
                        ))}
                      </select>
                    </td>

                    {/* Formula */}
                    <td className="px-3 py-2">
                      <div>
                        <div className="flex items-center gap-1">
                          <span style={{ color: 'rgba(183,224,222,0.35)', fontSize: 11, flexShrink: 0, fontFamily: 'DM Mono, monospace' }}>=</span>
                          <input
                            ref={el => { formulaRefs.current[col.key] = el }}
                            value={m.formula ?? ''}
                            onChange={e => updateMeta(col.key, { formula: e.target.value })}
                            onFocus={() => setExpandedFormula(col.key)}
                            placeholder="[col_key]+[col_key2]"
                            style={{ ...inputSm, fontFamily: 'DM Mono, monospace', fontSize: 10 }}
                          />
                        </div>
                        {isFormulaExpanded && (
                          <div className="mt-1">
                            <div className="text-xs mb-1" style={{ color: 'rgba(183,224,222,0.3)', fontFamily: 'DM Mono, monospace' }}>
                              Click a column key to insert:
                            </div>
                            <div className="flex flex-wrap gap-1 max-h-16 overflow-y-auto">
                              {columns.filter(c => c.key !== col.key).map(c => (
                                <button
                                  key={c.key}
                                  onMouseDown={e => {
                                    e.preventDefault()
                                    const el = formulaRefs.current[col.key]
                                    if (el) insertAtCursor(el, `[${c.key}]`)
                                    updateMeta(col.key, { formula: el?.value ?? (m.formula ?? '') })
                                  }}
                                  style={{
                                    fontSize: 9,
                                    fontFamily: 'DM Mono, monospace',
                                    padding: '1px 5px',
                                    borderRadius: 4,
                                    background: 'rgba(183,224,222,0.08)',
                                    border: '1px solid rgba(183,224,222,0.15)',
                                    color: 'var(--sb-sky)',
                                    cursor: 'pointer',
                                    whiteSpace: 'nowrap',
                                  }}
                                >
                                  {c.key}
                                </button>
                              ))}
                            </div>
                            <button
                              className="mt-1 text-xs"
                              style={{ color: 'rgba(183,224,222,0.3)', fontFamily: 'DM Mono, monospace' }}
                              onClick={() => setExpandedFormula(null)}
                            >
                              collapse ▲
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div
          className="flex items-center justify-between gap-3 px-5 py-3 flex-shrink-0"
          style={{ borderTop: '1px solid var(--color-border)', background: 'var(--color-topbar-bg)' }}
        >
          <p className="text-xs" style={{ color: 'rgba(183,224,222,0.3)', fontFamily: 'DM Mono, monospace' }}>
            Changes apply to the current view. Use "Save View As" to persist them.
          </p>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded-lg text-sm font-semibold"
              style={{ background: 'var(--color-input-bg)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)', fontFamily: 'Chakra Petch, sans-serif' }}
            >
              Cancel
            </button>
            <button
              onClick={handleApply}
              className="px-4 py-1.5 rounded-lg text-sm font-semibold"
              style={{ background: 'var(--sb-sky)', color: 'var(--sb-navy)', fontFamily: 'Chakra Petch, sans-serif' }}
            >
              Apply
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
