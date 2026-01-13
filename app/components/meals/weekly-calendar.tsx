'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { MealPlanEntryWithRecipe, Recipe, MealType } from '@/types'
import MealSlot from './meal-slot'
import RecipeCard from './recipe-card'
import { X } from 'lucide-react'
import { parseDateLocal, formatDateLocal } from '@/lib/domain/meal-planning'

interface WeeklyCalendarProps {
  weekStartDate: string
  mealPlan: MealPlanEntryWithRecipe[]
  recipes: Recipe[]
}

const MEAL_TYPES: MealType[] = ['breakfast', 'lunch', 'dinner', 'snack']
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export default function WeeklyCalendar({
  weekStartDate,
  mealPlan,
  recipes,
}: WeeklyCalendarProps) {
  const router = useRouter()
  const [selectedSlot, setSelectedSlot] = useState<{
    date: string
    mealType: MealType
  } | null>(null)
  const [loading, setLoading] = useState(false)

  // Build 7-day array from weekStartDate (using local date parsing)
  const startDate = parseDateLocal(weekStartDate)
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(startDate)
    date.setDate(startDate.getDate() + i)
    return formatDateLocal(date)
  })

  // Build lookup map for meal plan
  const mealGrid = new Map<string, MealPlanEntryWithRecipe>()
  mealPlan.forEach((entry) => {
    mealGrid.set(`${entry.planned_date}-${entry.meal_type}`, entry)
  })

  const handleAddMeal = async (recipeId: string) => {
    if (!selectedSlot) return

    setLoading(true)
    try {
      const response = await fetch('/api/meals/plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipeId,
          plannedDate: selectedSlot.date,
          mealType: selectedSlot.mealType,
          servingsPlanned: 4,
        }),
      })

      if (response.ok) {
        router.refresh()
        setSelectedSlot(null)
      }
    } finally {
      setLoading(false)
    }
  }

  const handleRemoveMeal = async (entryId: string) => {
    setLoading(true)
    try {
      const response = await fetch('/api/meals/plan', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mealPlanEntryId: entryId }),
      })

      if (response.ok) {
        router.refresh()
      }
    } finally {
      setLoading(false)
    }
  }

  // Filter recipes by selected meal type
  const filteredRecipes = selectedSlot
    ? recipes.filter((r) => {
        // Map meal types to recipe categories
        const categoryMap: Record<MealType, string[]> = {
          breakfast: ['breakfast'],
          lunch: ['lunch'],
          dinner: ['dinner'],
          snack: ['snack', 'dessert'],
          dessert: ['dessert'],
          drink: ['drink'],
        }
        // For now, show all recipes but could filter by category
        return true
      })
    : []

  return (
    <div className="relative">
      {/* Calendar Grid */}
      <div className="overflow-x-auto">
        <div className="grid grid-cols-8 gap-2 min-w-[800px]">
          {/* Header row - empty corner + days */}
          <div className="p-2"></div>
          {weekDays.map((date, i) => {
            const d = parseDateLocal(date)
            const todayStr = formatDateLocal(new Date())
            const isToday = date === todayStr
            return (
              <div
                key={date}
                className={`text-center p-2 rounded-lg ${
                  isToday ? 'bg-blue-100' : 'bg-gray-100'
                }`}
              >
                <div className="text-sm text-gray-500">{DAYS[d.getDay()]}</div>
                <div
                  className={`text-lg font-bold ${
                    isToday ? 'text-blue-600' : 'text-gray-900'
                  }`}
                >
                  {d.getDate()}
                </div>
              </div>
            )
          })}

          {/* Meal rows */}
          {MEAL_TYPES.map((mealType) => (
            <>
              <div
                key={`label-${mealType}`}
                className="p-2 font-semibold capitalize text-gray-700 flex items-center"
              >
                {mealType}
              </div>
              {weekDays.map((date) => {
                const entry = mealGrid.get(`${date}-${mealType}`)
                return (
                  <MealSlot
                    key={`${date}-${mealType}`}
                    entry={entry}
                    onClick={() => {
                      if (entry) {
                        // Open recipe detail modal
                        setSelectedSlot({ date, mealType })
                      } else {
                        setSelectedSlot({ date, mealType })
                      }
                    }}
                    onRemove={entry ? () => handleRemoveMeal(entry.id) : undefined}
                  />
                )
              })}
            </>
          ))}
        </div>
      </div>

      {/* Recipe Picker Modal */}
      {selectedSlot && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedSlot(null)}
        >
          <div
            className="bg-white rounded-xl shadow-xl max-w-3xl w-full max-h-[80vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b">
              <div>
                <h2 className="text-lg font-bold text-gray-900">
                  Select Recipe
                </h2>
                <p className="text-sm text-gray-500">
                  {DAYS[parseDateLocal(selectedSlot.date).getDay()]}{' '}
                  {parseDateLocal(selectedSlot.date).toLocaleDateString()} -{' '}
                  <span className="capitalize">{selectedSlot.mealType}</span>
                </p>
              </div>
              <button
                onClick={() => setSelectedSlot(null)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Recipe List */}
            <div className="p-4 overflow-y-auto max-h-[60vh]">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {recipes.map((recipe) => (
                  <RecipeCard
                    key={recipe.id}
                    recipe={recipe}
                    onClick={() => handleAddMeal(recipe.id)}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Loading Overlay */}
      {loading && (
        <div className="absolute inset-0 bg-white/50 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      )}
    </div>
  )
}
