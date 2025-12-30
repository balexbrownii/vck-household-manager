'use client'

import { useEffect, useState } from 'react'
import { createClient } from '../../lib/supabase/client'
import { Kid } from '../../types'
import { Activity, TrendingUp, AlertTriangle } from 'lucide-react'

interface KidAnalyticsProps {
  kid: Kid
}

interface KidStats {
  completionRate7d: number
  completionRate30d: number
  starsThisWeek: number
  starsThisMonth: number
  recentTimeouts: number
  topViolation: string | null
}

export default function KidAnalytics({ kid }: KidAnalyticsProps) {
  const [stats, setStats] = useState<KidStats>({
    completionRate7d: 0,
    completionRate30d: 0,
    starsThisWeek: 0,
    starsThisMonth: 0,
    recentTimeouts: 0,
    topViolation: null,
  })
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      setIsLoading(true)
      const supabase = createClient()

      const today = new Date()
      const sevenDaysAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
      const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000)

      const sevenDaysAgoStr = sevenDaysAgo.toISOString().split('T')[0]
      const thirtyDaysAgoStr = thirtyDaysAgo.toISOString().split('T')[0]

      // Get completion rates
      const { data: expectations7d } = await supabase
        .from('daily_expectations')
        .select('all_complete')
        .eq('kid_id', kid.id)
        .gte('date', sevenDaysAgoStr)

      const completed7d = expectations7d?.filter((e) => e.all_complete).length || 0
      const total7d = expectations7d?.length || 1
      const completionRate7d = Math.round((completed7d / total7d) * 100)

      const { data: expectations30d } = await supabase
        .from('daily_expectations')
        .select('all_complete')
        .eq('kid_id', kid.id)
        .gte('date', thirtyDaysAgoStr)

      const completed30d = expectations30d?.filter((e) => e.all_complete).length || 0
      const total30d = expectations30d?.length || 1
      const completionRate30d = Math.round((completed30d / total30d) * 100)

      // Get star history
      const { data: starHistory7d } = await supabase
        .from('star_history')
        .select('stars_earned')
        .eq('kid_id', kid.id)
        .gte('created_at', sevenDaysAgoStr)

      const starsThisWeek = starHistory7d?.reduce((sum, h) => sum + h.stars_earned, 0) || 0

      const { data: starHistory30d } = await supabase
        .from('star_history')
        .select('stars_earned')
        .eq('kid_id', kid.id)
        .gte('created_at', thirtyDaysAgoStr)

      const starsThisMonth = starHistory30d?.reduce((sum, h) => sum + h.stars_earned, 0) || 0

      // Get timeout stats
      const { data: recentTimeouts } = await supabase
        .from('timeout_violations')
        .select('violation_type')
        .eq('kid_id', kid.id)
        .gte('started_at', sevenDaysAgoStr)

      const topViolation = (recentTimeouts && recentTimeouts.length > 0)
        ? recentTimeouts?.[0]?.violation_type || null
        : null

      setStats({
        completionRate7d,
        completionRate30d,
        starsThisWeek,
        starsThisMonth,
        recentTimeouts: recentTimeouts?.length || 0,
        topViolation,
      })

      setIsLoading(false)
    }

    fetchStats()
  }, [kid.id])

  if (isLoading) {
    return <div className="text-gray-500">Loading analytics...</div>
  }

  const getCompletionColor = (rate: number) => {
    if (rate >= 80) return 'text-green-600 bg-green-50'
    if (rate >= 60) return 'text-yellow-600 bg-yellow-50'
    return 'text-red-600 bg-red-50'
  }

  return (
    <div className="bg-white rounded-lg border-2 border-gray-200 p-6">
      <div className="mb-6">
        <h3 className="text-xl font-bold text-gray-900">{kid.name}</h3>
        <p className="text-sm text-gray-600">Age {kid.age}</p>
      </div>

      {/* Completion Rates */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Activity className="w-5 h-5 text-blue-600" />
          <h4 className="text-lg font-semibold text-gray-900">Completion Rates</h4>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className={`rounded-lg p-4 ${getCompletionColor(stats.completionRate7d)}`}>
            <p className="text-xs font-medium opacity-75">Last 7 Days</p>
            <p className="text-2xl font-bold">{stats.completionRate7d}%</p>
          </div>
          <div className={`rounded-lg p-4 ${getCompletionColor(stats.completionRate30d)}`}>
            <p className="text-xs font-medium opacity-75">Last 30 Days</p>
            <p className="text-2xl font-bold">{stats.completionRate30d}%</p>
          </div>
        </div>
      </div>

      {/* Star Velocity */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-5 h-5 text-yellow-600" />
          <h4 className="text-lg font-semibold text-gray-900">Star Velocity</h4>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-lg p-4 bg-yellow-50 border border-yellow-200">
            <p className="text-xs font-medium text-yellow-700">This Week</p>
            <p className="text-2xl font-bold text-yellow-600">{stats.starsThisWeek}</p>
            <p className="text-xs text-yellow-600 mt-1">stars earned</p>
          </div>
          <div className="rounded-lg p-4 bg-blue-50 border border-blue-200">
            <p className="text-xs font-medium text-blue-700">This Month</p>
            <p className="text-2xl font-bold text-blue-600">{stats.starsThisMonth}</p>
            <p className="text-xs text-blue-600 mt-1">stars earned</p>
          </div>
        </div>
      </div>

      {/* Timeout Patterns */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <AlertTriangle className="w-5 h-5 text-red-600" />
          <h4 className="text-lg font-semibold text-gray-900">Timeout Patterns</h4>
        </div>
        <div className="rounded-lg p-4 bg-red-50 border border-red-200">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-medium text-red-700">Last 7 Days</p>
            <p className="text-2xl font-bold text-red-600">{stats.recentTimeouts}</p>
          </div>
          {stats.topViolation ? (
            <p className="text-sm text-red-700">
              Most common: <strong>{stats.topViolation.replace(/_/g, ' ')}</strong>
            </p>
          ) : (
            <p className="text-sm text-green-700">No timeouts this week - great job!</p>
          )}
        </div>
      </div>

      {/* Current Balance */}
      <div className="mt-6 pt-6 border-t border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">Total Stars</p>
            <p className="text-2xl font-bold text-yellow-600">{kid.total_stars || 0}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Milestones Reached</p>
            <p className="text-2xl font-bold text-blue-600">{kid.milestones_reached || 0}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
