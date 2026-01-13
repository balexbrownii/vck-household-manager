import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import TopNav from '@/components/nav/top-nav'
import { NutrientSummary } from '@/components/meals'
import Link from 'next/link'
import { ChevronLeft, Clock, Users, AlertTriangle } from 'lucide-react'

interface RecipeDetailPageProps {
  params: { recipeId: string }
}

export default async function RecipeDetailPage({ params }: RecipeDetailPageProps) {
  const supabase = await createClient()

  // Check authentication
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Fetch recipe
  const { data: recipe, error } = await supabase
    .from('recipes')
    .select(`
      *,
      recipe_categories (*)
    `)
    .eq('id', params.recipeId)
    .single()

  if (error || !recipe) {
    notFound()
  }

  const hasAlexNotes = !!recipe.alex_modifications
  const hasAlexanderNotes = !!recipe.alexander_notes
  const hasVictoriaNotes = !!recipe.victoria_notes
  const hasFamilyNotes = hasAlexNotes || hasAlexanderNotes || hasVictoriaNotes

  // Calculate nutrient totals for display
  const nutrients = {
    calories: recipe.calories || 0,
    protein_g: recipe.protein_g || 0,
    potassium_mg: recipe.potassium_mg || 0,
    folate_mcg: recipe.folate_mcg || 0,
    b12_mcg: recipe.b12_mcg || 0,
    vitamin_c_mg: recipe.vitamin_c_mg || 0,
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <TopNav />
      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Back Link */}
        <Link
          href="/meals/recipes"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
        >
          <ChevronLeft className="w-4 h-4" />
          Back to Recipes
        </Link>

        {/* Recipe Header */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden mb-6">
          <div className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded capitalize">
                    {recipe.recipe_categories?.name}
                  </span>
                  {recipe.recipe_number && (
                    <span className="text-sm text-gray-400">
                      #{recipe.recipe_number}
                    </span>
                  )}
                </div>
                <h1 className="text-2xl font-bold text-gray-900">{recipe.title}</h1>
                {recipe.description && (
                  <p className="text-gray-600 mt-2">{recipe.description}</p>
                )}
              </div>
              {hasFamilyNotes && (
                <AlertTriangle className="w-6 h-6 text-amber-500 flex-shrink-0" />
              )}
            </div>

            {/* Quick Info */}
            <div className="flex flex-wrap gap-4 text-sm text-gray-600">
              {recipe.estimated_minutes && (
                <div className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4" />
                  <span>{recipe.estimated_minutes} min</span>
                </div>
              )}
              <div className="flex items-center gap-1.5">
                <Users className="w-4 h-4" />
                <span>{recipe.servings} servings</span>
              </div>
            </div>
          </div>

          {/* Family Notes */}
          {hasFamilyNotes && (
            <div className="border-t border-gray-100 bg-amber-50 p-4">
              <h3 className="font-semibold text-amber-800 mb-2 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                Family Notes
              </h3>
              <div className="space-y-2">
                {hasAlexNotes && (
                  <div className="flex items-start gap-2 text-sm">
                    <span className="px-2 py-0.5 bg-amber-200 text-amber-800 rounded font-medium flex-shrink-0">
                      Alex
                    </span>
                    <span className="text-amber-900">{recipe.alex_modifications}</span>
                  </div>
                )}
                {hasAlexanderNotes && (
                  <div className="flex items-start gap-2 text-sm">
                    <span className="px-2 py-0.5 bg-purple-200 text-purple-800 rounded font-medium flex-shrink-0">
                      Alexander
                    </span>
                    <span className="text-purple-900">{recipe.alexander_notes}</span>
                  </div>
                )}
                {hasVictoriaNotes && (
                  <div className="flex items-start gap-2 text-sm">
                    <span className="px-2 py-0.5 bg-pink-200 text-pink-800 rounded font-medium flex-shrink-0">
                      Victoria
                    </span>
                    <span className="text-pink-900">{recipe.victoria_notes}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Nutrients */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">
            Nutrients (per serving)
          </h2>
          <NutrientSummary totals={nutrients} />
        </div>

        {/* Two Column Layout for Ingredients and Instructions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Ingredients */}
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
            <div className="bg-gray-50 px-4 py-3 border-b border-gray-100">
              <h2 className="font-semibold text-gray-900">Ingredients</h2>
            </div>
            <ul className="divide-y divide-gray-100">
              {recipe.ingredients.map((ing: { item: string; amount: string; unit: string; note?: string; potassium_mg?: number; folate_mcg?: number; b12_mcg?: number; vitamin_c_mg?: number }, idx: number) => (
                <li key={idx} className="px-4 py-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="font-medium text-gray-900">{ing.item}</span>
                      {ing.note && (
                        <span className="text-gray-500 text-sm ml-1">
                          ({ing.note})
                        </span>
                      )}
                    </div>
                    <span className="text-gray-600 text-sm">
                      {ing.amount} {ing.unit}
                    </span>
                  </div>
                  {/* Per-ingredient nutrients if available */}
                  {(ing.potassium_mg || ing.folate_mcg || ing.b12_mcg || ing.vitamin_c_mg) && (
                    <div className="flex flex-wrap gap-2 mt-1">
                      {ing.potassium_mg && (
                        <span className="text-xs text-green-600">
                          {ing.potassium_mg}mg K
                        </span>
                      )}
                      {ing.folate_mcg && (
                        <span className="text-xs text-purple-600">
                          {ing.folate_mcg}mcg folate
                        </span>
                      )}
                      {ing.b12_mcg && (
                        <span className="text-xs text-blue-600">
                          {ing.b12_mcg}mcg B12
                        </span>
                      )}
                      {ing.vitamin_c_mg && (
                        <span className="text-xs text-orange-600">
                          {ing.vitamin_c_mg}mg Vit C
                        </span>
                      )}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </div>

          {/* Instructions */}
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
            <div className="bg-gray-50 px-4 py-3 border-b border-gray-100">
              <h2 className="font-semibold text-gray-900">Instructions</h2>
            </div>
            <ol className="divide-y divide-gray-100">
              {recipe.instructions.map((step: string, idx: number) => (
                <li key={idx} className="px-4 py-3 flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium">
                    {idx + 1}
                  </span>
                  <span className="text-gray-700">{step}</span>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </main>
    </div>
  )
}
