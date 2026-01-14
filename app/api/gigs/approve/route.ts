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

    const { claimedGigId, notes } = await request.json()

    if (!claimedGigId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Get the claimed gig with gig details
    const { data: claimedGig, error: claimedGigError } = await supabase
      .from('claimed_gigs')
      .select('*, gigs(*)')
      .eq('id', claimedGigId)
      .single()

    if (claimedGigError || !claimedGig) {
      return NextResponse.json(
        { error: 'Claimed gig not found' },
        { status: 404 }
      )
    }

    const gig = claimedGig.gigs

    // Update claimed gig with approval
    const { data: updatedClaim, error: updateError } = await supabase
      .from('claimed_gigs')
      .update({
        inspection_status: 'approved',
        inspected_by: user.id,
        inspected_at: new Date().toISOString(),
        inspection_notes: notes || null,
        stars_awarded: gig.stars,
        completed_at: new Date().toISOString(),
      })
      .eq('id', claimedGigId)
      .select()
      .single()

    if (updateError) {
      console.error('Database error updating claimed gig:', updateError)
      return NextResponse.json(
        { error: 'Failed to approve gig' },
        { status: 500 }
      )
    }

    // Add stars to kid's history
    const { data: kid } = await supabase
      .from('kids')
      .select('total_stars')
      .eq('id', claimedGig.kid_id)
      .single()

    const newBalance = (kid?.total_stars || 0) + gig.stars

    const { error: starError } = await supabase
      .from('star_history')
      .insert({
        kid_id: claimedGig.kid_id,
        claimed_gig_id: claimedGigId,
        stars_earned: gig.stars,
        reason: `Completed gig: ${gig.title}`,
        balance_after: newBalance,
      })

    if (starError) {
      console.error('Database error adding stars:', starError)
      return NextResponse.json(
        { error: 'Failed to award stars' },
        { status: 500 }
      )
    }

    // Send notification message to kid
    await supabase.from('family_messages').insert({
      sender_type: 'parent',
      sender_parent_id: user.id,
      recipient_type: 'kid',
      recipient_kid_id: claimedGig.kid_id,
      message_type: 'notification',
      subject: 'Gig Approved!',
      body: `Great job! Your "${gig.title}" gig was approved! You earned ${gig.stars} stars!`,
      related_entity_type: 'gig',
      related_entity_id: claimedGigId
    })

    // Log to activity feed
    await supabase.from('activity_feed').insert({
      kid_id: claimedGig.kid_id,
      actor_type: 'parent',
      actor_id: user.id,
      action: 'gig_approved',
      entity_type: 'gig',
      entity_id: claimedGigId,
      message: `Approved "${gig.title}" - awarded ${gig.stars} stars`
    })

    return NextResponse.json(updatedClaim, { status: 200 })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
