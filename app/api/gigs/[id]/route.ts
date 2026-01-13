import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import crypto from 'crypto'

function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex')
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()

    // Get gig details
    const { data: gig, error } = await supabase
      .from('gigs')
      .select(`
        id,
        title,
        description,
        checklist,
        tier,
        stars,
        estimated_minutes,
        active
      `)
      .eq('id', id)
      .single()

    if (error) {
      console.error('Error fetching gig:', error)
      return NextResponse.json(
        { error: 'Gig not found' },
        { status: 404 }
      )
    }

    // Check if this gig is claimed (and by whom)
    const { data: claim } = await supabase
      .from('claimed_gigs')
      .select('id, kid_id, claimed_at, completed_at, inspection_status')
      .eq('gig_id', id)
      .is('completed_at', null)
      .single()

    // Check if current kid has claimed it (if kid session exists)
    const cookieStore = await cookies()
    const sessionToken = cookieStore.get('kid_session')?.value
    let currentKidId: string | null = null

    if (sessionToken) {
      const tokenHash = hashToken(sessionToken)
      const { data: session } = await supabase
        .from('kid_sessions')
        .select('kid_id')
        .eq('token_hash', tokenHash)
        .gt('expires_at', new Date().toISOString())
        .single()

      if (session) {
        currentKidId = session.kid_id
      }
    }

    // Determine gig status
    let status = 'available'
    let claimedBy = null

    if (claim) {
      status = 'claimed'
      claimedBy = claim.kid_id
    }

    if (!gig.active) {
      status = 'inactive'
    }

    return NextResponse.json({
      gig: {
        ...gig,
        instructions: gig.checklist ? JSON.stringify(gig.checklist) : null,
        status,
        claimed_by: claimedBy,
        is_claimed_by_me: currentKidId && claimedBy === currentKidId,
      },
    })
  } catch (error) {
    console.error('Gig API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
