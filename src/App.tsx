import React, { useEffect } from 'react'
import { AppProvider } from './context/AppContext'
import { Sidebar } from './components/Sidebar/Sidebar'
import { TopBar } from './components/TopBar/TopBar'
import { DataGrid } from './components/DataGrid/DataGrid'
import { UploadPanel } from './components/UploadPanel/UploadPanel'
import { ExportModal } from './components/ExportModal/ExportModal'
import { purgeOldEntries } from './lib/supabase'

function AppShell() {
  // Fire-and-forget 60-day purge on mount
  useEffect(() => {
    purgeOldEntries().catch(() => {})
  }, [])

  return (
    <div className="flex h-full overflow-hidden">
      <Sidebar />

      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <TopBar />
        <UploadPanel />

        <main className="flex-1 overflow-hidden flex flex-col" style={{ minHeight: 0 }}>
          <DataGrid />
        </main>
      </div>

      <ExportModal />
    </div>
  )
}

export default function App() {
  return (
    <AppProvider>
      <AppShell />
    </AppProvider>
  )
}
