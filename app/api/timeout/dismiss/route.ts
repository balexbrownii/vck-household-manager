import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// POST: Parent dismisses/cancels a timeout
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Check authentication - parent only
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify user is a parent
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || !['parent', 'admin'].includes(profile.role)) {
      return NextResponse.json(
        { error: 'Only parents can dismiss timeouts' },
        { status: 403 }
      )
    }

    const { timeoutId, reason } = await request.json()

    if (!timeoutId) {
      return NextResponse.json(
        { error: 'Missing timeout ID' },
        { status: 400 }
      )
    }

    // Get current timeout
    const { data: currentTimeout, error: getError } = await supabase
      .from('timeout_violations')
      .select('*, kids(name)')
      .eq('id', timeoutId)
      .is('completed_at', null)
      .single()

    if (getError || !currentTimeout) {
      return NextResponse.json(
        { error: 'Timeout not found or already completed' },
        { status: 404 }
      )
    }

    // Mark timeout as dismissed (completed early by parent)
    const { data: dismissedTimeout, error: updateError } = await supabase
      .from('timeout_violations')
      .update({
        completed_at: new Date().toISOString(),
        notes: reason ? `Dismissed by parent: ${reason}` : 'Dismissed by parent',
      })
      .eq('id', timeoutId)
      .select()
      .single()

    if (updateError) {
      console.error('Database error:', updateError)
      return NextResponse.json(
        { error: 'Failed to dismiss timeout' },
        { status: 500 }
      )
    }

    // Log activity
    await supabase.from('activity_feed').insert({
      kid_id: currentTimeout.kid_id,
      actor_type: 'parent',
      actor_id: user.id,
      action: 'timeout_dismissed',
      entity_type: 'timeout',
      entity_id: timeoutId,
      message: `Timeout dismissed${reason ? `: ${reason}` : ''}`
    })

    // Notify kid
    await supabase.from('family_messages').insert({
      sender_type: 'parent',
      sender_parent_id: user.id,
      recipient_type: 'kid',
      recipient_kid_id: currentTimeout.kid_id,
      message_type: 'notification',
      subject: 'Timeout Cancelled',
      body: reason
        ? `Your timeout has been cancelled. ${reason}`
        : 'Your timeout has been cancelled by a parent.',
      related_entity_type: 'timeout',
      related_entity_id: timeoutId
    })

    return NextResponse.json({
      success: true,
      timeout: dismissedTimeout,
      message: 'Timeout dismissed successfully'
    })
  } catch (error) {
    console.error('Timeout dismiss error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
