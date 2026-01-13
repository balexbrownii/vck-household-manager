import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import TopNav from '@/components/nav/top-nav'
import { RecipeCard } from '@/components/meals'
import { RecipeWithCategory } from '@/types'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'

const CATEGORY_LABELS: Record<string, string> = {
  breakfast: 'Breakfast',
  lunch: 'Lunch',
  dinner: 'Dinner',
  snack: 'Snacks',
  dessert: 'Desserts',
  drink: 'Drinks',
}

const CATEGORY_ORDER = ['breakfast', 'lunch', 'dinner', 'snack', 'dessert', 'drink']

interface RecipesPageProps {
  searchParams: { category?: string }
}

export default async function RecipesPage({ searchParams }: RecipesPageProps) {
  const supabase = await createClient()

  // Check authentication
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Fetch all recipes with categories
  const { data: recipes } = await supabase
    .from('recipes')
    .select(`
      *,
      recipe_categories (*)
    `)
    .eq('active', true)
    .order('recipe_number')

  // Fetch categories
  const { data: categories } = await supabase
    .from('recipe_categories')
    .select('*')
    .order('sort_order')

  // Filter by category if specified
  const selectedCategory = searchParams.category
  const filteredRecipes = selectedCategory
    ? recipes?.filter((r) => r.recipe_categories?.name === selectedCategory)
    : recipes

  // Group recipes by category
  const groupedRecipes = ((recipes || []) as RecipeWithCategory[]).reduce(
    (acc, recipe) => {
      const categoryName = recipe.recipe_categories?.name || 'other'
      if (!acc[categoryName]) {
        acc[categoryName] = []
      }
      acc[categoryName].push(recipe)
      return acc
    },
    {} as Record<string, RecipeWithCategory[]>
  )

  return (
    <div className="min-h-screen bg-gray-50">
      <TopNav />
      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-4 mb-4">
            <Link
              href="/meals"
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronLeft className="w-5 h-5 text-gray-600" />
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">All Recipes</h1>
              <p className="text-gray-600 mt-1">
                {recipes?.length || 0} nutrient-optimized Brown Family Diet recipes
              </p>
            </div>
          </div>
        </div>

        {/* Category Filters */}
        <div className="flex flex-wrap gap-2 mb-6">
          <Link
            href="/meals/recipes"
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              !selectedCategory
                ? 'bg-blue-600 text-white'
                : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
            }`}
          >
            All ({recipes?.length || 0})
          </Link>
          {CATEGORY_ORDER.map((cat) => {
            const count = groupedRecipes[cat]?.length || 0
            if (count === 0) return null
            return (
              <Link
                key={cat}
                href={`/meals/recipes?category=${cat}`}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  selectedCategory === cat
                    ? 'bg-blue-600 text-white'
                    : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
                }`}
              >
                {CATEGORY_LABELS[cat]} ({count})
              </Link>
            )
          })}
        </div>

        {/* Recipe Grid or Grouped View */}
        {selectedCategory ? (
          // Single category view
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredRecipes?.map((recipe) => (
              <Link key={recipe.id} href={`/meals/recipes/${recipe.id}`}>
                <RecipeCard recipe={recipe} />
              </Link>
            ))}
          </div>
        ) : (
          // Grouped by category view
          <div className="space-y-8">
            {CATEGORY_ORDER.map((cat) => {
              const categoryRecipes = groupedRecipes[cat]
              if (!categoryRecipes || categoryRecipes.length === 0) return null
              return (
                <div key={cat}>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold text-gray-900">
                      {CATEGORY_LABELS[cat]}
                    </h2>
                    <Link
                      href={`/meals/recipes?category=${cat}`}
                      className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                    >
                      View all {categoryRecipes.length}
                    </Link>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {categoryRecipes.slice(0, 3).map((recipe) => (
                      <Link key={recipe.id} href={`/meals/recipes/${recipe.id}`}>
                        <RecipeCard recipe={recipe} />
                      </Link>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}
