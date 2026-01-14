import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { calculateNutrition } from '@/lib/ai/nutrition-calculator'

// GET: Fetch ad-hoc meals for a date
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)

    const date = searchParams.get('date') || new Date().toISOString().split('T')[0]
    const mealType = searchParams.get('mealType')

    // Check authentication
    const { data: { user } } = await supabase.auth.getUser()

    // Build query
    let query = supabase
      .from('adhoc_meals')
      .select('*')
      .eq('planned_date', date)
      .order('meal_type')
      .order('created_at')

    if (mealType) {
      query = query.eq('meal_type', mealType)
    }

    const { data, error } = await query

    if (error) {
      console.error('Adhoc meals fetch error:', error)
      return NextResponse.json({ error: 'Failed to fetch ad-hoc meals' }, { status: 500 })
    }

    return NextResponse.json({ meals: data })
  } catch (error) {
    console.error('Adhoc meals GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST: Create ad-hoc meal with AI nutrition calculation
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Check authentication - parent only
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized - parents only' }, { status: 401 })
    }

    const body = await request.json()
    const { description, mealType, date, servings, skipAI } = body

    if (!description || !mealType) {
      return NextResponse.json(
        { error: 'Missing required fields: description, mealType' },
        { status: 400 }
      )
    }

    // Validate meal type
    const validMealTypes = ['breakfast', 'lunch', 'dinner', 'snack', 'dessert', 'drink']
    if (!validMealTypes.includes(mealType)) {
      return NextResponse.json(
        { error: 'Invalid meal type' },
        { status: 400 }
      )
    }

    // Calculate nutrition using AI (unless skipped)
    let nutritionData = {
      components: [] as Array<{ name: string; amount: string; unit: string }>,
      calories: null as number | null,
      protein_g: null as number | null,
      potassium_mg: null as number | null,
      folate_mcg: null as number | null,
      b12_mcg: null as number | null,
      vitamin_c_mg: null as number | null,
      magnesium_mg: null as number | null,
      fiber_g: null as number | null,
      ai_confidence: null as number | null,
      ai_notes: null as string | null,
    }

    if (!skipAI) {
      try {
        const result = await calculateNutrition(description, servings || 1)
        nutritionData = {
          components: result.components,
          calories: result.calories,
          protein_g: result.protein_g,
          potassium_mg: result.potassium_mg,
          folate_mcg: result.folate_mcg,
          b12_mcg: result.b12_mcg,
          vitamin_c_mg: result.vitamin_c_mg,
          magnesium_mg: result.magnesium_mg,
          fiber_g: result.fiber_g,
          ai_confidence: result.confidence,
          ai_notes: result.notes,
        }
      } catch (aiError) {
        console.error('AI nutrition calculation failed:', aiError)
        // Continue without nutrition data - it can be added later
      }
    }

    // Create the ad-hoc meal
    const { data, error } = await supabase
      .from('adhoc_meals')
      .insert({
        planned_date: date || new Date().toISOString().split('T')[0],
        meal_type: mealType,
        description,
        servings: servings || 1,
        created_by: user.id,
        ...nutritionData,
      })
      .select()
      .single()

    if (error) {
      console.error('Adhoc meal create error:', error)
      return NextResponse.json({ error: 'Failed to create ad-hoc meal' }, { status: 500 })
    }

    // Log activity
    await supabase.from('activity_feed').insert({
      kid_id: null, // No specific kid for meal logging
      actor_type: 'parent',
      actor_id: user.id,
      action: 'adhoc_meal_added',
      entity_type: 'meal',
      entity_id: data.id,
      message: `Added ${mealType}: ${description.substring(0, 50)}${description.length > 50 ? '...' : ''}`
    })

    return NextResponse.json({ meal: data })
  } catch (error) {
    console.error('Adhoc meals POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PATCH: Update ad-hoc meal (mark completed, edit nutrition)
export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Check authentication - parent only
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized - parents only' }, { status: 401 })
    }

    const body = await request.json()
    const { mealId, completed, description, calories, protein_g, notes } = body

    if (!mealId) {
      return NextResponse.json({ error: 'Missing mealId' }, { status: 400 })
    }

    const updateData: Record<string, unknown> = {}

    if (completed !== undefined) {
      updateData.completed = completed
      updateData.completed_at = completed ? new Date().toISOString() : null
    }
    if (description !== undefined) updateData.description = description
    if (calories !== undefined) updateData.calories = calories
    if (protein_g !== undefined) updateData.protein_g = protein_g
    if (notes !== undefined) updateData.notes = notes

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'No updates specified' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('adhoc_meals')
      .update(updateData)
      .eq('id', mealId)
      .select()
      .single()

    if (error) {
      console.error('Adhoc meal update error:', error)
      return NextResponse.json({ error: 'Failed to update ad-hoc meal' }, { status: 500 })
    }

    return NextResponse.json({ meal: data })
  } catch (error) {
    console.error('Adhoc meals PATCH error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE: Remove ad-hoc meal
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Check authentication - parent only
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized - parents only' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const mealId = searchParams.get('mealId')

    if (!mealId) {
      return NextResponse.json({ error: 'Missing mealId' }, { status: 400 })
    }

    const { error } = await supabase
      .from('adhoc_meals')
      .delete()
      .eq('id', mealId)

    if (error) {
      console.error('Adhoc meal delete error:', error)
      return NextResponse.json({ error: 'Failed to delete ad-hoc meal' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Adhoc meals DELETE error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
