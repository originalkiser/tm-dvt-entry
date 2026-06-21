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
import { Admin } from './pages/Admin'
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

function AccessDenied() {
  const { signOut } = useAuth()
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--sb-navy)' }}>
      <div
        className="w-full max-w-sm mx-4 rounded-2xl p-8 text-center space-y-4"
        style={{ background: '#001f38', border: '1px solid rgba(183,224,222,0.15)' }}
      >
        <div className="text-2xl">🔒</div>
        <h1 className="font-display font-bold text-lg" style={{ color: 'var(--sb-sky)' }}>
          Access Not Granted
        </h1>
        <p className="text-sm" style={{ color: 'rgba(183,224,222,0.5)' }}>
          Your account hasn't been given DVT-Entry access yet. Contact your administrator.
        </p>
        <button
          onClick={() => signOut()}
          className="w-full py-2 rounded-lg text-sm font-semibold transition-opacity"
          style={{ background: 'rgba(183,224,222,0.1)', color: 'var(--sb-sky)', border: '1px solid rgba(183,224,222,0.2)' }}
        >
          Sign Out
        </button>
      </div>
    </div>
  )
}

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user, role, isLoading } = useAuth()
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--sb-navy)' }}>
        <span className="font-display text-sm" style={{ color: 'var(--sb-sky)' }}>Loading…</span>
      </div>
    )
  }
  if (!user) return <Navigate to="/login" replace />
  if (role === null) return <AccessDenied />
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
            path="/admin"
            element={
              <RequireAuth>
                <RequireAdmin>
                  <AppProvider>
                    <Admin />
                  </AppProvider>
                </RequireAdmin>
              </RequireAuth>
            }
          />
          {/* Legacy redirect */}
          <Route path="/admin/locations" element={<Navigate to="/admin" replace />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <UpdatePrompt />
      </BrowserRouter>
    </AuthProvider>
  )
}
