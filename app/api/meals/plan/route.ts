import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { addMealPlanSchema, deleteMealPlanSchema } from '@/lib/validations/meals'
import { getWeekDates } from '@/lib/domain/meal-planning'

// GET meal plan for a week
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

    // Get week start date from query params
    const { searchParams } = new URL(request.url)
    const weekStartDate = searchParams.get('weekStartDate')

    if (!weekStartDate) {
      return NextResponse.json(
        { error: 'Missing weekStartDate parameter' },
        { status: 400 }
      )
    }

    // Get all dates in the week
    const weekDates = getWeekDates(weekStartDate)

    // Fetch meal plan entries for the week with recipes
    const { data, error } = await supabase
      .from('meal_plan_entries')
      .select(`
        *,
        recipes (
          id,
          title,
          category_id,
          description,
          recipe_number,
          calories,
          protein_g,
          potassium_mg,
          folate_mcg,
          b12_mcg,
          vitamin_c_mg,
          magnesium_mg,
          estimated_minutes,
          servings,
          ingredients,
          instructions,
          alex_modifications,
          alexander_notes,
          victoria_notes
        )
      `)
      .in('planned_date', weekDates)
      .order('planned_date', { ascending: true })

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch meal plan' },
        { status: 500 }
      )
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST add a meal to the plan
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
    const parsed = addMealPlanSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0].message },
        { status: 400 }
      )
    }

    const { recipeId, plannedDate, mealType, servingsPlanned, notes } = parsed.data

    // Verify recipe exists
    const { data: recipe, error: recipeError } = await supabase
      .from('recipes')
      .select('id')
      .eq('id', recipeId)
      .single()

    if (recipeError || !recipe) {
      return NextResponse.json(
        { error: 'Recipe not found' },
        { status: 404 }
      )
    }

    // Upsert the meal plan entry (replace if slot already filled)
    const { data, error } = await supabase
      .from('meal_plan_entries')
      .upsert(
        {
          recipe_id: recipeId,
          planned_date: plannedDate,
          meal_type: mealType,
          servings_planned: servingsPlanned || 4,
          notes: notes || null,
          created_by: user.id,
        },
        {
          onConflict: 'planned_date,meal_type',
        }
      )
      .select(`
        *,
        recipes (*)
      `)
      .single()

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { error: 'Failed to add meal to plan' },
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

// DELETE remove a meal from the plan
export async function DELETE(request: NextRequest) {
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
    const parsed = deleteMealPlanSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0].message },
        { status: 400 }
      )
    }

    const { mealPlanEntryId } = parsed.data

    const { error } = await supabase
      .from('meal_plan_entries')
      .delete()
      .eq('id', mealPlanEntryId)

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { error: 'Failed to remove meal from plan' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
