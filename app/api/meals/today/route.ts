import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'

export async function GET() {
  try {
    const supabase = await createClient()

    // Try parent auth first
    const {
      data: { user },
    } = await supabase.auth.getUser()

    // If no parent auth, try kid session
    if (!user) {
      const cookieStore = await cookies()
      const sessionToken = cookieStore.get('kid_session')?.value

      if (!sessionToken) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }

      // Verify kid session
      const { data: session, error: sessionError } = await supabase
        .from('kid_sessions')
        .select('kid_id, expires_at')
        .eq('session_token', sessionToken)
        .single()

      if (sessionError || !session) {
        return NextResponse.json({ error: 'Invalid session' }, { status: 401 })
      }

      if (new Date(session.expires_at) < new Date()) {
        return NextResponse.json({ error: 'Session expired' }, { status: 401 })
      }
    }

    // Get today's date in YYYY-MM-DD format
    const today = new Date().toISOString().split('T')[0]

    // Fetch today's meal plan entries with recipe titles
    const { data: meals, error } = await supabase
      .from('meal_plan_entries')
      .select(`
        id,
        meal_type,
        recipe_id,
        recipes (
          id,
          title
        )
      `)
      .eq('planned_date', today)
      .order('meal_type', { ascending: true })

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch today\'s meals' },
        { status: 500 }
      )
    }

    // Transform the data to a simpler format
    interface RecipeData {
      id: string
      title: string
    }

    const formattedMeals = (meals || []).map(meal => {
      // Supabase returns the joined recipe as an object (not array) for single FK
      const recipe = meal.recipes as unknown as RecipeData | null
      return {
        id: meal.id,
        meal_type: meal.meal_type,
        recipe_id: meal.recipe_id,
        recipe_title: recipe?.title || 'Unknown',
      }
    })

    return NextResponse.json({ meals: formattedMeals })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
