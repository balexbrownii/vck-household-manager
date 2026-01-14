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

    // If it's a chore, update the chore_completions record
    if (photo.entity_type === 'chore') {
      // Get room name from chore_rooms using entity_id
      const { data: room } = await supabase
        .from('chore_rooms')
        .select('room_name')
        .eq('id', photo.entity_id)
        .single()

      if (room?.room_name) {
        const today = new Date().toISOString().split('T')[0]

        if (action === 'approve') {
          await supabase
            .from('chore_completions')
            .update({
              completed: true,
              inspection_status: 'approved',
              verified_by: user.id,
              verified_at: new Date().toISOString(),
              notes: feedback || null,
            })
            .eq('kid_id', photo.kid_id)
            .eq('date', today)
            .eq('room_name', room.room_name)
        } else {
          // Rejection - mark as rejected so kid can resubmit
          await supabase
            .from('chore_completions')
            .update({
              inspection_status: 'rejected',
              notes: feedback || null,
            })
            .eq('kid_id', photo.kid_id)
            .eq('date', today)
            .eq('room_name', room.room_name)
        }
      }
    }

    // Send notification message to kid
    const entityLabel = photo.entity_type === 'gig' ? 'gig' : photo.entity_type === 'chore' ? 'chore' : 'task'

    if (action === 'approve') {
      await supabase.from('family_messages').insert({
        sender_type: 'parent',
        sender_parent_id: user.id,
        recipient_type: 'kid',
        recipient_kid_id: photo.kid_id,
        message_type: 'notification',
        subject: 'Submission Approved!',
        body: feedback
          ? `Your ${entityLabel} submission was approved! ${feedback}`
          : `Your ${entityLabel} submission was approved! Great work!`,
        related_entity_type: photo.entity_type,
        related_entity_id: photo.entity_id
      })

      // Log to activity feed
      await supabase.from('activity_feed').insert({
        kid_id: photo.kid_id,
        actor_type: 'parent',
        actor_id: user.id,
        action: 'submission_approved',
        entity_type: photo.entity_type,
        entity_id: photo.entity_id,
        message: `${entityLabel} submission approved`
      })
    } else {
      await supabase.from('family_messages').insert({
        sender_type: 'parent',
        sender_parent_id: user.id,
        recipient_type: 'kid',
        recipient_kid_id: photo.kid_id,
        message_type: 'notification',
        subject: 'Submission Needs Work',
        body: feedback
          ? `Your ${entityLabel} submission needs revision: ${feedback}`
          : `Your ${entityLabel} submission needs some more work. Please try again.`,
        related_entity_type: photo.entity_type,
        related_entity_id: photo.entity_id
      })

      // Log to activity feed
      await supabase.from('activity_feed').insert({
        kid_id: photo.kid_id,
        actor_type: 'parent',
        actor_id: user.id,
        action: 'submission_rejected',
        entity_type: photo.entity_type,
        entity_id: photo.entity_id,
        message: `${entityLabel} submission needs revision${feedback ? ': ' + feedback : ''}`
      })
    }

    // Log feedback signal for AI learning (if AI reviewed this submission)
    if (photo.ai_reviewed_at !== null) {
      const parentApproved = action === 'approve'
      const aiPassed = photo.ai_passed === true

      // Determine signal type
      let signalType: 'agreement' | 'false_positive' | 'false_negative'
      if (parentApproved === aiPassed) {
        signalType = 'agreement'
      } else if (aiPassed && !parentApproved) {
        signalType = 'false_positive' // AI was too lenient
      } else {
        signalType = 'false_negative' // AI was too strict
      }

      // Get rules snapshot from ai_review_logs
      const { data: aiLog } = await supabase
        .from('ai_review_logs')
        .select('rules_used')
        .eq('completion_photo_id', photoId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      await supabase.from('ai_feedback_signals').insert({
        completion_photo_id: photoId,
        entity_type: photo.entity_type,
        entity_id: photo.entity_id,
        ai_passed: aiPassed,
        ai_confidence: photo.ai_confidence,
        ai_feedback: photo.ai_feedback,
        parent_approved: parentApproved,
        parent_feedback: feedback || null,
        parent_id: user.id,
        signal_type: signalType,
        kid_notes: photo.notes,
        rules_snapshot: aiLog?.rules_used || null,
      })
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
