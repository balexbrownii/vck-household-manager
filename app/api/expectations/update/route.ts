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

    // Parse request body
    const { kidId, date, expectation, complete } = await request.json()

    if (!kidId || !date || !expectation) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Validate expectation field
    const validExpectations = [
      'exercise_complete',
      'reading_complete',
      'tidy_up_complete',
      'daily_chore_complete',
    ]

    if (!validExpectations.includes(expectation)) {
      return NextResponse.json(
        { error: 'Invalid expectation field' },
        { status: 400 }
      )
    }

    // Upsert daily expectation record
    const { data, error } = await supabase
      .from('daily_expectations')
      .upsert(
        {
          kid_id: kidId,
          date: date,
          [expectation]: complete,
        },
        { onConflict: 'kid_id,date' }
      )
      .select()
      .single()

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { error: 'Failed to update expectation' },
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
