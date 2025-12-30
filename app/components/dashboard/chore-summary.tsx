'use client'

import { ChoreAssignmentType, WeekType, ChoreCompletion } from '@/types'

interface ChoreSummaryProps {
  kidName: string
  week: WeekType
  assignment: ChoreAssignmentType
  completion: ChoreCompletion | null
}

export default function ChoreSummary({
  kidName,
  week,
  assignment,
  completion,
}: ChoreSummaryProps) {
  return (
    <div className="text-sm">
      <div className="text-gray-600 mb-1">Current Chore</div>
      <div className="flex items-center gap-2">
        <div className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-semibold">
          Week {week}
        </div>
        <div className="text-gray-900 font-medium">{assignment}</div>
      </div>
      {completion?.completed && (
        <div className="text-xs text-success font-semibold mt-1">✓ Completed</div>
      )}
    </div>
  )
}
