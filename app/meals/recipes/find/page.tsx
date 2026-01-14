'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import TopNav from '@/components/nav/top-nav'
import Link from 'next/link'
import { ChevronLeft, Send, Plus, Check, Clock, Users, Loader2, Sparkles } from 'lucide-react'

interface Ingredient {
  item: string
  amount: string
  unit: string
  note?: string
}

interface Recipe {
  title: string
  description?: string
  category: string
  estimated_minutes?: number
  servings: number
  calories?: number
  protein_g?: number
  potassium_mg?: number
  folate_mcg?: number
  b12_mcg?: number
  vitamin_c_mg?: number
  magnesium_mg?: number
  ingredients: Ingredient[]
  instructions: string[]
}

interface Message {
  role: 'user' | 'assistant'
  content: string
  recipes?: Recipe[]
}

export default function FindRecipesPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: "Hi! I can help you find recipes. Tell me what you're looking for - a type of cuisine, specific ingredients, dietary needs, or just describe what sounds good!",
      recipes: [],
    },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [addingRecipe, setAddingRecipe] = useState<string | null>(null)
  const [addedRecipes, setAddedRecipes] = useState<Set<string>>(new Set())
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = async () => {
    if (!input.trim() || loading) return

    const userMessage = input.trim()
    setInput('')
    setMessages((prev) => [...prev, { role: 'user', content: userMessage }])
    setLoading(true)

    try {
      // Build conversation history (excluding recipes for the API)
      const conversationHistory = messages.map((m) => ({
        role: m.role,
        content: m.content,
      }))

      const response = await fetch('/api/recipes/ai-find', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage,
          conversationHistory,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to get response')
      }

      const data = await response.json()

      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: data.message || 'Here are some recipes I found:',
          recipes: data.recipes || [],
        },
      ])
    } catch (error) {
      console.error('Error:', error)
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: "Sorry, I had trouble finding recipes. Please try again.",
          recipes: [],
        },
      ])
    } finally {
      setLoading(false)
    }
  }

  const handleAddRecipe = async (recipe: Recipe) => {
    setAddingRecipe(recipe.title)

    try {
      const response = await fetch('/api/recipes/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(recipe),
      })

      if (!response.ok) {
        throw new Error('Failed to add recipe')
      }

      setAddedRecipes((prev) => new Set(Array.from(prev).concat(recipe.title)))
    } catch (error) {
      console.error('Error adding recipe:', error)
      alert('Failed to add recipe. Please try again.')
    } finally {
      setAddingRecipe(null)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <TopNav />

      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="max-w-4xl mx-auto flex items-center gap-4">
          <Link
            href="/meals/recipes"
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-gray-600" />
          </Link>
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-500" />
            <h1 className="text-lg font-bold text-gray-900">Find Recipes</h1>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="max-w-4xl mx-auto space-y-6">
          {messages.map((message, idx) => (
            <div key={idx}>
              {/* Message bubble */}
              <div
                className={`flex ${
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                    message.role === 'user'
                      ? 'bg-blue-600 text-white'
                      : 'bg-white border border-gray-200 text-gray-900'
                  }`}
                >
                  {message.content}
                </div>
              </div>

              {/* Recipe cards */}
              {message.recipes && message.recipes.length > 0 && (
                <div className="mt-4 space-y-4">
                  {message.recipes.map((recipe, recipeIdx) => (
                    <div
                      key={recipeIdx}
                      className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden"
                    >
                      {/* Recipe header */}
                      <div className="p-4 border-b border-gray-100">
                        <div className="flex items-start justify-between">
                          <div>
                            <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-semibold rounded capitalize">
                              {recipe.category}
                            </span>
                            <h3 className="font-bold text-gray-900 mt-1">
                              {recipe.title}
                            </h3>
                            {recipe.description && (
                              <p className="text-sm text-gray-600 mt-1">
                                {recipe.description}
                              </p>
                            )}
                          </div>
                          <button
                            onClick={() => handleAddRecipe(recipe)}
                            disabled={
                              addingRecipe === recipe.title ||
                              addedRecipes.has(recipe.title)
                            }
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                              addedRecipes.has(recipe.title)
                                ? 'bg-green-100 text-green-700'
                                : 'bg-purple-600 text-white hover:bg-purple-700'
                            } disabled:opacity-50`}
                          >
                            {addingRecipe === recipe.title ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : addedRecipes.has(recipe.title) ? (
                              <Check className="w-4 h-4" />
                            ) : (
                              <Plus className="w-4 h-4" />
                            )}
                            {addedRecipes.has(recipe.title) ? 'Added' : 'Add'}
                          </button>
                        </div>

                        {/* Quick stats */}
                        <div className="flex flex-wrap gap-3 mt-3 text-sm text-gray-600">
                          {recipe.estimated_minutes && (
                            <div className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              <span>{recipe.estimated_minutes} min</span>
                            </div>
                          )}
                          <div className="flex items-center gap-1">
                            <Users className="w-4 h-4" />
                            <span>{recipe.servings} servings</span>
                          </div>
                        </div>
                      </div>

                      {/* Nutrients */}
                      <div className="px-4 py-3 bg-gray-50 flex flex-wrap gap-3 text-xs">
                        {recipe.calories && (
                          <span className="px-2 py-1 bg-amber-100 text-amber-700 rounded">
                            {recipe.calories} cal
                          </span>
                        )}
                        {recipe.protein_g && (
                          <span className="px-2 py-1 bg-red-100 text-red-700 rounded">
                            {recipe.protein_g}g protein
                          </span>
                        )}
                        {recipe.potassium_mg && (
                          <span className="px-2 py-1 bg-green-100 text-green-700 rounded">
                            {recipe.potassium_mg}mg K
                          </span>
                        )}
                        {recipe.folate_mcg && (
                          <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded">
                            {recipe.folate_mcg}mcg folate
                          </span>
                        )}
                        {recipe.b12_mcg && (
                          <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded">
                            {recipe.b12_mcg}mcg B12
                          </span>
                        )}
                      </div>

                      {/* Expandable details */}
                      <details className="group">
                        <summary className="px-4 py-2 text-sm text-blue-600 cursor-pointer hover:bg-gray-50 list-none flex items-center justify-between">
                          <span>View ingredients & instructions</span>
                          <ChevronLeft className="w-4 h-4 -rotate-90 group-open:rotate-90 transition-transform" />
                        </summary>
                        <div className="px-4 pb-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                          {/* Ingredients */}
                          <div>
                            <h4 className="font-semibold text-gray-900 mb-2">
                              Ingredients
                            </h4>
                            <ul className="space-y-1 text-sm text-gray-700">
                              {recipe.ingredients.map((ing, ingIdx) => (
                                <li key={ingIdx}>
                                  {ing.amount} {ing.unit} {ing.item}
                                  {ing.note && (
                                    <span className="text-gray-500">
                                      {' '}
                                      ({ing.note})
                                    </span>
                                  )}
                                </li>
                              ))}
                            </ul>
                          </div>
                          {/* Instructions */}
                          <div>
                            <h4 className="font-semibold text-gray-900 mb-2">
                              Instructions
                            </h4>
                            <ol className="space-y-2 text-sm text-gray-700">
                              {recipe.instructions.map((step, stepIdx) => (
                                <li key={stepIdx} className="flex gap-2">
                                  <span className="flex-shrink-0 w-5 h-5 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-medium">
                                    {stepIdx + 1}
                                  </span>
                                  <span>{step}</span>
                                </li>
                              ))}
                            </ol>
                          </div>
                        </div>
                      </details>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div className="flex justify-start">
              <div className="bg-white border border-gray-200 rounded-2xl px-4 py-3 flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-gray-500" />
                <span className="text-gray-500">Finding recipes...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input */}
      <div className="bg-white border-t border-gray-200 px-4 py-4">
        <div className="max-w-4xl mx-auto flex gap-3">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Describe what kind of recipe you want..."
            className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:border-blue-500 focus:outline-none"
            disabled={loading}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || loading}
            className="px-4 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
        <p className="max-w-4xl mx-auto text-xs text-gray-500 mt-2 text-center">
          Try: "high protein breakfast", "quick dinner with chicken", "vegetarian lunch high in potassium"
        </p>
      </div>
    </div>
  )
}
