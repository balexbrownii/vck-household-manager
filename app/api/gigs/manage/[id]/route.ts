import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// PATCH: Update gig
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { id } = await params

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

    const updateData: Record<string, unknown> = {}

    if (title !== undefined) updateData.title = title
    if (description !== undefined) updateData.description = description
    if (tier !== undefined) updateData.tier = tier
    if (stars !== undefined) updateData.stars = stars
    if (estimated_minutes !== undefined) updateData.estimated_minutes = estimated_minutes
    if (checklist !== undefined) updateData.checklist = checklist
    if (active !== undefined) updateData.active = active
    if (scope_description !== undefined) updateData.scope_description = scope_description || null
    if (completion_criteria !== undefined) updateData.completion_criteria = completion_criteria || null
    if (ai_review_enabled !== undefined) updateData.ai_review_enabled = ai_review_enabled

    const { data: gig, error } = await supabase
      .from('gigs')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Gig update error:', error)
      return NextResponse.json({ error: 'Failed to update gig' }, { status: 500 })
    }

    // Log activity
    await supabase.from('activity_feed').insert({
      kid_id: null,
      actor_type: 'parent',
      actor_id: user.id,
      action: 'gig_updated',
      entity_type: 'gig',
      entity_id: id,
      message: `Updated gig: ${gig.title}`,
    })

    return NextResponse.json({ gig })
  } catch (error) {
    console.error('Gig PATCH error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE: Delete gig
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { id } = await params

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get gig title for logging
    const { data: gig } = await supabase
      .from('gigs')
      .select('title')
      .eq('id', id)
      .single()

    // Check if gig has active claims
    const { count: activeClaims } = await supabase
      .from('claimed_gigs')
      .select('id', { count: 'exact' })
      .eq('gig_id', id)
      .is('inspection_status', null)

    if (activeClaims && activeClaims > 0) {
      return NextResponse.json(
        { error: 'Cannot delete gig with active claims' },
        { status: 400 }
      )
    }

    const { error } = await supabase
      .from('gigs')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Gig delete error:', error)
      return NextResponse.json({ error: 'Failed to delete gig' }, { status: 500 })
    }

    // Log activity
    await supabase.from('activity_feed').insert({
      kid_id: null,
      actor_type: 'parent',
      actor_id: user.id,
      action: 'gig_deleted',
      entity_type: 'gig',
      entity_id: id,
      message: `Deleted gig: ${gig?.title || 'Unknown'}`,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Gig DELETE error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
