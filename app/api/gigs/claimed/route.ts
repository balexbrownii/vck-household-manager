import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

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

    // Get gigs claimed by this kid that are not yet completed
    const { data: claimedGigs, error } = await supabase
      .from('claimed_gigs')
      .select(`
        id,
        claimed_at,
        inspection_status,
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
      .is('completed_at', null)
      .order('claimed_at', { ascending: false })

    if (error) {
      console.error('Error fetching claimed gigs:', error)
      return NextResponse.json(
        { error: 'Failed to fetch claimed gigs' },
        { status: 500 }
      )
    }

    // Define gig type for clarity
    interface ClaimedGigData {
      id: string
      title: string
      description: string
      stars: number
      tier: number
      estimated_minutes: number
    }

    // Flatten the response
    const gigs = claimedGigs?.map(claim => {
      const gigData = claim.gigs as unknown as ClaimedGigData | null
      if (!gigData) return null
      return {
        claimId: claim.id,
        id: gigData.id,
        title: gigData.title,
        description: gigData.description,
        stars: gigData.stars,
        tier: gigData.tier,
        estimatedMinutes: gigData.estimated_minutes,
        claimedAt: claim.claimed_at,
        inspectionStatus: claim.inspection_status,
      }
    }).filter(Boolean) || []

    return NextResponse.json({ gigs })
  } catch (error) {
    console.error('Claimed gigs API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
