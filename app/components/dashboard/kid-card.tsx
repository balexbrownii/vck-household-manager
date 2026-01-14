'use client'

import { Kid, DailyExpectation } from '@/types'
import DailyChecklist from './daily-checklist'
import ScreenTimeStatus from './screen-time-status'
import StarTracker from './star-tracker'
import QuickAddChore from './quick-add-chore'
import QuickAddExpectation from './quick-add-expectation'
import Link from 'next/link'
import { ChevronRight, Star } from 'lucide-react'

interface PendingTimeout {
  id: string
  timeout_minutes: number
  violation_type: string
  reset_count: number
  serving_started_at: string | null
  served_at: string | null
}

interface KidCardProps {
  kid: Kid
  expectations: DailyExpectation
  choreAssignment?: string
  roomName?: string
  choreChecklist?: string[]
  pendingTimeout?: PendingTimeout
}

export default function KidCard({
  kid,
  expectations,
  choreAssignment,
  roomName,
  choreChecklist,
  pendingTimeout,
}: KidCardProps) {
  return (
    <div className="parent-kid-card">
      {/* Header with avatar, name, and screen time status */}
      <div className="flex items-start justify-between mb-5">
        <div className="flex items-center gap-4">
          <div className="parent-kid-avatar">
            {kid.name.charAt(0)}
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">{kid.name}</h2>
            <p className="text-sm text-gray-500">Age {kid.age}</p>
          </div>
        </div>
        <ScreenTimeStatus
          allExpectationsComplete={expectations.all_complete}
        />
      </div>

      {/* Star Tracker */}
      <div className="mb-5">
        <StarTracker kid={kid} />
      </div>

      {/* Daily expectations checklist */}
      <div className="mb-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
            Today&apos;s Expectations
          </h3>
          <div className="flex items-center gap-1">
            <QuickAddExpectation kidId={kid.id} kidName={kid.name} />
            <QuickAddChore kidId={kid.id} kidName={kid.name} />
          </div>
        </div>
        <DailyChecklist
          kidId={kid.id}
          date={new Date().toISOString().split('T')[0] || ''}
          expectations={expectations}
          choreAssignment={choreAssignment}
          roomName={roomName}
          choreChecklist={choreChecklist}
          pendingTimeout={pendingTimeout}
        />
      </div>

      {/* Quick link to gigs */}
      <Link
        href={`/kid/${kid.id}/gigs`}
        className="flex items-center justify-between p-3 -mx-1 rounded-xl hover:bg-gray-50 transition-colors group"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
            <Star className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <div className="font-semibold text-gray-900">View Gigs</div>
            <div className="text-sm text-gray-500">{kid.total_stars} stars earned</div>
          </div>
        </div>
        <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-gray-600 transition-colors" />
      </Link>
    </div>
  )
}
