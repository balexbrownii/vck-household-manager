import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getGigWithRules, updateGigRules } from '@/lib/domain/ai-rules'

/**
 * GET /api/rules/gigs/[id]
 * Get a gig with its AI review rules
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()

    // Check authentication
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check role
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || !['parent', 'admin'].includes(profile.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const gig = await getGigWithRules(id)

    if (!gig) {
      return NextResponse.json({ error: 'Gig not found' }, { status: 404 })
    }

    return NextResponse.json({ gig })
  } catch (error) {
    console.error('Error fetching gig rules:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/rules/gigs/[id]
 * Update AI review rules for a gig
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()

    // Check authentication
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check role
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || !['parent', 'admin'].includes(profile.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { scope_description, completion_criteria, ai_review_enabled } = body

    const updatedGig = await updateGigRules(id, {
      scope_description,
      completion_criteria,
      ai_review_enabled,
    })

    if (!updatedGig) {
      return NextResponse.json(
        { error: 'Failed to update gig rules' },
        { status: 500 }
      )
    }

    return NextResponse.json({ gig: updatedGig })
  } catch (error) {
    console.error('Error updating gig rules:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
