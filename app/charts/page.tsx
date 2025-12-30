import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import TopNav from '@/components/nav/top-nav'
import { Download, FileText } from 'lucide-react'

export default async function ChartsPage() {
  const supabase = await createClient()

  // Check authentication
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const charts = [
    {
      id: 'daily-expectations',
      title: 'Daily Expectations Chart',
      description: 'The 4 daily requirements for screen time unlock, how they work, and reset rules.',
      color: 'blue',
      icon: '✓',
    },
    {
      id: 'chore-rotation',
      title: 'Chore Rotation Chart',
      description: 'Weekly A/B/C rotation assignments, daily room breakdown, and how the rotation works.',
      color: 'green',
      icon: '◼',
    },
    {
      id: 'screen-time',
      title: 'Screen Time Rules',
      description: 'Age-based limits, bonus time rules, and how screen time unlock works.',
      color: 'purple',
      icon: '▶',
    },
    {
      id: 'gigs-catalog',
      title: 'Gigs Catalog',
      description: 'All 5 gig tiers, star values, milestones, and how the gig workflow works.',
      color: 'yellow',
      icon: '★',
    },
    {
      id: 'timeout-rules',
      title: 'Timeout Rules',
      description: 'All violation types with base timeouts, reset rules, and how enforcement works.',
      color: 'red',
      icon: '⏱',
    },
  ]

  const colorMap = {
    blue: 'bg-blue-50 border-blue-200',
    green: 'bg-green-50 border-green-200',
    purple: 'bg-purple-50 border-purple-200',
    yellow: 'bg-yellow-50 border-yellow-200',
    red: 'bg-red-50 border-red-200',
  }

  const buttonColorMap = {
    blue: 'bg-blue-600 hover:bg-blue-700',
    green: 'bg-green-600 hover:bg-green-700',
    purple: 'bg-purple-600 hover:bg-purple-700',
    yellow: 'bg-yellow-600 hover:bg-yellow-700',
    red: 'bg-red-600 hover:bg-red-700',
  }

  return (
    <>
      <TopNav />
      <main className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-2">
            <FileText className="w-8 h-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900">Reference Charts</h1>
          </div>
          <p className="text-gray-600">
            Printable PDF guides for the kitchen fridge. Print and laminate for durability.
          </p>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 gap-6">
          {charts.map((chart) => (
            <div
              key={chart.id}
              className={`rounded-lg border-2 p-6 ${
                colorMap[chart.color as keyof typeof colorMap]
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-4xl">{chart.icon}</span>
                    <h2 className="text-2xl font-bold text-gray-900">
                      {chart.title}
                    </h2>
                  </div>
                  <p className="text-gray-700 mb-4">{chart.description}</p>
                  <div className="flex gap-2">
                    <a
                      href={`/api/charts?type=${chart.id}`}
                      download
                      className={`${
                        buttonColorMap[chart.color as keyof typeof buttonColorMap]
                      } text-white font-bold py-2 px-4 rounded-lg transition-colors flex items-center gap-2 inline-flex`}
                    >
                      <Download className="w-4 h-4" />
                      Download PDF
                    </a>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Instructions */}
        <div className="mt-12 bg-blue-50 border-2 border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Printing Tips</h3>
          <ul className="space-y-2 text-gray-700">
            <li>✓ Print on 8.5" × 11" paper (Letter size)</li>
            <li>✓ Use portrait orientation</li>
            <li>✓ Print color for better readability</li>
            <li>✓ Consider laminating for durability (optional)</li>
            <li>✓ Tape to kitchen fridge for quick reference</li>
          </ul>
        </div>

        {/* Quick Links */}
        <div className="mt-12 pt-6 border-t border-gray-200">
          <p className="text-gray-600 mb-4">Quick links to main features:</p>
          <div className="flex gap-4 flex-wrap">
            <a
              href="/"
              className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg font-semibold hover:bg-gray-200 transition-colors"
            >
              Dashboard
            </a>
            <a
              href="/gigs"
              className="px-6 py-3 bg-blue-100 text-blue-700 rounded-lg font-semibold hover:bg-blue-200 transition-colors"
            >
              Browse Gigs
            </a>
            <a
              href="/screen-time"
              className="px-6 py-3 bg-purple-100 text-purple-700 rounded-lg font-semibold hover:bg-purple-200 transition-colors"
            >
              Screen Time
            </a>
            <a
              href="/timeout"
              className="px-6 py-3 bg-red-100 text-red-700 rounded-lg font-semibold hover:bg-red-200 transition-colors"
            >
              Timeouts
            </a>
          </div>
        </div>
      </div>
    </main>
    </>
  )
}
