'use client'

import { DailyExpectation } from '@/types'
import ChecklistToggle from './checklist-toggle'

interface DailyChecklistProps {
  kidId: string
  date: string
  expectations: DailyExpectation
  choreAssignment?: string
}

export default function DailyChecklist({
  kidId,
  date,
  expectations,
  choreAssignment,
}: DailyChecklistProps) {
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
      label: 'Daily Chore',
      description: choreAssignment || 'Rotating assignment',
    },
  ]

  return (
    <div className="space-y-3">
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
