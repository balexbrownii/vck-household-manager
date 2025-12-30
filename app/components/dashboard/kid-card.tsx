'use client'

import { Kid, DailyExpectation } from '@/types'
import DailyChecklist from './daily-checklist'
import ScreenTimeStatus from './screen-time-status'
import StarTracker from './star-tracker'
import { useState } from 'react'
import Link from 'next/link'

interface KidCardProps {
  kid: Kid
  expectations: DailyExpectation
  onUpdate?: () => void
}

export default function KidCard({
  kid,
  expectations,
  onUpdate,
}: KidCardProps) {
  const [refreshing, setRefreshing] = useState(false)

  const handleUpdate = async () => {
    setRefreshing(true)
    if (onUpdate) {
      onUpdate()
    }
    setRefreshing(false)
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow">
      {/* Header with kid name and age */}
      <div className="mb-6">
        <div className="flex items-baseline gap-2 mb-4">
          <h2 className="text-2xl font-bold text-gray-900">{kid.name}</h2>
          <span className="text-sm text-gray-500">age {kid.age}</span>
        </div>

        {/* Screen time status indicator */}
        <ScreenTimeStatus
          allExpectationsComplete={expectations.all_complete}
        />
      </div>

      {/* Daily expectations checklist */}
      <div className="mb-6">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">
          Today's Expectations
        </h3>
        <DailyChecklist
          kidId={kid.id}
          date={new Date().toISOString().split('T')[0] || ''}
          expectations={expectations}
          onUpdate={handleUpdate}
        />
      </div>

      {/* Star tracker */}
      <div className="mb-6 pt-4 border-t border-gray-100">
        <StarTracker kid={kid} />
      </div>

      {/* Quick links */}
      <div className="pt-4 border-t border-gray-100 space-y-2">
        <Link
          href={`/kid/${kid.id}/gigs`}
          className="block text-center py-2 px-3 bg-blue-50 text-blue-600 rounded font-medium hover:bg-blue-100 transition-colors text-sm"
        >
          View Gigs
        </Link>
      </div>
    </div>
  )
}
