import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import sbLogoUrl from '../assets/sb-trademark-logo.svg'

export function Login() {
  const { signIn } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)
    const { error: err } = await signIn(email, password)
    setIsLoading(false)
    if (err) { setError(err); return }
    navigate('/', { replace: true })
  }

  const inputStyle: React.CSSProperties = {
    width: '100%',
    background: 'rgba(255,255,255,0.07)',
    border: '1px solid rgba(183,224,222,0.25)',
    borderRadius: 8,
    padding: '10px 14px',
    color: '#fff',
    fontSize: 14,
    fontFamily: 'Inter, sans-serif',
    outline: 'none',
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{ background: 'var(--sb-navy)' }}
    >
      <div
        className="w-full max-w-sm mx-4 rounded-2xl overflow-hidden shadow-2xl"
        style={{ background: '#001f38', border: '1px solid rgba(183,224,222,0.15)' }}
      >
        {/* Header */}
        <div className="flex flex-col items-center gap-3 pt-8 pb-6 px-8">
          <img src={sbLogoUrl} alt="Strickland Brothers" className="w-16 h-16" />
          <h1 className="font-display font-bold text-xl" style={{ color: 'var(--sb-sky)' }}>
            DVT-Entry
          </h1>
          <p className="text-xs text-center" style={{ color: 'rgba(183,224,222,0.5)' }}>
            Strickland Brothers · Daily Value Tracker
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-8 pb-8 space-y-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold" style={{ color: 'var(--sb-sky)', letterSpacing: '0.05em' }}>
              EMAIL
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              placeholder="you@stricklandbrothers.com"
              style={inputStyle}
              autoComplete="email"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold" style={{ color: 'var(--sb-sky)', letterSpacing: '0.05em' }}>
              PASSWORD
            </label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              placeholder="••••••••"
              style={inputStyle}
              autoComplete="current-password"
            />
          </div>

          {error && (
            <div
              className="text-xs px-3 py-2 rounded-md"
              style={{ background: 'rgba(220,38,38,0.15)', color: '#FCA5A5', border: '1px solid rgba(220,38,38,0.3)' }}
            >
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2.5 rounded-lg font-display font-bold text-sm transition-opacity mt-2"
            style={{
              background: isLoading ? 'rgba(183,224,222,0.5)' : 'var(--sb-sky)',
              color: 'var(--sb-navy)',
              opacity: isLoading ? 0.7 : 1,
            }}
          >
            {isLoading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  )
}
