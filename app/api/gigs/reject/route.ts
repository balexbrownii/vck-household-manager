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

    const { claimedGigId, reason } = await request.json()

    if (!claimedGigId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Get the claimed gig with gig details first
    const { data: claimedGig } = await supabase
      .from('claimed_gigs')
      .select('*, gigs(title)')
      .eq('id', claimedGigId)
      .single()

    // Reject the gig (no star penalty - they can redo it)
    const { data, error } = await supabase
      .from('claimed_gigs')
      .update({
        inspection_status: 'rejected',
        inspected_by: user.id,
        inspected_at: new Date().toISOString(),
        inspection_notes: reason || null,
      })
      .eq('id', claimedGigId)
      .select()
      .single()

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { error: 'Failed to reject gig' },
        { status: 500 }
      )
    }

    // Send notification message to kid
    if (claimedGig) {
      const gigTitle = claimedGig.gigs?.title || 'gig'

      await supabase.from('family_messages').insert({
        sender_type: 'parent',
        sender_parent_id: user.id,
        recipient_type: 'kid',
        recipient_kid_id: claimedGig.kid_id,
        message_type: 'notification',
        subject: 'Gig Needs Revision',
        body: reason
          ? `Your "${gigTitle}" gig needs some work: ${reason}`
          : `Your "${gigTitle}" gig needs some more work. Please check it and try again.`,
        related_entity_type: 'gig',
        related_entity_id: claimedGigId
      })

      // Log to activity feed
      await supabase.from('activity_feed').insert({
        kid_id: claimedGig.kid_id,
        actor_type: 'parent',
        actor_id: user.id,
        action: 'gig_rejected',
        entity_type: 'gig',
        entity_id: claimedGigId,
        message: `"${gigTitle}" needs revision${reason ? ': ' + reason : ''}`
      })
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
