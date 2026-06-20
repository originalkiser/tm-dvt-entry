import React, { useState } from 'react'
import { saveColumnView } from '../../lib/supabase'
import { ColumnSection } from '../../config/columns'

interface Props {
  section: ColumnSection
  currentColumnOrder: string[]
  onSaved: (viewId: string, viewName: string) => void
  onClose: () => void
}

export function SaveViewModal({ section, currentColumnOrder, onSaved, onClose }: Props) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSave = async () => {
    if (!name.trim()) { setError('Name is required'); return }
    setIsSaving(true)
    setError(null)
    try {
      const view = await saveColumnView(name.trim(), section, currentColumnOrder, description.trim() || undefined)
      onSaved(view.id, view.name)
    } catch (e) {
      setError(String(e))
    } finally {
      setIsSaving(false)
    }
  }

  const inputStyle: React.CSSProperties = {
    width: '100%',
    background: 'var(--color-input-bg)',
    border: '1px solid var(--color-input-border)',
    borderRadius: 8,
    padding: '8px 12px',
    color: 'var(--color-text-primary)',
    fontSize: 13,
    fontFamily: 'Inter, sans-serif',
    outline: 'none',
  }

  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-50"
      style={{ background: 'rgba(0,0,0,0.6)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        className="w-full max-w-sm mx-4 rounded-xl shadow-2xl overflow-hidden"
        style={{ background: 'var(--color-card-bg)', border: '1px solid var(--color-border)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: 'var(--color-border)', background: 'var(--color-topbar-bg)' }}>
          <h2 className="font-display font-bold text-base" style={{ color: 'var(--sb-sky)' }}>
            Save View As
          </h2>
          <div className="flex items-center gap-2">
            <span className="text-xs px-2 py-0.5 rounded" style={{ background: 'rgba(183,224,222,0.1)', color: 'var(--sb-sky)', fontFamily: 'DM Mono, monospace' }}>
              {section === 'md' ? 'Mid-Day' : 'End of Day'} · {currentColumnOrder.length} cols
            </span>
            <button onClick={onClose} style={{ color: 'var(--color-text-secondary)', fontSize: 20, lineHeight: 1 }}>×</button>
          </div>
        </div>

        <div className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--color-text-secondary)', letterSpacing: '0.05em' }}>
              VIEW NAME *
            </label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Revenue Focus, Membership Metrics"
              style={inputStyle}
              autoFocus
            />
          </div>

          <div>
            <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--color-text-secondary)', letterSpacing: '0.05em' }}>
              DESCRIPTION (optional)
            </label>
            <input
              type="text"
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="What is this view for?"
              style={inputStyle}
            />
          </div>

          {error && (
            <div className="text-xs p-2 rounded" style={{ background: 'rgba(220,38,38,0.1)', color: 'var(--color-danger)' }}>
              {error}
            </div>
          )}

          <div className="flex gap-3 pt-1">
            <button
              onClick={onClose}
              className="flex-1 py-2 rounded-lg text-sm font-semibold"
              style={{ background: 'var(--color-input-bg)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)', fontFamily: 'Chakra Petch, sans-serif' }}
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving || !name.trim()}
              className="flex-1 py-2 rounded-lg text-sm font-semibold transition-opacity"
              style={{ background: 'var(--sb-sky)', color: 'var(--sb-navy)', fontFamily: 'Chakra Petch, sans-serif', opacity: isSaving || !name.trim() ? 0.6 : 1 }}
            >
              {isSaving ? 'Saving…' : 'Save View'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
