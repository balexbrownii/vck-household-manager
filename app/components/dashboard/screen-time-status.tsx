'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Lock, Unlock, Settings } from 'lucide-react'

interface ScreenTimeStatusProps {
  allExpectationsComplete: boolean
  kidId?: string
  isParent?: boolean
}

export default function ScreenTimeStatus({
  allExpectationsComplete,
  kidId,
  isParent = false,
}: ScreenTimeStatusProps) {
  const router = useRouter()
  const [showOverride, setShowOverride] = useState(false)
  const [overriding, setOverriding] = useState(false)

  const handleOverride = async (action: 'unlock' | 'lock') => {
    if (!kidId) return
    setOverriding(true)
    try {
      const res = await fetch('/api/screen-time/override', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kidId, action })
      })
      if (res.ok) {
        router.refresh()
        setShowOverride(false)
      }
    } catch (error) {
      console.error('Screen time override failed:', error)
    } finally {
      setOverriding(false)
    }
  }

  return (
    <div className="relative">
      <div
        className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium ${
          allExpectationsComplete
            ? 'bg-success/10 text-success border border-success/20'
            : 'bg-danger/10 text-danger border border-danger/20'
        }`}
      >
        {allExpectationsComplete ? (
          <>
            <Unlock className="w-4 h-4" />
            <span>Screen Time UNLOCKED</span>
          </>
        ) : (
          <>
            <Lock className="w-4 h-4" />
            <span>Screen Time Locked</span>
          </>
        )}
        {isParent && kidId && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              setShowOverride(!showOverride)
            }}
            className="ml-1 p-1 hover:bg-black/10 rounded transition-colors"
            title="Override screen time"
          >
            <Settings className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Override dropdown */}
      {showOverride && isParent && (
        <div className="absolute right-0 top-full mt-1 z-20 bg-white border border-gray-200 rounded-lg shadow-lg p-2 min-w-[140px]">
          {allExpectationsComplete ? (
            <button
              onClick={() => handleOverride('lock')}
              disabled={overriding}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded transition-colors disabled:opacity-50"
            >
              <Lock className="w-4 h-4" />
              {overriding ? 'Locking...' : 'Lock Screen Time'}
            </button>
          ) : (
            <button
              onClick={() => handleOverride('unlock')}
              disabled={overriding}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-green-600 hover:bg-green-50 rounded transition-colors disabled:opacity-50"
            >
              <Unlock className="w-4 h-4" />
              {overriding ? 'Unlocking...' : 'Unlock Screen Time'}
            </button>
          )}
        </div>
      )}
    </div>
  )
}
