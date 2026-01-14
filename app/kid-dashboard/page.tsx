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
  AlertTriangle,
  UtensilsCrossed,
  Tv,
  Target,
  ImageIcon,
  RefreshCw,
  HourglassIcon,
} from 'lucide-react'
import { ExpandableTask } from '@/components/ui/expandable-task'
import { LoadingSpinner } from '@/components/ui/shared'
import KidNotifications from '@/components/messaging/kid-notifications'
import KidQuickMessage from '@/components/messaging/kid-quick-message'

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
  roomName: string | null
  checklist: string[]
}

interface AvailableGig {
  id: string
  title: string
  description: string
  tier: number
  stars: number
  estimated_minutes: number
}

interface PendingTimeout {
  id: string
  timeout_minutes: number
  violation_type: string
  reset_count: number
  created_at: string
  serving_started_at: string | null
  served_at: string | null
}

interface PlannedMeal {
  id: string
  meal_type: string
  recipe_title: string
  recipe_id: string
}

interface ClaimedGig {
  id: string
  gig_id: string
  title: string
  stars: number
  claimed_at: string
  completed_at: string | null
  inspection_status: string | null
  stars_awarded: number | null
  parent_notes: string | null
}

interface PendingSubmission {
  id: string
  task_type: string
  task_description: string
  status: string
  created_at: string
  review_notes: string | null
}

export default function KidDashboardPage() {
  const router = useRouter()
  const [kid, setKid] = useState<Kid | null>(null)
  const [expectations, setExpectations] = useState<DailyExpectation | null>(null)
  const [choreAssignment, setChoreAssignment] = useState<ChoreAssignment | null>(null)
  const [tidyUpItems, setTidyUpItems] = useState<string[]>([])
  const [availableGigs, setAvailableGigs] = useState<AvailableGig[]>([])
  const [claimedGigs, setClaimedGigs] = useState<ClaimedGig[]>([])
  const [pendingSubmissions, setPendingSubmissions] = useState<PendingSubmission[]>([])
  const [pendingTimeout, setPendingTimeout] = useState<PendingTimeout | null>(null)
  const [todaysMeals, setTodaysMeals] = useState<PlannedMeal[]>([])
  const [loading, setLoading] = useState(true)
  const [loggingOut, setLoggingOut] = useState(false)
  const [completingTimeout, setCompletingTimeout] = useState(false)

  useEffect(() => {
    loadDashboard()
  }, [])

  const loadDashboard = async () => {
    try {
      const res = await fetch('/api/kid-dashboard/data')

      if (!res.ok) {
        router.push('/kid-login')
        return
      }

      const data = await res.json()

      setKid(data.kid)
      setExpectations(data.expectations)
      setChoreAssignment(data.choreAssignment)
      setTidyUpItems(data.tidyUpItems || [])
      setAvailableGigs(data.availableGigs || [])
      setClaimedGigs(data.claimedGigs || [])
      setPendingSubmissions(data.pendingSubmissions || [])
      setPendingTimeout(data.pendingTimeout)
      setTodaysMeals(data.todaysMeals || [])
    } catch {
      router.push('/kid-login')
    } finally {
      setLoading(false)
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

      // Refresh dashboard data
      await loadDashboard()
    } catch (error) {
      console.error('Failed to update expectation:', error)
    }
  }

  const handleTimeoutComplete = async () => {
    if (!pendingTimeout || completingTimeout) return

    setCompletingTimeout(true)
    try {
      const res = await fetch('/api/timeout/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ timeoutId: pendingTimeout.id }),
      })

      if (res.ok) {
        setPendingTimeout(null)
      }
    } catch (error) {
      console.error('Failed to complete timeout:', error)
    } finally {
      setCompletingTimeout(false)
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

  // Group meals by type for display
  const mealsByType: Record<string, PlannedMeal[]> = {}
  todaysMeals.forEach(meal => {
    if (!mealsByType[meal.meal_type]) {
      mealsByType[meal.meal_type] = []
    }
    mealsByType[meal.meal_type].push(meal)
  })

  const mealOrder = ['breakfast', 'lunch', 'dinner', 'snack', 'dessert', 'drink']

  // Build subtitle for tidy up
  const tidyUpSubtitle = tidyUpItems.length > 0
    ? tidyUpItems.slice(0, 2).join(', ') + (tidyUpItems.length > 2 ? '...' : '')
    : 'Clean your space'

  // Build subtitle for daily chores
  const choreSubtitle = choreAssignment
    ? choreAssignment.roomName
      ? `${choreAssignment.assignment}: ${choreAssignment.roomName}`
      : choreAssignment.assignment
    : 'No chores today'

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

        {/* Pending Timeout - MUST BE FIRST */}
        {pendingTimeout && (
          <section className="kid-section border-2 border-red-300 bg-red-50">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <div className="flex-1">
                <h2 className="text-lg font-bold text-red-700">
                  Timeout: {pendingTimeout.timeout_minutes} minutes
                  {pendingTimeout.reset_count > 0 && (
                    <span className="ml-2 text-xs bg-red-200 px-2 py-0.5 rounded-full">
                      Reset {pendingTimeout.reset_count}x
                    </span>
                  )}
                </h2>
                <p className="text-red-600 text-sm mt-1">
                  {pendingTimeout.violation_type}
                </p>
                <p className="text-red-500 text-xs mt-2">
                  Stand your timeout, then tap below when done.
                </p>
                <button
                  onClick={handleTimeoutComplete}
                  disabled={completingTimeout}
                  className="mt-3 w-full py-3 bg-red-600 text-white font-semibold rounded-xl hover:bg-red-700 active:scale-[0.98] transition-all disabled:opacity-50"
                >
                  {completingTimeout ? 'Completing...' : 'I Finished My Timeout'}
                </button>
              </div>
            </div>
          </section>
        )}

        {/* Notifications from Parents */}
        <KidNotifications />

        {/* My Current Gig - Show claimed gigs status */}
        {claimedGigs.length > 0 && (
          <section className="kid-section">
            <h2 className="kid-section-title">
              <Target className="w-5 h-5 text-purple-500" />
              My Current Gig{claimedGigs.length > 1 ? 's' : ''}
            </h2>
            <div className="space-y-3">
              {claimedGigs.map((gig) => {
                const isPending = !gig.completed_at
                const isAwaitingReview = gig.completed_at && !gig.inspection_status
                const needsRevision = gig.inspection_status === 'revision_requested'

                return (
                  <div
                    key={gig.id}
                    className={`p-4 rounded-xl border-2 ${
                      needsRevision
                        ? 'border-amber-300 bg-amber-50'
                        : isAwaitingReview
                        ? 'border-blue-300 bg-blue-50'
                        : 'border-purple-200 bg-purple-50'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-gray-900">{gig.title}</div>
                        <div className="flex items-center gap-2 mt-1">
                          <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                          <span className="text-sm text-gray-600">{gig.stars} stars</span>
                        </div>
                      </div>
                      <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium ${
                        needsRevision
                          ? 'bg-amber-200 text-amber-800'
                          : isAwaitingReview
                          ? 'bg-blue-200 text-blue-800'
                          : 'bg-purple-200 text-purple-800'
                      }`}>
                        {needsRevision ? (
                          <>
                            <RefreshCw className="w-3.5 h-3.5" />
                            Fix Needed
                          </>
                        ) : isAwaitingReview ? (
                          <>
                            <HourglassIcon className="w-3.5 h-3.5" />
                            Awaiting Review
                          </>
                        ) : (
                          <>
                            <Clock className="w-3.5 h-3.5" />
                            In Progress
                          </>
                        )}
                      </div>
                    </div>
                    {needsRevision && gig.parent_notes && (
                      <div className="mt-3 p-3 bg-white rounded-lg border border-amber-200">
                        <p className="text-xs font-medium text-amber-700 mb-1">Parent feedback:</p>
                        <p className="text-sm text-gray-700">{gig.parent_notes}</p>
                      </div>
                    )}
                    {isPending && (
                      <a
                        href="/kid-dashboard/submit"
                        className="mt-3 block w-full py-2 text-center bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 active:scale-[0.98] transition-all"
                      >
                        Submit Completion Photo
                      </a>
                    )}
                    {needsRevision && (
                      <a
                        href="/kid-dashboard/submit"
                        className="mt-3 block w-full py-2 text-center bg-amber-600 text-white font-semibold rounded-lg hover:bg-amber-700 active:scale-[0.98] transition-all"
                      >
                        Resubmit Photo
                      </a>
                    )}
                  </div>
                )
              })}
            </div>
          </section>
        )}

        {/* My Submissions - Show pending photo reviews */}
        {pendingSubmissions.length > 0 && (
          <section className="kid-section">
            <h2 className="kid-section-title">
              <ImageIcon className="w-5 h-5 text-teal-500" />
              My Submissions
            </h2>
            <div className="space-y-2">
              {pendingSubmissions.map((submission) => {
                const needsRevision = submission.status === 'revision_requested'

                return (
                  <div
                    key={submission.id}
                    className={`flex items-center gap-3 p-3 rounded-xl ${
                      needsRevision ? 'bg-amber-50 border border-amber-200' : 'bg-teal-50'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                      needsRevision ? 'bg-amber-200' : 'bg-teal-200'
                    }`}>
                      {needsRevision ? (
                        <RefreshCw className="w-5 h-5 text-amber-700" />
                      ) : (
                        <HourglassIcon className="w-5 h-5 text-teal-700" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-gray-900 truncate">
                        {submission.task_description}
                      </div>
                      <div className={`text-xs font-medium ${
                        needsRevision ? 'text-amber-700' : 'text-teal-700'
                      }`}>
                        {needsRevision ? 'Revision requested' : 'Pending review'}
                      </div>
                      {needsRevision && submission.review_notes && (
                        <p className="text-xs text-gray-600 mt-1 italic">
                          &quot;{submission.review_notes}&quot;
                        </p>
                      )}
                    </div>
                    {needsRevision && (
                      <a
                        href="/kid-dashboard/submit"
                        className="px-3 py-1.5 bg-amber-600 text-white text-sm font-medium rounded-lg hover:bg-amber-700 active:scale-95 transition-all"
                      >
                        Fix
                      </a>
                    )}
                  </div>
                )
              })}
            </div>
          </section>
        )}

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

        {/* Today's Meals */}
        {todaysMeals.length > 0 && (
          <section className="kid-section">
            <h2 className="kid-section-title">
              <UtensilsCrossed className="w-5 h-5 text-orange-500" />
              Today&apos;s Meals
            </h2>
            <div className="space-y-2">
              {mealOrder.map(mealType => {
                const meals = mealsByType[mealType]
                if (!meals || meals.length === 0) return null

                const mealLabels: Record<string, string> = {
                  breakfast: '🌅 Breakfast',
                  lunch: '☀️ Lunch',
                  dinner: '🌙 Dinner',
                  snack: '🍎 Snack',
                  dessert: '🍰 Dessert',
                  drink: '🥤 Drink',
                }

                return (
                  <div key={mealType} className="flex items-center gap-3 p-3 bg-orange-50 rounded-xl">
                    <span className="text-sm font-medium text-orange-700 w-24">
                      {mealLabels[mealType] || mealType}
                    </span>
                    <span className="text-gray-900 flex-1">
                      {meals.map(m => m.recipe_title).join(', ')}
                    </span>
                  </div>
                )
              })}
            </div>
          </section>
        )}

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
                subtitle={tidyUpSubtitle}
                completed={expectations.tidy_up_complete}
                onComplete={(id, note) => handleExpectationComplete('tidy_up', note)}
                icon={<Sparkles className="w-5 h-5 text-purple-500" />}
                expandedContent={
                  <ul className="space-y-1 text-sm text-gray-600">
                    {tidyUpItems.map((item, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-purple-400">•</span>
                        {item}
                      </li>
                    ))}
                  </ul>
                }
              />

              <ExpandableTask
                id="daily_chore"
                title="Daily Chores"
                subtitle={choreSubtitle}
                completed={expectations.daily_chore_complete}
                onComplete={(id, note) => handleExpectationComplete('daily_chore', note)}
                icon={<Home className="w-5 h-5 text-teal-500" />}
                expandedContent={
                  choreAssignment && choreAssignment.checklist.length > 0 ? (
                    <ul className="space-y-1 text-sm text-gray-600">
                      {choreAssignment.checklist.map((item, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <span className="text-teal-400">•</span>
                          {item}
                        </li>
                      ))}
                    </ul>
                  ) : choreAssignment ? (
                    <p className="text-sm text-gray-500">
                      Complete your {choreAssignment.assignment} tasks for today.
                    </p>
                  ) : null
                }
              />

              {/* Screen Time Status */}
              <div className={`mt-4 p-4 rounded-xl text-center ${
                expectations.all_complete
                  ? 'bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200'
                  : 'bg-gray-50 border border-gray-200'
              }`}>
                <div className="flex items-center justify-center gap-2">
                  <Tv className={`w-5 h-5 ${expectations.all_complete ? 'text-green-600' : 'text-gray-400'}`} />
                  <span className={`font-semibold ${expectations.all_complete ? 'text-green-700' : 'text-gray-500'}`}>
                    {expectations.all_complete
                      ? '🎉 Screen time unlocked!'
                      : 'Complete all tasks to unlock screen time'
                    }
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="py-6 text-center">
              <p className="text-gray-500">Loading expectations...</p>
            </div>
          )}
        </section>

        {/* Today's Chores - Detailed View */}
        {choreAssignment && (
          <section className="kid-section">
            <h2 className="kid-section-title">
              <Clock className="w-5 h-5 text-blue-500" />
              My Chores: {choreAssignment.assignment}
            </h2>
            {choreAssignment.roomName && (
              <div className="mb-3 p-3 bg-blue-50 rounded-xl">
                <p className="font-medium text-blue-800">
                  Today: {choreAssignment.roomName}
                </p>
              </div>
            )}
            {choreAssignment.checklist.length > 0 && (
              <ul className="space-y-2">
                {choreAssignment.checklist.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-3 p-2 bg-gray-50 rounded-lg">
                    <span className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-medium flex-shrink-0">
                      {idx + 1}
                    </span>
                    <span className="text-gray-700">{item}</span>
                  </li>
                ))}
              </ul>
            )}
            <a
              href="/kid-dashboard/chores"
              className="flex items-center justify-between p-4 mt-3 bg-blue-50 rounded-xl hover:bg-blue-100 active:scale-[0.98] transition-all"
            >
              <span className="text-blue-700 font-semibold">View full chore schedule</span>
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
              No gigs available right now. Check back later!
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
          <KidQuickMessage onMessageSent={loadDashboard} />
        </div>
      </div>
    </main>
  )
}
