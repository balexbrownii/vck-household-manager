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

    // Update the timeout to mark serving started
    const { error } = await supabase
      .from('timeout_violations')
      .update({ serving_started_at: new Date().toISOString() })
      .eq('id', timeoutId)
      .is('serving_started_at', null) // Only if not already started

    if (error) {
      console.error('Error starting timeout:', error)
      return NextResponse.json(
        { error: 'Failed to start timeout' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in start-serving:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
