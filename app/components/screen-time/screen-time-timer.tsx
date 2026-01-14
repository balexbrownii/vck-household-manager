'use client'

import { ScreenTimeSession, Kid } from '@/types'
import { useEffect, useState } from 'react'
import { Clock, Zap } from 'lucide-react'

interface ScreenTimeTimerProps {
  kid: Kid
  session: ScreenTimeSession | null
}

export default function ScreenTimeTimer({ kid, session }: ScreenTimeTimerProps) {
  const [timeRemaining, setTimeRemaining] = useState<number>(0)
  const [isActive, setIsActive] = useState(false)

  useEffect(() => {
    if (!session?.unlocked_at) {
      setTimeRemaining(0)
      setIsActive(false)
      return
    }

    // Calculate remaining time
    const startTime = new Date(session.unlocked_at).getTime()
    const totalMinutes = session.total_minutes_allowed
    const elapsedMs = Date.now() - startTime
    const remaining = Math.max(0, totalMinutes * 60000 - elapsedMs)
    const remainingMinutes = Math.ceil(remaining / 60000)

    setTimeRemaining(remainingMinutes)
    setIsActive(remaining > 0)

    // Update every second
    const interval = setInterval(() => {
      const now = Date.now()
      const newRemaining = Math.max(0, totalMinutes * 60000 - (now - startTime))
      const newRemainingMinutes = Math.ceil(newRemaining / 60000)

      setTimeRemaining(newRemainingMinutes)
      setIsActive(newRemaining > 0)

      if (newRemaining <= 0) {
        clearInterval(interval)
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [session])

  if (!session?.unlocked_at) {
    return (
      <div className="bg-gray-50 rounded-lg border-2 border-dashed border-gray-300 p-6 text-center">
        <h3 className="text-lg font-bold text-gray-900 mb-3">{kid.name}</h3>
        <Clock className="w-8 h-8 text-gray-400 mx-auto mb-3" />
        <p className="text-gray-600 font-medium">Screen time not unlocked</p>
        <p className="text-sm text-gray-500">Complete all expectations first</p>
      </div>
    )
  }

  const minutes = Math.floor(timeRemaining % 60)
  const hours = Math.floor(timeRemaining / 60)
  const progress = session.total_minutes_allowed > 0
    ? ((session.total_minutes_allowed * 60 - (timeRemaining * 60)) / (session.total_minutes_allowed * 60)) * 100
    : 0

  return (
    <div className="bg-white rounded-lg border-2 border-primary p-6">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-xl font-bold text-gray-900">{kid.name}</h3>
        {session.bonus_minutes_allowed > 0 && (
          <div className="flex items-center gap-1 px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-semibold">
            <Zap className="w-3 h-3" />
            +{session.bonus_minutes_allowed}m bonus
          </div>
        )}
      </div>

      {/* Large timer display */}
      <div className="text-center mb-6">
        <div className="text-6xl font-bold text-primary font-mono">
          {hours}:{String(minutes).padStart(2, '0')}
        </div>
        <div className="text-sm text-gray-600 mt-2">
          {hours > 0 ? `${hours} hour${hours !== 1 ? 's' : ''} ` : ''}
          {minutes} minutes remaining
        </div>
      </div>

      {/* Progress bar */}
      <div className="mb-6">
        <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-primary transition-all duration-1000"
            style={{ width: `${Math.min(100, progress)}%` }}
          />
        </div>
      </div>

      {/* Details */}
      <div className="grid grid-cols-3 gap-2 sm:gap-4 pt-4 border-t border-gray-200">
        <div>
          <div className="text-xs text-gray-600">Base Time</div>
          <div className="font-bold text-gray-900">
            {session.base_minutes_allowed}m
          </div>
        </div>
        <div>
          <div className="text-xs text-gray-600">Bonus Time</div>
          <div className="font-bold text-yellow-600">
            +{session.bonus_minutes_allowed}m
          </div>
        </div>
        <div>
          <div className="text-xs text-gray-600">Total</div>
          <div className="font-bold text-primary">
            {session.total_minutes_allowed}m
          </div>
        </div>
      </div>

      {timeRemaining === 0 && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded text-center">
          <p className="text-red-700 font-semibold text-sm">
            Screen time expired
          </p>
        </div>
      )}
    </div>
  )
}
