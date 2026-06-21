import React, { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
  fetchLocations, updateLocationActive, updateLocationSheetName, updateLocationPos, updateLocationPosCode, addLocation, DVTLocation,
  fetchAllUsers, updateUserDvtAccess, UserWithAccess,
} from '../lib/supabase'

type AdminTab = 'locations' | 'users'

// Fixed column widths — must match between header and rows
const USER_COLS = '1fr 90px 110px 160px'
const LOC_COLS = '1fr 120px 120px 180px 110px'

// ── Shared helpers ────────────────────────────────────────────────────────

function ErrorBanner({ message, onClose }: { message: string | null; onClose: () => void }) {
  if (!message) return null
  return (
    <div
      className="flex items-center justify-between gap-3 text-sm p-3 rounded-lg mb-4"
      style={{ background: 'rgba(220,38,38,0.1)', color: 'var(--color-danger)', border: '1px solid rgba(220,38,38,0.2)' }}
    >
      <span>{message}</span>
      <button onClick={onClose} style={{ opacity: 0.6, flexShrink: 0 }}>✕</button>
    </div>
  )
}

function OpsRoleChip({ role }: { role: string }) {
  const label = role === 'admin' ? 'Admin' : role === 'area_manager' ? 'Area Mgr' : 'User'
  const color = role === 'admin' ? 'var(--conf-certain)' : role === 'area_manager' ? 'var(--sb-sky)' : 'rgba(183,224,222,0.5)'
  const bg = role === 'admin' ? 'var(--conf-certain-bg)' : role === 'area_manager' ? 'rgba(183,224,222,0.1)' : 'rgba(183,224,222,0.05)'
  return (
    <span
      className="text-xs px-1.5 py-0.5 rounded font-mono"
      style={{ color, background: bg, border: `1px solid ${color}`, opacity: 0.85 }}
    >
      {label}
    </span>
  )
}

// ── POS dropdown cell ──────────────────────────────────────────────────────

interface PosCellProps {
  value: string | null | undefined
  knownValues: string[]
  onSave: (pos: string) => Promise<void>
  disabled: boolean
}

function PosCell({ value, knownValues, onSave, disabled }: PosCellProps) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(value ?? '')
  const [showDropdown, setShowDropdown] = useState(false)
  const [saving, setSaving] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (editing) inputRef.current?.focus()
  }, [editing])

  useEffect(() => {
    if (!showDropdown) return
    function onClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [showDropdown])

  const commit = async () => {
    const trimmed = draft.trim()
    if (trimmed === (value ?? '')) { setEditing(false); setShowDropdown(false); return }
    setSaving(true)
    try {
      await onSave(trimmed)
    } finally {
      setSaving(false)
      setEditing(false)
      setShowDropdown(false)
    }
  }

  const suggestions = knownValues.filter(v => v && v !== (value ?? '') && v.toLowerCase().includes(draft.toLowerCase()))

  const cellInputStyle: React.CSSProperties = {
    background: 'var(--color-input-bg)',
    border: '1px solid var(--sb-sky)',
    borderRadius: 6,
    padding: '4px 8px',
    color: 'var(--color-text-primary)',
    fontSize: 11,
    fontFamily: 'DM Mono, monospace',
    width: '100%',
    outline: 'none',
  }

  if (!editing) {
    return (
      <button
        onClick={() => { setDraft(value ?? ''); setEditing(true); setShowDropdown(true) }}
        disabled={disabled}
        className="text-xs group flex items-center gap-1 w-full transition-opacity hover:opacity-80 text-left"
        style={{ color: value ? 'var(--color-text-primary)' : 'rgba(183,224,222,0.3)', fontFamily: 'DM Mono, monospace' }}
        title="Edit POS"
      >
        <span>{value || '—'}</span>
        <span style={{ opacity: 0, fontSize: 10, flexShrink: 0 }} className="group-hover:opacity-50">✎</span>
      </button>
    )
  }

  return (
    <div ref={containerRef} style={{ position: 'relative', width: '100%' }}>
      <div className="flex items-center gap-1">
        <input
          ref={inputRef}
          value={draft}
          onChange={e => { setDraft(e.target.value); setShowDropdown(true) }}
          onKeyDown={e => {
            if (e.key === 'Enter') commit()
            if (e.key === 'Escape') { setEditing(false); setShowDropdown(false) }
          }}
          onFocus={() => setShowDropdown(true)}
          disabled={saving}
          style={cellInputStyle}
        />
        <button
          onClick={commit}
          disabled={saving}
          className="text-xs px-1.5 py-1 rounded flex-shrink-0"
          style={{ background: 'var(--conf-certain-bg)', color: 'var(--conf-certain)', border: '1px solid var(--conf-certain)' }}
        >
          {saving ? '…' : '✓'}
        </button>
        <button
          onClick={() => { setEditing(false); setShowDropdown(false) }}
          className="text-xs px-1.5 py-1 rounded flex-shrink-0"
          style={{ color: 'var(--color-text-secondary)', border: '1px solid var(--color-border)' }}
        >
          ✕
        </button>
      </div>

      {showDropdown && suggestions.length > 0 && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            zIndex: 50,
            marginTop: 4,
            background: 'var(--color-card-bg)',
            border: '1px solid var(--sb-sky)',
            borderRadius: 8,
            boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
            overflow: 'hidden',
          }}
        >
          {suggestions.map(s => (
            <button
              key={s}
              onMouseDown={e => { e.preventDefault(); setDraft(s); setShowDropdown(false); }}
              className="w-full text-left px-3 py-2 text-xs transition-colors"
              style={{
                fontFamily: 'DM Mono, monospace',
                color: 'var(--sb-sky)',
                background: 'transparent',
                borderBottom: '1px solid rgba(183,224,222,0.08)',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(183,224,222,0.1)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            >
              {s}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ── POS Location Code cell (simple inline edit, no dropdown) ──────────────

interface PosCodeCellProps {
  value: string | null | undefined
  onSave: (code: string) => Promise<void>
  disabled: boolean
}

function PosCodeCell({ value, onSave, disabled }: PosCodeCellProps) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(value ?? '')
  const [saving, setSaving] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => { if (editing) inputRef.current?.focus() }, [editing])

  const commit = async () => {
    const trimmed = draft.trim()
    if (trimmed === (value ?? '')) { setEditing(false); return }
    setSaving(true)
    try { await onSave(trimmed) } finally { setSaving(false); setEditing(false) }
  }

  const cellInputStyle: React.CSSProperties = {
    background: 'var(--color-input-bg)',
    border: '1px solid var(--sb-sky)',
    borderRadius: 6,
    padding: '4px 8px',
    color: 'var(--color-text-primary)',
    fontSize: 11,
    fontFamily: 'DM Mono, monospace',
    width: '100%',
    outline: 'none',
  }

  if (!editing) {
    return (
      <button
        onClick={() => { setDraft(value ?? ''); setEditing(true) }}
        disabled={disabled}
        className="text-xs group flex items-center gap-1 w-full transition-opacity hover:opacity-80 text-left"
        style={{ color: value ? 'var(--color-text-primary)' : 'rgba(183,224,222,0.3)', fontFamily: 'DM Mono, monospace' }}
        title="Edit POS Location Code"
      >
        <span className="truncate">{value || '—'}</span>
        <span style={{ opacity: 0, fontSize: 10, flexShrink: 0 }} className="group-hover:opacity-50">✎</span>
      </button>
    )
  }

  return (
    <div className="flex items-center gap-1">
      <input
        ref={inputRef}
        value={draft}
        onChange={e => setDraft(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') setEditing(false) }}
        disabled={saving}
        style={cellInputStyle}
      />
      <button
        onClick={commit}
        disabled={saving}
        className="text-xs px-1.5 py-1 rounded flex-shrink-0"
        style={{ background: 'var(--conf-certain-bg)', color: 'var(--conf-certain)', border: '1px solid var(--conf-certain)' }}
      >
        {saving ? '…' : '✓'}
      </button>
      <button
        onClick={() => setEditing(false)}
        className="text-xs px-1.5 py-1 rounded flex-shrink-0"
        style={{ color: 'var(--color-text-secondary)', border: '1px solid var(--color-border)' }}
      >
        ✕
      </button>
    </div>
  )
}

// ── Inline sheet name cell ─────────────────────────────────────────────────

interface SheetCellProps {
  value: string
  onSave: (v: string) => Promise<void>
  disabled: boolean
}

function SheetCell({ value, onSave, disabled }: SheetCellProps) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(value)
  const [saving, setSaving] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => { if (editing) inputRef.current?.focus() }, [editing])

  const commit = async () => {
    const trimmed = draft.trim()
    if (!trimmed || trimmed === value) { setEditing(false); return }
    setSaving(true)
    try { await onSave(trimmed) } finally { setSaving(false); setEditing(false) }
  }

  const cellInputStyle: React.CSSProperties = {
    background: 'var(--color-input-bg)',
    border: '1px solid var(--sb-sky)',
    borderRadius: 6,
    padding: '4px 8px',
    color: 'var(--color-text-primary)',
    fontSize: 11,
    fontFamily: 'DM Mono, monospace',
    width: '100%',
    outline: 'none',
  }

  if (!editing) {
    return (
      <button
        onClick={() => { setDraft(value); setEditing(true) }}
        disabled={disabled}
        className="text-xs group flex items-center gap-1 w-full transition-opacity hover:opacity-80 text-left"
        style={{ color: 'var(--color-text-primary)', fontFamily: 'DM Mono, monospace' }}
        title="Edit sheet name"
      >
        <span className="truncate">{value}</span>
        <span style={{ opacity: 0, fontSize: 10, flexShrink: 0 }} className="group-hover:opacity-50">✎</span>
      </button>
    )
  }

  return (
    <div className="flex items-center gap-1">
      <input
        ref={inputRef}
        value={draft}
        onChange={e => setDraft(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') setEditing(false) }}
        disabled={saving}
        style={cellInputStyle}
      />
      <button
        onClick={commit}
        disabled={saving}
        className="text-xs px-1.5 py-1 rounded flex-shrink-0"
        style={{ background: 'var(--conf-certain-bg)', color: 'var(--conf-certain)', border: '1px solid var(--conf-certain)' }}
      >
        {saving ? '…' : '✓'}
      </button>
      <button
        onClick={() => setEditing(false)}
        className="text-xs px-1.5 py-1 rounded flex-shrink-0"
        style={{ color: 'var(--color-text-secondary)', border: '1px solid var(--color-border)' }}
      >
        ✕
      </button>
    </div>
  )
}

// ── Locations tab ─────────────────────────────────────────────────────────

function LocationsTab() {
  const [locations, setLocations] = useState<DVTLocation[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [newLoc, setNewLoc] = useState({ location_id: '', name: '', sheet_name: '' })
  const [adding, setAdding] = useState(false)

  useEffect(() => {
    fetchLocations()
      .then(setLocations)
      .catch(e => setError(e instanceof Error ? e.message : String(e)))
      .finally(() => setIsLoading(false))
  }, [])

  const toggleActive = async (loc: DVTLocation) => {
    setSaving(loc.location_id)
    try {
      await updateLocationActive(loc.location_id, !loc.is_active)
      setLocations(prev => prev.map(l =>
        l.location_id === loc.location_id ? { ...l, is_active: !l.is_active } : l
      ))
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setSaving(null)
    }
  }

  const handleSaveSheet = async (locationId: string, value: string) => {
    await updateLocationSheetName(locationId, value)
    setLocations(prev => prev.map(l =>
      l.location_id === locationId ? { ...l, sheet_name: value } : l
    ))
  }

  const handleSavePos = async (locationId: string, value: string) => {
    await updateLocationPos(locationId, value)
    setLocations(prev => prev.map(l =>
      l.location_id === locationId ? { ...l, pos: value || null } : l
    ))
  }

  const handleSavePosCode = async (locationId: string, value: string) => {
    await updateLocationPosCode(locationId, value)
    setLocations(prev => prev.map(l =>
      l.location_id === locationId ? { ...l, pos_location_code: value || null } : l
    ))
  }

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newLoc.location_id || !newLoc.name || !newLoc.sheet_name) return
    setAdding(true)
    try {
      await addLocation(newLoc)
      const updated = await fetchLocations()
      setLocations(updated)
      setNewLoc({ location_id: '', name: '', sheet_name: '' })
      setShowAddForm(false)
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setAdding(false)
    }
  }

  const active = locations.filter(l => l.is_active)
  const inactive = locations.filter(l => !l.is_active)
  const knownPosValues = [...new Set(locations.map(l => l.pos).filter(Boolean))] as string[]

  const inputStyle: React.CSSProperties = {
    background: 'var(--color-input-bg)',
    border: '1px solid var(--color-border)',
    borderRadius: 6,
    padding: '6px 10px',
    color: 'var(--color-text-primary)',
    fontSize: 13,
    fontFamily: 'DM Mono, monospace',
    width: '100%',
    outline: 'none',
  }

  const colStyle: React.CSSProperties = { gridTemplateColumns: LOC_COLS, gap: 12 }

  const LocationRow = ({ loc }: { loc: DVTLocation }) => {
    const isSavingThis = saving === loc.location_id
    return (
      <div
        className="grid items-center px-4 py-3"
        style={{ ...colStyle, borderBottom: '1px solid var(--color-border)', opacity: loc.is_active ? 1 : 0.55 }}
      >
        {/* Location name + ID */}
        <div className="flex items-center gap-2 min-w-0">
          <span
            className="w-2 h-2 rounded-full flex-shrink-0"
            style={{ background: loc.is_active ? '#4ADE80' : 'rgba(183,224,222,0.2)' }}
          />
          <div className="min-w-0">
            <div className="text-sm font-semibold truncate" style={{ color: 'var(--color-text-primary)', fontFamily: 'Chakra Petch, sans-serif' }}>
              {loc.name}
            </div>
            <div className="text-xs" style={{ color: 'var(--color-text-secondary)', fontFamily: 'DM Mono, monospace' }}>
              {loc.location_id}
            </div>
          </div>
        </div>

        {/* POS */}
        <div>
          <PosCell
            value={loc.pos}
            knownValues={knownPosValues}
            onSave={pos => handleSavePos(loc.location_id, pos)}
            disabled={isSavingThis}
          />
        </div>

        {/* POS Location Code */}
        <div>
          <PosCodeCell
            value={loc.pos_location_code}
            onSave={code => handleSavePosCode(loc.location_id, code)}
            disabled={isSavingThis}
          />
        </div>

        {/* Sheet Name */}
        <div>
          <SheetCell
            value={loc.sheet_name}
            onSave={v => handleSaveSheet(loc.location_id, v)}
            disabled={isSavingThis}
          />
        </div>

        {/* Status toggle */}
        <div>
          <button
            onClick={() => toggleActive(loc)}
            disabled={isSavingThis}
            className="text-xs px-3 py-1.5 rounded-md font-semibold transition-colors w-full"
            style={{
              background: loc.is_active ? 'rgba(220,38,38,0.1)' : 'var(--conf-certain-bg)',
              color: loc.is_active ? 'var(--color-danger)' : 'var(--conf-certain)',
              border: `1px solid ${loc.is_active ? 'rgba(220,38,38,0.3)' : 'var(--conf-certain)'}`,
              opacity: isSavingThis ? 0.5 : 1,
              fontFamily: 'DM Mono, monospace',
            }}
          >
            {isSavingThis ? '…' : loc.is_active ? 'Deactivate' : 'Activate'}
          </button>
        </div>
      </div>
    )
  }

  const TableHeader = () => (
    <div
      className="grid px-4 py-2 text-xs font-semibold items-center"
      style={{
        ...colStyle,
        color: 'rgba(183,224,222,0.4)',
        fontFamily: 'DM Mono, monospace',
        borderBottom: '1px solid var(--color-border)',
        background: 'var(--color-topbar-bg)',
      }}
    >
      <span>LOCATION</span>
      <span>POS</span>
      <span>POS CODE</span>
      <span>SHEET NAME</span>
      <span>STATUS</span>
    </div>
  )

  return (
    <div className="space-y-5">
      <ErrorBanner message={error} onClose={() => setError(null)} />

      {/* Add location */}
      <div className="rounded-xl overflow-hidden" style={{ background: 'var(--color-card-bg)', border: '1px solid var(--color-border)' }}>
        <div
          className="flex items-center justify-between px-4 py-3 cursor-pointer"
          style={{ borderBottom: showAddForm ? '1px solid var(--color-border)' : undefined }}
          onClick={() => setShowAddForm(s => !s)}
        >
          <span className="text-sm font-semibold font-display" style={{ color: 'var(--sb-sky)' }}>
            + Add Location
          </span>
          <span style={{ color: 'rgba(183,224,222,0.4)', fontSize: 12 }}>{showAddForm ? '▲' : '▼'}</span>
        </div>
        {showAddForm && (
          <form onSubmit={handleAdd} className="p-4 space-y-3">
            <div className="grid gap-3" style={{ gridTemplateColumns: '1fr 1fr 1fr' }}>
              {([
                ['LOCATION ID', 'location_id', '1533-Dallas'],
                ['DISPLAY NAME', 'name', '1533 – Dallas (Main St)'],
                ['SHEET NAME', 'sheet_name', '1533-Dallas-Main St'],
              ] as const).map(([label, key, placeholder]) => (
                <div key={key} className="space-y-1">
                  <label className="text-xs font-semibold" style={{ color: 'var(--sb-sky)', fontFamily: 'DM Mono, monospace' }}>
                    {label}
                  </label>
                  <input
                    style={inputStyle}
                    placeholder={placeholder}
                    value={newLoc[key]}
                    onChange={e => setNewLoc(p => ({ ...p, [key]: e.target.value }))}
                    required
                  />
                </div>
              ))}
            </div>
            <div className="flex gap-2 justify-end">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="text-xs px-3 py-1.5 rounded"
                style={{ color: 'var(--color-text-secondary)', background: 'rgba(183,224,222,0.06)', border: '1px solid var(--color-border)' }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={adding}
                className="text-xs px-3 py-1.5 rounded font-semibold"
                style={{ background: 'var(--conf-certain-bg)', color: 'var(--conf-certain)', border: '1px solid var(--conf-certain)', opacity: adding ? 0.6 : 1 }}
              >
                {adding ? 'Adding…' : 'Add Location'}
              </button>
            </div>
          </form>
        )}
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-sm" style={{ color: 'var(--color-text-secondary)', fontFamily: 'DM Mono, monospace' }}>
          Loading locations…
        </div>
      ) : (
        <>
          <SectionHeader title="Active Locations" count={active.length} countStyle="certain" />
          <div className="rounded-xl overflow-hidden" style={{ background: 'var(--color-card-bg)', border: '1px solid var(--color-border)' }}>
            <TableHeader />
            {active.length === 0
              ? <div className="p-4 text-sm text-center" style={{ color: 'var(--color-text-secondary)' }}>No active locations</div>
              : active.map(loc => <LocationRow key={loc.location_id} loc={loc} />)
            }
          </div>

          {inactive.length > 0 && (
            <>
              <SectionHeader title="Inactive Locations" count={inactive.length} countStyle="muted" />
              <div className="rounded-xl overflow-hidden" style={{ background: 'var(--color-card-bg)', border: '1px solid var(--color-border)' }}>
                <TableHeader />
                {inactive.map(loc => <LocationRow key={loc.location_id} loc={loc} />)}
              </div>
            </>
          )}
        </>
      )}
    </div>
  )
}

function SectionHeader({ title, count, countStyle }: { title: string; count: number; countStyle: 'certain' | 'muted' }) {
  return (
    <div className="flex items-center gap-2 mb-2">
      <h2 className="text-sm font-bold font-display" style={{ color: 'var(--color-text-primary)' }}>{title}</h2>
      <span
        className="text-xs px-1.5 py-0.5 rounded"
        style={{
          background: countStyle === 'certain' ? 'var(--conf-certain-bg)' : 'var(--color-input-bg)',
          color: countStyle === 'certain' ? 'var(--conf-certain)' : 'var(--color-text-secondary)',
          fontFamily: 'DM Mono, monospace',
        }}
      >
        {count}
      </span>
    </div>
  )
}

// ── Users tab ─────────────────────────────────────────────────────────────

const DVT_ROLE_OPTIONS = [
  { value: '', label: 'Inherit from Ops' },
  { value: 'admin', label: 'Admin' },
  { value: 'area_manager', label: 'Area Manager' },
  { value: 'user', label: 'User' },
]

function mapOpsRoleLabel(opsRole: string) {
  if (opsRole === 'admin') return 'Admin'
  if (opsRole === 'area_manager') return 'Area Manager'
  return 'User'
}

function UsersTab() {
  const [users, setUsers] = useState<UserWithAccess[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState<string | null>(null)

  useEffect(() => {
    fetchAllUsers()
      .then(setUsers)
      .catch(e => setError(e instanceof Error ? e.message : String(e)))
      .finally(() => setIsLoading(false))
  }, [])

  const handleToggleAccess = async (user: UserWithAccess) => {
    const next = !user.dvt_access
    setSaving(user.id)
    try {
      await updateUserDvtAccess(user.id, next, user.dvt_role)
      setUsers(prev => prev.map(u => u.id === user.id ? { ...u, dvt_access: next } : u))
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setSaving(null)
    }
  }

  const handleRoleChange = async (user: UserWithAccess, dvtRole: string) => {
    const role = dvtRole === '' ? null : dvtRole
    setSaving(user.id)
    try {
      await updateUserDvtAccess(user.id, user.dvt_access, role)
      setUsers(prev => prev.map(u => u.id === user.id ? { ...u, dvt_role: role } : u))
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setSaving(null)
    }
  }

  const selectStyle: React.CSSProperties = {
    width: '100%',
    background: 'var(--color-input-bg)',
    border: '1px solid var(--color-border)',
    borderRadius: 6,
    padding: '4px 6px',
    color: 'var(--color-text-primary)',
    fontSize: 11,
    fontFamily: 'DM Mono, monospace',
    outline: 'none',
    cursor: 'pointer',
  }

  const colStyle: React.CSSProperties = { gridTemplateColumns: USER_COLS, gap: 16 }

  return (
    <div className="space-y-4">
      <ErrorBanner message={error} onClose={() => setError(null)} />

      {isLoading ? (
        <div className="text-center py-12 text-sm" style={{ color: 'var(--color-text-secondary)', fontFamily: 'DM Mono, monospace' }}>
          Loading users…
        </div>
      ) : users.length === 0 ? (
        <div className="text-center py-12 text-sm" style={{ color: 'var(--color-text-secondary)' }}>No users found</div>
      ) : (
        <div className="rounded-xl overflow-hidden" style={{ background: 'var(--color-card-bg)', border: '1px solid var(--color-border)' }}>
          {/* Header */}
          <div
            className="grid px-4 py-2 text-xs font-semibold items-center"
            style={{
              ...colStyle,
              color: 'rgba(183,224,222,0.4)',
              fontFamily: 'DM Mono, monospace',
              borderBottom: '1px solid var(--color-border)',
              background: 'var(--color-topbar-bg)',
            }}
          >
            <span>USER</span>
            <span>OPS ROLE</span>
            <span>DVT ACCESS</span>
            <span>DVT ROLE</span>
          </div>

          {users.map(user => {
            const isSaving = saving === user.id
            const isOpsAdmin = user.ops_role === 'admin'
            return (
              <div
                key={user.id}
                className="grid items-center px-4 py-3"
                style={{
                  ...colStyle,
                  borderBottom: '1px solid var(--color-border)',
                  opacity: isSaving ? 0.6 : 1,
                }}
              >
                {/* Name + email */}
                <div className="min-w-0">
                  <div className="text-sm font-semibold truncate" style={{ color: 'var(--color-text-primary)' }}>
                    {user.name ?? '(no name)'}
                  </div>
                  {user.email && (
                    <div className="text-xs truncate" style={{ color: 'var(--color-text-secondary)', fontFamily: 'DM Mono, monospace' }}>
                      {user.email}
                    </div>
                  )}
                </div>

                {/* Ops role — fixed width column */}
                <div>
                  <OpsRoleChip role={user.ops_role} />
                </div>

                {/* DVT Access toggle — fixed width column */}
                <div className="flex items-center">
                  {isOpsAdmin ? (
                    <span className="text-xs" style={{ color: 'rgba(183,224,222,0.35)', fontFamily: 'DM Mono, monospace' }}>always on</span>
                  ) : (
                    <button
                      onClick={() => handleToggleAccess(user)}
                      disabled={isSaving}
                      className="relative rounded-full transition-colors flex-shrink-0"
                      style={{
                        width: 36,
                        height: 20,
                        background: user.dvt_access ? 'var(--conf-certain)' : 'rgba(183,224,222,0.15)',
                        border: '1px solid',
                        borderColor: user.dvt_access ? 'var(--conf-certain)' : 'rgba(183,224,222,0.2)',
                        cursor: isSaving ? 'default' : 'pointer',
                      }}
                      title={user.dvt_access ? 'Revoke DVT access' : 'Grant DVT access'}
                    >
                      <span
                        className="absolute rounded-full transition-all"
                        style={{
                          width: 14,
                          height: 14,
                          top: 2,
                          left: user.dvt_access ? 18 : 2,
                          background: '#fff',
                        }}
                      />
                    </button>
                  )}
                </div>

                {/* DVT Role — fixed width column, always rendered */}
                <div>
                  {isOpsAdmin ? (
                    <span className="text-xs" style={{ color: 'rgba(183,224,222,0.35)', fontFamily: 'DM Mono, monospace' }}>admin</span>
                  ) : user.dvt_access ? (
                    <select
                      value={user.dvt_role ?? ''}
                      onChange={e => handleRoleChange(user, e.target.value)}
                      disabled={isSaving}
                      style={selectStyle}
                    >
                      {DVT_ROLE_OPTIONS.map(opt => (
                        <option key={opt.value} value={opt.value}>
                          {opt.value === '' ? `Inherit (${mapOpsRoleLabel(user.ops_role)})` : opt.label}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <span className="text-xs" style={{ color: 'rgba(183,224,222,0.2)', fontFamily: 'DM Mono, monospace' }}>—</span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      <p className="text-xs" style={{ color: 'rgba(183,224,222,0.3)', fontFamily: 'DM Mono, monospace' }}>
        Users are shared with TM-OpsPerformance. New users must be added via Supabase or the Ops app.
        Ops admins always have DVT access regardless of the toggle.
      </p>
    </div>
  )
}

// ── Main Admin page ───────────────────────────────────────────────────────

export function Admin() {
  const { role } = useAuth()
  const navigate = useNavigate()
  const [tab, setTab] = useState<AdminTab>('locations')

  useEffect(() => {
    if (role !== 'admin') navigate('/')
  }, [role, navigate])

  const tabBtn = (t: AdminTab, label: string) => (
    <button
      onClick={() => setTab(t)}
      className="px-4 py-2 text-sm font-semibold transition-colors"
      style={{
        color: tab === t ? 'var(--sb-sky)' : 'rgba(183,224,222,0.4)',
        borderBottom: tab === t ? '2px solid var(--sb-sky)' : '2px solid transparent',
        fontFamily: 'Chakra Petch, sans-serif',
      }}
    >
      {label}
    </button>
  )

  return (
    <div className="min-h-screen" style={{ background: 'var(--color-content-bg)' }}>
      <div
        className="flex items-center gap-4 px-6 py-3 border-b flex-shrink-0"
        style={{ background: 'var(--color-topbar-bg)', borderColor: 'rgba(183,224,222,0.15)' }}
      >
        <button
          onClick={() => navigate('/')}
          className="text-sm flex items-center gap-1.5 transition-opacity hover:opacity-70 flex-shrink-0"
          style={{ color: 'var(--sb-sky)', fontFamily: 'Chakra Petch, sans-serif' }}
        >
          ← Back
        </button>
        <h1 className="font-display font-bold text-lg flex-shrink-0" style={{ color: 'var(--sb-sky)' }}>
          Admin
        </h1>
        <div className="flex items-center gap-0 flex-1">
          {tabBtn('locations', 'Locations')}
          {tabBtn('users', 'Users')}
        </div>
        <span
          className="ml-auto text-xs px-2 py-0.5 rounded flex-shrink-0"
          style={{ background: 'rgba(183,224,222,0.1)', color: 'var(--sb-sky)', fontFamily: 'DM Mono, monospace' }}
        >
          Admin
        </span>
      </div>

      <div className="max-w-4xl mx-auto p-6">
        {tab === 'locations' ? <LocationsTab /> : <UsersTab />}
      </div>
    </div>
  )
}
