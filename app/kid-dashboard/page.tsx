'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  Star,
  CheckCircle2,
  Clock,
  Briefcase,
  LogOut,
  ChevronRight,
  Trophy,
  Camera,
  Dumbbell,
  BookOpen,
  Sparkles,
  Home,
} from 'lucide-react'
import { ExpandableTask } from '@/components/ui/expandable-task'
import { LoadingSpinner } from '@/components/ui/shared'

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
      await loadDashboardData(data.kid.id, data.kid.max_gig_tier)
    } catch {
      router.push('/kid-login')
    } finally {
      setLoading(false)
    }
  }

  const loadDashboardData = async (kidId: string, kidTier: number) => {
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
      setAvailableGigs(
        (data.gigs || []).filter((g: AvailableGig) => g.tier <= kidTier).slice(0, 5)
      )
    }
  }

  const handleExpectationComplete = async (type: string, note?: string) => {
    if (!kid || !expectations) return

    try {
      await fetch('/api/expectations/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kidId: kid.id,
          expectationId: expectations.id,
          type,
          completed: true,
          note,
        }),
      })

      // Refresh expectations
      const res = await fetch(`/api/expectations?kidId=${kid.id}`)
      if (res.ok) {
        const data = await res.json()
        setExpectations(data.expectation || null)
      }
    } catch (error) {
      console.error('Failed to update expectation:', error)
    }
  }

  const handleLogout = async () => {
    setLoggingOut(true)
    await fetch('/api/kid-auth/logout', { method: 'POST' })
    router.push('/kid-login')
  }

  if (loading) {
    return (
      <main className="kid-page bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400 flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </main>
    )
  }

  if (!kid) return null

  const starsToMilestone = 200 - (kid.total_stars % 200)
  const progressPercent = ((kid.total_stars % 200) / 200) * 100
  const milestonesEarned = Math.floor(kid.total_stars / 200)

  return (
    <main className="kid-page bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400 no-pull-refresh">
      <div className="max-w-lg mx-auto">
        {/* Header */}
        <header className="kid-header">
          <div className="flex items-center gap-3">
            <div className="kid-avatar">
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
            className="p-3 bg-white/20 rounded-full hover:bg-white/30 active:scale-95 transition-all"
            aria-label="Log out"
          >
            <LogOut className="w-5 h-5 text-white" />
          </button>
        </header>

        {/* Star Progress */}
        <section className="kid-section">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Star className="w-7 h-7 text-yellow-500 fill-yellow-500" />
              <div>
                <span className="text-3xl font-bold text-gray-900">{kid.total_stars}</span>
                <span className="text-gray-500 ml-2">stars</span>
              </div>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-purple-100 rounded-full">
              <Trophy className="w-4 h-4 text-purple-600" />
              <span className="text-sm font-semibold text-purple-700">
                {starsToMilestone} to ${(milestonesEarned + 1) * 100}!
              </span>
            </div>
          </div>

          <div className="progress-bar h-3">
            <div
              className="progress-fill"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          <p className="text-xs text-gray-500 mt-2 text-center">
            {kid.total_stars % 200} / 200 stars toward next $100 milestone
          </p>
        </section>

        {/* Daily Expectations */}
        <section className="kid-section">
          <h2 className="kid-section-title">
            <CheckCircle2 className="w-5 h-5 text-green-500" />
            Today&apos;s Expectations
          </h2>

          {expectations ? (
            <div className="space-y-3">
              <ExpandableTask
                id="exercise"
                title="Exercise"
                subtitle="20 minutes of movement"
                completed={expectations.exercise_complete}
                onComplete={(id, note) => handleExpectationComplete('exercise', note)}
                icon={<Dumbbell className="w-5 h-5 text-orange-500" />}
              />

              <ExpandableTask
                id="reading"
                title="Reading / Homework"
                subtitle="15 minutes minimum"
                completed={expectations.reading_complete}
                onComplete={(id, note) => handleExpectationComplete('reading', note)}
                icon={<BookOpen className="w-5 h-5 text-blue-500" />}
              />

              <ExpandableTask
                id="tidy_up"
                title="Tidy Up"
                subtitle="Clean your space"
                completed={expectations.tidy_up_complete}
                onComplete={(id, note) => handleExpectationComplete('tidy_up', note)}
                icon={<Sparkles className="w-5 h-5 text-purple-500" />}
              />

              <ExpandableTask
                id="daily_chore"
                title="Daily Chores"
                subtitle={choreAssignment ? choreAssignment.assignment : 'Check your chores'}
                completed={expectations.daily_chore_complete}
                onComplete={(id, note) => handleExpectationComplete('daily_chore', note)}
                icon={<Home className="w-5 h-5 text-teal-500" />}
              />

              {expectations.all_complete && (
                <div className="mt-4 p-4 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl text-center">
                  <span className="text-2xl mr-2">🎉</span>
                  <span className="font-semibold text-green-700">
                    All done! Screen time unlocked!
                  </span>
                </div>
              )}
            </div>
          ) : (
            <div className="py-6 text-center">
              <div className="skeleton h-16 w-full mb-3" />
              <div className="skeleton h-16 w-full mb-3" />
              <div className="skeleton h-16 w-full" />
            </div>
          )}
        </section>

        {/* Today's Chores */}
        {choreAssignment && (
          <section className="kid-section">
            <h2 className="kid-section-title">
              <Clock className="w-5 h-5 text-blue-500" />
              My Chores: {choreAssignment.assignment}
            </h2>
            <a
              href="/kid-dashboard/chores"
              className="flex items-center justify-between p-4 bg-blue-50 rounded-xl hover:bg-blue-100 active:scale-[0.98] transition-all"
            >
              <span className="text-blue-700 font-semibold">View today&apos;s tasks</span>
              <ChevronRight className="w-5 h-5 text-blue-500" />
            </a>
          </section>
        )}

        {/* Available Gigs */}
        <section className="kid-section">
          <h2 className="kid-section-title">
            <Briefcase className="w-5 h-5 text-purple-500" />
            Available Gigs
          </h2>

          {availableGigs.length > 0 ? (
            <div className="space-y-3">
              {availableGigs.map(gig => (
                <a
                  key={gig.id}
                  href={`/kid-dashboard/gigs/${gig.id}`}
                  className="block p-4 bg-purple-50 rounded-xl hover:bg-purple-100 active:scale-[0.98] transition-all"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-gray-900 truncate">{gig.title}</div>
                      <div className="text-sm text-gray-500">~{gig.estimated_minutes} min</div>
                    </div>
                    <div className="star-display ml-3">
                      <Star className="w-4 h-4 fill-current" />
                      <span>{gig.stars}</span>
                    </div>
                  </div>
                </a>
              ))}

              <a
                href="/kid-dashboard/gigs"
                className="block text-center text-purple-600 font-semibold hover:text-purple-700 pt-2"
              >
                View all gigs →
              </a>
            </div>
          ) : (
            <p className="text-gray-500 text-sm text-center py-4">
              Complete your expectations first to claim gigs!
            </p>
          )}
        </section>

        {/* Quick Actions */}
        <div className="quick-actions">
          <a
            href="/kid-dashboard/submit"
            className="quick-action"
          >
            <div className="quick-action-icon bg-green-100">
              <Camera className="w-6 h-6 text-green-600" />
            </div>
            <span className="quick-action-label">Submit Work</span>
          </a>
          <a
            href="/kid-dashboard/my-stars"
            className="quick-action"
          >
            <div className="quick-action-icon bg-yellow-100">
              <Star className="w-6 h-6 text-yellow-600 fill-yellow-600" />
            </div>
            <span className="quick-action-label">My Stars</span>
          </a>
        </div>
      </div>
    </main>
  )
}
