import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET: List all gigs (for admin)
export async function GET() {
  try {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: gigs, error } = await supabase
      .from('gigs')
      .select('*')
      .order('tier', { ascending: true })
      .order('stars', { ascending: true })

    if (error) {
      console.error('Gigs fetch error:', error)
      return NextResponse.json({ error: 'Failed to fetch gigs' }, { status: 500 })
    }

    return NextResponse.json({ gigs })
  } catch (error) {
    console.error('Gigs GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST: Create new gig
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      title,
      description,
      tier,
      stars,
      estimated_minutes,
      checklist,
      active,
      scope_description,
      completion_criteria,
      ai_review_enabled,
    } = body

    if (!title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 })
    }

    const { data: gig, error } = await supabase
      .from('gigs')
      .insert({
        title,
        description: description || '',
        tier: tier || 1,
        stars: stars || 5,
        estimated_minutes: estimated_minutes || null,
        checklist: checklist || [],
        active: active !== false,
        scope_description: scope_description || null,
        completion_criteria: completion_criteria || null,
        ai_review_enabled: ai_review_enabled || false,
      })
      .select()
      .single()

    if (error) {
      console.error('Gig create error:', error)
      return NextResponse.json({ error: 'Failed to create gig' }, { status: 500 })
    }

    // Log activity
    await supabase.from('activity_feed').insert({
      kid_id: null,
      actor_type: 'parent',
      actor_id: user.id,
      action: 'gig_created',
      entity_type: 'gig',
      entity_id: gig.id,
      message: `Created new gig: ${title}`,
    })

    return NextResponse.json({ gig })
  } catch (error) {
    console.error('Gigs POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
