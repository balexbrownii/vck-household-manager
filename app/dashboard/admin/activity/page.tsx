'use client'

import { useState, useEffect } from 'react'
import PageHeader from '@/components/ui/page-header'
import {
  Activity,
  Loader2,
  User,
  Users,
  Star,
  Briefcase,
  Camera,
  CheckCircle,
  AlertTriangle,
  MessageSquare,
  RefreshCw,
  Filter,
} from 'lucide-react'

interface ActivityItem {
  id: string
  kid_id: string | null
  actor_type: string
  actor_id: string | null
  action: string
  entity_type: string | null
  entity_id: string | null
  message: string
  created_at: string
  kids?: { name: string } | null
}

interface Kid {
  id: string
  name: string
}

export default function ActivityLogPage() {
  const [activities, setActivities] = useState<ActivityItem[]>([])
  const [kids, setKids] = useState<Kid[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [selectedKid, setSelectedKid] = useState<string>('all')
  const [selectedAction, setSelectedAction] = useState<string>('all')
  const [hasMore, setHasMore] = useState(true)
  const [offset, setOffset] = useState(0)

  useEffect(() => {
    loadKids()
  }, [])

  useEffect(() => {
    setOffset(0)
    setHasMore(true)
    loadActivities(true)
  }, [selectedKid, selectedAction])

  const loadKids = async () => {
    try {
      const res = await fetch('/api/kids')
      if (res.ok) {
        const data = await res.json()
        setKids(data.kids || [])
      }
    } catch (err) {
      console.error('Failed to load kids:', err)
    }
  }

  const loadActivities = async (reset = false) => {
    const currentOffset = reset ? 0 : offset

    if (reset) {
      setLoading(true)
    } else {
      setLoadingMore(true)
    }

    try {
      const params = new URLSearchParams({
        limit: '50',
        offset: currentOffset.toString(),
      })

      if (selectedKid !== 'all') {
        params.set('kidId', selectedKid)
      }
      if (selectedAction !== 'all') {
        params.set('action', selectedAction)
      }

      const res = await fetch(`/api/activity?${params}`)
      if (res.ok) {
        const data = await res.json()
        const newActivities = data.activities || []

        if (reset) {
          setActivities(newActivities)
        } else {
          setActivities(prev => [...prev, ...newActivities])
        }

        setHasMore(newActivities.length === 50)
        setOffset(currentOffset + newActivities.length)
      }
    } catch (err) {
      console.error('Failed to load activities:', err)
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }

  const getActionIcon = (action: string) => {
    if (action.includes('gig')) return <Briefcase className="w-4 h-4" />
    if (action.includes('star')) return <Star className="w-4 h-4" />
    if (action.includes('photo')) return <Camera className="w-4 h-4" />
    if (action.includes('expectation') || action.includes('chore')) return <CheckCircle className="w-4 h-4" />
    if (action.includes('timeout')) return <AlertTriangle className="w-4 h-4" />
    if (action.includes('message')) return <MessageSquare className="w-4 h-4" />
    return <Activity className="w-4 h-4" />
  }

  const getActionColor = (action: string) => {
    if (action.includes('approved') || action.includes('completed')) return 'bg-green-100 text-green-600'
    if (action.includes('rejected') || action.includes('timeout')) return 'bg-red-100 text-red-600'
    if (action.includes('revision')) return 'bg-amber-100 text-amber-600'
    if (action.includes('star')) return 'bg-yellow-100 text-yellow-600'
    if (action.includes('gig')) return 'bg-purple-100 text-purple-600'
    if (action.includes('photo')) return 'bg-teal-100 text-teal-600'
    return 'bg-gray-100 text-gray-600'
  }

  const getActorIcon = (actorType: string) => {
    switch (actorType) {
      case 'kid':
        return <User className="w-4 h-4" />
      case 'parent':
        return <Users className="w-4 h-4" />
      default:
        return <Activity className="w-4 h-4" />
    }
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    return date.toLocaleDateString()
  }

  const actionTypes = [
    { value: 'all', label: 'All Actions' },
    { value: 'gig', label: 'Gigs' },
    { value: 'expectation', label: 'Expectations' },
    { value: 'chore', label: 'Chores' },
    { value: 'star', label: 'Stars' },
    { value: 'photo', label: 'Photos' },
    { value: 'timeout', label: 'Timeouts' },
  ]

  return (
    <div className="max-w-4xl mx-auto">
      <PageHeader
        title="Activity Log"
        subtitle="View all family activity history"
        backHref="/dashboard/admin"
        backLabel="Back to Admin"
        icon={<Activity className="w-7 h-7 text-gray-600" />}
      />

      {/* Filters */}
      <div className="bg-white rounded-xl border-2 border-gray-100 p-4 mb-6">
        <div className="flex items-center gap-2 mb-3">
          <Filter className="w-4 h-4 text-gray-400" />
          <span className="text-sm font-medium text-gray-700">Filters</span>
        </div>
        <div className="flex flex-wrap gap-3">
          <select
            value={selectedKid}
            onChange={(e) => setSelectedKid(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Kids</option>
            {kids.map((kid) => (
              <option key={kid.id} value={kid.id}>{kid.name}</option>
            ))}
          </select>

          <select
            value={selectedAction}
            onChange={(e) => setSelectedAction(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {actionTypes.map((type) => (
              <option key={type.value} value={type.value}>{type.label}</option>
            ))}
          </select>

          <button
            onClick={() => loadActivities(true)}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>
      </div>

      {/* Activity List */}
      <div className="bg-white rounded-xl border-2 border-gray-100 overflow-hidden">
        {loading ? (
          <div className="py-12 text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-gray-400" />
            <p className="mt-4 text-gray-600">Loading activity...</p>
          </div>
        ) : activities.length === 0 ? (
          <div className="py-12 text-center">
            <Activity className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No activity found</p>
          </div>
        ) : (
          <>
            <div className="divide-y divide-gray-100">
              {activities.map((activity) => (
                <div key={activity.id} className="p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${getActionColor(activity.action)}`}>
                      {getActionIcon(activity.action)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-gray-900">{activity.message}</p>
                      <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          {getActorIcon(activity.actor_type)}
                          {activity.actor_type === 'kid' && activity.kids?.name
                            ? activity.kids.name
                            : activity.actor_type === 'parent'
                            ? 'Parent'
                            : 'System'
                          }
                        </span>
                        <span>{formatDate(activity.created_at)}</span>
                        {activity.entity_type && (
                          <span className="px-2 py-0.5 bg-gray-100 rounded-full">
                            {activity.entity_type}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {hasMore && (
              <div className="p-4 text-center border-t">
                <button
                  onClick={() => loadActivities()}
                  disabled={loadingMore}
                  className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 flex items-center gap-2 mx-auto"
                >
                  {loadingMore ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    'Load More'
                  )}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
