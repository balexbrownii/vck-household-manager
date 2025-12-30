import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { isWeekend } from '@/lib/domain/screen-time-rules'

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

    const { kidId, date } = await request.json()

    if (!kidId || !date) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Get kid
    const { data: kid, error: kidError } = await supabase
      .from('kids')
      .select('*')
      .eq('id', kidId)
      .single()

    if (kidError || !kid) {
      return NextResponse.json({ error: 'Kid not found' }, { status: 404 })
    }

    // Check if all expectations are complete for today
    const { data: expectations, error: expectationsError } = await supabase
      .from('daily_expectations')
      .select('*')
      .eq('kid_id', kidId)
      .eq('date', date)
      .single()

    if (expectationsError) {
      return NextResponse.json(
        { error: 'Could not verify expectations' },
        { status: 400 }
      )
    }

    if (!expectations?.all_complete) {
      return NextResponse.json(
        { error: 'Not all daily expectations are complete' },
        { status: 403 }
      )
    }

    // Check if session already exists for today
    const { data: existingSession } = await supabase
      .from('screen_time_sessions')
      .select('*')
      .eq('kid_id', kidId)
      .eq('date', date)
      .single()

    // Calculate base and bonus minutes
    const dateObj = new Date(date)
    const weekend = isWeekend(dateObj)
    const baseMinutes = weekend
      ? kid.screen_time_weekend_minutes
      : kid.screen_time_weekday_minutes

    // Count completed gigs today for bonus minutes
    const { data: completedGigs, error: gigsError } = await supabase
      .from('claimed_gigs')
      .select('*')
      .eq('kid_id', kidId)
      .eq('inspection_status', 'approved')
      .gte('inspected_at', `${date}T00:00:00`)
      .lte('inspected_at', `${date}T23:59:59`)

    const completedGigsCount = completedGigs?.length || 0
    const eligibleGigs = Math.min(completedGigsCount, 2)
    const bonusMinutes = eligibleGigs * 15

    if (existingSession) {
      // Update existing session
      const { data, error } = await supabase
        .from('screen_time_sessions')
        .update({
          unlocked_at: new Date().toISOString(),
          bonus_minutes_allowed: bonusMinutes,
        })
        .eq('id', existingSession.id)
        .select()
        .single()

      if (error) {
        return NextResponse.json(
          { error: 'Failed to unlock screen time' },
          { status: 500 }
        )
      }

      return NextResponse.json(data, { status: 200 })
    }

    // Create new session
    const { data, error } = await supabase
      .from('screen_time_sessions')
      .insert({
        kid_id: kidId,
        date: date,
        unlocked_at: new Date().toISOString(),
        base_minutes_allowed: baseMinutes,
        bonus_minutes_allowed: bonusMinutes,
        is_weekend: weekend,
      })
      .select()
      .single()

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { error: 'Failed to unlock screen time' },
        { status: 500 }
      )
    }

    return NextResponse.json(data, { status: 201 })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
