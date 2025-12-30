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

    const { kidId, gigId } = await request.json()

    if (!kidId || !gigId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Check if kid already has an active gig
    const { data: existingGig } = await supabase
      .from('claimed_gigs')
      .select('*')
      .eq('kid_id', kidId)
      .or('inspection_status.is.null,inspection_status.eq.pending')
      .limit(1)

    if (existingGig && existingGig.length > 0) {
      return NextResponse.json(
        { error: 'Kid already has an active gig in progress' },
        { status: 409 }
      )
    }

    // Claim the gig
    const { data, error } = await supabase
      .from('claimed_gigs')
      .insert({
        gig_id: gigId,
        kid_id: kidId,
        claimed_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { error: 'Failed to claim gig' },
        { status: 500 }
      )
    }

    return NextResponse.json(data, { status: 201 })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
