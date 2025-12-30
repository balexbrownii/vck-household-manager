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

    const { kidId, date, completed, notes } = await request.json()

    if (!kidId || !date) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Get current chore rotation state
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

    // Get kid's assignment for current week
    const { data: assignment, error: assignmentError } = await supabase
      .from('chore_assignments')
      .select('*')
      .eq('kid_id', kidId)
      .eq('week', rotationState.current_week)
      .single()

    if (assignmentError || !assignment) {
      return NextResponse.json(
        { error: 'Could not find kid assignment' },
        { status: 500 }
      )
    }

    // Get today's room for this assignment
    const dayOfWeek = new Date(date).getDay()
    const { data: rooms, error: roomsError } = await supabase
      .from('chore_rooms')
      .select('*')
      .eq('assignment', assignment.assignment)
      .eq('day_of_week', dayOfWeek)
      .single()

    if (roomsError || !rooms) {
      return NextResponse.json(
        { error: 'Could not find room assignment' },
        { status: 500 }
      )
    }

    // Upsert completion record
    const { data, error } = await supabase
      .from('chore_completions')
      .upsert(
        {
          kid_id: kidId,
          date: date,
          assignment: assignment.assignment,
          room_name: rooms.room_name,
          completed: completed,
          notes: notes || null,
          verified_by: completed ? user.id : null,
          verified_at: completed ? new Date().toISOString() : null,
        },
        { onConflict: 'kid_id,date' }
      )
      .select()
      .single()

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { error: 'Failed to update chore completion' },
        { status: 500 }
      )
    }

    // Update daily expectations chore_complete if marked as done
    if (completed) {
      await supabase
        .from('daily_expectations')
        .upsert(
          {
            kid_id: kidId,
            date: date,
            daily_chore_complete: true,
          },
          { onConflict: 'kid_id,date' }
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
