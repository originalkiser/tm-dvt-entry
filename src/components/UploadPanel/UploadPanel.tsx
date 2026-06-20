import React, { useState } from 'react'
import { useAppContext } from '../../context/AppContext'
import { LOCATIONS } from '../../config/locations'
import { FileDropZone } from './FileDropZone'
import { ParseSummary } from './ParseSummary'
import { parseFile, mergeParseResults, ParseResult } from '../../lib/parseEngine'
import { today } from '../../lib/dateUtils'

export function UploadPanel() {
  const { state, dispatch } = useAppContext()
  const [results, setResults] = useState<ParseResult[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [applyDate, setApplyDate] = useState(today())

  const activeLocation = LOCATIONS.find((l) => l.id === state.activeLocationId)

  const handleFiles = async (files: File[]) => {
    setIsProcessing(true)
    try {
      const parsed = await Promise.all(files.map(parseFile))
      setResults(parsed)
      dispatch({ type: 'SET_PARSE_RESULTS', results: parsed })

      // Auto-detect date if only one result has a date
      const detectedDates = parsed.map((r) => r.date).filter(Boolean)
      if (detectedDates.length === 1 && detectedDates[0]) {
        setApplyDate(detectedDates[0])
      }
    } finally {
      setIsProcessing(false)
    }
  }

  const handleApply = () => {
    if (results.length === 0) return
    const merged = mergeParseResults(results)
    dispatch({
      type: 'APPLY_PARSE_RESULT',
      locationId: state.activeLocationId,
      date: applyDate,
      result: merged,
    })
  }

  if (!state.uploadPanelOpen) return null

  return (
    <div
      className="border-b px-4 py-3 space-y-3"
      style={{
        background: 'var(--color-card-bg)',
        borderColor: 'var(--color-border)',
      }}
    >
      <div className="flex items-center gap-4 flex-wrap">
        <FileDropZone onFiles={handleFiles} isProcessing={isProcessing} />

        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <label className="text-xs font-semibold" style={{ color: 'var(--color-text-secondary)', fontFamily: 'Inter, sans-serif' }}>
              Apply to date:
            </label>
            <input
              type="date"
              value={applyDate}
              onChange={(e) => setApplyDate(e.target.value)}
              style={{
                background: 'var(--color-input-bg)',
                border: '1px solid var(--color-input-border)',
                color: 'var(--color-text-primary)',
                borderRadius: 6,
                padding: '4px 8px',
                fontSize: 13,
                fontFamily: 'DM Mono, monospace',
              }}
            />
          </div>

          {results.length > 0 && (
            <button
              onClick={handleApply}
              className="px-4 py-2 rounded-md text-sm font-semibold transition-colors"
              style={{
                background: 'var(--sb-sky)',
                color: 'var(--sb-navy)',
                fontFamily: 'Chakra Petch, sans-serif',
              }}
            >
              Apply to {activeLocation?.name} — {applyDate}
            </button>
          )}
        </div>
      </div>

      {results.length > 0 && <ParseSummary results={results} />}
    </div>
  )
}
