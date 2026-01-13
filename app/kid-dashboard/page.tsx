'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  Star,
  CheckCircle2,
  Clock,
  Briefcase,
  LogOut,
  Loader2,
  ChevronRight,
  Trophy,
  Camera
} from 'lucide-react'

interface Kid {
  id: string
  name: string
  age: number
  total_stars: number
  max_gig_tier: number
}

interface DailyExpectation {
  id: string
  exercise_complete: boolean
  reading_complete: boolean
  tidy_up_complete: boolean
  daily_chore_complete: boolean
  all_complete: boolean
}

interface ChoreAssignment {
  assignment: string
  week: string
}

interface AvailableGig {
  id: string
  title: string
  description: string
  tier: number
  stars: number
  estimated_minutes: number
}

export default function KidDashboardPage() {
  const router = useRouter()
  const [kid, setKid] = useState<Kid | null>(null)
  const [expectations, setExpectations] = useState<DailyExpectation | null>(null)
  const [choreAssignment, setChoreAssignment] = useState<ChoreAssignment | null>(null)
  const [availableGigs, setAvailableGigs] = useState<AvailableGig[]>([])
  const [loading, setLoading] = useState(true)
  const [loggingOut, setLoggingOut] = useState(false)

  useEffect(() => {
    checkSession()
  }, [])

  const checkSession = async () => {
    try {
      const res = await fetch('/api/kid-auth/session')
      const data = await res.json()

      if (!data.authenticated || !data.kid) {
        router.push('/kid-login')
        return
      }

      setKid(data.kid)
      await loadDashboardData(data.kid.id)
    } catch {
      router.push('/kid-login')
    } finally {
      setLoading(false)
    }
  }

  const loadDashboardData = async (kidId: string) => {
    // Load expectations, chores, and gigs in parallel
    const [expectationsRes, choresRes, gigsRes] = await Promise.all([
      fetch(`/api/expectations?kidId=${kidId}`).catch(() => null),
      fetch(`/api/chores/assignments?kidId=${kidId}`).catch(() => null),
      fetch('/api/gigs?status=available').catch(() => null),
    ])

    if (expectationsRes?.ok) {
      const data = await expectationsRes.json()
      setExpectations(data.expectation || null)
    }

    if (choresRes?.ok) {
      const data = await choresRes.json()
      setChoreAssignment(data.assignment || null)
    }

    if (gigsRes?.ok) {
      const data = await gigsRes.json()
      // Filter gigs by kid's tier
      const kidTier = kid?.max_gig_tier || 1
      setAvailableGigs(
        (data.gigs || []).filter((g: AvailableGig) => g.tier <= kidTier).slice(0, 5)
      )
    }
  }

  const handleLogout = async () => {
    setLoggingOut(true)
    await fetch('/api/kid-auth/logout', { method: 'POST' })
    router.push('/kid-login')
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-purple-400 via-pink-500 to-red-500 flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-white animate-spin" />
      </main>
    )
  }

  if (!kid) {
    return null
  }

  const starsToMilestone = 200 - (kid.total_stars % 200)
  const progressPercent = ((kid.total_stars % 200) / 200) * 100

  return (
    <main className="min-h-screen bg-gradient-to-br from-purple-400 via-pink-500 to-red-500 p-4">
      <div className="max-w-lg mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 bg-white rounded-full flex items-center justify-center text-2xl font-bold text-purple-600">
              {kid.name.charAt(0)}
            </div>
            <div className="text-white">
              <h1 className="text-xl font-bold">Hi, {kid.name}!</h1>
              <p className="text-white/80 text-sm">Let&apos;s have a great day</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            disabled={loggingOut}
            className="p-2 bg-white/20 rounded-full hover:bg-white/30 transition-colors"
          >
            <LogOut className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Star Progress */}
        <div className="bg-white rounded-2xl p-6 mb-4 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Star className="w-6 h-6 text-yellow-500 fill-yellow-500" />
              <span className="text-2xl font-bold text-gray-900">{kid.total_stars}</span>
              <span className="text-gray-500">stars</span>
            </div>
            <div className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-purple-500" />
              <span className="text-sm text-gray-600">{starsToMilestone} to $100!</span>
            </div>
          </div>
          <div className="w-full h-4 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-yellow-400 to-yellow-500 rounded-full transition-all"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <p className="text-xs text-gray-500 mt-2 text-center">
            {kid.total_stars % 200} / 200 stars toward next $100 milestone
          </p>
        </div>

        {/* Daily Expectations */}
        <div className="bg-white rounded-2xl p-6 mb-4 shadow-lg">
          <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-green-500" />
            Today&apos;s Expectations
          </h2>

          {expectations ? (
            <div className="space-y-3">
              <ExpectationItem
                label="Exercise (20 min)"
                done={expectations.exercise_complete}
              />
              <ExpectationItem
                label="Reading/Homework (15 min)"
                done={expectations.reading_complete}
              />
              <ExpectationItem
                label="Tidy Up"
                done={expectations.tidy_up_complete}
              />
              <ExpectationItem
                label="Daily Chores"
                done={expectations.daily_chore_complete}
              />

              {expectations.all_complete && (
                <div className="mt-4 p-3 bg-green-100 rounded-lg text-green-700 text-center font-semibold">
                  🎉 All done! Screen time unlocked!
                </div>
              )}
            </div>
          ) : (
            <p className="text-gray-500 text-sm">Loading expectations...</p>
          )}
        </div>

        {/* Today's Chores */}
        {choreAssignment && (
          <div className="bg-white rounded-2xl p-6 mb-4 shadow-lg">
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5 text-blue-500" />
              My Chores: {choreAssignment.assignment}
            </h2>
            <a
              href={`/kid-dashboard/chores`}
              className="flex items-center justify-between p-3 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
            >
              <span className="text-blue-700 font-medium">View today&apos;s tasks</span>
              <ChevronRight className="w-5 h-5 text-blue-500" />
            </a>
          </div>
        )}

        {/* Available Gigs */}
        <div className="bg-white rounded-2xl p-6 mb-4 shadow-lg">
          <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-purple-500" />
            Available Gigs
          </h2>

          {availableGigs.length > 0 ? (
            <div className="space-y-3">
              {availableGigs.map(gig => (
                <a
                  key={gig.id}
                  href={`/kid-dashboard/gigs/${gig.id}`}
                  className="block p-3 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-gray-900">{gig.title}</div>
                      <div className="text-sm text-gray-500">~{gig.estimated_minutes} min</div>
                    </div>
                    <div className="flex items-center gap-1 bg-yellow-100 px-2 py-1 rounded-full">
                      <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                      <span className="font-bold text-yellow-700">{gig.stars}</span>
                    </div>
                  </div>
                </a>
              ))}
              <a
                href="/kid-dashboard/gigs"
                className="block text-center text-purple-600 font-medium hover:text-purple-700 mt-2"
              >
                View all gigs →
              </a>
            </div>
          ) : (
            <p className="text-gray-500 text-sm">Complete your expectations first to claim gigs!</p>
          )}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-4">
          <a
            href="/kid-dashboard/submit"
            className="bg-white rounded-2xl p-4 shadow-lg flex flex-col items-center gap-2 hover:scale-105 transition-transform"
          >
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <Camera className="w-6 h-6 text-green-600" />
            </div>
            <span className="font-medium text-gray-900 text-sm">Submit Work</span>
          </a>
          <a
            href="/kid-dashboard/my-stars"
            className="bg-white rounded-2xl p-4 shadow-lg flex flex-col items-center gap-2 hover:scale-105 transition-transform"
          >
            <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
              <Star className="w-6 h-6 text-yellow-600 fill-yellow-600" />
            </div>
            <span className="font-medium text-gray-900 text-sm">My Stars</span>
          </a>
        </div>
      </div>
    </main>
  )
}

function ExpectationItem({ label, done }: { label: string; done: boolean }) {
  return (
    <div className={`flex items-center gap-3 p-3 rounded-lg ${done ? 'bg-green-50' : 'bg-gray-50'}`}>
      <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
        done ? 'bg-green-500' : 'border-2 border-gray-300'
      }`}>
        {done && <CheckCircle2 className="w-4 h-4 text-white" />}
      </div>
      <span className={done ? 'text-green-700 line-through' : 'text-gray-700'}>{label}</span>
    </div>
  )
}
