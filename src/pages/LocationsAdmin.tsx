import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { fetchLocations, updateLocationActive, DVTLocation } from '../lib/supabase'

export function LocationsAdmin() {
  const { role } = useAuth()
  const navigate = useNavigate()
  const [locations, setLocations] = useState<DVTLocation[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (role !== 'admin') { navigate('/'); return }
    fetchLocations()
      .then(setLocations)
      .catch(e => setError(String(e)))
      .finally(() => setIsLoading(false))
  }, [role, navigate])

  const toggleActive = async (loc: DVTLocation) => {
    setSaving(loc.location_id)
    try {
      await updateLocationActive(loc.location_id, !loc.is_active)
      setLocations(prev =>
        prev.map(l => l.location_id === loc.location_id ? { ...l, is_active: !l.is_active } : l)
      )
    } catch (e) {
      setError(String(e))
    } finally {
      setSaving(null)
    }
  }

  const active = locations.filter(l => l.is_active)
  const inactive = locations.filter(l => !l.is_active)

  const rowStyle = (isActive: boolean): React.CSSProperties => ({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '10px 16px',
    borderBottom: '1px solid var(--color-border)',
    opacity: isActive ? 1 : 0.5,
  })

  const LocationRow = ({ loc }: { loc: DVTLocation }) => (
    <div style={rowStyle(loc.is_active)}>
      <div className="flex items-center gap-3">
        <span
          className="w-2 h-2 rounded-full flex-shrink-0"
          style={{ background: loc.is_active ? '#4ADE80' : 'rgba(183,224,222,0.2)' }}
        />
        <div>
          <div className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)', fontFamily: 'Chakra Petch, sans-serif' }}>
            {loc.name}
          </div>
          <div className="text-xs" style={{ color: 'var(--color-text-secondary)', fontFamily: 'DM Mono, monospace' }}>
            {loc.location_id} · Sheet: {loc.sheet_name}
          </div>
        </div>
      </div>

      <button
        onClick={() => toggleActive(loc)}
        disabled={saving === loc.location_id}
        className="text-xs px-3 py-1.5 rounded-md font-semibold transition-colors"
        style={{
          background: loc.is_active ? 'rgba(220,38,38,0.1)' : 'var(--conf-certain-bg)',
          color: loc.is_active ? 'var(--color-danger)' : 'var(--conf-certain)',
          border: `1px solid ${loc.is_active ? 'rgba(220,38,38,0.3)' : 'var(--conf-certain)'}`,
          opacity: saving === loc.location_id ? 0.5 : 1,
          fontFamily: 'DM Mono, monospace',
        }}
      >
        {saving === loc.location_id ? '…' : loc.is_active ? 'Deactivate' : 'Activate'}
      </button>
    </div>
  )

  return (
    <div className="min-h-screen" style={{ background: 'var(--color-content-bg)' }}>
      {/* Header */}
      <div
        className="flex items-center gap-4 px-6 py-4 border-b"
        style={{ background: 'var(--color-topbar-bg)', borderColor: 'rgba(183,224,222,0.15)' }}
      >
        <button
          onClick={() => navigate('/')}
          className="text-sm flex items-center gap-1.5 transition-opacity hover:opacity-70"
          style={{ color: 'var(--sb-sky)', fontFamily: 'Chakra Petch, sans-serif' }}
        >
          ← Back
        </button>
        <h1 className="font-display font-bold text-lg" style={{ color: 'var(--sb-sky)' }}>
          Locations
        </h1>
        <span
          className="ml-auto text-xs px-2 py-0.5 rounded"
          style={{ background: 'rgba(183,224,222,0.1)', color: 'var(--sb-sky)', fontFamily: 'DM Mono, monospace' }}
        >
          Admin
        </span>
      </div>

      <div className="max-w-2xl mx-auto p-6 space-y-6">
        {error && (
          <div className="text-sm p-3 rounded-lg" style={{ background: 'rgba(220,38,38,0.1)', color: 'var(--color-danger)' }}>
            {error}
          </div>
        )}

        {isLoading ? (
          <div className="text-center py-12" style={{ color: 'var(--color-text-secondary)', fontFamily: 'DM Mono, monospace' }}>
            Loading locations…
          </div>
        ) : (
          <>
            {/* Active locations */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <h2 className="text-sm font-bold font-display" style={{ color: 'var(--color-text-primary)' }}>
                  Active Locations
                </h2>
                <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: 'var(--conf-certain-bg)', color: 'var(--conf-certain)', fontFamily: 'DM Mono, monospace' }}>
                  {active.length}
                </span>
              </div>
              <div className="rounded-xl overflow-hidden" style={{ background: 'var(--color-card-bg)', border: '1px solid var(--color-border)' }}>
                {active.length === 0
                  ? <div className="p-4 text-sm text-center" style={{ color: 'var(--color-text-secondary)' }}>No active locations</div>
                  : active.map(loc => <LocationRow key={loc.location_id} loc={loc} />)
                }
              </div>
            </div>

            {/* Inactive locations */}
            {inactive.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <h2 className="text-sm font-bold font-display" style={{ color: 'var(--color-text-primary)' }}>
                    Inactive Locations
                  </h2>
                  <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: 'var(--color-input-bg)', color: 'var(--color-text-secondary)', fontFamily: 'DM Mono, monospace' }}>
                    {inactive.length}
                  </span>
                </div>
                <div className="rounded-xl overflow-hidden" style={{ background: 'var(--color-card-bg)', border: '1px solid var(--color-border)' }}>
                  {inactive.map(loc => <LocationRow key={loc.location_id} loc={loc} />)}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
