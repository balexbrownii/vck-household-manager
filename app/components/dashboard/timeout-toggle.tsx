'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { AlertTriangle, CheckCircle2 } from 'lucide-react'

interface TimeoutToggleProps {
  timeoutId: string
  timeoutMinutes: number
  violationType: string
  resetCount: number
}

export default function TimeoutToggle({
  timeoutId,
  timeoutMinutes,
  violationType,
  resetCount,
}: TimeoutToggleProps) {
  const [loading, setLoading] = useState(false)
  const [completed, setCompleted] = useState(false)
  const router = useRouter()

  const handleComplete = async () => {
    setLoading(true)
    setCompleted(true) // Optimistic update

    try {
      const response = await fetch('/api/timeout/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ timeoutId }),
      })

      if (!response.ok) {
        setCompleted(false) // Revert on error
        console.error('Failed to complete timeout')
      } else {
        router.refresh() // Refresh to update the UI
      }
    } catch (error) {
      setCompleted(false) // Revert on error
      console.error('Error completing timeout:', error)
    } finally {
      setLoading(false)
    }
  }

  if (completed) {
    return (
      <div className="w-full flex items-start gap-3 p-3 rounded-lg border-2 border-green-200 bg-green-50">
        <div className="flex-shrink-0 mt-1">
          <CheckCircle2 className="w-5 h-5 text-green-600" />
        </div>
        <div className="flex-1 text-left">
          <div className="font-medium text-green-700">Timeout Complete</div>
          <div className="text-sm text-green-600">Good job standing your timeout!</div>
        </div>
      </div>
    )
  }

  return (
    <button
      onClick={handleComplete}
      disabled={loading}
      className="w-full flex items-start gap-3 p-3 rounded-lg border-2 border-red-300 bg-red-50 hover:bg-red-100 transition-all disabled:opacity-50"
    >
      <div className="flex-shrink-0 mt-1">
        <AlertTriangle className="w-5 h-5 text-red-600" />
      </div>
      <div className="flex-1 text-left">
        <div className="font-medium text-red-700">
          Timeout: {timeoutMinutes} minutes
          {resetCount > 0 && (
            <span className="ml-2 text-xs bg-red-200 px-1.5 py-0.5 rounded">
              Reset {resetCount}x
            </span>
          )}
        </div>
        <div className="text-sm text-red-600">
          {violationType} - Tap when timeout is stood
        </div>
      </div>
    </button>
  )
}
