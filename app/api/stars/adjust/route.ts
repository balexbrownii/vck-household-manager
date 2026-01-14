import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Check authentication - only parents can adjust stars
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { kidId, stars, reason } = await request.json()

    if (!kidId || stars === undefined || !reason) {
      return NextResponse.json(
        { error: 'Missing required fields: kidId, stars, reason' },
        { status: 400 }
      )
    }

    if (typeof stars !== 'number' || stars === 0) {
      return NextResponse.json(
        { error: 'Stars must be a non-zero number' },
        { status: 400 }
      )
    }

    // Get current kid data
    const { data: kid, error: kidError } = await supabase
      .from('kids')
      .select('name, total_stars')
      .eq('id', kidId)
      .single()

    if (kidError || !kid) {
      return NextResponse.json({ error: 'Kid not found' }, { status: 404 })
    }

    // Calculate new balance (don't allow negative total)
    const newTotal = Math.max(0, kid.total_stars + stars)

    // Create adjustment record
    const { data: adjustment, error: adjustError } = await supabase
      .from('star_adjustments')
      .insert({
        kid_id: kidId,
        stars,
        reason,
        adjusted_by: user.id,
      })
      .select()
      .single()

    if (adjustError) {
      console.error('Adjustment insert error:', adjustError)
      return NextResponse.json({ error: 'Failed to record adjustment' }, { status: 500 })
    }

    // Update kid's total stars
    const { error: updateError } = await supabase
      .from('kids')
      .update({ total_stars: newTotal, updated_at: new Date().toISOString() })
      .eq('id', kidId)

    if (updateError) {
      console.error('Kid update error:', updateError)
      return NextResponse.json({ error: 'Failed to update stars' }, { status: 500 })
    }

    // Also record in star_history for consistency
    await supabase.from('star_history').insert({
      kid_id: kidId,
      claimed_gig_id: null, // No gig associated
      stars_earned: stars,
      reason: `Manual adjustment: ${reason}`,
      balance_after: newTotal,
    })

    // Log activity
    const actionType = stars > 0 ? 'star_added' : 'star_deducted'
    const message = stars > 0
      ? `Added ${stars} stars to ${kid.name}: ${reason}`
      : `Deducted ${Math.abs(stars)} stars from ${kid.name}: ${reason}`

    await supabase.from('activity_feed').insert({
      kid_id: kidId,
      actor_type: 'parent',
      actor_id: user.id,
      action: actionType,
      entity_type: 'stars',
      entity_id: adjustment.id,
      message,
    })

    return NextResponse.json({
      adjustment,
      newTotal,
      previousTotal: kid.total_stars,
    })
  } catch (error) {
    console.error('Star adjust error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// GET: Fetch adjustment history
export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url)
    const kidId = searchParams.get('kidId')
    const limit = parseInt(searchParams.get('limit') || '20')

    let query = supabase
      .from('star_adjustments')
      .select('*, kids(name)')
      .order('created_at', { ascending: false })
      .limit(limit)

    if (kidId) {
      query = query.eq('kid_id', kidId)
    }

    const { data, error } = await query

    if (error) {
      console.error('Adjustments fetch error:', error)
      return NextResponse.json({ error: 'Failed to fetch adjustments' }, { status: 500 })
    }

    return NextResponse.json({ adjustments: data })
  } catch (error) {
    console.error('Star adjustments GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
