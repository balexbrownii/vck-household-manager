'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { DailyExpectation } from '@/types'
import ChecklistToggle from './checklist-toggle'
import AdhocItemToggle from './adhoc-item-toggle'
import TimeoutToggle from './timeout-toggle'

interface PendingTimeout {
  id: string
  timeout_minutes: number
  violation_type: string
  reset_count: number
  serving_started_at: string | null
  served_at: string | null
}

interface AdhocExpectation {
  id: string
  title: string
  description: string | null
  icon: string
  completed: boolean
}

interface AdhocChore {
  id: string
  title: string
  description: string | null
  checklist: string[]
  completed: boolean
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
  const router = useRouter()
  const [adhocExpectations, setAdhocExpectations] = useState<AdhocExpectation[]>([])
  const [adhocChores, setAdhocChores] = useState<AdhocChore[]>([])

  const fetchAdhocItems = useCallback(async () => {
    try {
      const [expRes, choreRes] = await Promise.all([
        fetch(`/api/adhoc-expectations?kidId=${kidId}&date=${date}`),
        fetch(`/api/adhoc-chores?kidId=${kidId}&date=${date}`)
      ])

      if (expRes.ok) {
        const data = await expRes.json()
        setAdhocExpectations(data.expectations || [])
      }

      if (choreRes.ok) {
        const data = await choreRes.json()
        setAdhocChores(data.chores || [])
      }
    } catch (error) {
      console.error('Failed to fetch adhoc items:', error)
    }
  }, [kidId, date])

  useEffect(() => {
    fetchAdhocItems()
  }, [fetchAdhocItems])

  const handleDeleteExpectation = async (id: string) => {
    try {
      const res = await fetch('/api/adhoc-expectations', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ expectationId: id })
      })
      if (res.ok) {
        setAdhocExpectations(prev => prev.filter(e => e.id !== id))
        router.refresh()
      }
    } catch (error) {
      console.error('Failed to delete expectation:', error)
    }
  }

  const handleDeleteChore = async (id: string) => {
    try {
      const res = await fetch('/api/adhoc-chores', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ choreId: id })
      })
      if (res.ok) {
        setAdhocChores(prev => prev.filter(c => c.id !== id))
        router.refresh()
      }
    } catch (error) {
      console.error('Failed to delete chore:', error)
    }
  }
  // Build the chore description with room name and tasks
  const choreDescription = roomName
    ? `${roomName}${choreChecklist && choreChecklist.length > 0 ? ': ' + choreChecklist.join(', ') : ''}`
    : choreAssignment || 'Rotating assignment'

  const expectationItems = [
    {
      key: 'exercise_complete',
      type: 'exercise',
      label: 'Exercise',
      description: '20+ minutes physical activity',
      completedByKid: expectations.exercise_completed_by_kid,
      completedAt: expectations.exercise_completed_at,
    },
    {
      key: 'reading_complete',
      type: 'reading',
      label: 'Read/Homework',
      description: '15+ minutes reading or homework',
      completedByKid: expectations.reading_completed_by_kid,
      completedAt: expectations.reading_completed_at,
    },
    {
      key: 'tidy_up_complete',
      type: 'tidy_up',
      label: 'Tidy Up',
      description: 'Personal cleanup (room, house, car, yard)',
      completedByKid: expectations.tidy_up_completed_by_kid,
      completedAt: expectations.tidy_up_completed_at,
    },
    {
      key: 'daily_chore_complete',
      type: 'daily_chore',
      label: `Daily Chore: ${choreAssignment || 'TBD'}`,
      description: choreDescription,
      completedByKid: expectations.daily_chore_completed_by_kid,
      completedAt: expectations.daily_chore_completed_at,
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
          isParent={true}
          onDismiss={() => router.refresh()}
        />
      )}

      {expectationItems.map((item) => (
        <ChecklistToggle
          key={item.key}
          kidId={kidId}
          date={date}
          expectation={item.type}
          label={item.label}
          description={item.description}
          isComplete={
            expectations[item.key as keyof DailyExpectation] === true
          }
          completedByKid={item.completedByKid}
          completedAt={item.completedAt}
        />
      ))}

      {/* Ad-hoc Expectations */}
      {adhocExpectations.map((item) => (
        <AdhocItemToggle
          key={`adhoc-exp-${item.id}`}
          id={item.id}
          type="expectation"
          title={item.title}
          description={item.description}
          isComplete={item.completed}
          icon={item.icon}
          onDelete={() => handleDeleteExpectation(item.id)}
        />
      ))}

      {/* Ad-hoc Chores */}
      {adhocChores.map((item) => (
        <AdhocItemToggle
          key={`adhoc-chore-${item.id}`}
          id={item.id}
          type="chore"
          title={item.title}
          description={item.description}
          isComplete={item.completed}
          checklist={item.checklist}
          onDelete={() => handleDeleteChore(item.id)}
        />
      ))}
    </div>
  )
}
