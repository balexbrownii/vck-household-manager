import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/app/lib/supabase/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()

    const { data: gig, error } = await supabase
      .from('gigs')
      .select(`
        id,
        title,
        description,
        instructions,
        tier,
        stars,
        estimated_minutes,
        category,
        status,
        claimed_by
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

    return NextResponse.json({ gig })
  } catch (error) {
    console.error('Gig API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
