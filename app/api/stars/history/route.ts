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

    // Get star history for this kid (using correct table name: star_history)
    const { data: entries, error } = await supabase
      .from('star_history')
      .select('id, stars_earned, reason, balance_after, created_at')
      .eq('kid_id', kidId)
      .gt('stars_earned', 0) // Only show positive entries (earned stars)
      .order('created_at', { ascending: false })
      .limit(50)

    if (error) {
      console.error('Error fetching star history:', error)
      return NextResponse.json(
        { error: 'Failed to fetch star history' },
        { status: 500 }
      )
    }

    // Map to expected format
    const formattedEntries = entries?.map(e => ({
      id: e.id,
      stars: e.stars_earned,
      reason: e.reason,
      balance_after: e.balance_after,
      created_at: e.created_at,
    })) || []

    return NextResponse.json({ entries: formattedEntries })
  } catch (error) {
    console.error('Star history API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
