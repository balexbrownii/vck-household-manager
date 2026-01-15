'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { AlertTriangle, Play, Clock, ChevronDown, ChevronUp, X, Hourglass, Trash2 } from 'lucide-react'
import { toast } from '@/lib/toast'

interface TimeoutToggleProps {
  timeoutId: string
  timeoutMinutes: number
  violationType: string
  resetCount: number
  servingStartedAt?: string | null
  servedAt?: string | null
  isParent?: boolean
  onDismiss?: () => void
}

export default function TimeoutToggle({
  timeoutId,
  timeoutMinutes,
  violationType,
  resetCount,
  servingStartedAt,
  servedAt,
  isParent = false,
  onDismiss,
}: TimeoutToggleProps) {
  const [loading, setLoading] = useState(false)
  const [dismissing, setDismissing] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const [isServing, setIsServing] = useState(!!servingStartedAt && !servedAt)
  const [isPendingApproval, setIsPendingApproval] = useState(!!servedAt)
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null)
  const router = useRouter()

  // Calculate time remaining based on serving_started_at
  const calculateTimeRemaining = useCallback(() => {
    if (!servingStartedAt) return null
    const startTime = new Date(servingStartedAt).getTime()
    const endTime = startTime + (timeoutMinutes * 60 * 1000)
    const now = Date.now()
    const remaining = Math.max(0, Math.ceil((endTime - now) / 1000))
    return remaining
  }, [servingStartedAt, timeoutMinutes])

  // Initialize and update timer
  useEffect(() => {
    if (servingStartedAt && !servedAt) {
      setIsServing(true)
      const remaining = calculateTimeRemaining()
      setTimeRemaining(remaining)

      // Update every second
      const interval = setInterval(() => {
        const newRemaining = calculateTimeRemaining()
        setTimeRemaining(newRemaining)
        if (newRemaining === 0) {
          clearInterval(interval)
        }
      }, 1000)

      return () => clearInterval(interval)
    }
  }, [servingStartedAt, servedAt, calculateTimeRemaining])

  // Format seconds to MM:SS
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const handleStartTimer = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/timeout/start-serving', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ timeoutId }),
      })

      if (response.ok) {
        setIsServing(true)
        setTimeRemaining(timeoutMinutes * 60)
        router.refresh()
      } else {
        toast.error('Failed to start timeout')
      }
    } catch {
      toast.error('Failed to start timeout')
    } finally {
      setLoading(false)
    }
  }

  const handleMarkServed = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/timeout/mark-served', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ timeoutId }),
      })

      if (response.ok) {
        setIsPendingApproval(true)
        setIsServing(false)
        router.refresh()
      } else {
        toast.error('Failed to mark timeout as served')
      }
    } catch {
      toast.error('Failed to mark timeout as served')
    } finally {
      setLoading(false)
    }
  }

  const handleDismiss = async () => {
    setDismissing(true)
    try {
      const response = await fetch('/api/timeout/dismiss', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ timeoutId }),
      })

      if (response.ok) {
        if (onDismiss) onDismiss()
        router.refresh()
      } else {
        toast.error('Failed to dismiss timeout')
      }
    } catch {
      toast.error('Failed to dismiss timeout')
    } finally {
      setDismissing(false)
    }
  }

  const handleApprove = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/timeout/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ timeoutId }),
      })

      if (response.ok) {
        if (onDismiss) onDismiss()
        router.refresh()
      } else {
        toast.error('Failed to approve timeout')
      }
    } catch {
      toast.error('Failed to approve timeout')
    } finally {
      setLoading(false)
    }
  }

  // Pending parent approval state
  if (isPendingApproval || servedAt) {
    return (
      <div className="w-full rounded-lg border-2 border-amber-300 bg-amber-50">
        <div className="flex items-start gap-3 p-3">
          <div className="flex-shrink-0 mt-1">
            <Hourglass className="w-5 h-5 text-amber-600" />
          </div>
          <div className="flex-1 text-left">
            <div className="font-medium text-amber-700">Timeout Served</div>
            <div className="text-sm text-amber-600">
              {isParent ? 'Approve to clear timeout' : 'Waiting for parent approval'}
            </div>
          </div>
        </div>
        {isParent && (
          <div className="px-3 pb-3 flex gap-2">
            <button
              onClick={handleApprove}
              disabled={loading}
              className="flex-1 py-2 px-4 bg-green-500 text-white font-medium rounded-lg hover:bg-green-600 disabled:opacity-50 transition-colors"
            >
              {loading ? 'Approving...' : 'Approve'}
            </button>
            <button
              onClick={handleDismiss}
              disabled={dismissing}
              className="py-2 px-4 bg-gray-200 text-gray-700 font-medium rounded-lg hover:bg-gray-300 disabled:opacity-50 transition-colors"
            >
              {dismissing ? '...' : 'Cancel'}
            </button>
          </div>
        )}
      </div>
    )
  }

  // Serving state with timer
  if (isServing && timeRemaining !== null) {
    const timerDone = timeRemaining === 0

    return (
      <div className="w-full rounded-lg border-2 border-red-300 bg-red-50 overflow-hidden relative group">
        <div className="p-3">
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0">
              <Clock className="w-5 h-5 text-red-600" />
            </div>
            <div className="flex-1">
              <div className="font-medium text-red-700">
                Timeout in Progress
              </div>
              <div className="text-sm text-red-600">{violationType}</div>
            </div>
            <div className={`text-2xl font-bold ${timerDone ? 'text-green-600' : 'text-red-700'}`}>
              {formatTime(timeRemaining)}
            </div>
          </div>
        </div>

        {timerDone && !isParent && (
          <div className="px-3 pb-3 border-t border-red-200 pt-3">
            <button
              onClick={handleMarkServed}
              disabled={loading}
              className="w-full py-2 px-4 bg-green-500 text-white font-medium rounded-lg hover:bg-green-600 disabled:opacity-50 transition-colors"
            >
              {loading ? 'Submitting...' : 'I Served My Timeout'}
            </button>
          </div>
        )}

        {/* Parent dismiss button - shows on hover */}
        {isParent && (
          <button
            onClick={handleDismiss}
            disabled={dismissing}
            className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 shadow-sm disabled:opacity-50"
            title="Cancel timeout"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    )
  }

  // Default: Not started - expandable
  return (
    <div className={`w-full rounded-lg border-2 transition-all relative group ${
      expanded ? 'border-red-400 bg-red-50' : 'border-red-300 bg-red-50'
    }`}>
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-start gap-3 p-3"
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
          <div className="text-sm text-red-600">{violationType}</div>
        </div>
        <div className="flex-shrink-0 mt-1 text-red-400">
          {expanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
        </div>
      </button>

      {expanded && !isParent && (
        <div className="px-3 pb-3 border-t border-red-200 pt-3">
          <p className="text-sm text-red-600 mb-3">
            Go to your timeout spot. When you're ready, start the timer.
          </p>
          <div className="flex gap-2">
            <button
              onClick={handleStartTimer}
              disabled={loading}
              className="flex-1 flex items-center justify-center gap-2 py-2 px-4 bg-red-500 text-white font-medium rounded-lg hover:bg-red-600 disabled:opacity-50 transition-colors"
            >
              <Play className="w-4 h-4" />
              {loading ? 'Starting...' : 'Start Timer'}
            </button>
            <button
              onClick={() => setExpanded(false)}
              className="py-2 px-3 text-red-500 hover:bg-red-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* Parent dismiss button - shows on hover */}
      {isParent && (
        <button
          onClick={handleDismiss}
          disabled={dismissing}
          className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 shadow-sm disabled:opacity-50"
          title="Cancel timeout"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  )
}
