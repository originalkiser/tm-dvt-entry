import React, { useEffect, useRef, useState } from 'react'
import { ColumnView, fetchColumnViews, deleteColumnView, updateColumnViewGlobal } from '../../lib/supabase'
import { ColumnSection } from '../../config/columns'
import { useAuth } from '../../context/AuthContext'

interface Props {
  section: ColumnSection
  onApply: (view: ColumnView) => void
  refreshTrigger: number
}

export function ViewSelector({ section, onApply, refreshTrigger }: Props) {
  const { role } = useAuth()
  const [views, setViews] = useState<ColumnView[]>([])
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setIsLoading(true)
    fetchColumnViews()
      .then(all => setViews(all.filter(v => v.section === section)))
      .catch(console.error)
      .finally(() => setIsLoading(false))
  }, [section, refreshTrigger])

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    await deleteColumnView(id)
    setViews(prev => prev.filter(v => v.id !== id))
  }

  const handleToggleGlobal = async (e: React.MouseEvent, view: ColumnView) => {
    e.stopPropagation()
    await updateColumnViewGlobal(view.id, !view.is_global)
    setViews(prev => prev.map(v => v.id === view.id ? { ...v, is_global: !v.is_global } : v))
  }

  const btnStyle: React.CSSProperties = {
    background: 'rgba(183,224,222,0.08)',
    border: '1px solid rgba(183,224,222,0.2)',
    color: 'var(--sb-sky)',
    borderRadius: 6,
    padding: '4px 10px',
    fontSize: 12,
    fontFamily: 'DM Mono, monospace',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: 4,
  }

  return (
    <div ref={ref} className="relative">
      <button style={btnStyle} onClick={() => setOpen(o => !o)}>
        Views {views.length > 0 && <span style={{ opacity: 0.6 }}>({views.length})</span>} ▾
      </button>

      {open && (
        <div
          className="absolute top-full mt-1 right-0 z-30 rounded-xl shadow-2xl overflow-hidden min-w-56"
          style={{ background: 'var(--color-card-bg)', border: '1px solid var(--color-border)' }}
        >
          <div className="px-3 py-2 border-b text-xs font-semibold" style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-secondary)', letterSpacing: '0.05em' }}>
            SAVED VIEWS — {section === 'md' ? 'MID-DAY' : 'END OF DAY'}
          </div>

          {isLoading && (
            <div className="p-3 text-xs text-center" style={{ color: 'var(--color-text-secondary)', fontFamily: 'DM Mono, monospace' }}>Loading…</div>
          )}

          {!isLoading && views.length === 0 && (
            <div className="p-3 text-xs text-center" style={{ color: 'var(--color-text-secondary)', fontFamily: 'DM Mono, monospace' }}>No saved views yet</div>
          )}

          {views.map(view => (
            <div
              key={view.id}
              className="flex items-center gap-2 px-3 py-2.5 cursor-pointer transition-colors"
              style={{ borderBottom: '1px solid var(--color-border)' }}
              onClick={() => { onApply(view); setOpen(false) }}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-semibold truncate" style={{ color: 'var(--color-text-primary)', fontFamily: 'Chakra Petch, sans-serif' }}>
                    {view.name}
                  </span>
                  {view.is_global && (
                    <span className="text-xs px-1.5 py-0.5 rounded flex-shrink-0" style={{ background: 'rgba(183,224,222,0.1)', color: 'var(--sb-sky)', fontSize: 10 }}>
                      shared
                    </span>
                  )}
                </div>
                {view.description && (
                  <div className="text-xs truncate" style={{ color: 'var(--color-text-secondary)' }}>{view.description}</div>
                )}
                <div className="text-xs" style={{ color: 'var(--color-text-secondary)', opacity: 0.6, fontFamily: 'DM Mono, monospace' }}>
                  {view.column_keys.length} columns
                </div>
              </div>

              <div className="flex items-center gap-1 flex-shrink-0" onClick={e => e.stopPropagation()}>
                {role === 'admin' && (
                  <button
                    onClick={e => handleToggleGlobal(e, view)}
                    title={view.is_global ? 'Make private' : 'Share with all users'}
                    className="text-xs px-1.5 py-1 rounded transition-colors"
                    style={{ color: view.is_global ? 'var(--sb-sky)' : 'var(--color-text-secondary)', background: 'transparent' }}
                  >
                    {view.is_global ? '🌐' : '○'}
                  </button>
                )}
                <button
                  onClick={e => handleDelete(e, view.id)}
                  title="Delete view"
                  className="text-xs px-1.5 py-1 rounded transition-colors"
                  style={{ color: 'var(--color-text-secondary)', background: 'transparent' }}
                >
                  ×
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
