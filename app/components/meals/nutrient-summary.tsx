'use client'

import { NUTRIENT_TARGETS } from '@/types'
import { Leaf, Heart, Zap } from 'lucide-react'

interface NutrientTotals {
  potassium_mg: number
  folate_mcg: number
  b12_mcg: number
  protein_g: number
  vitamin_c_mg: number
  calories: number
}

interface NutrientSummaryProps {
  totals: NutrientTotals
  compact?: boolean
}

interface NutrientBarProps {
  label: string
  value: number
  target: number
  unit: string
  color: string
  icon?: React.ReactNode
}

function NutrientBar({ label, value, target, unit, color, icon }: NutrientBarProps) {
  const percentage = Math.min((value / target) * 100, 100)
  const isComplete = value >= target

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-1.5">
          {icon}
          <span className="text-gray-700">{label}</span>
        </div>
        <span className={`font-medium ${isComplete ? 'text-green-600' : 'text-gray-500'}`}>
          {Math.round(value)}{unit} / {target}{unit}
        </span>
      </div>
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${color}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  )
}

export default function NutrientSummary({ totals, compact = false }: NutrientSummaryProps) {
  const nutrients = [
    {
      label: 'Potassium',
      value: totals.potassium_mg,
      target: NUTRIENT_TARGETS.potassium_mg,
      unit: 'mg',
      color: 'bg-green-500',
      icon: <Leaf className="w-4 h-4 text-green-500" />,
    },
    {
      label: 'Folate',
      value: totals.folate_mcg,
      target: NUTRIENT_TARGETS.folate_mcg,
      unit: 'mcg',
      color: 'bg-purple-500',
      icon: <span className="w-4 h-4 text-center text-xs font-bold text-purple-500">F</span>,
    },
    {
      label: 'B12',
      value: totals.b12_mcg,
      target: NUTRIENT_TARGETS.b12_mcg,
      unit: 'mcg',
      color: 'bg-blue-500',
      icon: <span className="w-4 h-4 text-center text-xs font-bold text-blue-500">B</span>,
    },
    {
      label: 'Protein',
      value: totals.protein_g,
      target: NUTRIENT_TARGETS.protein_g,
      unit: 'g',
      color: 'bg-red-500',
      icon: <Heart className="w-4 h-4 text-red-500" />,
    },
    {
      label: 'Vitamin C',
      value: totals.vitamin_c_mg,
      target: NUTRIENT_TARGETS.vitamin_c_mg,
      unit: 'mg',
      color: 'bg-orange-500',
      icon: <span className="w-4 h-4 text-center text-xs font-bold text-orange-500">C</span>,
    },
  ]

  if (compact) {
    return (
      <div className="grid grid-cols-5 gap-2">
        {nutrients.map((n) => {
          const percentage = Math.min((n.value / n.target) * 100, 100)
          const isComplete = n.value >= n.target
          return (
            <div
              key={n.label}
              className={`text-center p-2 rounded-lg ${
                isComplete ? 'bg-green-50' : 'bg-gray-50'
              }`}
            >
              <div className="flex justify-center mb-1">{n.icon}</div>
              <div className={`text-xs font-medium ${isComplete ? 'text-green-600' : 'text-gray-600'}`}>
                {Math.round(percentage)}%
              </div>
            </div>
          )
        })}
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-gray-900">Daily Nutrients</h3>
        <div className="flex items-center gap-1.5 text-sm text-gray-500">
          <Zap className="w-4 h-4 text-amber-500" />
          <span>{Math.round(totals.calories)} cal</span>
        </div>
      </div>
      <div className="space-y-3">
        {nutrients.map((n) => (
          <NutrientBar key={n.label} {...n} />
        ))}
      </div>
    </div>
  )
}
