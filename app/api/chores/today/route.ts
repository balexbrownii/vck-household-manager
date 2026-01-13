import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const kidId = searchParams.get('kidId')

    if (!kidId) {
      return NextResponse.json(
        { error: 'kidId is required' },
        { status: 400 }
      )
    }

    const supabase = await createClient()
    const today = new Date().toISOString().split('T')[0]
    const dayOfWeek = new Date().getDay() // 0 = Sunday, 6 = Saturday

    // Get kid's current chore assignment
    const { data: assignment, error: assignmentError } = await supabase
      .from('chore_assignments')
      .select('assignment, week')
      .eq('kid_id', kidId)
      .single()

    if (assignmentError || !assignment) {
      return NextResponse.json({ chores: [], assignment: null })
    }

    // Get the chore rooms for today's day and this assignment
    const { data: rooms, error: roomsError } = await supabase
      .from('chore_rooms')
      .select('id, room_name, checklist')
      .eq('assignment', assignment.assignment)
      .eq('day_of_week', dayOfWeek)

    if (roomsError) {
      console.error('Error fetching chore rooms:', roomsError)
      return NextResponse.json(
        { error: 'Failed to fetch chores' },
        { status: 500 }
      )
    }

    // Get today's completions for this kid
    const { data: completions, error: completionsError } = await supabase
      .from('chore_completions')
      .select('id, room_name, completed, inspection_status, kid_notes')
      .eq('kid_id', kidId)
      .eq('date', today)
      .eq('assignment', assignment.assignment)

    if (completionsError) {
      console.error('Error fetching completions:', completionsError)
    }

    // Map completions by room name for easy lookup
    const completionsByRoom = new Map(
      (completions || []).map(c => [c.room_name, c])
    )

    // Combine rooms with completion status
    const chores = (rooms || []).map(room => {
      const completion = completionsByRoom.get(room.room_name)
      return {
        id: room.id,
        roomName: room.room_name,
        checklist: room.checklist,
        completionId: completion?.id || null,
        completed: completion?.completed || false,
        inspectionStatus: completion?.inspection_status || null,
        kidNotes: completion?.kid_notes || null,
      }
    })

    return NextResponse.json({
      chores,
      assignment: assignment.assignment,
      week: assignment.week,
    })
  } catch (error) {
    console.error('Today chores API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
