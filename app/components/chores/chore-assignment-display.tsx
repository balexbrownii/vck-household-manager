'use client'

import { ChoreAssignmentType, ChoreRoom, WeekType } from '@/types'
import { CheckCircle2, Circle } from 'lucide-react'
import { useState } from 'react'
import { toast } from '@/lib/toast'

interface ChoreAssignmentDisplayProps {
  kidId: string
  date: string
  week: WeekType
  assignment: ChoreAssignmentType
  room: ChoreRoom | null
  isComplete: boolean
  onComplete?: (complete: boolean) => void
}

export default function ChoreAssignmentDisplay({
  kidId,
  date,
  week,
  assignment,
  room,
  isComplete,
  onComplete,
}: ChoreAssignmentDisplayProps) {
  const [loading, setLoading] = useState(false)
  const [complete, setComplete] = useState(isComplete)

  const handleToggleComplete = async () => {
    setLoading(true)
    setComplete(!complete)

    try {
      const response = await fetch('/api/chores/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kidId,
          date,
          completed: !complete,
        }),
      })

      if (!response.ok) {
        setComplete(complete)
        toast.error('Failed to update chore')
      } else if (onComplete) {
        onComplete(!complete)
      }
    } catch {
      setComplete(complete)
      toast.error('Failed to update chore')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      {/* Week indicator */}
      <div className="flex items-center gap-2 mb-4">
        <div className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-semibold">
          Week {week}
        </div>
        <div className="text-sm text-gray-500">{assignment}</div>
      </div>

      {room ? (
        <>
          {/* Room name */}
          <h3 className="text-2xl font-bold text-gray-900 mb-4">{room.room_name}</h3>

          {/* Checklist */}
          <div className="space-y-2 mb-6">
            {room.checklist.map((task, index) => (
              <div key={index} className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-success flex-shrink-0" />
                <span className="text-gray-700">{task}</span>
              </div>
            ))}
          </div>

          {/* Complete button */}
          <button
            onClick={handleToggleComplete}
            disabled={loading}
            className={`w-full py-3 rounded-lg font-semibold transition-colors ${
              complete
                ? 'bg-success text-white hover:bg-green-700'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            } disabled:opacity-50`}
          >
            {complete ? '✓ Chore Complete' : 'Mark as Complete'}
          </button>
        </>
      ) : (
        <div className="text-center py-8 text-gray-500">
          <p>No room assignment found for today</p>
        </div>
      )}
    </div>
  )
}
