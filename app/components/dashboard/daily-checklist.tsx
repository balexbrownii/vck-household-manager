'use client'

import { DailyExpectation } from '@/types'
import ChecklistToggle from './checklist-toggle'
import TimeoutToggle from './timeout-toggle'

interface PendingTimeout {
  id: string
  timeout_minutes: number
  violation_type: string
  reset_count: number
  serving_started_at: string | null
  served_at: string | null
}

interface DailyChecklistProps {
  kidId: string
  date: string
  expectations: DailyExpectation
  choreAssignment?: string
  roomName?: string
  choreChecklist?: string[]
  pendingTimeout?: PendingTimeout
}

export default function DailyChecklist({
  kidId,
  date,
  expectations,
  choreAssignment,
  roomName,
  choreChecklist,
  pendingTimeout,
}: DailyChecklistProps) {
  // Build the chore description with room name and tasks
  const choreDescription = roomName
    ? `${roomName}${choreChecklist && choreChecklist.length > 0 ? ': ' + choreChecklist.join(', ') : ''}`
    : choreAssignment || 'Rotating assignment'

  const expectationItems = [
    {
      key: 'exercise_complete',
      label: 'Exercise',
      description: '20+ minutes physical activity',
    },
    {
      key: 'reading_complete',
      label: 'Read/Homework',
      description: '15+ minutes reading or homework',
    },
    {
      key: 'tidy_up_complete',
      label: 'Tidy Up',
      description: 'Personal cleanup (room, house, car, yard)',
    },
    {
      key: 'daily_chore_complete',
      label: `Daily Chore: ${choreAssignment || 'TBD'}`,
      description: choreDescription,
    },
  ]

  return (
    <div className="space-y-3">
      {/* Pending Timeout - shown first if exists */}
      {pendingTimeout && (
        <TimeoutToggle
          timeoutId={pendingTimeout.id}
          timeoutMinutes={pendingTimeout.timeout_minutes}
          violationType={pendingTimeout.violation_type}
          resetCount={pendingTimeout.reset_count}
          servingStartedAt={pendingTimeout.serving_started_at}
          servedAt={pendingTimeout.served_at}
        />
      )}

      {expectationItems.map((item) => (
        <ChecklistToggle
          key={item.key}
          kidId={kidId}
          date={date}
          expectation={item.key}
          label={item.label}
          description={item.description}
          isComplete={
            expectations[item.key as keyof DailyExpectation] === true
          }
        />
      ))}
    </div>
  )
}
