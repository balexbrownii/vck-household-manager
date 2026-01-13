import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import TopNav from '@/components/nav/top-nav'
import { ShoppingList } from '@/components/meals'
import { getWeekStartDate, formatDateLocal, parseDateLocal } from '@/lib/domain/meal-planning'
import Link from 'next/link'
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react'

interface ShoppingPageProps {
  searchParams: { week?: string }
}

export default async function ShoppingPage({ searchParams }: ShoppingPageProps) {
  const supabase = await createClient()

  // Check authentication
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Calculate week dates
  const today = new Date()
  const weekParam = searchParams.week
  const weekStartDate = weekParam || getWeekStartDate(today)

  // Calculate previous and next week (using local date parsing)
  const currentWeekStart = parseDateLocal(weekStartDate)
  const prevWeekStart = new Date(currentWeekStart)
  prevWeekStart.setDate(prevWeekStart.getDate() - 7)
  const nextWeekStart = new Date(currentWeekStart)
  nextWeekStart.setDate(nextWeekStart.getDate() + 7)

  const prevWeek = formatDateLocal(prevWeekStart)
  const nextWeek = formatDateLocal(nextWeekStart)
  const thisWeek = getWeekStartDate(today)

  // Fetch shopping list for the week
  const { data: shoppingItems } = await supabase
    .from('shopping_list_items')
    .select('*')
    .eq('week_start_date', weekStartDate)
    .order('category')
    .order('ingredient_name')

  // Format week range for display
  const weekEndDate = new Date(currentWeekStart)
  weekEndDate.setDate(weekEndDate.getDate() + 6)
  const formatDateDisplay = (d: Date) =>
    d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  const weekLabel = `${formatDateDisplay(currentWeekStart)} - ${formatDateDisplay(weekEndDate)}`

  return (
    <div className="min-h-screen bg-gray-50">
      <TopNav />
      <main className="max-w-2xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-4 mb-4">
            <Link
              href={`/meals?week=${weekStartDate}`}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronLeft className="w-5 h-5 text-gray-600" />
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Shopping List</h1>
              <p className="text-gray-600 mt-1">
                Ingredients for your weekly meal plan
              </p>
            </div>
          </div>
        </div>

        {/* Week Navigation */}
        <div className="flex items-center justify-between mb-6 bg-white rounded-lg border border-gray-200 p-3">
          <Link
            href={`/meals/shopping?week=${prevWeek}`}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-gray-600" />
          </Link>
          <div className="flex items-center gap-3">
            <Calendar className="w-4 h-4 text-gray-400" />
            <span className="font-semibold text-gray-900">{weekLabel}</span>
            {weekStartDate !== thisWeek && (
              <Link
                href="/meals/shopping"
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                This Week
              </Link>
            )}
          </div>
          <Link
            href={`/meals/shopping?week=${nextWeek}`}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ChevronRight className="w-5 h-5 text-gray-600" />
          </Link>
        </div>

        {/* Shopping List */}
        <ShoppingList items={shoppingItems || []} weekStartDate={weekStartDate} />

        {/* Link to meal plan */}
        <div className="mt-6 text-center">
          <Link
            href={`/meals?week=${weekStartDate}`}
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            View meal plan for this week
          </Link>
        </div>
      </main>
    </div>
  )
}
