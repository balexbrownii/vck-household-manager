import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET list meal prep gigs (optionally filtered by kid or status)
export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url)
    const kidId = searchParams.get('kidId')
    const status = searchParams.get('status')
    const weekStartDate = searchParams.get('weekStartDate')

    let query = supabase
      .from('meal_prep_gigs')
      .select(`
        *,
        meal_plan_entries (
          *,
          recipes (title, estimated_minutes)
        ),
        kids (name)
      `)
      .order('created_at', { ascending: false })

    // Filter by kid if specified
    if (kidId) {
      query = query.eq('kid_id', kidId)
    }

    // Filter by status if specified
    if (status) {
      query = query.eq('status', status)
    }

    // Filter by week if weekStartDate is provided
    if (weekStartDate) {
      // Build week dates
      const weekDates: string[] = []
      for (let i = 0; i < 7; i++) {
        const d = new Date(weekStartDate)
        d.setDate(d.getDate() + i)
        weekDates.push(d.toISOString().split('T')[0])
      }

      // Need to join to get meal_plan_entries.planned_date
      query = query.in('meal_plan_entries.planned_date', weekDates)
    }

    const { data, error } = await query

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch meal prep gigs' },
        { status: 500 }
      )
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
