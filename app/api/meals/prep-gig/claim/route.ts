import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { claimMealPrepSchema } from '@/lib/validations/meals'
import { calculateMealPrepStars } from '@/lib/domain/meal-planning'
import { PrepType } from '@/types'

// POST claim a meal prep gig
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
    const parsed = claimMealPrepSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0].message },
        { status: 400 }
      )
    }

    const { mealPlanEntryId, kidId, prepType } = parsed.data

    // Check if this prep type is already claimed for this meal
    const { data: existingGig } = await supabase
      .from('meal_prep_gigs')
      .select('*')
      .eq('meal_plan_entry_id', mealPlanEntryId)
      .eq('prep_type', prepType)
      .single()

    if (existingGig && existingGig.status !== 'available') {
      return NextResponse.json(
        { error: 'This prep gig has already been claimed' },
        { status: 400 }
      )
    }

    // Calculate stars for this prep type
    const starsOffered = calculateMealPrepStars(prepType as PrepType)

    // Create or update the gig
    if (existingGig) {
      // Update existing gig
      const { data, error } = await supabase
        .from('meal_prep_gigs')
        .update({
          kid_id: kidId,
          status: 'claimed',
        })
        .eq('id', existingGig.id)
        .select()
        .single()

      if (error) {
        console.error('Database error:', error)
        return NextResponse.json(
          { error: 'Failed to claim meal prep gig' },
          { status: 500 }
        )
      }

      return NextResponse.json(data)
    } else {
      // Create new gig
      const { data, error } = await supabase
        .from('meal_prep_gigs')
        .insert({
          meal_plan_entry_id: mealPlanEntryId,
          kid_id: kidId,
          prep_type: prepType,
          stars_offered: starsOffered,
          status: 'claimed',
        })
        .select()
        .single()

      if (error) {
        console.error('Database error:', error)
        return NextResponse.json(
          { error: 'Failed to create meal prep gig' },
          { status: 500 }
        )
      }

      return NextResponse.json(data, { status: 201 })
    }
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
