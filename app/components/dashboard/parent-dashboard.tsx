import { createClient } from '@/lib/supabase/server'
import { Kid, DailyExpectation } from '@/types'
import KidCard from './kid-card'
import WeekSelector from './week-selector'
import { redirect } from 'next/navigation'

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
  }

  const kidExpectations = kids.map((kid) => {
    const exp = expectationsMap.get(kid.id)
    const choreAssignment = choreMap.get(kid.id) || 'Not assigned'

    if (exp) {
      return { kid, expectation: exp, choreAssignment }
    }

    // Return default expectation for kids without records
    return {
      kid,
      expectation: {
        ...defaultExpectation,
        kid_id: kid.id,
      } as DailyExpectation,
      choreAssignment,
    }
  })

  return (
    <div className="space-y-6">
      {/* Dashboard Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Family Dashboard</h1>
            <p className="text-gray-600 mt-2">
              {today} • {kids.length} {kids.length === 1 ? 'child' : 'children'}
            </p>
          </div>
          <WeekSelector currentWeek={currentWeek} />
        </div>
      </div>

      {/* Kid Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {kidExpectations.map(({ kid, expectation, choreAssignment }) => (
          <KidCard
            key={kid.id}
            kid={kid}
            expectations={expectation}
            choreAssignment={choreAssignment}
          />
        ))}
      </div>

      {/* Quick Stats Footer */}
      <div className="mt-12 pt-6 border-t border-gray-200">
        <div className="grid grid-cols-3 gap-4 mb-8">
          {kidExpectations.map(({ kid, expectation }) => (
            <div key={kid.id} className="text-center">
              <div className="text-2xl font-bold text-primary">
                {expectation.all_complete ? '✓' : '○'}
              </div>
              <div className="text-sm text-gray-600">{kid.name}</div>
            </div>
          ))}
        </div>

        {/* Admin Actions */}
        <div className="flex gap-4 justify-center flex-wrap">
          <a
            href="/gigs"
            className="px-6 py-3 bg-blue-100 text-blue-700 rounded-lg font-semibold hover:bg-blue-200 transition-colors"
          >
            Browse All Gigs
          </a>
          <a
            href="/gigs/inspect"
            className="px-6 py-3 bg-green-100 text-green-700 rounded-lg font-semibold hover:bg-green-200 transition-colors"
          >
            Inspect Gigs
          </a>
          <a
            href="/timeout"
            className="px-6 py-3 bg-red-100 text-red-700 rounded-lg font-semibold hover:bg-red-200 transition-colors"
          >
            Timeout Management
          </a>
          <a
            href="/analytics"
            className="px-6 py-3 bg-purple-100 text-purple-700 rounded-lg font-semibold hover:bg-purple-200 transition-colors"
          >
            Analytics
          </a>
          <a
            href="/charts"
            className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg font-semibold hover:bg-gray-200 transition-colors"
          >
            Print Charts
          </a>
        </div>
      </div>
    </div>
  )
}
