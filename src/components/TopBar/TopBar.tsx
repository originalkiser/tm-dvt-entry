import React from 'react'
import { useAppContext } from '../../context/AppContext'
import { DateRangePicker } from './DateRangePicker'
import { ThemeToggle } from './ThemeToggle'
import { ExportButton } from './ExportButton'
export function TopBar() {
  const { state, dispatch } = useAppContext()

  const saveLabel =
    state.saveStatus === 'saving'
      ? 'Saving…'
      : state.saveStatus === 'saved'
      ? '✓ Saved'
      : state.saveStatus === 'error'
      ? '⚠ Save failed'
      : null

  const saveLabelColor =
    state.saveStatus === 'error'
      ? 'var(--color-danger)'
      : state.saveStatus === 'saved'
      ? 'var(--color-success)'
      : 'rgba(183,224,222,0.6)'

  return (
    <header
      className="flex items-center gap-4 px-4 py-2 flex-shrink-0 flex-wrap"
      style={{
        background: 'var(--color-topbar-bg)',
        borderBottom: '1px solid rgba(183,224,222,0.15)',
        minHeight: 52,
      }}
    >
      {/* Left: date range + upload */}
      <div className="flex items-center gap-3 flex-1 min-w-0 flex-wrap">
        <DateRangePicker />
        <button
          onClick={() => dispatch({ type: 'TOGGLE_UPLOAD_PANEL' })}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs transition-colors"
          style={{
            background: state.uploadPanelOpen ? 'rgba(183,224,222,0.2)' : 'rgba(183,224,222,0.08)',
            color: 'var(--sb-sky)',
            border: '1px solid rgba(183,224,222,0.25)',
            fontFamily: 'DM Mono, monospace',
          }}
        >
          ↑ Upload Files {state.uploadPanelOpen ? '▲' : '▼'}
        </button>
      </div>

      {/* Right: save status, theme toggle, export */}
      <div className="flex items-center gap-3 flex-shrink-0">
        {saveLabel && (
          <span className="text-xs font-mono" style={{ color: saveLabelColor }}>
            {saveLabel}
          </span>
        )}
        {state.saveStatus === 'error' && (
          <button
            className="text-xs underline"
            style={{ color: 'var(--color-danger)' }}
            onClick={() => {
              // Re-trigger save for all pending
            }}
          >
            Retry
          </button>
        )}
        <ThemeToggle />
        <ExportButton />
      </div>
    </header>
  )
}
