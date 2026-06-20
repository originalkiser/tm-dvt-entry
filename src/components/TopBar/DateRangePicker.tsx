import React from 'react'
import { useAppContext } from '../../context/AppContext'
import { today, subtractDays } from '../../lib/dateUtils'

export function DateRangePicker() {
  const { state, dispatch } = useAppContext()

  const setPreset = (days: number) => {
    dispatch({ type: 'SET_DATE_RANGE', start: subtractDays(days - 1), end: today() })
  }

  const presets = [
    { label: 'Last 5D', days: 5 },
    { label: 'Last 7D', days: 7 },
    { label: 'Last 30D', days: 30 },
  ]

  const inputStyle: React.CSSProperties = {
    background: 'rgba(183,224,222,0.08)',
    border: '1px solid rgba(183,224,222,0.2)',
    color: '#fff',
    borderRadius: 6,
    padding: '4px 8px',
    fontSize: 13,
    fontFamily: 'DM Mono, monospace',
  }

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <input
        type="date"
        value={state.dateRange.start}
        onChange={(e) => dispatch({ type: 'SET_DATE_RANGE', start: e.target.value, end: state.dateRange.end })}
        style={inputStyle}
      />
      <span style={{ color: 'rgba(183,224,222,0.5)', fontSize: 12 }}>→</span>
      <input
        type="date"
        value={state.dateRange.end}
        onChange={(e) => dispatch({ type: 'SET_DATE_RANGE', start: state.dateRange.start, end: e.target.value })}
        style={inputStyle}
      />
      <div className="flex items-center gap-1">
        {presets.map((p) => (
          <button
            key={p.days}
            onClick={() => setPreset(p.days)}
            className="text-xs px-2 py-1 rounded transition-colors"
            style={{
              background: 'rgba(183,224,222,0.1)',
              color: 'var(--sb-sky)',
              border: '1px solid rgba(183,224,222,0.2)',
              fontFamily: 'DM Mono, monospace',
            }}
          >
            {p.label}
          </button>
        ))}
      </div>
    </div>
  )
}
