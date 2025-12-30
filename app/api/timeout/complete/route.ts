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
      .is('completed_at', null) // Only complete active timeouts
      .single()

    if (getError || !currentTimeout) {
      return NextResponse.json(
        { error: 'Timeout not found or already completed' },
        { status: 404 }
      )
    }

    // Mark timeout as completed
    const { data: completedTimeout, error: updateError } = await supabase
      .from('timeout_violations')
      .update({
        completed_at: new Date().toISOString(),
      })
      .eq('id', timeoutId)
      .select()
      .single()

    if (updateError) {
      console.error('Database error:', updateError)
      return NextResponse.json(
        { error: 'Failed to complete timeout' },
        { status: 500 }
      )
    }

    return NextResponse.json(completedTimeout)
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
