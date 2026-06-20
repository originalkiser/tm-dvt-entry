import React from 'react'
import { useAppContext } from '../../context/AppContext'

export function ExportButton() {
  const { dispatch } = useAppContext()

  return (
    <button
      onClick={() => dispatch({ type: 'TOGGLE_EXPORT_MODAL' })}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-semibold transition-colors"
      style={{
        background: 'var(--sb-sky)',
        color: 'var(--sb-navy)',
        fontFamily: 'Chakra Petch, sans-serif',
      }}
    >
      ↗ Export
    </button>
  )
}
