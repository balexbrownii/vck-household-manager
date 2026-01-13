import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
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

    // session.kids is the related record (singular due to foreign key)
    const kids = session.kids as unknown as { id: string; max_gig_tier: number } | null
    if (!kids) {
      return NextResponse.json({ error: 'Kid not found' }, { status: 404 })
    }
    const kidId = kids.id
    const kidTier = kids.max_gig_tier || 1

    // Fetch the gig
    const { data: gig, error: gigError } = await supabase
      .from('gigs')
      .select('id, tier, active')
      .eq('id', gigId)
      .single()

    if (gigError || !gig) {
      return NextResponse.json(
        { error: 'Gig not found' },
        { status: 404 }
      )
    }

    // Check if gig is active
    if (!gig.active) {
      return NextResponse.json(
        { error: 'This gig is no longer available' },
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

    // Check if already claimed by anyone (not completed)
    const { data: existingClaim } = await supabase
      .from('claimed_gigs')
      .select('id, kid_id')
      .eq('gig_id', gigId)
      .is('completed_at', null)
      .single()

    if (existingClaim) {
      if (existingClaim.kid_id === kidId) {
        return NextResponse.json(
          { error: 'You have already claimed this gig' },
          { status: 400 }
        )
      }
      return NextResponse.json(
        { error: 'This gig has already been claimed by someone else' },
        { status: 400 }
      )
    }

    // Create claimed_gigs record
    const { data: claimedGig, error: claimError } = await supabase
      .from('claimed_gigs')
      .insert({
        gig_id: gigId,
        kid_id: kidId,
        claimed_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (claimError) {
      console.error('Claim error:', claimError)
      return NextResponse.json(
        { error: 'Failed to claim gig' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Gig claimed successfully!',
      claimedGigId: claimedGig.id,
    })
  } catch (error) {
    console.error('Claim gig error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
