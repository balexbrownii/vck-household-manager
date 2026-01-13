import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/app/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const kidId = searchParams.get('kidId')

    if (!kidId) {
      return NextResponse.json(
        { error: 'kidId is required' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Get gigs that are claimed by this kid but not yet completed
    const { data: gigs, error } = await supabase
      .from('gig_assignments')
      .select(`
        id,
        status,
        claimed_at,
        gigs (
          id,
          title,
          description,
          stars,
          tier,
          estimated_minutes
        )
      `)
      .eq('kid_id', kidId)
      .eq('status', 'in_progress')
      .order('claimed_at', { ascending: false })

    if (error) {
      console.error('Error fetching claimed gigs:', error)
      return NextResponse.json(
        { error: 'Failed to fetch claimed gigs' },
        { status: 500 }
      )
    }

    // Flatten the response
    const claimedGigs = gigs?.map(assignment => ({
      assignmentId: assignment.id,
      id: (assignment.gigs as { id: string }).id,
      title: (assignment.gigs as { title: string }).title,
      description: (assignment.gigs as { description: string }).description,
      stars: (assignment.gigs as { stars: number }).stars,
      tier: (assignment.gigs as { tier: number }).tier,
      estimatedMinutes: (assignment.gigs as { estimated_minutes: number }).estimated_minutes,
      claimedAt: assignment.claimed_at,
    })) || []

    return NextResponse.json({ gigs: claimedGigs })
  } catch (error) {
    console.error('Claimed gigs API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
