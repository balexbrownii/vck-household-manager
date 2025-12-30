import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import ViolationLogger from '@/components/timeout/violation-logger'
import TimeoutTimer from '@/components/timeout/timeout-timer'
import TimeoutHistory from '@/components/timeout/timeout-history'
import TopNav from '@/components/nav/top-nav'
import { AlertTriangle } from 'lucide-react'

export default async function TimeoutPage() {
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

  // Fetch active timeouts (no completed_at)
  const { data: activeTimeouts } = await supabase
    .from('timeout_violations')
    .select('*')
    .is('completed_at', null)
    .order('started_at', { ascending: false })

  // Create a map of kid timeouts
  const timeoutsByKid = new Map()
  activeTimeouts?.forEach((timeout) => {
    if (!timeoutsByKid.has(timeout.kid_id)) {
      timeoutsByKid.set(timeout.kid_id, [])
    }
    timeoutsByKid.get(timeout.kid_id).push(timeout)
  })

  return (
    <>
      <TopNav />
      <main className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-2">
            <AlertTriangle className="w-8 h-8 text-red-600" />
            <h1 className="text-3xl font-bold text-gray-900">Timeout Management</h1>
          </div>
          <p className="text-gray-600">Immediate violation logging and timeout tracking</p>
        </div>

        {/* Active Timeouts */}
        {activeTimeouts && activeTimeouts.length > 0 && (
          <div className="mb-12">
            <div className="flex items-center gap-2 mb-6">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              <h2 className="text-2xl font-bold text-gray-900">Active Timeouts</h2>
              <span className="ml-auto text-sm font-semibold text-red-600">
                {activeTimeouts.length} in progress
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {activeTimeouts.map((timeout) => (
                <div key={timeout.id}>
                  <div className="text-sm font-semibold text-gray-700 mb-2">
                    {kids.find((k) => k.id === timeout.kid_id)?.name}
                  </div>
                  <TimeoutTimer key={timeout.id} timeout={timeout} />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Quick Log Section */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Log New Violation</h2>
          <div className="grid grid-cols-1 gap-6">
            {kids.map((kid) => (
              <div key={kid.id}>
                <ViolationLogger
                  kidId={kid.id}
                  kidName={kid.name}
                  onViolationLogged={() => {
                    // Would trigger page refresh in real app
                    // For now, just shows success
                  }}
                />
              </div>
            ))}
          </div>
        </div>

        {/* History & Patterns */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Timeout History & Patterns</h2>
          <div className="grid grid-cols-1 gap-6">
            {kids.map((kid) => (
              <div key={kid.id}>
                <TimeoutHistory kidId={kid.id} kidName={kid.name} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
    </>
  )
}
