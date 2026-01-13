'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  Star,
  ArrowLeft,
  Loader2,
  Trophy,
  Calendar,
  TrendingUp,
} from 'lucide-react'

interface Kid {
  id: string
  name: string
  total_stars: number
}

interface StarEntry {
  id: string
  stars: number
  reason: string
  source_type: string
  created_at: string
}

export default function MyStarsPage() {
  const router = useRouter()
  const [kid, setKid] = useState<Kid | null>(null)
  const [loading, setLoading] = useState(true)
  const [starHistory, setStarHistory] = useState<StarEntry[]>([])

  useEffect(() => {
    checkSessionAndLoadData()
  }, [])

  const checkSessionAndLoadData = async () => {
    try {
      const sessionRes = await fetch('/api/kid-auth/session')
      const sessionData = await sessionRes.json()

      if (!sessionData.authenticated || !sessionData.kid) {
        router.push('/kid-login')
        return
      }

      setKid(sessionData.kid)

      // Load star history
      const historyRes = await fetch(`/api/stars/history?kidId=${sessionData.kid.id}`)
      if (historyRes.ok) {
        const data = await historyRes.json()
        setStarHistory(data.entries || [])
      }
    } catch {
      router.push('/kid-login')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-yellow-400 via-orange-500 to-red-500 flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-white animate-spin" />
      </main>
    )
  }

  if (!kid) return null

  const starsThisWeek = starHistory
    .filter(e => {
      const weekAgo = new Date()
      weekAgo.setDate(weekAgo.getDate() - 7)
      return new Date(e.created_at) > weekAgo
    })
    .reduce((sum, e) => sum + e.stars, 0)

  const starsToMilestone = 200 - (kid.total_stars % 200)
  const milestonesEarned = Math.floor(kid.total_stars / 200)

  return (
    <main className="min-h-screen bg-gradient-to-br from-yellow-400 via-orange-500 to-red-500 p-4">
      <div className="max-w-lg mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => router.push('/kid-dashboard')}
            className="p-2 bg-white/20 rounded-full hover:bg-white/30 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
          <h1 className="text-xl font-bold text-white">My Stars</h1>
        </div>

        {/* Total Stars Card */}
        <div className="bg-white rounded-2xl p-6 mb-4 shadow-lg text-center">
          <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Star className="w-10 h-10 text-yellow-500 fill-yellow-500" />
          </div>
          <div className="text-4xl font-bold text-gray-900 mb-2">
            {kid.total_stars}
          </div>
          <div className="text-gray-500">Total Stars Earned</div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="bg-white rounded-2xl p-4 shadow-lg text-center">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
            <div className="text-2xl font-bold text-gray-900">{starsThisWeek}</div>
            <div className="text-sm text-gray-500">This Week</div>
          </div>
          <div className="bg-white rounded-2xl p-4 shadow-lg text-center">
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-2">
              <Trophy className="w-6 h-6 text-purple-600" />
            </div>
            <div className="text-2xl font-bold text-gray-900">${milestonesEarned * 100}</div>
            <div className="text-sm text-gray-500">Earned So Far</div>
          </div>
        </div>

        {/* Progress to Next Milestone */}
        <div className="bg-white rounded-2xl p-6 mb-4 shadow-lg">
          <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Trophy className="w-5 h-5 text-purple-500" />
            Next $100 Milestone
          </h2>
          <div className="w-full h-6 bg-gray-200 rounded-full overflow-hidden mb-2">
            <div
              className="h-full bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full transition-all"
              style={{ width: `${((200 - starsToMilestone) / 200) * 100}%` }}
            />
          </div>
          <p className="text-center text-gray-600">
            <span className="font-bold text-orange-600">{starsToMilestone}</span> stars to go!
          </p>
        </div>

        {/* Recent History */}
        <div className="bg-white rounded-2xl p-6 shadow-lg">
          <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-blue-500" />
            Recent Stars
          </h2>

          {starHistory.length > 0 ? (
            <div className="space-y-3">
              {starHistory.slice(0, 10).map(entry => (
                <div
                  key={entry.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div>
                    <div className="font-medium text-gray-900">{entry.reason}</div>
                    <div className="text-sm text-gray-500">
                      {new Date(entry.created_at).toLocaleDateString('en-US', {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 bg-yellow-100 px-3 py-1 rounded-full">
                    <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                    <span className="font-bold text-yellow-700">+{entry.stars}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-gray-500 py-6">
              No stars earned yet. Complete tasks to earn stars!
            </p>
          )}
        </div>
      </div>
    </main>
  )
}
