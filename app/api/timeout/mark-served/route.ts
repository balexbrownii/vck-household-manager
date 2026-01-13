import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { timeoutId } = await request.json()

    if (!timeoutId) {
      return NextResponse.json(
        { error: 'Timeout ID is required' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // First verify the timeout exists and has been started
    const { data: timeout, error: fetchError } = await supabase
      .from('timeout_violations')
      .select('serving_started_at, timeout_minutes')
      .eq('id', timeoutId)
      .single()

    if (fetchError || !timeout) {
      return NextResponse.json(
        { error: 'Timeout not found' },
        { status: 404 }
      )
    }

    if (!timeout.serving_started_at) {
      return NextResponse.json(
        { error: 'Timeout has not been started yet' },
        { status: 400 }
      )
    }

    // Check if enough time has passed (allow some grace period)
    const startTime = new Date(timeout.serving_started_at).getTime()
    const requiredTime = timeout.timeout_minutes * 60 * 1000
    const elapsedTime = Date.now() - startTime
    const graceSeconds = 5 // Allow 5 seconds grace period

    if (elapsedTime < requiredTime - (graceSeconds * 1000)) {
      return NextResponse.json(
        { error: 'Timeout period has not completed yet' },
        { status: 400 }
      )
    }

    // Update the timeout to mark as served (pending parent approval)
    const { error } = await supabase
      .from('timeout_violations')
      .update({ served_at: new Date().toISOString() })
      .eq('id', timeoutId)
      .is('served_at', null) // Only if not already served

    if (error) {
      console.error('Error marking timeout served:', error)
      return NextResponse.json(
        { error: 'Failed to mark timeout as served' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in mark-served:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
