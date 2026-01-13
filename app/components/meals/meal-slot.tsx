'use client'

import { MealPlanEntryWithRecipe } from '@/types'
import { Plus, AlertTriangle } from 'lucide-react'

interface MealSlotProps {
  entry?: MealPlanEntryWithRecipe
  onClick: () => void
  onRemove?: () => void
}

export default function MealSlot({ entry, onClick, onRemove }: MealSlotProps) {
  if (!entry) {
    return (
      <button
        onClick={onClick}
        className="w-full h-20 border-2 border-dashed border-gray-200 rounded-lg flex items-center justify-center text-gray-400 hover:border-blue-300 hover:text-blue-500 hover:bg-blue-50 transition-all"
      >
        <Plus className="w-5 h-5" />
      </button>
    )
  }

  const recipe = entry.recipes
  const hasWarning = !!recipe.alex_modifications || !!recipe.alexander_notes

  return (
    <div
      className="w-full h-20 bg-white border border-gray-200 rounded-lg p-2 cursor-pointer hover:shadow-md transition-shadow relative group"
      onClick={onClick}
    >
      <div className="flex items-start justify-between h-full">
        <div className="flex-1 min-w-0">
          <div className="font-medium text-sm text-gray-900 truncate">
            {recipe.title}
          </div>
          <div className="text-xs text-gray-500 mt-1">
            {recipe.potassium_mg && `${recipe.potassium_mg}mg K`}
            {recipe.protein_g && ` • ${recipe.protein_g}g`}
          </div>
          {recipe.estimated_minutes && (
            <div className="text-xs text-gray-400 mt-0.5">
              {recipe.estimated_minutes} min
            </div>
          )}
        </div>
        {hasWarning && (
          <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0" />
        )}
      </div>

      {/* Remove button - shows on hover */}
      {onRemove && (
        <button
          onClick={(e) => {
            e.stopPropagation()
            onRemove()
          }}
          className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
        >
          ×
        </button>
      )}
    </div>
  )
}
