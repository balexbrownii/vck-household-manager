import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  getExpectationRules,
  getExpectationRule,
  updateExpectationRule,
} from '@/lib/domain/ai-rules'
import { ExpectationType } from '@/types/database'

/**
 * GET /api/rules/expectations
 * Get all expectation rules or a specific one by type
 * Query params: ?type=exercise|reading|tidy_up|daily_chore
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Check authentication
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check role
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || !['parent', 'admin'].includes(profile.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') as ExpectationType | null

    if (type) {
      const rule = await getExpectationRule(type)
      if (!rule) {
        return NextResponse.json(
          { error: 'Expectation rule not found' },
          { status: 404 }
        )
      }
      return NextResponse.json({ rule })
    }

    const rules = await getExpectationRules()
    return NextResponse.json({ rules })
  } catch (error) {
    console.error('Error fetching expectation rules:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/rules/expectations
 * Update an expectation rule by type
 * Body: { type: string, scope_description?: string, completion_criteria?: string, ai_review_enabled?: boolean }
 */
export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Check authentication
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check role
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || !['parent', 'admin'].includes(profile.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { type, scope_description, completion_criteria, ai_review_enabled } =
      body

    if (!type) {
      return NextResponse.json(
        { error: 'Expectation type is required' },
        { status: 400 }
      )
    }

    const validTypes: ExpectationType[] = [
      'exercise',
      'reading',
      'tidy_up',
      'daily_chore',
    ]
    if (!validTypes.includes(type)) {
      return NextResponse.json(
        { error: 'Invalid expectation type' },
        { status: 400 }
      )
    }

    const updatedRule = await updateExpectationRule(type, {
      scope_description,
      completion_criteria,
      ai_review_enabled,
    })

    if (!updatedRule) {
      return NextResponse.json(
        { error: 'Failed to update expectation rule' },
        { status: 500 }
      )
    }

    return NextResponse.json({ rule: updatedRule })
  } catch (error) {
    console.error('Error updating expectation rule:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
