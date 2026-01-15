'use client'

import { useState, useEffect } from 'react'
import PageHeader from '@/components/ui/page-header'
import { toast } from '@/lib/toast'
import {
  Star,
  Plus,
  Minus,
  Loader2,
  Check,
  History,
  AlertTriangle,
} from 'lucide-react'

interface Kid {
  id: string
  name: string
  total_stars: number
}

interface StarHistoryEntry {
  id: string
  stars_earned: number
  reason: string
  balance_after: number
  created_at: string
}

export default function StarAdjustmentPage() {
  const [kids, setKids] = useState<Kid[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedKid, setSelectedKid] = useState<Kid | null>(null)
  const [adjustmentType, setAdjustmentType] = useState<'add' | 'deduct'>('add')
  const [amount, setAmount] = useState(5)
  const [reason, setReason] = useState('')
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [history, setHistory] = useState<StarHistoryEntry[]>([])
  const [loadingHistory, setLoadingHistory] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadKids()
  }, [])

  const loadKids = async () => {
    try {
      const res = await fetch('/api/kids')
      if (res.ok) {
        const data = await res.json()
        setKids(data.kids || [])
      }
    } catch {
      toast.error('Failed to load kids')
    } finally {
      setLoading(false)
    }
  }

  const loadHistory = async (kidId: string) => {
    setLoadingHistory(true)
    try {
      const res = await fetch(`/api/stars/history?kidId=${kidId}&limit=20&includeAll=true`)
      if (res.ok) {
        const data = await res.json()
        setHistory(data.history || [])
      }
    } catch {
      toast.error('Failed to load history')
    } finally {
      setLoadingHistory(false)
    }
  }

  const handleSelectKid = (kid: Kid) => {
    setSelectedKid(kid)
    setError(null)
    loadHistory(kid.id)
  }

  const handleSubmit = async () => {
    if (!selectedKid || !reason.trim()) {
      setError('Please provide a reason for this adjustment')
      return
    }

    const finalAmount = adjustmentType === 'deduct' ? -amount : amount

    // Prevent going negative
    if (selectedKid.total_stars + finalAmount < 0) {
      setError(`Cannot deduct ${amount} stars - ${selectedKid.name} only has ${selectedKid.total_stars} stars`)
      return
    }

    setSaving(true)
    setError(null)

    try {
      const res = await fetch('/api/stars/adjust', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kidId: selectedKid.id,
          stars: finalAmount,
          reason: reason.trim(),
        }),
      })

      if (res.ok) {
        const data = await res.json()
        setSuccess(true)

        // Update local state
        setKids(kids.map(k =>
          k.id === selectedKid.id
            ? { ...k, total_stars: data.newBalance }
            : k
        ))
        setSelectedKid({ ...selectedKid, total_stars: data.newBalance })

        // Refresh history
        loadHistory(selectedKid.id)

        setTimeout(() => {
          setSuccess(false)
          setReason('')
          setAmount(5)
        }, 2000)
      } else {
        const data = await res.json()
        setError(data.error || 'Failed to adjust stars')
      }
    } catch {
      toast.error('Failed to adjust stars')
    } finally {
      setSaving(false)
    }
  }

  const presetReasons = {
    add: [
      'Great attitude today',
      'Helped without being asked',
      'Extra cleanup',
      'Good behavior',
      'Special achievement',
    ],
    deduct: [
      'Disrespectful behavior',
      'Didn\'t complete chores',
      'Broke rules',
      'Lost privilege',
      'Other issue',
    ],
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto py-12 text-center">
        <Loader2 className="w-8 h-8 animate-spin mx-auto text-yellow-600" />
        <p className="mt-4 text-gray-600">Loading...</p>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto">
      <PageHeader
        title="Star Adjustments"
        subtitle="Manually add or deduct stars from kids"
        backHref="/dashboard/admin"
        backLabel="Back to Admin"
        icon={<Star className="w-7 h-7 text-yellow-500 fill-yellow-500" />}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left - Kid Selection & Adjustment Form */}
        <div className="space-y-4">
          {/* Kid Selection */}
          <div className="bg-white rounded-xl border-2 border-gray-100 p-4">
            <h2 className="font-semibold text-gray-900 mb-3">Select Kid</h2>
            <div className="grid grid-cols-2 gap-2">
              {kids.map((kid) => (
                <button
                  key={kid.id}
                  onClick={() => handleSelectKid(kid)}
                  className={`p-3 rounded-xl border-2 text-left transition-all ${
                    selectedKid?.id === kid.id
                      ? 'border-yellow-400 bg-yellow-50'
                      : 'border-gray-100 hover:border-gray-200'
                  }`}
                >
                  <div className="font-semibold text-gray-900">{kid.name}</div>
                  <div className="flex items-center gap-1 text-sm text-yellow-600 mt-1">
                    <Star className="w-4 h-4 fill-current" />
                    {kid.total_stars} stars
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Adjustment Form */}
          {selectedKid && (
            <div className="bg-white rounded-xl border-2 border-gray-100 p-4">
              <h2 className="font-semibold text-gray-900 mb-3">
                Adjust Stars for {selectedKid.name}
              </h2>

              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                  {error}
                </div>
              )}

              {success && (
                <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm flex items-center gap-2">
                  <Check className="w-4 h-4" />
                  Stars adjusted successfully!
                </div>
              )}

              {/* Add/Deduct Toggle */}
              <div className="flex gap-2 mb-4">
                <button
                  onClick={() => setAdjustmentType('add')}
                  className={`flex-1 py-2 px-4 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors ${
                    adjustmentType === 'add'
                      ? 'bg-green-100 text-green-700 border-2 border-green-300'
                      : 'bg-gray-100 text-gray-600 border-2 border-transparent'
                  }`}
                >
                  <Plus className="w-4 h-4" />
                  Add Stars
                </button>
                <button
                  onClick={() => setAdjustmentType('deduct')}
                  className={`flex-1 py-2 px-4 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors ${
                    adjustmentType === 'deduct'
                      ? 'bg-red-100 text-red-700 border-2 border-red-300'
                      : 'bg-gray-100 text-gray-600 border-2 border-transparent'
                  }`}
                >
                  <Minus className="w-4 h-4" />
                  Deduct Stars
                </button>
              </div>

              {/* Amount */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Amount
                </label>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setAmount(Math.max(1, amount - 5))}
                    className="w-10 h-10 rounded-lg border border-gray-300 flex items-center justify-center hover:bg-gray-50"
                  >
                    -5
                  </button>
                  <button
                    onClick={() => setAmount(Math.max(1, amount - 1))}
                    className="w-10 h-10 rounded-lg border border-gray-300 flex items-center justify-center hover:bg-gray-50"
                  >
                    -1
                  </button>
                  <div className="flex-1 text-center">
                    <input
                      type="number"
                      min="1"
                      max="100"
                      value={amount}
                      onChange={(e) => setAmount(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-20 text-center text-2xl font-bold text-gray-900 border-b-2 border-gray-300 focus:border-yellow-500 outline-none"
                    />
                    <div className="text-sm text-gray-500 mt-1">stars</div>
                  </div>
                  <button
                    onClick={() => setAmount(amount + 1)}
                    className="w-10 h-10 rounded-lg border border-gray-300 flex items-center justify-center hover:bg-gray-50"
                  >
                    +1
                  </button>
                  <button
                    onClick={() => setAmount(amount + 5)}
                    className="w-10 h-10 rounded-lg border border-gray-300 flex items-center justify-center hover:bg-gray-50"
                  >
                    +5
                  </button>
                </div>
              </div>

              {/* Reason */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reason *
                </label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {presetReasons[adjustmentType].map((preset) => (
                    <button
                      key={preset}
                      onClick={() => setReason(preset)}
                      className={`px-3 py-1 text-sm rounded-full transition-colors ${
                        reason === preset
                          ? 'bg-yellow-100 text-yellow-700 border border-yellow-300'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {preset}
                    </button>
                  ))}
                </div>
                <input
                  type="text"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Or type a custom reason..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                />
              </div>

              {/* Preview */}
              <div className={`p-3 rounded-lg mb-4 ${
                adjustmentType === 'add' ? 'bg-green-50' : 'bg-red-50'
              }`}>
                <div className="text-sm text-gray-600">Preview:</div>
                <div className="font-semibold">
                  {selectedKid.name}: {selectedKid.total_stars} → {' '}
                  <span className={adjustmentType === 'add' ? 'text-green-700' : 'text-red-700'}>
                    {selectedKid.total_stars + (adjustmentType === 'deduct' ? -amount : amount)}
                  </span>
                  {' '}stars
                </div>
              </div>

              {/* Submit */}
              <button
                onClick={handleSubmit}
                disabled={!reason.trim() || saving}
                className={`w-full py-3 font-semibold rounded-xl flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                  adjustmentType === 'add'
                    ? 'bg-green-600 text-white hover:bg-green-700'
                    : 'bg-red-600 text-white hover:bg-red-700'
                }`}
              >
                {saving ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Adjusting...
                  </>
                ) : (
                  <>
                    {adjustmentType === 'add' ? <Plus className="w-5 h-5" /> : <Minus className="w-5 h-5" />}
                    {adjustmentType === 'add' ? 'Add' : 'Deduct'} {amount} Stars
                  </>
                )}
              </button>
            </div>
          )}
        </div>

        {/* Right - History */}
        <div className="bg-white rounded-xl border-2 border-gray-100 p-4">
          <h2 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <History className="w-5 h-5 text-gray-400" />
            Recent History
            {selectedKid && <span className="text-gray-500 font-normal">- {selectedKid.name}</span>}
          </h2>

          {!selectedKid ? (
            <p className="text-gray-500 text-sm text-center py-8">
              Select a kid to view their star history
            </p>
          ) : loadingHistory ? (
            <div className="text-center py-8">
              <Loader2 className="w-6 h-6 animate-spin mx-auto text-gray-400" />
            </div>
          ) : history.length === 0 ? (
            <p className="text-gray-500 text-sm text-center py-8">
              No star history yet
            </p>
          ) : (
            <div className="space-y-2 max-h-[500px] overflow-y-auto">
              {history.map((entry) => (
                <div
                  key={entry.id}
                  className={`p-3 rounded-lg ${
                    entry.stars_earned >= 0 ? 'bg-green-50' : 'bg-red-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className={`font-semibold ${
                      entry.stars_earned >= 0 ? 'text-green-700' : 'text-red-700'
                    }`}>
                      {entry.stars_earned >= 0 ? '+' : ''}{entry.stars_earned} stars
                    </span>
                    <span className="text-xs text-gray-500">
                      {new Date(entry.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="text-sm text-gray-600 mt-1">{entry.reason}</div>
                  <div className="text-xs text-gray-400 mt-1">
                    Balance: {entry.balance_after}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
