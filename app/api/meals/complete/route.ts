import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { completeMealSchema } from '@/lib/validations/meals'

// POST mark a meal as completed
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
    const parsed = completeMealSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0].message },
        { status: 400 }
      )
    }

    const { mealPlanEntryId, rating, notes } = parsed.data

    // Verify meal plan entry exists
    const { data: entry, error: entryError } = await supabase
      .from('meal_plan_entries')
      .select('id')
      .eq('id', mealPlanEntryId)
      .single()

    if (entryError || !entry) {
      return NextResponse.json(
        { error: 'Meal plan entry not found' },
        { status: 404 }
      )
    }

    // Check if already completed
    const { data: existing } = await supabase
      .from('meal_completions')
      .select('id')
      .eq('meal_plan_entry_id', mealPlanEntryId)
      .single()

    if (existing) {
      return NextResponse.json(
        { error: 'Meal already marked as completed' },
        { status: 409 }
      )
    }

    // Create completion record
    const { data, error } = await supabase
      .from('meal_completions')
      .insert({
        meal_plan_entry_id: mealPlanEntryId,
        served_by: user.id,
        rating: rating || null,
        notes: notes || null,
      })
      .select()
      .single()

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { error: 'Failed to mark meal as completed' },
        { status: 500 }
      )
    }

    return NextResponse.json(data, { status: 201 })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
