import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const VALID_ASSIGNMENTS = ['Kitchen', 'Living Spaces', 'Bathrooms & Entry', 'Garden']
const VALID_WEEKS = ['A', 'B', 'C']

// GET - Fetch all kid assignments with kid names
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

    // Fetch assignments with kid details
    const { data: assignments, error } = await supabase
      .from('chore_assignments')
      .select(`
        id,
        kid_id,
        week,
        assignment,
        kids (
          id,
          name,
          age
        )
      `)
      .order('week', { ascending: true })

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Failed to fetch assignments' }, { status: 500 })
    }

    // Also fetch all kids for the UI
    const { data: kids } = await supabase
      .from('kids')
      .select('id, name, age')
      .order('age', { ascending: true })

    return NextResponse.json({ assignments, kids })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT - Update a kid's assignment for a specific week
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

    const { id, assignment } = await request.json()

    if (!id) {
      return NextResponse.json({ error: 'Missing assignment ID' }, { status: 400 })
    }

    if (!assignment || !VALID_ASSIGNMENTS.includes(assignment)) {
      return NextResponse.json(
        { error: `Invalid assignment. Must be one of: ${VALID_ASSIGNMENTS.join(', ')}` },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from('chore_assignments')
      .update({ assignment })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Failed to update assignment' }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST - Create a new assignment (for adding a kid to a week)
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

    const { kid_id, week, assignment } = await request.json()

    if (!kid_id || !week || !assignment) {
      return NextResponse.json(
        { error: 'Missing required fields: kid_id, week, assignment' },
        { status: 400 }
      )
    }

    if (!VALID_WEEKS.includes(week)) {
      return NextResponse.json(
        { error: `Invalid week. Must be one of: ${VALID_WEEKS.join(', ')}` },
        { status: 400 }
      )
    }

    if (!VALID_ASSIGNMENTS.includes(assignment)) {
      return NextResponse.json(
        { error: `Invalid assignment. Must be one of: ${VALID_ASSIGNMENTS.join(', ')}` },
        { status: 400 }
      )
    }

    // Check if assignment already exists for this kid/week
    const { data: existing } = await supabase
      .from('chore_assignments')
      .select('id')
      .eq('kid_id', kid_id)
      .eq('week', week)
      .single()

    if (existing) {
      return NextResponse.json(
        { error: 'Assignment already exists for this kid/week combination' },
        { status: 409 }
      )
    }

    const { data, error } = await supabase
      .from('chore_assignments')
      .insert({ kid_id, week, assignment })
      .select()
      .single()

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Failed to create assignment' }, { status: 500 })
    }

    return NextResponse.json(data, { status: 201 })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE - Remove an assignment
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
      return NextResponse.json({ error: 'Missing assignment ID' }, { status: 400 })
    }

    const { error } = await supabase
      .from('chore_assignments')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Failed to delete assignment' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
