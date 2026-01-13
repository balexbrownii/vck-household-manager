'use client'

import { useState } from 'react'
import { MealPlanEntryWithRecipe } from '@/types'
import { Plus, Info, X } from 'lucide-react'

interface MealSlotProps {
  entry?: MealPlanEntryWithRecipe
  onClick: () => void
  onRemove?: () => void
}

export default function MealSlot({ entry, onClick, onRemove }: MealSlotProps) {
  const [showNotes, setShowNotes] = useState(false)

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
  const hasAlexMods = !!recipe.alex_modifications
  const hasAlexanderNotes = !!recipe.alexander_notes
  const hasNotes = hasAlexMods || hasAlexanderNotes

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
        {hasNotes && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              setShowNotes(!showNotes)
            }}
            className="flex-shrink-0 p-1 -m-1 rounded hover:bg-blue-100"
          >
            <Info className="w-4 h-4 text-blue-500" />
          </button>
        )}
      </div>

      {/* Notes popup - shown on tap */}
      {showNotes && (
        <div
          className="absolute right-0 top-full mt-1 z-20 w-56 p-3 bg-white border border-gray-200 rounded-lg shadow-lg text-xs"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex justify-between items-center mb-2">
            <span className="font-medium text-gray-900">Family Notes</span>
            <button
              onClick={() => setShowNotes(false)}
              className="p-1 hover:bg-gray-100 rounded"
            >
              <X className="w-3 h-3 text-gray-500" />
            </button>
          </div>
          {hasAlexMods && (
            <div className="text-gray-700 mb-1">
              <span className="font-medium">Alex:</span> {recipe.alex_modifications}
            </div>
          )}
          {hasAlexanderNotes && (
            <div className="text-gray-700">
              <span className="font-medium">Alexander:</span> {recipe.alexander_notes}
            </div>
          )}
        </div>
      )}

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
