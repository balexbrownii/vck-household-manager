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

    // Get star history for this kid
    const { data: entries, error } = await supabase
      .from('star_ledger')
      .select('id, stars, reason, source_type, created_at')
      .eq('kid_id', kidId)
      .gt('stars', 0) // Only show positive entries (earned stars)
      .order('created_at', { ascending: false })
      .limit(50)

    if (error) {
      console.error('Error fetching star history:', error)
      return NextResponse.json(
        { error: 'Failed to fetch star history' },
        { status: 500 }
      )
    }

    return NextResponse.json({ entries: entries || [] })
  } catch (error) {
    console.error('Star history API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
