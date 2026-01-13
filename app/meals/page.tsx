import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import TopNav from '@/components/nav/top-nav'
import { WeeklyCalendar, NutrientSummary } from '@/components/meals'
import { getWeekStartDate } from '@/lib/domain/meal-planning'
import { MealPlanEntryWithRecipe } from '@/types'
import { ChevronLeft, ChevronRight, ShoppingCart } from 'lucide-react'
import Link from 'next/link'

interface MealsPageProps {
  searchParams: { week?: string }
}

export default async function MealsPage({ searchParams }: MealsPageProps) {
  const supabase = await createClient()

  // Check authentication
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Calculate week dates
  const today = new Date()
  const weekParam = searchParams.week
  const weekStartDate = weekParam || getWeekStartDate(today)

  // Calculate previous and next week
  const currentWeekStart = new Date(weekStartDate)
  const prevWeekStart = new Date(currentWeekStart)
  prevWeekStart.setDate(prevWeekStart.getDate() - 7)
  const nextWeekStart = new Date(currentWeekStart)
  nextWeekStart.setDate(nextWeekStart.getDate() + 7)

  const prevWeek = prevWeekStart.toISOString().split('T')[0]
  const nextWeek = nextWeekStart.toISOString().split('T')[0]
  const thisWeek = getWeekStartDate(today)

  // Build week dates array
  const weekDates: string[] = []
  for (let i = 0; i < 7; i++) {
    const d = new Date(weekStartDate)
    d.setDate(d.getDate() + i)
    weekDates.push(d.toISOString().split('T')[0])
  }

  // Fetch meal plan for the week
  const { data: mealPlan } = await supabase
    .from('meal_plan_entries')
    .select(`
      *,
      recipes (*)
    `)
    .in('planned_date', weekDates)
    .order('planned_date')

  // Fetch all recipes for the picker
  const { data: recipes } = await supabase
    .from('recipes')
    .select('*')
    .eq('active', true)
    .order('recipe_number')

  // Calculate daily nutrients for today
  const todayDate = today.toISOString().split('T')[0]
  const todayMeals = (mealPlan || []).filter(
    (m) => m.planned_date === todayDate
  ) as MealPlanEntryWithRecipe[]

  const todayNutrients = todayMeals.reduce(
    (totals, meal) => {
      const recipe = meal.recipes
      const multiplier = meal.servings_planned / recipe.servings
      return {
        calories: totals.calories + (recipe.calories || 0) * multiplier,
        protein_g: totals.protein_g + (recipe.protein_g || 0) * multiplier,
        potassium_mg: totals.potassium_mg + (recipe.potassium_mg || 0) * multiplier,
        folate_mcg: totals.folate_mcg + (recipe.folate_mcg || 0) * multiplier,
        b12_mcg: totals.b12_mcg + (recipe.b12_mcg || 0) * multiplier,
        vitamin_c_mg: totals.vitamin_c_mg + (recipe.vitamin_c_mg || 0) * multiplier,
      }
    },
    {
      calories: 0,
      protein_g: 0,
      potassium_mg: 0,
      folate_mcg: 0,
      b12_mcg: 0,
      vitamin_c_mg: 0,
    }
  )

  // Format week range for display
  const weekEndDate = new Date(weekStartDate)
  weekEndDate.setDate(weekEndDate.getDate() + 6)
  const formatDate = (d: Date) =>
    d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  const weekLabel = `${formatDate(new Date(weekStartDate))} - ${formatDate(weekEndDate)}`

  return (
    <div className="min-h-screen bg-gray-50">
      <TopNav />
      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Meal Planning</h1>
              <p className="text-gray-600 mt-1">
                Brown Family Diet - Nutrient-first meal planning
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Link
                href={`/meals/shopping?week=${weekStartDate}`}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors"
              >
                <ShoppingCart className="w-4 h-4" />
                <span className="hidden sm:inline">Shopping List</span>
              </Link>
              <Link
                href="/meals/recipes"
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors"
              >
                All Recipes
              </Link>
            </div>
          </div>
        </div>

        {/* Week Navigation */}
        <div className="flex items-center justify-between mb-6 bg-white rounded-lg border border-gray-200 p-3">
          <Link
            href={`/meals?week=${prevWeek}`}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-gray-600" />
          </Link>
          <div className="flex items-center gap-3">
            <span className="font-semibold text-gray-900">{weekLabel}</span>
            {weekStartDate !== thisWeek && (
              <Link
                href="/meals"
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                Today
              </Link>
            )}
          </div>
          <Link
            href={`/meals?week=${nextWeek}`}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ChevronRight className="w-5 h-5 text-gray-600" />
          </Link>
        </div>

        {/* Today's Nutrients (if viewing current week) */}
        {weekDates.includes(todayDate) && todayMeals.length > 0 && (
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">
              Today's Nutrients
            </h2>
            <NutrientSummary totals={todayNutrients} />
          </div>
        )}

        {/* Weekly Calendar */}
        <WeeklyCalendar
          weekStartDate={weekStartDate}
          mealPlan={(mealPlan || []) as MealPlanEntryWithRecipe[]}
          recipes={recipes || []}
        />

        {/* Quick Stats */}
        <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg border border-gray-200 p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">
              {mealPlan?.length || 0}
            </div>
            <div className="text-sm text-gray-500">Meals Planned</div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4 text-center">
            <div className="text-2xl font-bold text-green-600">
              {new Set(mealPlan?.map((m) => m.recipe_id)).size || 0}
            </div>
            <div className="text-sm text-gray-500">Unique Recipes</div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4 text-center">
            <div className="text-2xl font-bold text-purple-600">
              {recipes?.length || 0}
            </div>
            <div className="text-sm text-gray-500">Total Recipes</div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4 text-center">
            <div className="text-2xl font-bold text-amber-600">
              {7 - (mealPlan?.filter((m) => m.meal_type === 'dinner').length || 0)}
            </div>
            <div className="text-sm text-gray-500">Dinners to Plan</div>
          </div>
        </div>
      </main>
    </div>
  )
}
