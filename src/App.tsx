import React, { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { AppProvider } from './context/AppContext'
import { Sidebar } from './components/Sidebar/Sidebar'
import { TopBar } from './components/TopBar/TopBar'
import { DataGrid } from './components/DataGrid/DataGrid'
import { UploadPanel } from './components/UploadPanel/UploadPanel'
import { ExportModal } from './components/ExportModal/ExportModal'
import { Login } from './pages/Login'
import { LocationsAdmin } from './pages/LocationsAdmin'
import { UpdatePrompt } from './components/UpdatePrompt'
import { purgeOldEntries } from './lib/supabase'

function ProtectedShell() {
  useEffect(() => { purgeOldEntries().catch(() => {}) }, [])

  return (
    <AppProvider>
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
    </AppProvider>
  )
}

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth()
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--sb-navy)' }}>
        <span className="font-display text-sm" style={{ color: 'var(--sb-sky)' }}>Loading…</span>
      </div>
    )
  }
  if (!user) return <Navigate to="/login" replace />
  return <>{children}</>
}

function RequireAdmin({ children }: { children: React.ReactNode }) {
  const { role, isLoading } = useAuth()
  if (isLoading) return null
  if (role !== 'admin') return <Navigate to="/" replace />
  return <>{children}</>
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/"
            element={
              <RequireAuth>
                <ProtectedShell />
              </RequireAuth>
            }
          />
          <Route
            path="/admin/locations"
            element={
              <RequireAuth>
                <RequireAdmin>
                  <AppProvider>
                    <LocationsAdmin />
                  </AppProvider>
                </RequireAdmin>
              </RequireAuth>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <UpdatePrompt />
      </BrowserRouter>
    </AuthProvider>
  )
}
