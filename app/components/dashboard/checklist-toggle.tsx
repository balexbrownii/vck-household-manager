'use client'

import { useState } from 'react'
import { CheckCircle2, Circle, ChevronDown, ChevronUp, X } from 'lucide-react'

interface ChecklistToggleProps {
  kidId: string
  date: string
  expectation: string
  label: string
  description: string
  isComplete: boolean
  completedByKid?: boolean
  completedAt?: string | null
  onUpdate?: () => void
}

export default function ChecklistToggle({
  kidId,
  date,
  expectation,
  label,
  description,
  isComplete,
  completedByKid,
  completedAt,
  onUpdate,
}: ChecklistToggleProps) {
  const [loading, setLoading] = useState(false)
  const [complete, setComplete] = useState(isComplete)
  const [expanded, setExpanded] = useState(false)
  const [note, setNote] = useState('')

  const handleComplete = async () => {
    setLoading(true)
    // Optimistic update
    setComplete(true)

    try {
      const response = await fetch('/api/expectations/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kidId,
          type: expectation, // expectation prop contains the type value (exercise, reading, etc.)
          completed: true,
          note: note.trim() || undefined,
        }),
      })

      if (!response.ok) {
        // Revert optimistic update on error
        setComplete(false)
        console.error('Failed to update expectation')
      } else {
        setExpanded(false)
        setNote('')
        if (onUpdate) {
          onUpdate()
        }
      }
    } catch (error) {
      // Revert optimistic update on error
      setComplete(false)
      console.error('Error updating expectation:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleUncomplete = async () => {
    setLoading(true)
    setComplete(false)

    try {
      const response = await fetch('/api/expectations/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kidId,
          type: expectation, // expectation prop contains the type value
          completed: false,
        }),
      })

      if (!response.ok) {
        setComplete(true)
        console.error('Failed to update expectation')
      } else if (onUpdate) {
        onUpdate()
      }
    } catch (error) {
      setComplete(true)
      console.error('Error updating expectation:', error)
    } finally {
      setLoading(false)
    }
  }

  // Format completion info
  const getCompletionInfo = () => {
    if (!completedAt) return null
    const time = new Date(completedAt).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    })
    const source = completedByKid ? 'by kid' : 'by parent'
    return `${time} ${source}`
  }

  // If already complete, show completed state with option to undo
  if (complete) {
    const completionInfo = getCompletionInfo()
    return (
      <div className="w-full flex items-start gap-3 p-3 rounded-lg border-2 border-green-200 bg-green-50">
        <div className="flex-shrink-0 mt-1">
          <CheckCircle2 className="w-5 h-5 text-success" />
        </div>
        <div className="flex-1 text-left">
          <div className="font-medium text-gray-700">{label}</div>
          <div className="text-sm text-gray-500">{description}</div>
          {completionInfo && (
            <div className="text-xs text-green-600 mt-1">
              ✓ Completed {completionInfo}
            </div>
          )}
        </div>
        <button
          onClick={handleUncomplete}
          disabled={loading}
          className="text-xs text-gray-400 hover:text-gray-600 underline"
        >
          Undo
        </button>
      </div>
    )
  }

  // Not complete - show expandable card
  return (
    <div className={`w-full rounded-lg border-2 transition-all ${
      expanded ? 'border-blue-300 bg-blue-50' : 'border-gray-200 hover:border-primary'
    }`}>
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-start gap-3 p-3"
      >
        <div className="flex-shrink-0 mt-1">
          <Circle className="w-5 h-5 text-gray-300" />
        </div>
        <div className="flex-1 text-left">
          <div className="font-medium text-gray-600">{label}</div>
          <div className="text-sm text-gray-500">{description}</div>
        </div>
        <div className="flex-shrink-0 mt-1 text-gray-400">
          {expanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
        </div>
      </button>

      {expanded && (
        <div className="px-3 pb-3 pt-1 border-t border-blue-200">
          <div className="mb-3">
            <label className="block text-xs text-gray-500 mb-1">Add a note (optional)</label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g., Went for a bike ride, read chapter 5..."
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleComplete}
              disabled={loading}
              className="flex-1 py-2 px-4 bg-green-500 text-white text-sm font-medium rounded-lg hover:bg-green-600 disabled:opacity-50 transition-colors"
            >
              {loading ? 'Saving...' : 'Mark Complete'}
            </button>
            <button
              onClick={() => {
                setExpanded(false)
                setNote('')
              }}
              className="py-2 px-3 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
