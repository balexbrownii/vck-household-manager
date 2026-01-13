import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: photoId } = await params
    const { action, feedback } = await request.json()

    if (!action || !['approve', 'reject'].includes(action)) {
      return NextResponse.json(
        { error: 'Invalid action. Must be "approve" or "reject"' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Verify parent is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Verify user is a parent
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || !['parent', 'admin'].includes(profile.role)) {
      return NextResponse.json(
        { error: 'Only parents can review submissions' },
        { status: 403 }
      )
    }

    // Get the photo submission
    const { data: photo, error: photoError } = await supabase
      .from('completion_photos')
      .select('*')
      .eq('id', photoId)
      .single()

    if (photoError || !photo) {
      return NextResponse.json(
        { error: 'Submission not found' },
        { status: 404 }
      )
    }

    if (photo.status !== 'pending_review') {
      return NextResponse.json(
        { error: 'This submission has already been reviewed' },
        { status: 400 }
      )
    }

    const newStatus = action === 'approve' ? 'approved' : 'rejected'

    // Update the photo status
    const { error: updateError } = await supabase
      .from('completion_photos')
      .update({
        status: newStatus,
        reviewed_at: new Date().toISOString(),
        reviewed_by: user.id,
        review_feedback: feedback || null,
      })
      .eq('id', photoId)

    if (updateError) {
      console.error('Update error:', updateError)
      return NextResponse.json(
        { error: 'Failed to update submission' },
        { status: 500 }
      )
    }

    // If approved and it's a gig, award stars
    if (action === 'approve' && photo.entity_type === 'gig') {
      // Get gig details and claimed_gig record
      const { data: gig } = await supabase
        .from('gigs')
        .select('stars, title')
        .eq('id', photo.entity_id)
        .single()

      const { data: claimedGig } = await supabase
        .from('claimed_gigs')
        .select('id')
        .eq('gig_id', photo.entity_id)
        .eq('kid_id', photo.kid_id)
        .single()

      if (gig && claimedGig) {
        // Get current kid stars for balance_after calculation
        const { data: kid } = await supabase
          .from('kids')
          .select('total_stars')
          .eq('id', photo.kid_id)
          .single()

        const currentStars = kid?.total_stars || 0
        const newBalance = currentStars + gig.stars

        // Update kid's total stars directly
        const { error: starsError } = await supabase
          .from('kids')
          .update({ total_stars: newBalance })
          .eq('id', photo.kid_id)

        if (starsError) {
          console.error('Stars update error:', starsError)
        }

        // Add to star_history (correct table name)
        const { error: historyError } = await supabase
          .from('star_history')
          .insert({
            kid_id: photo.kid_id,
            claimed_gig_id: claimedGig.id,
            stars_earned: gig.stars,
            reason: `Completed gig: ${gig.title}`,
            balance_after: newBalance,
          })

        if (historyError) {
          console.error('Star history error:', historyError)
        }

        // Update claimed_gigs (correct table name)
        const { error: claimError } = await supabase
          .from('claimed_gigs')
          .update({
            inspection_status: 'approved',
            inspected_by: user.id,
            inspected_at: new Date().toISOString(),
            completed_at: new Date().toISOString(),
            stars_awarded: gig.stars,
          })
          .eq('id', claimedGig.id)

        if (claimError) {
          console.error('Claimed gig update error:', claimError)
        }
      }
    }

    // If approved and it's a chore, mark as completed and verified
    if (action === 'approve' && photo.entity_type === 'chore') {
      await supabase
        .from('chore_completions')
        .update({
          completed: true,
          verified: true,
          verified_at: new Date().toISOString(),
          verified_by: user.id,
        })
        .eq('chore_id', photo.entity_id)
        .eq('kid_id', photo.kid_id)
        .eq('date', new Date().toISOString().split('T')[0])
    }

    return NextResponse.json({
      success: true,
      status: newStatus,
      message: action === 'approve'
        ? 'Submission approved! Stars awarded.'
        : 'Submission rejected.',
    })
  } catch (error) {
    console.error('Review submission error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
