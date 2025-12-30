'use client'

import { useEffect, useState } from 'react'
import { TimeoutViolation } from '@/types'
import { calculateActualTimeoutDuration, formatTimeoutDuration } from '@/lib/domain/timeout-rules'
import { RotateCcw, Check } from 'lucide-react'

interface TimeoutTimerProps {
  timeout: TimeoutViolation
  onReset?: () => void
  onComplete?: () => void
}

export default function TimeoutTimer({ timeout, onReset, onComplete }: TimeoutTimerProps) {
  const [minutesRemaining, setMinutesRemaining] = useState(0)
  const [isActive, setIsActive] = useState(true)
  const [isResetting, setIsResetting] = useState(false)
  const [isCompleting, setIsCompleting] = useState(false)

  useEffect(() => {
    if (!timeout?.started_at) {
      setMinutesRemaining(0)
      setIsActive(false)
      return
    }

    // Calculate remaining time
    const startTime = new Date(timeout.started_at).getTime()
    const actualDuration = calculateActualTimeoutDuration(
      timeout.timeout_minutes,
      timeout.reset_count || 0,
      timeout.doubled || false
    )
    const elapsedMs = Date.now() - startTime
    const remaining = Math.max(0, actualDuration * 60000 - elapsedMs)
    const remainingMinutes = Math.ceil(remaining / 60000)

    setMinutesRemaining(remainingMinutes)
    setIsActive(remaining > 0)

    // Update every second
    const interval = setInterval(() => {
      const now = Date.now()
      const newRemaining = Math.max(0, actualDuration * 60000 - (now - startTime))
      const newRemainingMinutes = Math.ceil(newRemaining / 60000)

      setMinutesRemaining(newRemainingMinutes)
      setIsActive(newRemaining > 0)

      if (newRemaining <= 0) {
        clearInterval(interval)
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [timeout])

  const handleReset = async () => {
    setIsResetting(true)
    try {
      const response = await fetch('/api/timeout/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ timeoutId: timeout.id }),
      })

      if (!response.ok) {
        throw new Error('Failed to reset timeout')
      }

      onReset?.()
    } catch (err) {
      console.error('Failed to reset:', err)
    } finally {
      setIsResetting(false)
    }
  }

  const handleComplete = async () => {
    setIsCompleting(true)
    try {
      const response = await fetch('/api/timeout/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ timeoutId: timeout.id }),
      })

      if (!response.ok) {
        throw new Error('Failed to complete timeout')
      }

      onComplete?.()
    } catch (err) {
      console.error('Failed to complete:', err)
    } finally {
      setIsCompleting(false)
    }
  }

  const minutes = Math.floor(minutesRemaining % 60)
  const hours = Math.floor(minutesRemaining / 60)
  const progress = isActive ? ((100 - (minutesRemaining / (timeout.timeout_minutes * (1 + (timeout.reset_count || 0))))) * 100) || 0 : 100

  const getStatusColor = () => {
    if (timeout.doubled) return 'bg-red-600'
    if ((timeout.reset_count || 0) > 0) return 'bg-orange-600'
    return 'bg-red-500'
  }

  return (
    <div className={`rounded-lg border-2 p-6 ${isActive ? 'border-red-500 bg-white' : 'border-green-500 bg-green-50'}`}>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-bold text-gray-900">Timeout in Progress</h3>
          <p className="text-sm text-gray-600">{timeout.violation_type.replace(/_/g, ' ')}</p>
        </div>
        <div className="flex items-center gap-2">
          {timeout.doubled && (
            <div className="px-2 py-1 bg-red-600 text-white text-xs font-bold rounded">
              DOUBLED
            </div>
          )}
          {(timeout.reset_count || 0) > 0 && (
            <div className="px-2 py-1 bg-orange-600 text-white text-xs font-bold rounded">
              Reset x{timeout.reset_count}
            </div>
          )}
        </div>
      </div>

      {/* Large timer display */}
      <div className="text-center mb-6">
        <div className={`text-6xl font-bold font-mono ${isActive ? 'text-red-600' : 'text-green-600'}`}>
          {hours}:{String(minutes).padStart(2, '0')}
        </div>
        <div className="text-sm text-gray-600 mt-2">
          {isActive ? (
            <>
              {hours > 0 ? `${hours}h ` : ''}
              {minutes} minutes remaining
            </>
          ) : (
            'Timeout complete! Good job.'
          )}
        </div>
      </div>

      {/* Progress bar */}
      <div className="mb-6">
        <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
          <div
            className={`h-full ${getStatusColor()} transition-all duration-1000`}
            style={{ width: `${Math.min(100, progress)}%` }}
          />
        </div>
      </div>

      {/* Details grid */}
      <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-200 mb-6">
        <div>
          <div className="text-xs text-gray-600">Base Time</div>
          <div className="font-bold text-gray-900">
            {timeout.timeout_minutes}m
          </div>
        </div>
        <div>
          <div className="text-xs text-gray-600">Resets</div>
          <div className="font-bold text-orange-600">
            {timeout.reset_count || 0}
          </div>
        </div>
        <div>
          <div className="text-xs text-gray-600">Total Duration</div>
          <div className="font-bold text-red-600">
            {calculateActualTimeoutDuration(
              timeout.timeout_minutes,
              timeout.reset_count || 0,
              timeout.doubled || false
            )}m
          </div>
        </div>
      </div>

      {/* Notes */}
      {timeout.notes && (
        <div className="mb-6 p-3 bg-gray-100 rounded-lg text-sm text-gray-700">
          <strong>Notes:</strong> {timeout.notes}
        </div>
      )}

      {/* Action buttons */}
      {isActive ? (
        <div className="flex gap-3">
          <button
            onClick={handleReset}
            disabled={isResetting}
            className="flex-1 bg-orange-600 hover:bg-orange-700 disabled:bg-gray-400 text-white font-bold py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            {isResetting ? 'Resetting...' : 'Reset (Caught Not Going)'}
          </button>
          <button
            onClick={handleComplete}
            disabled={isCompleting}
            className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-bold py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            <Check className="w-4 h-4" />
            {isCompleting ? 'Marking...' : 'Mark Complete'}
          </button>
        </div>
      ) : (
        <div className="p-3 bg-green-100 border border-green-300 text-green-700 rounded-lg text-center font-semibold">
          Timeout Complete
        </div>
      )}
    </div>
  )
}
