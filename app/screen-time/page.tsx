import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import ScreenTimeTimer from '@/components/screen-time/screen-time-timer'
import TopNav from '@/components/nav/top-nav'

export default async function ScreenTimePage() {
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

  // Fetch today's screen time sessions
  const today = new Date().toISOString().split('T')[0]
  const { data: sessions } = await supabase
    .from('screen_time_sessions')
    .select('*')
    .eq('date', today)

  const sessionsMap = new Map()
  sessions?.forEach((session) => {
    sessionsMap.set(session.kid_id, session)
  })

  return (
    <>
      <TopNav />
      <main className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-3xl font-bold text-gray-900">Screen Time Manager</h1>
          <p className="text-gray-600 mt-2">
            Real-time countdown timers for each child
          </p>
        </div>

        {/* Timer grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {kids.map((kid) => (
            <ScreenTimeTimer
              key={kid.id}
              kid={kid}
              session={sessionsMap.get(kid.id) || null}
            />
          ))}
        </div>

        {/* Info section */}
        <div className="mt-16 bg-blue-50 border border-blue-200 rounded-lg p-8">
          <h3 className="text-lg font-bold text-gray-900 mb-4">How Screen Time Works:</h3>
          <ul className="space-y-3 text-gray-700">
            <li>
              <strong>Unlock:</strong> Automatically unlocked when all 4 daily expectations are complete
            </li>
            <li>
              <strong>Base Time:</strong> {kids[0]?.screen_time_weekday_minutes || 60} min weekday / {kids[0]?.screen_time_weekend_minutes || 120} min weekend
            </li>
            <li>
              <strong>Bonus Time:</strong> +15 minutes per completed gig (max 2 gigs/day = +30 min)
            </li>
            <li>
              <strong>Cutoff:</strong> Timer must run out before cutoff time or auto-lock
            </li>
            <li>
              <strong>Bonus Expires:</strong> Same day only - doesn't carry over
            </li>
          </ul>
        </div>
      </div>
    </main>
    </>
  )
}
