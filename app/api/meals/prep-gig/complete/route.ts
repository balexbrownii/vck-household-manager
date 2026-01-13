import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { completeMealPrepSchema } from '@/lib/validations/meals'

// POST complete a meal prep gig and award stars
export async function POST(request: NextRequest) {
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

    const body = await request.json()

    // Validate input
    const parsed = completeMealPrepSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0].message },
        { status: 400 }
      )
    }

    const { mealPrepGigId, notes } = parsed.data

    // Get the gig
    const { data: gig, error: gigError } = await supabase
      .from('meal_prep_gigs')
      .select('*')
      .eq('id', mealPrepGigId)
      .single()

    if (gigError || !gig) {
      return NextResponse.json(
        { error: 'Meal prep gig not found' },
        { status: 404 }
      )
    }

    if (gig.status !== 'claimed') {
      return NextResponse.json(
        { error: 'This gig is not in claimed status' },
        { status: 400 }
      )
    }

    if (!gig.kid_id) {
      return NextResponse.json(
        { error: 'No kid assigned to this gig' },
        { status: 400 }
      )
    }

    // Update the gig to completed
    const { data: updatedGig, error: updateError } = await supabase
      .from('meal_prep_gigs')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        verified_by: user.id,
      })
      .eq('id', mealPrepGigId)
      .select()
      .single()

    if (updateError) {
      console.error('Database error:', updateError)
      return NextResponse.json(
        { error: 'Failed to complete meal prep gig' },
        { status: 500 }
      )
    }

    // Award stars to the kid
    // First, get current kid stars
    const { data: kid, error: kidError } = await supabase
      .from('kids')
      .select('total_stars')
      .eq('id', gig.kid_id)
      .single()

    if (kidError) {
      console.error('Error fetching kid:', kidError)
      // Continue anyway, gig is marked complete
    }

    const newStarBalance = (kid?.total_stars || 0) + gig.stars_offered

    // Update kid's star balance
    const { error: starsError } = await supabase
      .from('kids')
      .update({ total_stars: newStarBalance })
      .eq('id', gig.kid_id)

    if (starsError) {
      console.error('Error updating stars:', starsError)
    }

    // Record in star history
    const { error: historyError } = await supabase.from('star_history').insert({
      kid_id: gig.kid_id,
      stars_earned: gig.stars_offered,
      reason: `Meal prep: ${gig.prep_type}${notes ? ` - ${notes}` : ''}`,
      balance_after: newStarBalance,
    })

    if (historyError) {
      console.error('Error recording star history:', historyError)
    }

    return NextResponse.json({
      gig: updatedGig,
      starsAwarded: gig.stars_offered,
      newBalance: newStarBalance,
    })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
