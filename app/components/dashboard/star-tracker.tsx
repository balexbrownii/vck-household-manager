'use client'

import { Kid } from '@/types'

interface StarTrackerProps {
  kid: Kid
}

export default function StarTracker({ kid }: StarTrackerProps) {
  const starsToNext = 200 - (kid.total_stars % 200)
  const progress = ((kid.total_stars % 200) / 200) * 100

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="text-sm font-medium text-gray-700">Stars</div>
        <div className="text-sm font-bold text-primary">
          {kid.total_stars % 200}/200
        </div>
      </div>
      <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
        <div
          className="h-full bg-primary transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>
      <div className="text-xs text-gray-500">
        {starsToNext} stars to ${kid.milestones_reached + 1} milestone
      </div>
    </div>
  )
}
