import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import KidAnalytics from '@/components/analytics/kid-analytics'
import OverallStats from '@/components/analytics/overall-stats'
import TopNav from '@/components/nav/top-nav'
import { TrendingUp } from 'lucide-react'

export default async function AnalyticsPage() {
  const supabase = await createClient()

  // Check authentication
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Fetch all kids
  const { data: kids } = await supabase
    .from('kids')
    .select('*')
    .order('age', { ascending: true })

  if (!kids || kids.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">No kids found</p>
      </div>
    )
  }

  return (
    <>
      <TopNav />
      <main className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-2">
            <TrendingUp className="w-8 h-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
          </div>
          <p className="text-gray-600">
            Family performance metrics and patterns
          </p>
        </div>

        {/* Overall Stats */}
        <div className="mb-12">
          <OverallStats kids={kids} />
        </div>

        {/* Per-Kid Analytics */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Per-Child Analytics</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {kids.map((kid) => (
              <div key={kid.id}>
                <KidAnalytics kid={kid} />
              </div>
            ))}
          </div>
        </div>

        {/* Tips Section */}
        <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Analytics Tips</h3>
          <ul className="space-y-2 text-gray-700">
            <li>✓ Check completion rates to identify struggling areas</li>
            <li>✓ Monitor star velocity to understand gig engagement</li>
            <li>✓ Look for timeout patterns to address behavioral issues</li>
            <li>✓ Use data to provide specific feedback and encouragement</li>
            <li>✓ Celebrate wins and milestones with the kids</li>
          </ul>
        </div>
      </div>
    </main>
    </>
  )
}
