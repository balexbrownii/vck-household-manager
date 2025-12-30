import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get current rotation state
    const { data: rotationState, error: rotationError } = await supabase
      .from('chore_rotation_state')
      .select('*')
      .single()

    if (rotationError || !rotationState) {
      return NextResponse.json(
        { error: 'Could not find rotation state' },
        { status: 500 }
      )
    }

    // Calculate next week
    const weeks: ('A' | 'B' | 'C')[] = ['A', 'B', 'C']
    const currentIndex = weeks.indexOf(rotationState.current_week)
    const nextWeek = weeks[(currentIndex + 1) % 3]

    // Update rotation state
    const { data, error } = await supabase
      .from('chore_rotation_state')
      .update({
        current_week: nextWeek,
        week_start_date: new Date().toISOString().split('T')[0],
        next_rotation_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split('T')[0],
        last_rotated_at: new Date().toISOString(),
      })
      .eq('id', rotationState.id)
      .select()
      .single()

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { error: 'Failed to rotate chores' },
        { status: 500 }
      )
    }

    return NextResponse.json(data, { status: 200 })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
