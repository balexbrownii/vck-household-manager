import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const kidId = searchParams.get('kidId')
    const limit = parseInt(searchParams.get('limit') || '50')
    const includeAll = searchParams.get('includeAll') === 'true'

    if (!kidId) {
      return NextResponse.json(
        { error: 'kidId is required' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Build query
    let query = supabase
      .from('star_history')
      .select('id, stars_earned, reason, balance_after, created_at')
      .eq('kid_id', kidId)
      .order('created_at', { ascending: false })
      .limit(limit)

    // By default only show positive entries (for kid-facing views)
    // Use includeAll=true for admin views that need deductions too
    if (!includeAll) {
      query = query.gt('stars_earned', 0)
    }

    const { data: entries, error } = await query

    if (error) {
      console.error('Error fetching star history:', error)
      return NextResponse.json(
        { error: 'Failed to fetch star history' },
        { status: 500 }
      )
    }

    // Map to expected format for kid view
    const formattedEntries = entries?.map(e => ({
      id: e.id,
      stars: e.stars_earned,
      reason: e.reason,
      balance_after: e.balance_after,
      created_at: e.created_at,
    })) || []

    // Also return raw history format for admin view
    const history = entries?.map(e => ({
      id: e.id,
      stars_earned: e.stars_earned,
      reason: e.reason,
      balance_after: e.balance_after,
      created_at: e.created_at,
    })) || []

    return NextResponse.json({ entries: formattedEntries, history })
  } catch (error) {
    console.error('Star history API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
