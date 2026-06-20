import React from 'react'
import { ParseResult } from '../../lib/parseEngine'

interface Props {
  results: ParseResult[]
}

export function ParseSummary({ results }: Props) {
  if (results.length === 0) return null

  const totalFields = results.reduce((sum, r) => sum + Object.keys(r.fields).length, 0)
  const certainCount = results.reduce(
    (sum, r) => sum + Object.values(r.fields).filter((f) => f.confidence === 'certain').length,
    0
  )
  const uncertainCount = totalFields - certainCount

  return (
    <div className="space-y-2">
      <div
        className="text-sm px-3 py-2 rounded-md"
        style={{
          background: 'var(--conf-certain-bg)',
          border: '1px solid var(--conf-certain)',
          color: 'var(--color-text-primary)',
          fontFamily: 'DM Mono, monospace',
        }}
      >
        Parsed {totalFields} fields from {results.length} file{results.length !== 1 ? 's' : ''} —{' '}
        <span style={{ color: 'var(--conf-certain)' }}>{certainCount} certain</span>
        {uncertainCount > 0 && (
          <>
            {', '}
            <span style={{ color: 'var(--conf-uncertain)' }}>{uncertainCount} need review</span>
          </>
        )}
      </div>

      {results.map((result, i) => (
        <div
          key={i}
          className="text-xs rounded px-3 py-2 space-y-1"
          style={{
            background: 'var(--color-input-bg)',
            border: '1px solid var(--color-border)',
            fontFamily: 'DM Mono, monospace',
          }}
        >
          <div className="flex items-center gap-2">
            <span style={{ color: 'var(--sb-sky)' }}>📄</span>
            <span className="font-semibold" style={{ color: 'var(--color-text-primary)' }}>
              {result.filename}
            </span>
            <span
              className="ml-auto px-2 py-0.5 rounded text-xs"
              style={{
                background: Object.keys(result.fields).length > 0 ? 'var(--conf-certain-bg)' : 'rgba(255,0,0,0.1)',
                color: Object.keys(result.fields).length > 0 ? 'var(--conf-certain)' : 'var(--color-danger)',
              }}
            >
              {Object.keys(result.fields).length > 0 ? 'Mapped' : 'Needs Review'}
            </span>
          </div>
          {result.date && (
            <div style={{ color: 'var(--color-text-secondary)' }}>
              Detected date: <span style={{ color: 'var(--sb-sky)' }}>{result.date}</span>
            </div>
          )}
          {result.warnings.length > 0 && (
            <div style={{ color: 'var(--conf-uncertain)' }}>
              ⚠ {result.warnings.join(' · ')}
            </div>
          )}
          {result.unmappedColumns.length > 0 && (
            <div style={{ color: 'var(--color-text-secondary)' }}>
              Unmapped: {result.unmappedColumns.join(', ')}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
