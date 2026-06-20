import React from 'react'
import { useAppContext } from '../../context/AppContext'

export function ThemeToggle() {
  const { state, dispatch } = useAppContext()
  const isDark = state.theme === 'dark'

  return (
    <button
      onClick={() => dispatch({ type: 'SET_THEME', theme: isDark ? 'light' : 'dark' })}
      className="flex items-center justify-center w-8 h-8 rounded-md transition-colors"
      style={{
        background: 'rgba(183,224,222,0.12)',
        color: 'var(--sb-sky)',
        border: '1px solid rgba(183,224,222,0.2)',
      }}
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {isDark ? '☀' : '🌙'}
    </button>
  )
}
