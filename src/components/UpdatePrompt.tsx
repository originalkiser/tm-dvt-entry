import React from 'react'
import { useRegisterSW } from 'virtual:pwa-register/react'

export function UpdatePrompt() {
  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW()

  if (!needRefresh) return null

  return (
    <div
      className="fixed bottom-4 right-4 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-2xl"
      style={{
        background: 'var(--color-card-bg)',
        border: '1px solid var(--sb-sky)',
        maxWidth: 340,
        animation: 'slideUp 0.2s ease-out',
      }}
    >
      <style>{`
        @keyframes slideUp {
          from { transform: translateY(12px); opacity: 0; }
          to   { transform: translateY(0);    opacity: 1; }
        }
      `}</style>

      <span style={{ fontSize: 20, flexShrink: 0 }}>🔄</span>

      <div className="flex-1 min-w-0">
        <div className="text-sm font-semibold font-display" style={{ color: 'var(--sb-sky)' }}>
          Update Available
        </div>
        <div className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
          A new version of DVT-Entry is ready.
        </div>
      </div>

      <button
        onClick={() => updateServiceWorker(true)}
        className="flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-bold font-display transition-opacity hover:opacity-80"
        style={{ background: 'var(--sb-sky)', color: 'var(--sb-navy)' }}
      >
        Update
      </button>
    </div>
  )
}
