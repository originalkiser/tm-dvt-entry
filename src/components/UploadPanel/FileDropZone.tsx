import React, { useCallback, useState } from 'react'

interface Props {
  onFiles: (files: File[]) => void
  isProcessing: boolean
}

export function FileDropZone({ onFiles, isProcessing }: Props) {
  const [isDraggingOver, setIsDraggingOver] = useState(false)

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDraggingOver(false)
      const files = Array.from(e.dataTransfer.files).filter((f) =>
        /\.(xlsx|xls|csv|txt)$/i.test(f.name)
      )
      if (files.length) onFiles(files)
    },
    [onFiles]
  )

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? [])
    if (files.length) onFiles(files)
    e.target.value = ''
  }

  return (
    <label
      className="flex flex-col items-center justify-center gap-2 rounded-lg cursor-pointer transition-colors"
      style={{
        border: `2px dashed ${isDraggingOver ? 'var(--sb-sky)' : 'var(--color-border)'}`,
        background: isDraggingOver ? 'var(--conf-certain-bg)' : 'var(--color-input-bg)',
        padding: '20px 32px',
        minWidth: 260,
      }}
      onDragOver={(e) => { e.preventDefault(); setIsDraggingOver(true) }}
      onDragLeave={() => setIsDraggingOver(false)}
      onDrop={handleDrop}
    >
      <input
        type="file"
        multiple
        accept=".xlsx,.xls,.csv,.txt"
        className="sr-only"
        onChange={handleFileInput}
        disabled={isProcessing}
      />
      <span style={{ fontSize: 28 }}>📂</span>
      <span className="text-sm" style={{ color: 'var(--color-text-secondary)', fontFamily: 'DM Mono, monospace' }}>
        {isProcessing ? 'Processing…' : 'Drop files here or click to browse'}
      </span>
      <span className="text-xs" style={{ color: 'var(--color-text-secondary)', opacity: 0.6 }}>
        .xlsx · .xls · .csv · .txt
      </span>
    </label>
  )
}
