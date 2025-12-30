import { createClient } from '@/lib/supabase/server'
import GigInspectionForm from '@/components/gigs/gig-inspection-form'
import ClaimedGigStatus from '@/components/gigs/claimed-gig-status'
import { redirect } from 'next/navigation'

export default async function InspectGigsPage() {
  const supabase = await createClient()

  // Check authentication
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Fetch all claimed gigs pending inspection
  const { data: pendingGigs, error: pendingError } = await supabase
    .from('claimed_gigs')
    .select('*, gigs(*), kids(name)')
    .or('inspection_status.is.null,inspection_status.eq.pending')
    .order('claimed_at', { ascending: false })

  if (pendingError) {
    console.error('Error fetching pending gigs:', pendingError)
  }

  // Fetch recently completed gigs (for reference)
  const { data: recentGigs, error: recentError } = await supabase
    .from('claimed_gigs')
    .select('*, gigs(*), kids(name)')
    .in('inspection_status', ['approved', 'rejected'])
    .order('inspected_at', { ascending: false })
    .limit(10)

  if (recentError) {
    console.error('Error fetching recent gigs:', recentError)
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-3xl font-bold text-gray-900">Inspect Gigs</h1>
          <p className="text-gray-600 mt-2">
            Review and approve completed gigs
          </p>
        </div>

        {/* Pending Gigs */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            {pendingGigs && pendingGigs.length > 0
              ? `Pending Review (${pendingGigs.length})`
              : 'No Pending Gigs'}
          </h2>

          {pendingGigs && pendingGigs.length > 0 ? (
            <div className="space-y-8">
              {pendingGigs.map((claimedGig) => (
                <div key={claimedGig.id} className="space-y-4">
                  {/* Kid and status */}
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {(claimedGig.kids as any)?.name || 'Unknown Kid'}
                    </h3>
                  </div>

                  {/* Inspection form */}
                  <GigInspectionForm claimedGig={claimedGig} />
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
              <p className="text-gray-500 text-lg">
                No gigs awaiting inspection
              </p>
            </div>
          )}
        </div>

        {/* Recently Completed */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Recently Completed
          </h2>

          {recentGigs && recentGigs.length > 0 ? (
            <div className="space-y-4">
              {recentGigs.map((claimedGig) => (
                <div key={claimedGig.id} className="flex items-center justify-between bg-white rounded-lg border border-gray-200 p-4">
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      {claimedGig.gigs.title}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {(claimedGig.kids as any)?.name || 'Unknown Kid'}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className={`px-3 py-1 rounded-full text-sm font-semibold ${
                      claimedGig.inspection_status === 'approved'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-orange-100 text-orange-700'
                    }`}>
                      {claimedGig.inspection_status === 'approved'
                        ? `✓ ${claimedGig.stars_awarded} stars`
                        : '✗ Rejected'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
              <p className="text-gray-500">No recent activity</p>
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
