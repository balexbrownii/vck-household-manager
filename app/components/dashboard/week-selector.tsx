'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from '@/lib/toast'

interface WeekSelectorProps {
  currentWeek: string
}

export default function WeekSelector({ currentWeek }: WeekSelectorProps) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleWeekChange = async (newWeek: string) => {
    if (newWeek === currentWeek) return

    setLoading(true)
    try {
      const response = await fetch('/api/chores/rotate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ week: newWeek }),
      })

      if (response.ok) {
        router.refresh()
      }
    } catch {
      toast.error('Failed to change week')
    } finally {
      setLoading(false)
    }
  }

  const weeks = ['A', 'B', 'C']

  return (
    <div className="inline-flex items-center gap-2">
      <span className="text-sm text-gray-500">Week:</span>
      <div className="inline-flex rounded-lg border border-gray-200 overflow-hidden">
        {weeks.map((week) => (
          <button
            key={week}
            onClick={() => handleWeekChange(week)}
            disabled={loading}
            className={`px-3 py-1 text-sm font-semibold transition-colors ${
              currentWeek === week
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {week}
          </button>
        ))}
      </div>
    </div>
  )
}
