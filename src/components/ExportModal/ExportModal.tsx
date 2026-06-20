import React, { useState } from 'react'
import { useAppContext } from '../../context/AppContext'
import { LOCATIONS } from '../../config/locations'
import { buildExportPayload, exportToCSV, postToPowerAutomate } from '../../lib/exportUtils'

export function ExportModal() {
  const { state, dispatch } = useAppContext()
  const [selectedLocations, setSelectedLocations] = useState<string[]>([state.activeLocationId])
  const [startDate, setStartDate] = useState(state.dateRange.start)
  const [endDate, setEndDate] = useState(state.dateRange.end)
  const [isExporting, setIsExporting] = useState(false)
  const [exportError, setExportError] = useState<string | null>(null)
  const [exportSuccess, setExportSuccess] = useState(false)

  if (!state.exportModalOpen) return null

  const toggleLocation = (id: string) => {
    setSelectedLocations((prev) =>
      prev.includes(id) ? prev.filter((l) => l !== id) : [...prev, id]
    )
  }

  const selectedLocationDefs = LOCATIONS.filter((l) => selectedLocations.includes(l.id))

  const handleCSVExport = () => {
    const payload = buildExportPayload(selectedLocationDefs, state.entries, startDate, endDate)
    for (const locExport of payload.locations) {
      const loc = LOCATIONS.find((l) => l.id === locExport.locationId)!
      exportToCSV(locExport, loc.name)
    }
    dispatch({ type: 'CLOSE_EXPORT_MODAL' })
  }

  const handlePowerAutomate = async () => {
    setIsExporting(true)
    setExportError(null)
    try {
      const payload = buildExportPayload(selectedLocationDefs, state.entries, startDate, endDate)
      await postToPowerAutomate(payload)
      setExportSuccess(true)
      setTimeout(() => dispatch({ type: 'CLOSE_EXPORT_MODAL' }), 1000)
    } catch (err) {
      setExportError(String(err))
    } finally {
      setIsExporting(false)
    }
  }

  const inputStyle: React.CSSProperties = {
    background: 'var(--color-input-bg)',
    border: '1px solid var(--color-input-border)',
    color: 'var(--color-text-primary)',
    borderRadius: 6,
    padding: '6px 10px',
    fontSize: 13,
    fontFamily: 'DM Mono, monospace',
    width: '100%',
  }

  const hasPowerAutomate = !!import.meta.env.VITE_POWER_AUTOMATE_URL

  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-50"
      style={{ background: 'rgba(0,0,0,0.6)' }}
      onClick={(e) => { if (e.target === e.currentTarget) dispatch({ type: 'CLOSE_EXPORT_MODAL' }) }}
    >
      <div
        className="rounded-xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden"
        style={{ background: 'var(--color-card-bg)', border: '1px solid var(--color-border)' }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-5 py-4 border-b"
          style={{ borderColor: 'var(--color-border)', background: 'var(--color-topbar-bg)' }}
        >
          <h2 className="font-display font-bold text-base" style={{ color: 'var(--sb-sky)' }}>
            Export Data
          </h2>
          <button
            onClick={() => dispatch({ type: 'CLOSE_EXPORT_MODAL' })}
            style={{ color: 'var(--color-text-secondary)', fontSize: 20, lineHeight: 1 }}
          >
            ×
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Date range */}
          <div>
            <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>
              Date Range
            </label>
            <div className="flex gap-2">
              <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} style={inputStyle} />
              <span style={{ color: 'var(--color-text-secondary)', alignSelf: 'center' }}>→</span>
              <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} style={inputStyle} />
            </div>
          </div>

          {/* Location selector */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold" style={{ color: 'var(--color-text-secondary)' }}>
                Locations ({selectedLocations.length} selected)
              </label>
              <button
                className="text-xs"
                style={{ color: 'var(--sb-inky)' }}
                onClick={() =>
                  setSelectedLocations(
                    selectedLocations.length === LOCATIONS.length ? [] : LOCATIONS.map((l) => l.id)
                  )
                }
              >
                {selectedLocations.length === LOCATIONS.length ? 'Deselect all' : 'Select all'}
              </button>
            </div>
            <div
              className="grid grid-cols-2 gap-1 overflow-y-auto rounded-md p-2"
              style={{ maxHeight: 180, background: 'var(--color-input-bg)', border: '1px solid var(--color-input-border)' }}
            >
              {LOCATIONS.map((loc) => (
                <label key={loc.id} className="flex items-center gap-1.5 cursor-pointer text-xs py-0.5">
                  <input
                    type="checkbox"
                    checked={selectedLocations.includes(loc.id)}
                    onChange={() => toggleLocation(loc.id)}
                    style={{ accentColor: 'var(--sb-sky)' }}
                  />
                  <span style={{ color: 'var(--color-text-primary)' }}>{loc.name}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Error / Success */}
          {exportError && (
            <div className="text-xs p-2 rounded" style={{ background: 'rgba(220,38,38,0.1)', color: 'var(--color-danger)' }}>
              {exportError}
            </div>
          )}
          {exportSuccess && (
            <div className="text-xs p-2 rounded" style={{ background: 'var(--conf-certain-bg)', color: 'var(--conf-certain)' }}>
              ✓ Sent to Power Automate
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <button
              onClick={handleCSVExport}
              disabled={selectedLocations.length === 0}
              className="flex-1 py-2 rounded-md text-sm font-semibold transition-opacity"
              style={{
                background: 'var(--color-input-bg)',
                border: '1px solid var(--color-border)',
                color: 'var(--color-text-primary)',
                fontFamily: 'Chakra Petch, sans-serif',
                opacity: selectedLocations.length === 0 ? 0.5 : 1,
              }}
            >
              ↓ Download CSV
            </button>
            {hasPowerAutomate && (
              <button
                onClick={handlePowerAutomate}
                disabled={selectedLocations.length === 0 || isExporting}
                className="flex-1 py-2 rounded-md text-sm font-semibold transition-opacity"
                style={{
                  background: 'var(--sb-sky)',
                  color: 'var(--sb-navy)',
                  fontFamily: 'Chakra Petch, sans-serif',
                  opacity: selectedLocations.length === 0 || isExporting ? 0.6 : 1,
                }}
              >
                {isExporting ? 'Sending…' : '↗ Send to Power Automate'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
