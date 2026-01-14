'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Activity, CheckCircle, XCircle, Star, Clock, Monitor, ChevronRight, Bell } from 'lucide-react'

interface ActivityItem {
  id: string
  kid_id: string
  actor_type: 'kid' | 'parent' | 'system'
  action: string
  entity_type: string | null
  message: string
  read_by_parent: boolean
  created_at: string
}

interface ActivityFeedProps {
  initialActivity?: ActivityItem[]
  maxItems?: number
  showViewAll?: boolean
}

export default function ActivityFeed({
  initialActivity = [],
  maxItems = 5,
  showViewAll = true
}: ActivityFeedProps) {
  const [activity, setActivity] = useState<ActivityItem[]>(initialActivity)
  const [loading, setLoading] = useState(initialActivity.length === 0)

  useEffect(() => {
    if (initialActivity.length === 0) {
      fetchActivity()
    }
  }, [initialActivity.length])

  const fetchActivity = async () => {
    try {
      const res = await fetch(`/api/activity?limit=${maxItems}`)
      const data = await res.json()
      if (data.activity) {
        setActivity(data.activity)
      }
    } catch (error) {
      console.error('Failed to fetch activity:', error)
    } finally {
      setLoading(false)
    }
  }

  const getActionIcon = (action: string) => {
    if (action.includes('approved')) return <CheckCircle className="w-4 h-4 text-green-600" />
    if (action.includes('rejected')) return <XCircle className="w-4 h-4 text-red-600" />
    if (action.includes('star')) return <Star className="w-4 h-4 text-yellow-500" />
    if (action.includes('timeout')) return <Clock className="w-4 h-4 text-red-600" />
    if (action.includes('screen_time')) return <Monitor className="w-4 h-4 text-blue-600" />
    return <Activity className="w-4 h-4 text-gray-500" />
  }

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMins / 60)
    const diffDays = Math.floor(diffHours / 24)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays === 1) return 'Yesterday'
    return date.toLocaleDateString()
  }

  if (loading) {
    return (
      <div className="bg-white border-2 border-gray-100 rounded-2xl p-4 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Activity className="w-5 h-5 text-blue-600" />
          <h2 className="font-bold text-gray-900">Recent Activity</h2>
        </div>
        <div className="animate-pulse space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-gray-200" />
              <div className="flex-1">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-1" />
                <div className="h-3 bg-gray-100 rounded w-1/4" />
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white border-2 border-gray-100 rounded-2xl p-4 mb-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Bell className="w-5 h-5 text-blue-600" />
          <h2 className="font-bold text-gray-900">Recent Activity</h2>
          {activity.filter(a => !a.read_by_parent).length > 0 && (
            <span className="inline-flex items-center justify-center w-5 h-5 text-xs font-bold bg-blue-600 text-white rounded-full">
              {activity.filter(a => !a.read_by_parent).length}
            </span>
          )}
        </div>
        {showViewAll && (
          <Link
            href="/dashboard/activity"
            className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
          >
            View All <ChevronRight className="w-4 h-4" />
          </Link>
        )}
      </div>

      {activity.length === 0 ? (
        <div className="text-center py-6">
          <Activity className="w-8 h-8 text-gray-300 mx-auto mb-2" />
          <p className="text-gray-500 text-sm">No recent activity</p>
        </div>
      ) : (
        <div className="space-y-3">
          {activity.slice(0, maxItems).map((item) => (
            <div
              key={item.id}
              className={`flex items-start gap-3 p-2 rounded-lg transition-colors ${
                !item.read_by_parent ? 'bg-blue-50' : 'hover:bg-gray-50'
              }`}
            >
              <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                {getActionIcon(item.action)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-900">{item.message}</p>
                <p className="text-xs text-gray-500">{formatTime(item.created_at)}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
