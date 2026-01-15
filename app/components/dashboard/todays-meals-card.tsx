'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Utensils, Coffee, Sun, Moon, ChevronRight, Trash2, Plus } from 'lucide-react'
import { toast } from '@/lib/toast'
import { MealPlanEntryWithRecipe } from '@/types'
import QuickAddMeal from './quick-add-meal'

interface AdhocMeal {
  id: string
  meal_type: string
  description: string
  calories: number | null
  protein_g: number | null
}

interface TodaysMealsCardProps {
  meals: MealPlanEntryWithRecipe[]
  adhocMeals?: AdhocMeal[]
  onRefresh?: () => void
}

export default function TodaysMealsCard({ meals, adhocMeals = [], onRefresh }: TodaysMealsCardProps) {
  const router = useRouter()
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const handleDeleteAdhocMeal = async (id: string) => {
    setDeletingId(id)
    try {
      const res = await fetch(`/api/meals/adhoc?mealId=${id}`, {
        method: 'DELETE',
      })
      if (res.ok) {
        if (onRefresh) onRefresh()
        router.refresh()
      } else {
        toast.error('Failed to delete meal')
      }
    } catch {
      toast.error('Failed to delete meal')
    } finally {
      setDeletingId(null)
    }
  }

  const getMealIcon = (mealType: string) => {
    switch (mealType) {
      case 'breakfast':
        return <Coffee className="w-4 h-4" />
      case 'lunch':
        return <Sun className="w-4 h-4" />
      case 'dinner':
        return <Moon className="w-4 h-4" />
      case 'snack':
        return <Utensils className="w-4 h-4" />
      default:
        return <Utensils className="w-4 h-4" />
    }
  }

  const getMealLabel = (mealType: string) => {
    switch (mealType) {
      case 'breakfast':
        return 'Breakfast'
      case 'lunch':
        return 'Lunch'
      case 'dinner':
        return 'Dinner'
      case 'snack':
        return 'Snack'
      case 'dessert':
        return 'Dessert'
      case 'drink':
        return 'Drink'
      default:
        return mealType
    }
  }

  const mealOrder = ['breakfast', 'lunch', 'snack', 'dinner', 'dessert', 'drink']
  const sortedMeals = [...meals].sort(
    (a, b) => mealOrder.indexOf(a.meal_type) - mealOrder.indexOf(b.meal_type)
  )

  // Group by meal type for display
  const mealsByType = sortedMeals.reduce((acc, meal) => {
    if (!acc[meal.meal_type]) {
      acc[meal.meal_type] = []
    }
    acc[meal.meal_type].push(meal)
    return acc
  }, {} as Record<string, MealPlanEntryWithRecipe[]>)

  return (
    <div className="bg-white border-2 border-gray-100 rounded-2xl p-4 mb-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Utensils className="w-5 h-5 text-orange-600" />
          <h2 className="font-bold text-gray-900">Today&apos;s Meals</h2>
        </div>
        <div className="flex items-center gap-2">
          <QuickAddMeal onMealAdded={onRefresh} />
          <Link
            href="/meals"
            className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
          >
            Plan <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {meals.length === 0 && adhocMeals.length === 0 ? (
        <div className="text-center py-6">
          <Utensils className="w-8 h-8 text-gray-300 mx-auto mb-2" />
          <p className="text-gray-500 text-sm mb-3">No meals planned for today</p>
          <Link
            href="/meals/plan"
            className="inline-flex items-center gap-1 px-3 py-2 bg-orange-100 text-orange-700 rounded-lg text-sm font-medium hover:bg-orange-200 transition-colors"
          >
            <Plus className="w-4 h-4" /> Add Meals
          </Link>
        </div>
      ) : (
        <div className="space-y-2">
          {/* Planned meals from recipes */}
          {Object.entries(mealsByType).map(([mealType, typeMeals]) => (
            <div
              key={mealType}
              className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 flex-shrink-0">
                {getMealIcon(mealType)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                  {getMealLabel(mealType)}
                </div>
                <div className="font-medium text-gray-900 truncate">
                  {typeMeals.map((m) => m.recipes?.title || 'Unknown').join(', ')}
                </div>
              </div>
            </div>
          ))}

          {/* Ad-hoc meals */}
          {adhocMeals.map((meal) => (
            <div
              key={meal.id}
              className="relative group flex items-center gap-3 p-2 rounded-lg bg-orange-50/50 hover:bg-orange-50 transition-colors"
            >
              <div className="w-8 h-8 rounded-full bg-orange-200 flex items-center justify-center text-orange-700 flex-shrink-0">
                {getMealIcon(meal.meal_type)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-medium text-orange-600 uppercase tracking-wide flex items-center gap-1">
                  {getMealLabel(meal.meal_type)}
                  <span className="text-orange-400 text-[10px] normal-case">(quick)</span>
                </div>
                <div className="font-medium text-gray-900 truncate">
                  {meal.description}
                </div>
                {meal.calories && (
                  <div className="text-xs text-gray-500">
                    {meal.calories} cal • {meal.protein_g || 0}g protein
                  </div>
                )}
              </div>
              {/* Delete button - shows on hover */}
              <button
                onClick={() => handleDeleteAdhocMeal(meal.id)}
                disabled={deletingId === meal.id}
                className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 disabled:opacity-50"
                title="Delete meal"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
