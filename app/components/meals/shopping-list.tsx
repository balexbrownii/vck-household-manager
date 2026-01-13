'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ShoppingListItem } from '@/types'
import { Check, RefreshCw, ShoppingCart } from 'lucide-react'

interface ShoppingListProps {
  items: ShoppingListItem[]
  weekStartDate: string
}

// Category display order and labels
const CATEGORY_ORDER = [
  'produce',
  'protein',
  'dairy',
  'grains',
  'canned',
  'frozen',
  'condiments',
  'other',
] as const

const CATEGORY_LABELS: Record<string, string> = {
  produce: 'Produce',
  protein: 'Meat & Protein',
  dairy: 'Dairy & Eggs',
  grains: 'Grains & Bread',
  canned: 'Canned & Jarred',
  frozen: 'Frozen',
  condiments: 'Condiments & Spices',
  other: 'Other',
}

export default function ShoppingList({ items, weekStartDate }: ShoppingListProps) {
  const router = useRouter()
  const [loading, setLoading] = useState<string | null>(null)
  const [regenerating, setRegenerating] = useState(false)

  // Group items by category
  const groupedItems = items.reduce(
    (acc, item) => {
      const category = item.category || 'other'
      if (!acc[category]) {
        acc[category] = []
      }
      acc[category].push(item)
      return acc
    },
    {} as Record<string, ShoppingListItem[]>
  )

  const handleToggle = async (itemId: string, purchased: boolean) => {
    setLoading(itemId)
    try {
      const response = await fetch('/api/shopping-list/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemId, purchased }),
      })

      if (response.ok) {
        router.refresh()
      }
    } finally {
      setLoading(null)
    }
  }

  const handleRegenerate = async () => {
    setRegenerating(true)
    try {
      const response = await fetch('/api/shopping-list/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ weekStartDate }),
      })

      if (response.ok) {
        router.refresh()
      }
    } finally {
      setRegenerating(false)
    }
  }

  const purchasedCount = items.filter((i) => i.purchased).length
  const totalCount = items.length
  const progress = totalCount > 0 ? (purchasedCount / totalCount) * 100 : 0

  if (items.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
        <ShoppingCart className="w-12 h-12 text-gray-300 mx-auto mb-4" />
        <h3 className="font-bold text-gray-900 mb-2">No Shopping List</h3>
        <p className="text-gray-500 mb-4">
          Generate a shopping list from your meal plan for this week.
        </p>
        <button
          onClick={handleRegenerate}
          disabled={regenerating}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {regenerating ? (
            <RefreshCw className="w-4 h-4 animate-spin" />
          ) : (
            <ShoppingCart className="w-4 h-4" />
          )}
          Generate List
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Progress Header */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="font-bold text-gray-900">Shopping Progress</h3>
            <p className="text-sm text-gray-500">
              {purchasedCount} of {totalCount} items purchased
            </p>
          </div>
          <button
            onClick={handleRegenerate}
            disabled={regenerating}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
            title="Regenerate list"
          >
            <RefreshCw className={`w-5 h-5 ${regenerating ? 'animate-spin' : ''}`} />
          </button>
        </div>
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-green-500 rounded-full transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Grouped Items */}
      {CATEGORY_ORDER.map((category) => {
        const categoryItems = groupedItems[category]
        if (!categoryItems || categoryItems.length === 0) return null

        return (
          <div key={category} className="bg-white rounded-lg border border-gray-200">
            <div className="px-4 py-3 border-b border-gray-100">
              <h4 className="font-semibold text-gray-700">
                {CATEGORY_LABELS[category] || category}
              </h4>
            </div>
            <ul className="divide-y divide-gray-100">
              {categoryItems.map((item) => (
                <li key={item.id} className="flex items-center gap-3 px-4 py-3">
                  <button
                    onClick={() => handleToggle(item.id, !item.purchased)}
                    disabled={loading === item.id}
                    className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                      item.purchased
                        ? 'bg-green-500 border-green-500 text-white'
                        : 'border-gray-300 hover:border-green-400'
                    }`}
                  >
                    {item.purchased && <Check className="w-4 h-4" />}
                  </button>
                  <div className="flex-1 min-w-0">
                    <div
                      className={`font-medium ${
                        item.purchased ? 'text-gray-400 line-through' : 'text-gray-900'
                      }`}
                    >
                      {item.ingredient_name}
                    </div>
                    {item.quantity && (
                      <div className="text-sm text-gray-500">
                        {item.quantity} {item.unit}
                      </div>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )
      })}
    </div>
  )
}
