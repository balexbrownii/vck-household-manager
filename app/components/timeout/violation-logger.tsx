'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { VIOLATION_RULES, getViolationsByCategory } from '@/lib/domain/timeout-rules'
import { AlertTriangle, Plus } from 'lucide-react'

interface ViolationLoggerProps {
  kidId: string
  kidName: string
  onViolationLogged?: () => void
}

export default function ViolationLogger({ kidId, kidName, onViolationLogged }: ViolationLoggerProps) {
  const router = useRouter()
  const [selectedCategory, setSelectedCategory] = useState<string>('respect')
  const [selectedViolation, setSelectedViolation] = useState<string>('')
  const [notes, setNotes] = useState('')
  const [isLogging, setIsLogging] = useState(false)
  const [error, setError] = useState('')

  const violations = selectedCategory
    ? getViolationsByCategory(selectedCategory as any)
    : Object.entries(VIOLATION_RULES).map(([type, rule]) => ({
      type,
      description: rule.description,
      minutes: rule.minutes,
    }))

  const handleLogViolation = async () => {
    if (!selectedViolation) {
      setError('Please select a violation type')
      return
    }

    setIsLogging(true)
    setError('')

    try {
      const response = await fetch('/api/timeout/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kidId,
          violationType: selectedViolation,
          notes: notes || null,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to log violation')
      }

      // Reset form
      setSelectedViolation('')
      setNotes('')
      setSelectedCategory('respect')

      // Refresh the page to show the new timeout in Active Timeouts
      router.refresh()

      // Call callback
      onViolationLogged?.()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to log violation')
    } finally {
      setIsLogging(false)
    }
  }

  return (
    <div className="bg-red-50 rounded-lg border-2 border-red-200 p-6">
      <div className="flex items-center gap-2 mb-4">
        <AlertTriangle className="w-5 h-5 text-red-600" />
        <h3 className="text-lg font-bold text-gray-900">Log Violation</h3>
        <span className="text-sm text-gray-600">for {kidName}</span>
      </div>

      {/* Category tabs */}
      <div className="mb-4">
        <label className="block text-sm font-semibold text-gray-700 mb-2">Category</label>
        <div className="flex flex-wrap gap-2">
          {['respect', 'responsibility', 'safety', 'communication'].map((cat) => (
            <button
              key={cat}
              onClick={() => {
                setSelectedCategory(cat)
                setSelectedViolation('')
              }}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
                selectedCategory === cat
                  ? 'bg-red-600 text-white'
                  : 'bg-red-100 text-red-800 hover:bg-red-200'
              }`}
            >
              {cat.charAt(0).toUpperCase() + cat.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Violation type selection */}
      <div className="mb-4">
        <label className="block text-sm font-semibold text-gray-700 mb-2">Violation Type</label>
        <div className="grid grid-cols-1 gap-2">
          {violations.map((v) => (
            <button
              key={v.type}
              onClick={() => setSelectedViolation(v.type)}
              className={`text-left p-3 rounded-lg border-2 transition-colors ${
                selectedViolation === v.type
                  ? 'border-red-600 bg-red-50'
                  : 'border-gray-200 hover:border-red-300'
              }`}
            >
              <div className="flex justify-between items-start">
                <div>
                  <div className="font-semibold text-gray-900">
                    {v.description}
                  </div>
                </div>
                <div className="text-xs font-bold text-red-600 bg-red-100 px-2 py-1 rounded">
                  {v.minutes}m
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Notes */}
      <div className="mb-4">
        <label className="block text-sm font-semibold text-gray-700 mb-2">Notes (optional)</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Additional context about the violation..."
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
          rows={3}
        />
      </div>

      {/* Error message */}
      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-300 text-red-700 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* Action button */}
      <button
        onClick={handleLogViolation}
        disabled={isLogging || !selectedViolation}
        className="w-full bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white font-bold py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
      >
        <Plus className="w-5 h-5" />
        {isLogging ? 'Logging...' : 'Log Violation'}
      </button>
    </div>
  )
}
