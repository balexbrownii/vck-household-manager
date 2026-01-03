import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET - Fetch all chore rooms
export async function GET() {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: rooms, error } = await supabase
      .from('chore_rooms')
      .select('*')
      .order('assignment', { ascending: true })
      .order('day_of_week', { ascending: true })

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Failed to fetch rooms' }, { status: 500 })
    }

    return NextResponse.json(rooms)
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT - Update a chore room
export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id, room_name, checklist } = await request.json()

    if (!id) {
      return NextResponse.json({ error: 'Missing room ID' }, { status: 400 })
    }

    const updateData: { room_name?: string; checklist?: string[] } = {}

    if (room_name !== undefined) {
      updateData.room_name = room_name
    }

    if (checklist !== undefined) {
      // Validate checklist is an array of strings
      if (!Array.isArray(checklist) || !checklist.every(item => typeof item === 'string')) {
        return NextResponse.json({ error: 'Checklist must be an array of strings' }, { status: 400 })
      }
      updateData.checklist = checklist
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 })
    }

    const { data: room, error } = await supabase
      .from('chore_rooms')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Failed to update room' }, { status: 500 })
    }

    return NextResponse.json(room)
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST - Create a new chore room
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { assignment, day_of_week, room_name, checklist } = await request.json()

    if (!assignment || day_of_week === undefined || !room_name) {
      return NextResponse.json(
        { error: 'Missing required fields: assignment, day_of_week, room_name' },
        { status: 400 }
      )
    }

    // Validate assignment
    const validAssignments = ['Kitchen', 'Living Spaces', 'Bathrooms & Entry', 'Garden']
    if (!validAssignments.includes(assignment)) {
      return NextResponse.json(
        { error: `Invalid assignment. Must be one of: ${validAssignments.join(', ')}` },
        { status: 400 }
      )
    }

    // Validate day_of_week
    if (day_of_week < 0 || day_of_week > 6) {
      return NextResponse.json(
        { error: 'day_of_week must be between 0 (Sunday) and 6 (Saturday)' },
        { status: 400 }
      )
    }

    const { data: room, error } = await supabase
      .from('chore_rooms')
      .insert({
        assignment,
        day_of_week,
        room_name,
        checklist: checklist || [],
      })
      .select()
      .single()

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Failed to create room' }, { status: 500 })
    }

    return NextResponse.json(room, { status: 201 })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE - Delete a chore room
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Missing room ID' }, { status: 400 })
    }

    const { error } = await supabase
      .from('chore_rooms')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Failed to delete room' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
