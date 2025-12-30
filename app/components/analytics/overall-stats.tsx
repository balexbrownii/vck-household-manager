'use client'

import { useEffect, useState } from 'react'
import { createClient } from '../../lib/supabase/client'
import { Kid } from '@/types'
import { BarChart3, Calendar } from 'lucide-react'

interface OverallStatsProps {
  kids: Kid[]
}

interface Stats {
  totalStars: number
  totalTimeouts: number
  averageCompletionRate: number
  thisWeekStars: number
}

export default function OverallStats({ kids }: OverallStatsProps) {
  const [stats, setStats] = useState<Stats>({
    totalStars: 0,
    totalTimeouts: 0,
    averageCompletionRate: 0,
    thisWeekStars: 0,
  })
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      setIsLoading(true)
      const supabase = createClient()

      // Calculate date range (last 7 days)
      const today = new Date()
      const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
      const weekAgoStr = weekAgo.toISOString().split('T')[0]

      // Get total stars from all kids
      const totalStarsFromKids = kids.reduce((sum, kid) => sum + (kid.total_stars || 0), 0)

      // Get star history for this week
      const { data: recentStarHistory } = await supabase
        .from('star_history')
        .select('stars_earned')
        .gte('created_at', weekAgoStr)

      const thisWeekStars = recentStarHistory?.reduce((sum, h) => sum + h.stars_earned, 0) || 0

      // Get total timeouts
      const { data: timeouts } = await supabase
        .from('timeout_violations')
        .select('id')

      // Get completion rate (last 7 days)
      const { data: expectations } = await supabase
        .from('daily_expectations')
        .select('all_complete')
        .gte('date', weekAgoStr)

      const completedCount = expectations?.filter((e) => e.all_complete).length || 0
      const totalCount = expectations?.length || 1
      const completionRate = Math.round((completedCount / totalCount) * 100)

      setStats({
        totalStars: totalStarsFromKids,
        totalTimeouts: timeouts?.length || 0,
        averageCompletionRate: completionRate,
        thisWeekStars,
      })

      setIsLoading(false)
    }

    fetchStats()
  }, [kids])

  if (isLoading) {
    return <div className="text-gray-500">Loading analytics...</div>
  }

  const StatCard = ({ icon: Icon, label, value, color }: any) => (
    <div className={`rounded-lg border-2 p-6 ${color}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-600 text-sm font-medium">{label}</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{value}</p>
        </div>
        <Icon className="w-8 h-8 opacity-20" />
      </div>
    </div>
  )

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <StatCard
        icon={BarChart3}
        label="Total Stars"
        value={stats.totalStars}
        color="bg-yellow-50 border-yellow-200"
      />
      <StatCard
        icon={Calendar}
        label="This Week Stars"
        value={stats.thisWeekStars}
        color="bg-blue-50 border-blue-200"
      />
      <StatCard
        icon={BarChart3}
        label="Completion Rate"
        value={`${stats.averageCompletionRate}%`}
        color="bg-green-50 border-green-200"
      />
      <StatCard
        icon={BarChart3}
        label="Total Timeouts"
        value={stats.totalTimeouts}
        color="bg-red-50 border-red-200"
      />
    </div>
  )
}
