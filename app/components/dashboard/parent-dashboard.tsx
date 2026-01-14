import { createClient } from '@/lib/supabase/server'
import { Kid, DailyExpectation, MealPlanEntryWithRecipe } from '@/types'
import KidCard from './kid-card'
import WeekSelector from './week-selector'
import NeedsAttentionBanner from './needs-attention-banner'
import TodaysMealsCard from './todays-meals-card'
import ActivityFeed from './activity-feed'
import { redirect } from 'next/navigation'
import { Briefcase, ClipboardCheck, AlertTriangle, BarChart3, FileText, Users, Utensils } from 'lucide-react'

export default async function ParentDashboard() {
  const supabase = await createClient()

  // Check authentication
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Fetch all kids
  const { data: kids, error: kidsError } = await supabase
    .from('kids')
    .select('*')
    .order('age', { ascending: true })

  if (kidsError || !kids) {
    console.error('Kids fetch error:', kidsError)
    console.error('User ID:', user?.id)
    return (
      <div className="text-center py-12">
        <p className="text-red-600">Failed to load kids</p>
        <p className="text-gray-600 text-sm mt-2">{kidsError?.message || 'No data returned'}</p>
      </div>
    )
  }

  // Fetch today's expectations for all kids
  const today = new Date().toISOString().split('T')[0] || ''
  const kidIds = kids.map((k) => k.id)

  const { data: expectations, error: expectationsError } = await supabase
    .from('daily_expectations')
    .select('*')
    .in('kid_id', kidIds)
    .eq('date', today)

  if (expectationsError) {
    console.error('Error fetching expectations:', expectationsError)
  }

  // Fetch current chore rotation state
  const { data: rotationState } = await supabase
    .from('chore_rotation_state')
    .select('*')
    .single()

  const currentWeek = rotationState?.current_week || 'A'

  // Fetch chore assignments for current week
  const { data: choreAssignments } = await supabase
    .from('chore_assignments')
    .select('*')
    .eq('week', currentWeek)
    .in('kid_id', kidIds)

  // Create a map of chore assignments by kid_id
  const choreMap = new Map<string, string>()
  choreAssignments?.forEach((ca) => {
    choreMap.set(ca.kid_id, ca.assignment)
  })

  // Get today's day of week (0 = Sunday, 1 = Monday, etc.)
  const dayOfWeek = new Date().getDay()

  // Fetch today's chore rooms for all assignments
  const assignments = Array.from(new Set(choreAssignments?.map(ca => ca.assignment) || []))
  const { data: choreRooms } = await supabase
    .from('chore_rooms')
    .select('*')
    .eq('day_of_week', dayOfWeek)
    .in('assignment', assignments)

  // Create a map of today's room details by assignment
  const roomMap = new Map<string, { room_name: string; checklist: string[] }>()
  choreRooms?.forEach((room) => {
    roomMap.set(room.assignment, { room_name: room.room_name, checklist: room.checklist || [] })
  })

  // Fetch pending timeouts (not completed) for all kids
  const { data: pendingTimeouts } = await supabase
    .from('timeout_violations')
    .select('*')
    .in('kid_id', kidIds)
    .is('completed_at', null)

  // Create a map of pending timeouts by kid_id
  const timeoutMap = new Map<string, {
    id: string
    timeout_minutes: number
    violation_type: string
    reset_count: number
    serving_started_at: string | null
    served_at: string | null
  }>()
  pendingTimeouts?.forEach((timeout) => {
    timeoutMap.set(timeout.kid_id, {
      id: timeout.id,
      timeout_minutes: timeout.timeout_minutes,
      violation_type: timeout.violation_type,
      reset_count: timeout.reset_count,
      serving_started_at: timeout.serving_started_at,
      served_at: timeout.served_at,
    })
  })

  // Fetch today's meals (planned from recipes)
  const { data: todaysMeals } = await supabase
    .from('meal_plan_entries')
    .select('*, recipes(*)')
    .eq('planned_date', today)
    .order('meal_type')

  // Fetch today's ad-hoc meals
  const { data: adhocMeals } = await supabase
    .from('adhoc_meals')
    .select('*')
    .eq('planned_date', today)
    .order('meal_type')

  // Fetch pending gig reviews (claimed but not inspected)
  const { data: pendingGigReviews } = await supabase
    .from('claimed_gigs')
    .select('*, gigs(title), kids(name)')
    .is('inspection_status', null)
    .not('completed_at', 'is', null)

  // Fetch pending photo reviews
  const { data: pendingPhotoReviews } = await supabase
    .from('completion_photos')
    .select('*, kids(name)')
    .eq('status', 'pending_review')

  // Fetch recent activity (unread by parent)
  const { data: recentActivity } = await supabase
    .from('activity_feed')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(5)

  // Create a map of expectations by kid_id, with defaults for kids without records
  const expectationsMap = new Map<string, DailyExpectation>()
  expectations?.forEach((exp) => {
    expectationsMap.set(exp.kid_id, exp)
  })

  // For kids without expectations today, create default records
  const defaultExpectation: Omit<DailyExpectation, 'id' | 'created_at' | 'updated_at'> = {
    kid_id: '',
    date: today,
    exercise_complete: false,
    reading_complete: false,
    tidy_up_complete: false,
    daily_chore_complete: false,
    all_complete: false,
    completed_at: null,
    // Audit fields
    exercise_completed_by: null,
    exercise_completed_at: null,
    exercise_completed_by_kid: false,
    reading_completed_by: null,
    reading_completed_at: null,
    reading_completed_by_kid: false,
    tidy_up_completed_by: null,
    tidy_up_completed_at: null,
    tidy_up_completed_by_kid: false,
    daily_chore_completed_by: null,
    daily_chore_completed_at: null,
    daily_chore_completed_by_kid: false,
  }

  const kidExpectations = kids.map((kid) => {
    const exp = expectationsMap.get(kid.id)
    const choreAssignment = choreMap.get(kid.id) || 'Not assigned'
    const roomDetails = roomMap.get(choreAssignment)
    const pendingTimeout = timeoutMap.get(kid.id)

    if (exp) {
      return { kid, expectation: exp, choreAssignment, roomDetails, pendingTimeout }
    }

    // Return default expectation for kids without records
    return {
      kid,
      expectation: {
        ...defaultExpectation,
        kid_id: kid.id,
      } as DailyExpectation,
      choreAssignment,
      roomDetails,
      pendingTimeout,
    }
  })

  // Build attention items
  interface AttentionItem {
    type: 'gig_review' | 'timeout_pending' | 'expectations_incomplete' | 'photo_review'
    kidId?: string
    kidName: string
    message: string
    link: string
    count?: number
  }

  const attentionItems: AttentionItem[] = []

  // Add pending gig reviews
  if (pendingGigReviews && pendingGigReviews.length > 0) {
    const gigsByKid = new Map<string, { name: string; count: number }>()
    pendingGigReviews.forEach((gig) => {
      const kidName = (gig.kids as { name: string })?.name || 'Unknown'
      const existing = gigsByKid.get(gig.kid_id)
      if (existing) {
        existing.count++
      } else {
        gigsByKid.set(gig.kid_id, { name: kidName, count: 1 })
      }
    })

    gigsByKid.forEach((data, kidId) => {
      attentionItems.push({
        type: 'gig_review',
        kidId,
        kidName: data.name,
        message: `${data.name} has ${data.count} gig${data.count > 1 ? 's' : ''} awaiting review`,
        link: '/dashboard/review',
        count: data.count,
      })
    })
  }

  // Add pending photo reviews
  if (pendingPhotoReviews && pendingPhotoReviews.length > 0) {
    attentionItems.push({
      type: 'photo_review',
      kidName: 'Kids',
      message: `${pendingPhotoReviews.length} photo${pendingPhotoReviews.length > 1 ? 's' : ''} awaiting review`,
      link: '/dashboard/review',
      count: pendingPhotoReviews.length,
    })
  }

  // Add kids with incomplete expectations (no progress at all today)
  const kidsWithNoProgress = kids.filter((kid) => {
    const exp = expectationsMap.get(kid.id)
    if (!exp) return true
    return !exp.exercise_complete && !exp.reading_complete && !exp.tidy_up_complete && !exp.daily_chore_complete
  })

  kidsWithNoProgress.forEach((kid) => {
    attentionItems.push({
      type: 'expectations_incomplete',
      kidId: kid.id,
      kidName: kid.name,
      message: `${kid.name} hasn't started expectations`,
      link: `/kid/${kid.id}`,
    })
  })

  // Format today's date nicely
  const dateOptions: Intl.DateTimeFormatOptions = { weekday: 'long', month: 'long', day: 'numeric' }
  const formattedDate = new Date().toLocaleDateString('en-US', dateOptions)

  return (
    <div className="space-y-6">
      {/* Dashboard Header */}
      <div className="dashboard-header">
        <div>
          <h1 className="dashboard-title">Brown Family Dashboard</h1>
          <p className="dashboard-subtitle">
            {formattedDate}
          </p>
        </div>
        <WeekSelector currentWeek={currentWeek} />
      </div>

      {/* Needs Attention Banner */}
      <NeedsAttentionBanner items={attentionItems} />

      {/* Today's Overview - Meals and Activity side by side on larger screens */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TodaysMealsCard
          meals={(todaysMeals as MealPlanEntryWithRecipe[]) || []}
          adhocMeals={adhocMeals || []}
        />
        <ActivityFeed initialActivity={recentActivity || []} maxItems={5} />
      </div>

      {/* Kid Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {kidExpectations.map(({ kid, expectation, choreAssignment, roomDetails, pendingTimeout }) => (
          <KidCard
            key={kid.id}
            kid={kid}
            expectations={expectation}
            choreAssignment={choreAssignment}
            roomName={roomDetails?.room_name}
            choreChecklist={roomDetails?.checklist}
            pendingTimeout={pendingTimeout}
          />
        ))}
      </div>

      {/* Admin Actions */}
      <div className="pt-6 border-t border-gray-200">
        <div className="action-buttons">
          <a href="/gigs" className="action-btn action-btn-blue">
            <Briefcase className="w-4 h-4" />
            Browse Gigs
          </a>
          <a href="/dashboard/review" className="action-btn action-btn-green">
            <ClipboardCheck className="w-4 h-4" />
            Review Submissions
          </a>
          <a href="/meals" className="action-btn action-btn-orange">
            <Utensils className="w-4 h-4" />
            Meal Planning
          </a>
          <a href="/timeout" className="action-btn action-btn-red">
            <AlertTriangle className="w-4 h-4" />
            Timeouts
          </a>
          <a href="/analytics" className="action-btn action-btn-purple">
            <BarChart3 className="w-4 h-4" />
            Analytics
          </a>
          <a href="/charts" className="action-btn action-btn-gray">
            <FileText className="w-4 h-4" />
            Print Charts
          </a>
          <a href="/dashboard/kids" className="action-btn action-btn-pink">
            <Users className="w-4 h-4" />
            Manage Kids
          </a>
        </div>
      </div>
    </div>
  )
}
