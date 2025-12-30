import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { calculateActualTimeoutDuration } from '@/lib/domain/timeout-rules'

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

    const { timeoutId } = await request.json()

    if (!timeoutId) {
      return NextResponse.json(
        { error: 'Missing timeout ID' },
        { status: 400 }
      )
    }

    // Get current timeout
    const { data: currentTimeout, error: getError } = await supabase
      .from('timeout_violations')
      .select('*')
      .eq('id', timeoutId)
      .is('completed_at', null) // Only reset active timeouts
      .single()

    if (getError || !currentTimeout) {
      return NextResponse.json(
        { error: 'Timeout not found or already completed' },
        { status: 404 }
      )
    }

    // Increment reset count and update started_at to now
    const newResetCount = (currentTimeout.reset_count || 0) + 1
    const newStartedAt = new Date().toISOString()

    const { data: updatedTimeout, error: updateError } = await supabase
      .from('timeout_violations')
      .update({
        reset_count: newResetCount,
        started_at: newStartedAt,
      })
      .eq('id', timeoutId)
      .select()
      .single()

    if (updateError) {
      console.error('Database error:', updateError)
      return NextResponse.json(
        { error: 'Failed to reset timeout' },
        { status: 500 }
      )
    }

    // Calculate new duration
    const actualDuration = calculateActualTimeoutDuration(
      updatedTimeout.timeout_minutes,
      newResetCount,
      updatedTimeout.doubled || false
    )

    return NextResponse.json({
      ...updatedTimeout,
      actual_duration_minutes: actualDuration,
    })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
