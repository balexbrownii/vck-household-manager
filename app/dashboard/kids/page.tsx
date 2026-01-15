'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import TopNav from '@/components/nav/top-nav'
import { toast } from '@/lib/toast'
import Link from 'next/link'
import { ChevronLeft, Key, Check, Loader2, Eye, EyeOff } from 'lucide-react'

interface Kid {
  id: string
  name: string
  age: number
  hasPin: boolean
}

export default function ManageKidsPage() {
  const router = useRouter()
  const [kids, setKids] = useState<Kid[]>([])
  const [loading, setLoading] = useState(true)
  const [editingKid, setEditingKid] = useState<string | null>(null)
  const [newPin, setNewPin] = useState('')
  const [confirmPin, setConfirmPin] = useState('')
  const [showPin, setShowPin] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    loadKids()
  }, [])

  const loadKids = async () => {
    try {
      const response = await fetch('/api/kids')
      const data = await response.json()
      if (data.kids) {
        setKids(data.kids.map((k: { id: string; name: string; age: number; pin_hash: string | null }) => ({
          id: k.id,
          name: k.name,
          age: k.age,
          hasPin: !!k.pin_hash,
        })))
      }
    } catch {
      toast.error('Failed to load kids')
    } finally {
      setLoading(false)
    }
  }

  const handleSetPin = async (kidId: string) => {
    if (newPin.length !== 4 || !/^\d{4}$/.test(newPin)) {
      setError('PIN must be exactly 4 digits')
      return
    }

    if (newPin !== confirmPin) {
      setError('PINs do not match')
      return
    }

    setSaving(true)
    setError('')

    try {
      const response = await fetch('/api/kid-auth/set-pin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kidId, pin: newPin }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to set PIN')
      }

      setSuccess('PIN updated successfully!')
      setEditingKid(null)
      setNewPin('')
      setConfirmPin('')
      setShowPin(false)
      loadKids()

      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to set PIN')
    } finally {
      setSaving(false)
    }
  }

  const startEditing = (kidId: string) => {
    setEditingKid(kidId)
    setNewPin('')
    setConfirmPin('')
    setError('')
    setShowPin(false)
  }

  const cancelEditing = () => {
    setEditingKid(null)
    setNewPin('')
    setConfirmPin('')
    setError('')
    setShowPin(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <TopNav />
        <main className="max-w-2xl mx-auto px-4 py-8">
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <TopNav />
      <main className="max-w-2xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-6">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <ChevronLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Manage Kids</h1>
          <p className="text-gray-600 mt-1">
            Set or change PINs for kid login
          </p>
        </div>

        {/* Success Message */}
        {success && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded-lg flex items-center gap-2">
            <Check className="w-5 h-5" />
            {success}
          </div>
        )}

        {/* Kids List */}
        <div className="space-y-4">
          {kids.map((kid) => (
            <div
              key={kid.id}
              className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden"
            >
              <div className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-lg">
                      {kid.name.charAt(0)}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{kid.name}</h3>
                      <p className="text-sm text-gray-500">Age {kid.age}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {kid.hasPin ? (
                      <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded">
                        PIN Set
                      </span>
                    ) : (
                      <span className="px-2 py-1 bg-amber-100 text-amber-700 text-xs font-medium rounded">
                        No PIN
                      </span>
                    )}
                    {editingKid !== kid.id && (
                      <button
                        onClick={() => startEditing(kid.id)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        <Key className="w-4 h-4" />
                        {kid.hasPin ? 'Change' : 'Set'} PIN
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* PIN Edit Form */}
              {editingKid === kid.id && (
                <div className="border-t border-gray-100 bg-gray-50 p-4">
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        New PIN (4 digits)
                      </label>
                      <div className="relative">
                        <input
                          type={showPin ? 'text' : 'password'}
                          value={newPin}
                          onChange={(e) => {
                            const val = e.target.value.replace(/\D/g, '').slice(0, 4)
                            setNewPin(val)
                            setError('')
                          }}
                          placeholder="Enter 4-digit PIN"
                          className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none text-lg tracking-widest"
                          maxLength={4}
                          inputMode="numeric"
                          pattern="[0-9]*"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPin(!showPin)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          {showPin ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Confirm PIN
                      </label>
                      <input
                        type={showPin ? 'text' : 'password'}
                        value={confirmPin}
                        onChange={(e) => {
                          const val = e.target.value.replace(/\D/g, '').slice(0, 4)
                          setConfirmPin(val)
                          setError('')
                        }}
                        placeholder="Confirm PIN"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none text-lg tracking-widest"
                        maxLength={4}
                        inputMode="numeric"
                        pattern="[0-9]*"
                      />
                    </div>

                    {error && (
                      <p className="text-sm text-red-600">{error}</p>
                    )}

                    <div className="flex gap-2 pt-2">
                      <button
                        onClick={() => handleSetPin(kid.id)}
                        disabled={saving || newPin.length !== 4 || confirmPin.length !== 4}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        {saving ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Check className="w-4 h-4" />
                        )}
                        Save PIN
                      </button>
                      <button
                        onClick={cancelEditing}
                        disabled={saving}
                        className="px-4 py-2 bg-gray-200 text-gray-700 font-medium rounded-lg hover:bg-gray-300 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Instructions */}
        <div className="mt-8 p-4 bg-blue-50 border border-blue-100 rounded-lg">
          <h3 className="font-semibold text-blue-900 mb-2">Kid Login Instructions</h3>
          <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
            <li>Kids go to <code className="bg-blue-100 px-1 rounded">/kid-login</code></li>
            <li>They tap their name</li>
            <li>They enter their 4-digit PIN</li>
            <li>They're taken to their dashboard</li>
          </ol>
        </div>
      </main>
    </div>
  )
}
