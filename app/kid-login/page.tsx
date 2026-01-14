'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Star, Loader2 } from 'lucide-react'

export default function KidLoginPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [pin, setPin] = useState('')
  const [loading, setLoading] = useState(true)
  const [loggingIn, setLoggingIn] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    // Check if already logged in as kid
    fetch('/api/kid-auth/session')
      .then(res => res.json())
      .then(data => {
        if (data.authenticated && data.kid) {
          router.push('/kid-dashboard')
        }
        setLoading(false)
      })
      .catch(() => {
        setLoading(false)
      })
  }, [router])

  const handlePinInput = (digit: string) => {
    if (pin.length < 4) {
      setPin(prev => prev + digit)
      setError('')
    }
  }

  const handlePinDelete = () => {
    setPin(prev => prev.slice(0, -1))
    setError('')
  }

  const handlePinClear = () => {
    setPin('')
    setError('')
  }

  const handleLogin = useCallback(async () => {
    if (!name.trim() || pin.length !== 4 || loggingIn) return

    setLoggingIn(true)
    setError('')

    try {
      const response = await fetch('/api/kid-auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          pin,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Login failed')
        setPin('')
      } else {
        router.push('/kid-dashboard')
      }
    } catch {
      setError('Something went wrong. Please try again.')
      setPin('')
    } finally {
      setLoggingIn(false)
    }
  }, [name, pin, loggingIn, router])

  // Auto-submit when 4 digits entered and name is filled
  useEffect(() => {
    if (pin.length === 4 && name.trim()) {
      handleLogin()
    }
  }, [pin, name, handleLogin])

  if (loading) {
    return (
      <main className="kid-page bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400 flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-white animate-spin" />
      </main>
    )
  }

  return (
    <main className="kid-page bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400 no-pull-refresh flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="kid-card animate-fade-in">
          {/* Header */}
          <div className="text-center mb-6">
            <div className="w-20 h-20 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-lg">
              <Star className="w-10 h-10 text-white fill-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">StarKids</h1>
            <p className="text-gray-500 mt-1">Enter your name and PIN</p>
          </div>

          {/* Name Input */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Your Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value)
                setError('')
              }}
              placeholder="Type your first name"
              className="w-full px-4 py-3 text-lg border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:outline-none transition-colors"
              disabled={loggingIn}
              autoCapitalize="words"
              autoComplete="off"
            />
          </div>

          {/* PIN Display */}
          <div className="mb-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Your PIN
            </label>
          </div>
          <div className="pin-display">
            {[0, 1, 2, 3].map(i => (
              <div
                key={i}
                className={`pin-dot ${pin.length > i ? 'filled' : ''}`}
              />
            ))}
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm text-center">
              {error}
            </div>
          )}

          {/* Number Pad */}
          <div className="pin-pad">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(digit => (
              <button
                key={digit}
                onClick={() => handlePinInput(String(digit))}
                disabled={loggingIn}
                className="pin-key"
              >
                {digit}
              </button>
            ))}
            <button
              onClick={handlePinClear}
              disabled={loggingIn}
              className="pin-key secondary"
            >
              Clear
            </button>
            <button
              onClick={() => handlePinInput('0')}
              disabled={loggingIn}
              className="pin-key"
            >
              0
            </button>
            <button
              onClick={handlePinDelete}
              disabled={loggingIn}
              className="pin-key secondary"
            >
              ⌫
            </button>
          </div>

          {loggingIn && (
            <div className="mt-4 flex justify-center">
              <Loader2 className="w-6 h-6 text-purple-500 animate-spin" />
            </div>
          )}

          {/* Parent Link */}
          <div className="mt-6 pt-4 border-t border-gray-100 text-center">
            <a
              href="/login"
              className="text-sm text-purple-600 hover:text-purple-700 font-semibold"
            >
              Parent Login →
            </a>
          </div>
        </div>
      </div>
    </main>
  )
}
