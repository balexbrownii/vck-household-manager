'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Star } from 'lucide-react'
import { LoadingSpinner } from '@/components/ui/shared'

interface Kid {
  id: string
  name: string
  age: number
  pin_hash: string | null
}

export default function KidLoginPage() {
  const router = useRouter()
  const [kids, setKids] = useState<Kid[]>([])
  const [selectedKid, setSelectedKid] = useState<Kid | null>(null)
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
      })

    // Fetch kids list
    fetch('/api/kids')
      .then(res => res.json())
      .then(data => {
        if (data.kids) {
          setKids(data.kids)
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
    if (!selectedKid || pin.length !== 4 || loggingIn) return

    setLoggingIn(true)
    setError('')

    try {
      const response = await fetch('/api/kid-auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kidId: selectedKid.id,
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
  }, [selectedKid, pin, loggingIn, router])

  // Auto-submit when 4 digits entered
  useEffect(() => {
    if (pin.length === 4 && selectedKid) {
      handleLogin()
    }
  }, [pin, selectedKid, handleLogin])

  if (loading) {
    return (
      <main className="kid-page bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400 flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </main>
    )
  }

  return (
    <main className="kid-page bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400 no-pull-refresh flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {!selectedKid ? (
          // Kid Selection Screen
          <div className="kid-card animate-fade-in">
            <div className="text-center mb-8">
              <div className="w-24 h-24 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                <Star className="w-12 h-12 text-white fill-white" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900">StarKids</h1>
              <p className="text-gray-500 mt-2">Tap your name to log in</p>
            </div>

            <div className="space-y-3">
              {kids.map(kid => (
                <button
                  key={kid.id}
                  onClick={() => setSelectedKid(kid)}
                  disabled={!kid.pin_hash}
                  className={`kid-selector-item ${
                    !kid.pin_hash ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  <div className="kid-avatar text-xl">
                    {kid.name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0 text-left">
                    <div className="font-semibold text-gray-900 truncate">{kid.name}</div>
                    <div className="text-sm text-gray-500">
                      {kid.pin_hash ? `Age ${kid.age}` : 'PIN not set'}
                    </div>
                  </div>
                </button>
              ))}
            </div>

            <div className="mt-8 pt-6 border-t border-gray-100 text-center">
              <a
                href="/login"
                className="text-sm text-purple-600 hover:text-purple-700 font-semibold"
              >
                Parent Login →
              </a>
            </div>
          </div>
        ) : (
          // PIN Entry Screen
          <div className="kid-card animate-fade-in">
            <button
              onClick={() => {
                setSelectedKid(null)
                setPin('')
                setError('')
              }}
              className="flex items-center gap-2 text-gray-500 hover:text-gray-900 mb-6 -ml-1 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="font-medium">Back</span>
            </button>

            <div className="text-center mb-8">
              <div className="kid-avatar w-20 h-20 text-2xl mx-auto mb-4">
                {selectedKid.name.charAt(0)}
              </div>
              <h1 className="text-2xl font-bold text-gray-900">Hi, {selectedKid.name}!</h1>
              <p className="text-gray-500 mt-2">Enter your 4-digit PIN</p>
            </div>

            {/* PIN Display */}
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
              <div className="mb-6 p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm text-center">
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
              <div className="mt-6 flex justify-center">
                <LoadingSpinner size="sm" />
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  )
}
