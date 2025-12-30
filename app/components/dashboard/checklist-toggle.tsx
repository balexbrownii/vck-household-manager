'use client'

import { useState } from 'react'
import { CheckCircle2, Circle } from 'lucide-react'

interface ChecklistToggleProps {
  kidId: string
  date: string
  expectation: string
  label: string
  description: string
  isComplete: boolean
  onUpdate?: () => void
}

export default function ChecklistToggle({
  kidId,
  date,
  expectation,
  label,
  description,
  isComplete,
  onUpdate,
}: ChecklistToggleProps) {
  const [loading, setLoading] = useState(false)
  const [complete, setComplete] = useState(isComplete)

  const handleToggle = async () => {
    setLoading(true)
    // Optimistic update
    setComplete(!complete)

    try {
      const response = await fetch('/api/expectations/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kidId,
          date,
          expectation,
          complete: !complete,
        }),
      })

      if (!response.ok) {
        // Revert optimistic update on error
        setComplete(complete)
        console.error('Failed to update expectation')
      } else if (onUpdate) {
        onUpdate()
      }
    } catch (error) {
      // Revert optimistic update on error
      setComplete(complete)
      console.error('Error updating expectation:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleToggle}
      disabled={loading}
      className="w-full flex items-start gap-3 p-3 rounded-lg border-2 border-gray-200 hover:border-primary hover:bg-blue-50 transition-all disabled:opacity-50"
    >
      <div className="flex-shrink-0 mt-1">
        {complete ? (
          <CheckCircle2 className="w-5 h-5 text-success" />
        ) : (
          <Circle className="w-5 h-5 text-gray-300" />
        )}
      </div>
      <div className="flex-1 text-left">
        <div className={`font-medium ${complete ? 'text-gray-700' : 'text-gray-600'}`}>
          {label}
        </div>
        <div className="text-sm text-gray-500">{description}</div>
      </div>
    </button>
  )
}
