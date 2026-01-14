import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const recipe = await request.json()

    if (!recipe.title || !recipe.ingredients || !recipe.instructions) {
      return NextResponse.json(
        { error: 'Title, ingredients, and instructions are required' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Check authentication
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get the category ID
    const { data: category } = await supabase
      .from('recipe_categories')
      .select('id')
      .eq('name', recipe.category || 'dinner')
      .single()

    // Get the next recipe number
    const { data: maxRecipe } = await supabase
      .from('recipes')
      .select('recipe_number')
      .order('recipe_number', { ascending: false })
      .limit(1)
      .single()

    const nextRecipeNumber = (maxRecipe?.recipe_number || 0) + 1

    // Insert the recipe
    const { data: newRecipe, error } = await supabase
      .from('recipes')
      .insert({
        title: recipe.title,
        description: recipe.description || null,
        category_id: category?.id || null,
        recipe_number: nextRecipeNumber,
        estimated_minutes: recipe.estimated_minutes || null,
        servings: recipe.servings || 4,
        calories: recipe.calories || null,
        protein_g: recipe.protein_g || null,
        potassium_mg: recipe.potassium_mg || null,
        folate_mcg: recipe.folate_mcg || null,
        b12_mcg: recipe.b12_mcg || null,
        vitamin_c_mg: recipe.vitamin_c_mg || null,
        magnesium_mg: recipe.magnesium_mg || null,
        ingredients: recipe.ingredients,
        instructions: recipe.instructions,
        active: true,
      })
      .select()
      .single()

    if (error) {
      console.error('Error adding recipe:', error)
      return NextResponse.json(
        { error: 'Failed to add recipe' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, recipe: newRecipe })
  } catch (error) {
    console.error('Error in add recipe:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
