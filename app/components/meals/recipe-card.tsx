'use client'

import { Recipe } from '@/types'
import { Clock, Zap, Leaf, Heart, Info } from 'lucide-react'

interface RecipeCardProps {
  recipe: Recipe
  onClick?: () => void
  compact?: boolean
}

export default function RecipeCard({ recipe, onClick, compact = false }: RecipeCardProps) {
  const hasAlexNotes = !!recipe.alex_modifications
  const hasAlexanderNotes = !!recipe.alexander_notes

  if (compact) {
    return (
      <div
        onClick={onClick}
        className={`p-3 rounded-lg border border-gray-200 bg-white hover:shadow-md transition-shadow ${
          onClick ? 'cursor-pointer' : ''
        }`}
      >
        <div className="flex items-center justify-between">
          <div className="font-medium text-gray-900 truncate">{recipe.title}</div>
          {(hasAlexNotes || hasAlexanderNotes) && (
            <Info className="w-4 h-4 text-amber-500 flex-shrink-0 ml-2" />
          )}
        </div>
        <div className="text-xs text-gray-500 mt-1 flex gap-3">
          {recipe.potassium_mg && (
            <span>{recipe.potassium_mg}mg K</span>
          )}
          {recipe.protein_g && (
            <span>{recipe.protein_g}g protein</span>
          )}
        </div>
      </div>
    )
  }

  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-lg border border-gray-200 p-4 shadow-sm hover:shadow-md transition-shadow ${
        onClick ? 'cursor-pointer' : ''
      }`}
    >
      {/* Header */}
      <div className="mb-3">
        <div className="flex items-start justify-between">
          <h3 className="font-bold text-gray-900">{recipe.title}</h3>
          {recipe.recipe_number && (
            <span className="text-xs text-gray-400 ml-2">#{recipe.recipe_number}</span>
          )}
        </div>
        {recipe.description && (
          <p className="text-sm text-gray-600 mt-1">{recipe.description}</p>
        )}
      </div>

      {/* Nutrients Grid */}
      <div className="grid grid-cols-2 gap-2 mb-3">
        {recipe.calories && (
          <div className="flex items-center gap-1.5 text-sm">
            <Zap className="w-4 h-4 text-amber-500" />
            <span className="text-gray-700">{recipe.calories} cal</span>
          </div>
        )}
        {recipe.protein_g && (
          <div className="flex items-center gap-1.5 text-sm">
            <Heart className="w-4 h-4 text-red-500" />
            <span className="text-gray-700">{recipe.protein_g}g protein</span>
          </div>
        )}
        {recipe.potassium_mg && (
          <div className="flex items-center gap-1.5 text-sm">
            <Leaf className="w-4 h-4 text-green-500" />
            <span className="text-gray-700">{recipe.potassium_mg}mg K</span>
          </div>
        )}
        {recipe.folate_mcg && (
          <div className="flex items-center gap-1.5 text-sm">
            <span className="w-4 h-4 text-center text-xs font-bold text-purple-500">F</span>
            <span className="text-gray-700">{recipe.folate_mcg}mcg folate</span>
          </div>
        )}
      </div>

      {/* Additional Nutrients */}
      <div className="flex flex-wrap gap-2 mb-3">
        {recipe.vitamin_c_mg && (
          <span className="px-2 py-0.5 bg-orange-100 text-orange-700 rounded text-xs">
            {recipe.vitamin_c_mg}mg Vit C
          </span>
        )}
        {recipe.b12_mcg && (
          <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs">
            {recipe.b12_mcg}mcg B12
          </span>
        )}
        {recipe.magnesium_mg && (
          <span className="px-2 py-0.5 bg-teal-100 text-teal-700 rounded text-xs">
            {recipe.magnesium_mg}mg Mg
          </span>
        )}
      </div>

      {/* Prep Time */}
      {recipe.estimated_minutes && (
        <div className="flex items-center gap-1.5 text-sm text-gray-500 mb-3">
          <Clock className="w-4 h-4" />
          <span>{recipe.estimated_minutes} min</span>
          <span className="mx-1">•</span>
          <span>{recipe.servings} servings</span>
        </div>
      )}

      {/* Family Notes */}
      {(hasAlexNotes || hasAlexanderNotes) && (
        <div className="border-t border-gray-100 pt-3 mt-3 space-y-1">
          {hasAlexNotes && (
            <div className="flex items-start gap-2 text-xs">
              <span className="px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded font-medium">Alex</span>
              <span className="text-gray-600">{recipe.alex_modifications}</span>
            </div>
          )}
          {hasAlexanderNotes && (
            <div className="flex items-start gap-2 text-xs">
              <span className="px-1.5 py-0.5 bg-purple-100 text-purple-700 rounded font-medium">Alexander</span>
              <span className="text-gray-600">{recipe.alexander_notes}</span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
