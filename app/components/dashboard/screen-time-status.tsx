'use client'

import { DailyExpectation } from '@/types'
import { Lock, Unlock } from 'lucide-react'

interface ScreenTimeStatusProps {
  allExpectationsComplete: boolean
}

export default function ScreenTimeStatus({
  allExpectationsComplete,
}: ScreenTimeStatusProps) {
  return (
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
    </div>
  )
}
