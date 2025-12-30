import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { VIOLATION_RULES, calculateActualTimeoutDuration } from '@/lib/domain/timeout-rules'

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

    const { kidId, violationType, notes } = await request.json()

    if (!kidId || !violationType) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Get violation rule
    const rule = VIOLATION_RULES[violationType]
    if (!rule) {
      return NextResponse.json({ error: 'Invalid violation type' }, { status: 400 })
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

    // Create timeout violation record
    const startedAt = new Date().toISOString()
    const baseMinutes = rule.minutes
    const resetCount = 0
    const doubled = false
    const actualDuration = calculateActualTimeoutDuration(baseMinutes, resetCount, doubled)

    const { data: timeout, error: insertError } = await supabase
      .from('timeout_violations')
      .insert({
        kid_id: kidId,
        violation_type: violationType,
        timeout_minutes: baseMinutes,
        started_at: startedAt,
        reset_count: resetCount,
        doubled: doubled,
        notes: notes || null,
        logged_by: user.id,
      })
      .select()
      .single()

    if (insertError) {
      console.error('Database error:', insertError)
      return NextResponse.json(
        { error: 'Failed to log timeout' },
        { status: 500 }
      )
    }

    return NextResponse.json(
      {
        ...timeout,
        actual_duration_minutes: actualDuration,
        rule_description: rule.description,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
