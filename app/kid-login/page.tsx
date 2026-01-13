'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Loader2 } from 'lucide-react'

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
          router.push(`/kid-dashboard`)
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

  const handleLogin = async () => {
    if (!selectedKid || pin.length !== 4) return

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
  }

  // Auto-submit when 4 digits entered
  useEffect(() => {
    if (pin.length === 4 && selectedKid) {
      handleLogin()
    }
  }, [pin])

  if (loading) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-purple-400 via-pink-500 to-red-500 flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-white animate-spin" />
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-purple-400 via-pink-500 to-red-500 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {!selectedKid ? (
          // Kid Selection Screen
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="text-center mb-8">
              <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-4xl">⭐</span>
              </div>
              <h1 className="text-2xl font-bold text-gray-900">StarKids</h1>
              <p className="text-gray-600 mt-2">Tap your name to log in</p>
            </div>

            <div className="space-y-3">
              {kids.map(kid => (
                <button
                  key={kid.id}
                  onClick={() => setSelectedKid(kid)}
                  disabled={!kid.pin_hash}
                  className={`w-full p-4 rounded-xl text-left transition-all ${
                    kid.pin_hash
                      ? 'bg-gradient-to-r from-purple-100 to-pink-100 hover:from-purple-200 hover:to-pink-200 border-2 border-transparent hover:border-purple-300'
                      : 'bg-gray-100 cursor-not-allowed opacity-60'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold text-white ${
                      kid.pin_hash ? 'bg-gradient-to-br from-purple-500 to-pink-500' : 'bg-gray-400'
                    }`}>
                      {kid.name.charAt(0)}
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900">{kid.name}</div>
                      <div className="text-sm text-gray-500">
                        {kid.pin_hash ? `Age ${kid.age}` : 'PIN not set - ask a parent'}
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>

            <div className="mt-8 pt-6 border-t border-gray-200 text-center">
              <a
                href="/login"
                className="text-sm text-purple-600 hover:text-purple-700 font-medium"
              >
                Parent Login →
              </a>
            </div>
          </div>
        ) : (
          // PIN Entry Screen
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <button
              onClick={() => {
                setSelectedKid(null)
                setPin('')
                setError('')
              }}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>

            <div className="text-center mb-8">
              <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl font-bold text-white">
                {selectedKid.name.charAt(0)}
              </div>
              <h1 className="text-2xl font-bold text-gray-900">Hi, {selectedKid.name}!</h1>
              <p className="text-gray-600 mt-2">Enter your 4-digit PIN</p>
            </div>

            {/* PIN Display */}
            <div className="flex justify-center gap-4 mb-6">
              {[0, 1, 2, 3].map(i => (
                <div
                  key={i}
                  className={`w-12 h-12 rounded-full border-2 flex items-center justify-center ${
                    pin.length > i
                      ? 'border-purple-500 bg-purple-500'
                      : 'border-gray-300 bg-white'
                  }`}
                >
                  {pin.length > i && (
                    <div className="w-3 h-3 bg-white rounded-full" />
                  )}
                </div>
              ))}
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-4 p-3 bg-red-100 border border-red-300 text-red-700 rounded-lg text-sm text-center">
                {error}
              </div>
            )}

            {/* Number Pad */}
            <div className="grid grid-cols-3 gap-3">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9', 'C', '0', '⌫'].map(digit => (
                <button
                  key={digit}
                  onClick={() => {
                    if (digit === 'C') handlePinClear()
                    else if (digit === '⌫') handlePinDelete()
                    else handlePinInput(digit)
                  }}
                  disabled={loggingIn}
                  className={`h-16 rounded-xl text-2xl font-semibold transition-all ${
                    digit === 'C' || digit === '⌫'
                      ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      : 'bg-purple-100 text-purple-700 hover:bg-purple-200'
                  } disabled:opacity-50`}
                >
                  {loggingIn && digit !== 'C' && digit !== '⌫' ? (
                    <Loader2 className="w-6 h-6 mx-auto animate-spin" />
                  ) : (
                    digit
                  )}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
