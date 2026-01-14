import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import crypto from 'crypto'

function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex')
}

async function getKidFromSession(): Promise<string | null> {
  const cookieStore = await cookies()
  const sessionToken = cookieStore.get('kid_session')?.value

  if (!sessionToken) return null

  const supabase = await createClient()
  const tokenHash = hashToken(sessionToken)

  const { data: session } = await supabase
    .from('kid_sessions')
    .select('kid_id')
    .eq('token_hash', tokenHash)
    .gt('expires_at', new Date().toISOString())
    .single()

  return session?.kid_id || null
}

// GET: Fetch ad-hoc gigs
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)

    const kidId = searchParams.get('kidId')
    const date = searchParams.get('date') || new Date().toISOString().split('T')[0]
    const includeCompleted = searchParams.get('includeCompleted') === 'true'

    // Check authentication
    const { data: { user } } = await supabase.auth.getUser()
    const sessionKidId = await getKidFromSession()

    if (!user && !sessionKidId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const isKid = !user && !!sessionKidId

    // Build query
    let query = supabase
      .from('adhoc_gigs')
      .select('*')
      .eq('date', date)
      .order('created_at', { ascending: true })

    if (isKid) {
      // Kids only see their own gigs
      query = query.eq('kid_id', sessionKidId)
    } else if (kidId) {
      // Parents can filter by kid
      query = query.eq('kid_id', kidId)
    }

    if (!includeCompleted) {
      query = query.not('status', 'in', '("approved","rejected")')
    }

    const { data, error } = await query

    if (error) {
      console.error('Adhoc gigs fetch error:', error)
      return NextResponse.json({ error: 'Failed to fetch ad-hoc gigs' }, { status: 500 })
    }

    return NextResponse.json({ gigs: data })
  } catch (error) {
    console.error('Adhoc gigs GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST: Create ad-hoc gig (parent only)
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized - parents only' }, { status: 401 })
    }

    const body = await request.json()
    const { kidId, title, description, stars, estimated_minutes, checklist, date } = body

    if (!kidId || !title) {
      return NextResponse.json(
        { error: 'Missing required fields: kidId, title' },
        { status: 400 }
      )
    }

    // Get kid name for notification
    const { data: kid } = await supabase
      .from('kids')
      .select('name')
      .eq('id', kidId)
      .single()

    // Create the ad-hoc gig
    const { data, error } = await supabase
      .from('adhoc_gigs')
      .insert({
        kid_id: kidId,
        title,
        description: description || null,
        stars: stars || 5,
        estimated_minutes: estimated_minutes || null,
        checklist: checklist || [],
        date: date || new Date().toISOString().split('T')[0],
        assigned_by: user.id,
      })
      .select()
      .single()

    if (error) {
      console.error('Adhoc gig create error:', error)
      return NextResponse.json({ error: 'Failed to create ad-hoc gig' }, { status: 500 })
    }

    // Log activity
    await supabase.from('activity_feed').insert({
      kid_id: kidId,
      actor_type: 'parent',
      actor_id: user.id,
      action: 'adhoc_gig_assigned',
      entity_type: 'adhoc_gig',
      entity_id: data.id,
      message: `New gig assigned: ${title} (${stars} stars)`,
    })

    // Create notification for kid
    await supabase.from('family_messages').insert({
      sender_type: 'parent',
      sender_parent_id: user.id,
      recipient_type: 'kid',
      recipient_kid_id: kidId,
      message_type: 'notification',
      subject: 'New Gig Available',
      body: `You have a new gig: ${title} - worth ${stars} stars!${description ? '\n\n' + description : ''}`,
    })

    return NextResponse.json({ gig: data })
  } catch (error) {
    console.error('Adhoc gigs POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PATCH: Update ad-hoc gig (mark complete, inspect)
export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    const sessionKidId = await getKidFromSession()

    if (!user && !sessionKidId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const isParent = !!user
    const isKid = !user && !!sessionKidId

    const body = await request.json()
    const { gigId, completed, completionNote, inspectionStatus, parentNotes, starsAwarded } = body

    if (!gigId) {
      return NextResponse.json({ error: 'Missing gigId' }, { status: 400 })
    }

    // Get current gig
    const { data: gig } = await supabase
      .from('adhoc_gigs')
      .select('*, kids(name)')
      .eq('id', gigId)
      .single()

    if (!gig) {
      return NextResponse.json({ error: 'Gig not found' }, { status: 404 })
    }

    const updateData: Record<string, unknown> = {}

    // Kids can mark as completed
    if (isKid && completed !== undefined) {
      updateData.status = completed ? 'completed' : 'assigned'
      updateData.completed_at = completed ? new Date().toISOString() : null
      updateData.completed_by_kid = completed
      if (completionNote) updateData.completion_note = completionNote
    }

    // Parents can inspect
    if (isParent) {
      if (inspectionStatus) {
        updateData.inspection_status = inspectionStatus
        updateData.inspected_by = user.id
        updateData.inspected_at = new Date().toISOString()

        if (inspectionStatus === 'approved') {
          updateData.status = 'approved'
          updateData.stars_awarded = starsAwarded || gig.stars
        } else if (inspectionStatus === 'rejected') {
          updateData.status = 'rejected'
        } else if (inspectionStatus === 'revision_requested') {
          updateData.status = 'in_progress'
        }
      }
      if (parentNotes !== undefined) updateData.parent_notes = parentNotes
      if (completed !== undefined) {
        updateData.status = completed ? 'completed' : 'assigned'
        updateData.completed_at = completed ? new Date().toISOString() : null
        updateData.completed_by_kid = false
      }
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'No updates specified' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('adhoc_gigs')
      .update(updateData)
      .eq('id', gigId)
      .select()
      .single()

    if (error) {
      console.error('Adhoc gig update error:', error)
      return NextResponse.json({ error: 'Failed to update ad-hoc gig' }, { status: 500 })
    }

    // Handle post-update actions
    const kidName = (gig.kids as { name: string })?.name || 'Unknown'

    // Log activity for completions
    if (isKid && completed) {
      await supabase.from('activity_feed').insert({
        kid_id: gig.kid_id,
        actor_type: 'kid',
        actor_id: sessionKidId,
        action: 'adhoc_gig_completed',
        entity_type: 'adhoc_gig',
        entity_id: gigId,
        message: `${kidName} completed gig: ${gig.title}`,
      })
    }

    // Handle approval - award stars
    if (isParent && inspectionStatus === 'approved') {
      const starsToAward = starsAwarded || gig.stars

      // Update kid's star balance
      await supabase.rpc('increment_stars', {
        kid_id_param: gig.kid_id,
        amount: starsToAward
      })

      // Log star history
      const { data: updatedKid } = await supabase
        .from('kids')
        .select('total_stars')
        .eq('id', gig.kid_id)
        .single()

      await supabase.from('star_history').insert({
        kid_id: gig.kid_id,
        stars_earned: starsToAward,
        reason: `Completed ad-hoc gig: ${gig.title}`,
        balance_after: updatedKid?.total_stars || 0,
      })

      // Activity log
      await supabase.from('activity_feed').insert({
        kid_id: gig.kid_id,
        actor_type: 'parent',
        actor_id: user.id,
        action: 'adhoc_gig_approved',
        entity_type: 'adhoc_gig',
        entity_id: gigId,
        message: `Approved ${kidName}'s gig "${gig.title}" - awarded ${starsToAward} stars`,
      })

      // Notify kid
      await supabase.from('family_messages').insert({
        sender_type: 'parent',
        sender_parent_id: user.id,
        recipient_type: 'kid',
        recipient_kid_id: gig.kid_id,
        message_type: 'notification',
        subject: 'Gig Approved!',
        body: `Great job! Your gig "${gig.title}" was approved. You earned ${starsToAward} stars!`,
      })
    }

    // Handle rejection
    if (isParent && inspectionStatus === 'rejected') {
      await supabase.from('activity_feed').insert({
        kid_id: gig.kid_id,
        actor_type: 'parent',
        actor_id: user.id,
        action: 'adhoc_gig_rejected',
        entity_type: 'adhoc_gig',
        entity_id: gigId,
        message: `Rejected ${kidName}'s gig "${gig.title}"`,
      })
    }

    // Handle revision request
    if (isParent && inspectionStatus === 'revision_requested') {
      await supabase.from('family_messages').insert({
        sender_type: 'parent',
        sender_parent_id: user.id,
        recipient_type: 'kid',
        recipient_kid_id: gig.kid_id,
        message_type: 'notification',
        subject: 'Gig Needs Work',
        body: `Your gig "${gig.title}" needs some fixes.${parentNotes ? '\n\nFeedback: ' + parentNotes : ''}`,
      })
    }

    return NextResponse.json({ gig: data })
  } catch (error) {
    console.error('Adhoc gigs PATCH error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE: Remove ad-hoc gig (parent only)
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized - parents only' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const gigId = searchParams.get('gigId')

    if (!gigId) {
      return NextResponse.json({ error: 'Missing gigId' }, { status: 400 })
    }

    const { error } = await supabase
      .from('adhoc_gigs')
      .delete()
      .eq('id', gigId)

    if (error) {
      console.error('Adhoc gig delete error:', error)
      return NextResponse.json({ error: 'Failed to delete ad-hoc gig' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Adhoc gigs DELETE error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
