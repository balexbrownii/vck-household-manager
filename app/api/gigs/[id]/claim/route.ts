import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/app/lib/supabase/server'
import { cookies } from 'next/headers'
import crypto from 'crypto'

function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex')
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: gigId } = await params
    const cookieStore = await cookies()
    const sessionToken = cookieStore.get('kid_session')?.value

    if (!sessionToken) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    const supabase = await createClient()
    const tokenHash = hashToken(sessionToken)

    // Verify kid session
    const { data: session, error: sessionError } = await supabase
      .from('kid_sessions')
      .select(`
        kid_id,
        kids (
          id,
          max_gig_tier
        )
      `)
      .eq('token_hash', tokenHash)
      .gt('expires_at', new Date().toISOString())
      .single()

    if (sessionError || !session) {
      return NextResponse.json(
        { error: 'Invalid session' },
        { status: 401 }
      )
    }

    const kid = session.kids as { id: string; max_gig_tier: number }
    const kidId = kid.id
    const kidTier = kid.max_gig_tier || 1

    // Fetch the gig
    const { data: gig, error: gigError } = await supabase
      .from('gigs')
      .select('id, tier, status, claimed_by')
      .eq('id', gigId)
      .single()

    if (gigError || !gig) {
      return NextResponse.json(
        { error: 'Gig not found' },
        { status: 404 }
      )
    }

    // Check if already claimed
    if (gig.claimed_by) {
      return NextResponse.json(
        { error: 'This gig has already been claimed' },
        { status: 400 }
      )
    }

    // Check tier eligibility
    if (gig.tier > kidTier) {
      return NextResponse.json(
        { error: `You need to unlock Tier ${gig.tier} to claim this gig` },
        { status: 403 }
      )
    }

    // Check if gig is available
    if (gig.status !== 'available') {
      return NextResponse.json(
        { error: 'This gig is no longer available' },
        { status: 400 }
      )
    }

    // Claim the gig - update gig status and create assignment
    const { error: updateError } = await supabase
      .from('gigs')
      .update({
        status: 'claimed',
        claimed_by: kidId,
        claimed_at: new Date().toISOString(),
      })
      .eq('id', gigId)

    if (updateError) {
      console.error('Claim update error:', updateError)
      return NextResponse.json(
        { error: 'Failed to claim gig' },
        { status: 500 }
      )
    }

    // Create gig assignment record
    const { error: assignmentError } = await supabase
      .from('gig_assignments')
      .insert({
        gig_id: gigId,
        kid_id: kidId,
        status: 'in_progress',
        claimed_at: new Date().toISOString(),
      })

    if (assignmentError) {
      console.error('Assignment creation error:', assignmentError)
      // Don't fail the request, the gig is already claimed
    }

    return NextResponse.json({
      success: true,
      message: 'Gig claimed successfully!',
    })
  } catch (error) {
    console.error('Claim gig error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
