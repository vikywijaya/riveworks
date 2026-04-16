'use client'

import { useState, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import ThemeToggle from '@/components/ThemeToggle'

export default function LoginPage() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      })

      if (res.ok) {
        window.location.href = '/admin'
      } else {
        const data = await res.json()
        setError(data.error || 'Invalid password')
      }
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const monoStyle = { fontFamily: "'DM Mono', monospace" }

  return (
    <div className="min-h-screen bg-dark-bg text-ink flex">
      {/* Left — decorative column */}
      <div className="hidden lg:flex w-1/2 flex-col justify-between p-16 border-r border-dark-border">
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-ink-faint tracking-[0.2em] uppercase" style={monoStyle}>
            kidastudio / admin
          </span>
          <ThemeToggle />
        </div>
        <div>
          <p className="text-[clamp(2.5rem,4vw,3.5rem)] leading-[0.95] tracking-[-0.03em] text-ink font-normal mb-4"
            style={{ fontFamily: "'Instrument Serif', serif" }}>
            Motion<br />
            <em className="not-italic text-ink-dim">Portfolio</em>
          </p>
          <p className="text-xs text-ink-faint max-w-xs" style={monoStyle}>
            Upload and curate your interactive Rive animation collection.
          </p>
        </div>
        <div className="text-[10px] text-ink-faint" style={monoStyle}>
          © {new Date().getFullYear()}
        </div>
      </div>

      {/* Right — login form */}
      <div className="flex-1 flex items-center justify-center px-8">
        <div className="w-full max-w-sm">
          <p className="text-[10px] text-ink-faint tracking-[0.2em] uppercase mb-10" style={monoStyle}>
            Authentication required
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="password" className="block text-[10px] text-ink-faint uppercase tracking-[0.15em] mb-1.5" style={monoStyle}>
                password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                autoFocus
                className="w-full px-3 py-2.5 bg-dark-bg border border-dark-border text-ink placeholder-ink-faint focus:outline-none focus:border-ink-dim transition-colors duration-150 text-sm"
                style={monoStyle}
              />
            </div>

            {error && (
              <p className="text-[11px] text-red-400 border border-red-900/40 px-3 py-2" style={monoStyle}>{error}</p>
            )}

            <button
              type="submit"
              disabled={loading || !password}
              className="w-full py-2.5 bg-ink text-dark-bg text-xs tracking-wider hover:bg-ink/90 active:bg-ink/80 transition-colors duration-150 disabled:opacity-30 disabled:cursor-not-allowed"
              style={monoStyle}
            >
              {loading ? 'SIGNING IN…' : 'SIGN IN'}
            </button>
          </form>

          <p className="text-[10px] text-ink-faint mt-8" style={monoStyle}>
            ← <a href="/" className="hover:text-ink transition-colors">back to gallery</a>
          </p>
        </div>
      </div>
    </div>
  )
}
