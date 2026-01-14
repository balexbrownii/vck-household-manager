import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import crypto from 'crypto'

function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex')
}

// Get authenticated kid from session
async function getAuthenticatedKid(supabase: ReturnType<typeof createClient> extends Promise<infer T> ? T : never) {
  const cookieStore = await cookies()
  const sessionToken = cookieStore.get('kid_session')?.value

  if (!sessionToken) {
    return null
  }

  const tokenHash = hashToken(sessionToken)

  const { data: session } = await supabase
    .from('kid_sessions')
    .select('kid_id, expires_at')
    .eq('token_hash', tokenHash)
    .single()

  if (!session || new Date(session.expires_at) < new Date()) {
    return null
  }

  const { data: kid } = await supabase
    .from('kids')
    .select('id, name, age, total_stars, max_gig_tier')
    .eq('id', session.kid_id)
    .single()

  return kid
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    const kid = await getAuthenticatedKid(supabase)
    if (!kid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const today = new Date().toISOString().split('T')[0]
    const dayOfWeek = new Date().getDay() // 0 = Sunday

    // Fetch all data in parallel
    const [
      expectationsResult,
      rotationStateResult,
      assignmentsResult,
      gigsResult,
      timeoutResult,
      mealsResult,
      expectationRulesResult,
    ] = await Promise.all([
      // Today's expectations for this kid
      supabase
        .from('daily_expectations')
        .select('*')
        .eq('kid_id', kid.id)
        .eq('date', today)
        .single(),

      // Current week rotation
      supabase
        .from('chore_rotation_state')
        .select('current_week')
        .single(),

      // All chore assignments for this kid
      supabase
        .from('chore_assignments')
        .select('assignment, week')
        .eq('kid_id', kid.id),

      // Available gigs
      supabase
        .from('gigs')
        .select('id, title, description, tier, stars, estimated_minutes')
        .eq('active', true)
        .is('claimed_by', null)
        .lte('tier', kid.max_gig_tier)
        .order('stars', { ascending: false })
        .limit(5),

      // Pending timeout
      supabase
        .from('timeout_violations')
        .select('id, timeout_minutes, violation_type, reset_count, created_at, serving_started_at, served_at')
        .eq('kid_id', kid.id)
        .is('completed_at', null)
        .order('created_at', { ascending: false })
        .limit(1),

      // Today's meals
      supabase
        .from('meal_plan_entries')
        .select(`
          id,
          meal_type,
          recipes (
            id,
            title
          )
        `)
        .eq('date', today),

      // Expectation rules (tidy up items, etc.)
      supabase
        .from('expectation_rules')
        .select('expectation_type, scope_description, completion_criteria'),
    ])

    // Get current week assignment
    const currentWeek = rotationStateResult.data?.current_week || 'A'
    const currentAssignment = assignmentsResult.data?.find(a => a.week === currentWeek)

    // Get today's chore room details if there's an assignment
    let choreRoom = null
    if (currentAssignment) {
      const { data: room } = await supabase
        .from('chore_rooms')
        .select('room_name, checklist')
        .eq('assignment', currentAssignment.assignment)
        .eq('day_of_week', dayOfWeek)
        .single()

      choreRoom = room
    }

    // Build tidy up checklist from rules or default
    const tidyUpRule = expectationRulesResult.data?.find(r => r.expectation_type === 'tidy_up')
    const tidyUpItems = tidyUpRule?.scope_description?.split('\n').filter(Boolean) || [
      'Make your bed',
      'Pick up items from around the house',
      'Clean up your room',
      'Put away your items in the garage',
      'Pick up items from the yard',
    ]

    // Format meals - handle Supabase join type inference
    const meals = (mealsResult.data || []).map(m => {
      // Supabase returns recipes as single object for foreign key relation
      const recipe = m.recipes as unknown as { id: string; title: string } | null
      return {
        id: m.id,
        meal_type: m.meal_type,
        recipe_id: recipe?.id,
        recipe_title: recipe?.title,
      }
    }).filter(m => m.recipe_title)

    return NextResponse.json({
      kid,
      expectations: expectationsResult.data || null,
      choreAssignment: currentAssignment ? {
        assignment: currentAssignment.assignment,
        week: currentWeek,
        roomName: choreRoom?.room_name || null,
        checklist: choreRoom?.checklist || [],
      } : null,
      tidyUpItems,
      availableGigs: gigsResult.data || [],
      pendingTimeout: timeoutResult.data?.[0] || null,
      todaysMeals: meals,
    })
  } catch (error) {
    console.error('Kid dashboard data error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
