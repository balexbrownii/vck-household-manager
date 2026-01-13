import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getChoreRoomWithRules, updateChoreRoomRules } from '@/lib/domain/ai-rules'

/**
 * GET /api/rules/chores/[id]
 * Get a chore room with its AI review rules
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
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

    const chore = await getChoreRoomWithRules(id)

    if (!chore) {
      return NextResponse.json({ error: 'Chore room not found' }, { status: 404 })
    }

    return NextResponse.json({ chore })
  } catch (error) {
    console.error('Error fetching chore rules:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/rules/chores/[id]
 * Update AI review rules for a chore room
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
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
    const { scope_description, completion_criteria, ai_review_enabled } = body

    const updatedChore = await updateChoreRoomRules(id, {
      scope_description,
      completion_criteria,
      ai_review_enabled,
    })

    if (!updatedChore) {
      return NextResponse.json(
        { error: 'Failed to update chore rules' },
        { status: 500 }
      )
    }

    return NextResponse.json({ chore: updatedChore })
  } catch (error) {
    console.error('Error updating chore rules:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
