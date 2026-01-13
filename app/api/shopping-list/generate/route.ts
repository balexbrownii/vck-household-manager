import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateShoppingListSchema } from '@/lib/validations/meals'
import { getWeekDates, aggregateIngredients } from '@/lib/domain/meal-planning'
import { MealPlanEntryWithRecipe } from '@/types'

// POST generate shopping list from meal plan
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
    const parsed = generateShoppingListSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0].message },
        { status: 400 }
      )
    }

    const { weekStartDate } = parsed.data

    // Get all dates in the week
    const weekDates = getWeekDates(weekStartDate)

    // Fetch meal plan entries for the week with recipes
    const { data: mealPlan, error: mealPlanError } = await supabase
      .from('meal_plan_entries')
      .select(`
        *,
        recipes (*)
      `)
      .in('planned_date', weekDates)

    if (mealPlanError) {
      console.error('Database error:', mealPlanError)
      return NextResponse.json(
        { error: 'Failed to fetch meal plan' },
        { status: 500 }
      )
    }

    if (!mealPlan || mealPlan.length === 0) {
      return NextResponse.json(
        { error: 'No meals planned for this week' },
        { status: 400 }
      )
    }

    // Aggregate ingredients
    const aggregatedIngredients = aggregateIngredients(mealPlan as MealPlanEntryWithRecipe[])

    // Delete existing shopping list for this week
    await supabase
      .from('shopping_list_items')
      .delete()
      .eq('week_start_date', weekStartDate)

    // Insert new shopping list items
    const shoppingItems = aggregatedIngredients.map((ing) => ({
      week_start_date: weekStartDate,
      ingredient_name: ing.name,
      quantity: ing.totalQuantity.toString(),
      unit: ing.unit,
      category: ing.category,
      source_recipe_ids: ing.recipeIds,
      purchased: false,
    }))

    const { data, error } = await supabase
      .from('shopping_list_items')
      .insert(shoppingItems)
      .select()

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { error: 'Failed to generate shopping list' },
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

// GET shopping list for a week
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

    const { data, error } = await supabase
      .from('shopping_list_items')
      .select('*')
      .eq('week_start_date', weekStartDate)
      .order('category')
      .order('ingredient_name')

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch shopping list' },
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
