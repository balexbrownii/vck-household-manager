'use client'

import { useEffect, useState } from 'react'
import { createClient } from '../../lib/supabase/client'
import { TimeoutViolation } from '@/types'
import { VIOLATION_RULES, formatTimeoutDuration } from '@/lib/domain/timeout-rules'
import { TrendingUp, Calendar } from 'lucide-react'

interface TimeoutHistoryProps {
  kidId: string
  kidName: string
}

interface ViolationStat {
  type: string
  count: number
  totalMinutes: number
  description: string
}

export default function TimeoutHistory({ kidId, kidName }: TimeoutHistoryProps) {
  const [history, setHistory] = useState<TimeoutViolation[]>([])
  const [stats, setStats] = useState<ViolationStat[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchHistory = async () => {
      setIsLoading(true)
      const supabase = createClient()

      // Fetch completed timeouts (last 30)
      const { data: completedTimeouts } = await supabase
        .from('timeout_violations')
        .select('*')
        .eq('kid_id', kidId)
        .not('completed_at', 'is', null)
        .order('completed_at', { ascending: false })
        .limit(30)

      setHistory(completedTimeouts || [])

      // Calculate violation statistics
      if (completedTimeouts && completedTimeouts.length > 0) {
        const statsMap = new Map<string, ViolationStat>()

        completedTimeouts.forEach((timeout) => {
          const rule = VIOLATION_RULES[timeout.violation_type]
          const key = timeout.violation_type

          if (!statsMap.has(key)) {
            statsMap.set(key, {
              type: timeout.violation_type,
              count: 0,
              totalMinutes: 0,
              description: rule?.description || timeout.violation_type,
            })
          }

          const stat = statsMap.get(key)!
          stat.count += 1
          stat.totalMinutes += timeout.timeout_minutes * (1 + (timeout.reset_count || 0))
        })

        // Sort by frequency
        const sortedStats = Array.from(statsMap.values()).sort((a, b) => b.count - a.count)
        setStats(sortedStats)
      }

      setIsLoading(false)
    }

    fetchHistory()
  }, [kidId])

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (isLoading) {
    return <div className="text-gray-500">Loading history...</div>
  }

  if (history.length === 0) {
    return (
      <div className="bg-green-50 rounded-lg border-2 border-green-200 p-6 text-center">
        <Calendar className="w-8 h-8 text-green-600 mx-auto mb-2" />
        <p className="text-green-700 font-medium">{kidName} has no timeout history</p>
        <p className="text-sm text-green-600">Great behavior!</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg border-2 border-gray-200 p-6">
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-5 h-5 text-orange-600" />
          <h3 className="text-lg font-bold text-gray-900">Violation Patterns</h3>
        </div>

        {/* Top violations */}
        <div className="space-y-3">
          {stats.slice(0, 5).map((stat) => (
            <div key={stat.type} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <div className="font-semibold text-gray-900">
                  {stat.description}
                </div>
                <div className="text-xs text-gray-600">
                  {stat.count} timeout{stat.count !== 1 ? 's' : ''} •{' '}
                  {formatTimeoutDuration(stat.totalMinutes)} total
                </div>
              </div>
              <div className="text-2xl font-bold text-orange-600">
                {stat.count}
              </div>
            </div>
          ))}
        </div>

        {stats.length === 0 && (
          <p className="text-gray-500 text-sm">No violations recorded yet.</p>
        )}
      </div>

      {/* History list */}
      <div className="border-t border-gray-200 pt-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Recent Timeouts</h3>
        <div className="space-y-3">
          {history.slice(0, 10).map((timeout) => {
            const rule = VIOLATION_RULES[timeout.violation_type]
            const actualDuration = timeout.timeout_minutes * (1 + (timeout.reset_count || 0))

            return (
              <div
                key={timeout.id}
                className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <div className="font-semibold text-gray-900">
                      {rule?.description || timeout.violation_type}
                    </div>
                    <div className="text-xs text-gray-600">
                      {formatDate(timeout.completed_at || timeout.started_at)}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-orange-600">
                      {actualDuration}m
                    </div>
                    <div className="text-xs text-gray-600">
                      {timeout.reset_count ? `Reset x${timeout.reset_count}` : 'No reset'}
                    </div>
                  </div>
                </div>
                {timeout.notes && (
                  <div className="text-xs text-gray-600 italic">
                    "{timeout.notes}"
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {history.length > 10 && (
          <p className="text-xs text-gray-500 text-center mt-4">
            Showing 10 of {history.length} timeouts
          </p>
        )}
      </div>
    </div>
  )
}
