'use client'

import { useState } from 'react'
import { Plus, X, Utensils, Loader2, Sparkles, Check } from 'lucide-react'
import { toast } from '@/lib/toast'

interface QuickAddMealProps {
  onMealAdded?: () => void
}

const mealTypes = [
  { value: 'breakfast', label: 'Breakfast', emoji: '🌅' },
  { value: 'lunch', label: 'Lunch', emoji: '☀️' },
  { value: 'dinner', label: 'Dinner', emoji: '🌙' },
  { value: 'snack', label: 'Snack', emoji: '🍎' },
  { value: 'dessert', label: 'Dessert', emoji: '🍰' },
  { value: 'drink', label: 'Drink', emoji: '🥤' },
]

export default function QuickAddMeal({ onMealAdded }: QuickAddMealProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [description, setDescription] = useState('')
  const [mealType, setMealType] = useState('dinner')
  const [servings, setServings] = useState(4)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [nutritionPreview, setNutritionPreview] = useState<{
    calories: number
    protein: number
    confidence: number
  } | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!description.trim()) return

    setSaving(true)
    try {
      const res = await fetch('/api/meals/adhoc', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          description: description.trim(),
          mealType,
          servings,
        })
      })

      if (res.ok) {
        const data = await res.json()
        setNutritionPreview({
          calories: data.meal.calories || 0,
          protein: data.meal.protein_g || 0,
          confidence: data.meal.ai_confidence || 0,
        })
        setSuccess(true)
        setTimeout(() => {
          setSuccess(false)
          setIsOpen(false)
          setDescription('')
          setNutritionPreview(null)
          onMealAdded?.()
        }, 2500)
      } else {
        toast.error('Failed to add meal')
      }
    } catch {
      toast.error('Failed to add meal')
    } finally {
      setSaving(false)
    }
  }

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center gap-1 px-3 py-1.5 text-sm text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
      >
        <Plus className="w-4 h-4" />
        Quick Add
      </button>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <Utensils className="w-5 h-5 text-orange-500" />
            {success ? 'Meal Added!' : 'Quick Add Meal'}
          </h3>
          <button
            onClick={() => setIsOpen(false)}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        {success ? (
          <div className="p-6 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="w-8 h-8 text-green-600" />
            </div>
            <p className="text-gray-900 font-medium mb-2">Meal added to today&apos;s plan!</p>
            {nutritionPreview && nutritionPreview.calories > 0 && (
              <div className="bg-orange-50 rounded-xl p-4 mt-4">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Sparkles className="w-4 h-4 text-orange-500" />
                  <span className="text-sm font-medium text-orange-700">AI Nutrition Estimate</span>
                </div>
                <div className="flex justify-center gap-6 text-sm">
                  <div>
                    <span className="font-bold text-gray-900">{nutritionPreview.calories}</span>
                    <span className="text-gray-500 ml-1">cal</span>
                  </div>
                  <div>
                    <span className="font-bold text-gray-900">{nutritionPreview.protein}g</span>
                    <span className="text-gray-500 ml-1">protein</span>
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  {Math.round(nutritionPreview.confidence * 100)}% confidence
                </p>
              </div>
            )}
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-4 space-y-4">
            {/* Meal Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Meal Type
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {mealTypes.map((type) => (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() => setMealType(type.value)}
                    className={`p-2 rounded-lg border text-sm font-medium transition-colors ${
                      mealType === type.value
                        ? 'border-orange-500 bg-orange-50 text-orange-700'
                        : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <span className="mr-1">{type.emoji}</span>
                    {type.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Describe the meal
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g., grilled chicken breast, steamed broccoli, mashed potatoes, garden salad"
                required
                autoFocus
                rows={3}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none"
              />
              <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                AI will calculate nutrition automatically
              </p>
            </div>

            {/* Servings */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Servings
              </label>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setServings(Math.max(1, servings - 1))}
                  className="w-10 h-10 rounded-lg border border-gray-300 flex items-center justify-center hover:bg-gray-50"
                >
                  -
                </button>
                <span className="text-xl font-bold text-gray-900 w-12 text-center">
                  {servings}
                </span>
                <button
                  type="button"
                  onClick={() => setServings(servings + 1)}
                  className="w-10 h-10 rounded-lg border border-gray-300 flex items-center justify-center hover:bg-gray-50"
                >
                  +
                </button>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="flex-1 py-3 bg-gray-100 text-gray-700 font-semibold rounded-xl hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!description.trim() || saving}
                className="flex-1 py-3 bg-orange-600 text-white font-semibold rounded-xl hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Calculating...
                  </>
                ) : (
                  <>
                    <Plus className="w-5 h-5" />
                    Add Meal
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
