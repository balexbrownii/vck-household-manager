import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import GigCard from '@/components/gigs/gig-card'
import ClaimedGigStatus from '@/components/gigs/claimed-gig-status'
import TopNav from '@/components/nav/top-nav'
import Link from 'next/link'

interface KidGigsPageProps {
  params: Promise<{ kidId: string }>
}

export default async function KidGigsPage({ params }: KidGigsPageProps) {
  const supabase = await createClient()

  // Check authentication
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { kidId } = await params

  // Fetch kid details
  const { data: kid, error: kidError } = await supabase
    .from('kids')
    .select('*')
    .eq('id', kidId)
    .single()

  if (kidError || !kid) {
    return (
      <div className="min-h-screen bg-gray-50">
        <TopNav />
        <div className="text-center py-12">
          <p className="text-red-600">Kid not found</p>
          <Link href="/" className="text-blue-600 hover:underline mt-4 inline-block">
            Back to Dashboard
          </Link>
        </div>
      </div>
    )
  }

  // Fetch kid's active/claimed gig
  const { data: claimedGig } = await supabase
    .from('claimed_gigs')
    .select('*, gigs(*)')
    .eq('kid_id', kidId)
    .or('inspection_status.is.null,inspection_status.eq.pending')
    .limit(1)
    .single()

  const hasActiveGig = !!claimedGig

  // Fetch available gigs filtered by kid's tier
  const { data: availableGigs, error: gigsError } = await supabase
    .from('gigs')
    .select('*')
    .lte('tier', kid.max_gig_tier)
    .eq('active', true)
    .order('tier', { ascending: true })
    .order('stars', { ascending: true })

  if (gigsError || !availableGigs) {
    return (
      <div className="min-h-screen bg-gray-50">
        <TopNav />
        <div className="text-center py-12">
          <p className="text-red-600">Failed to load gigs</p>
        </div>
      </div>
    )
  }

  // Group gigs by tier
  const gigsByTier: Record<number, typeof availableGigs> = {}
  availableGigs.forEach((gig) => {
    if (!gigsByTier[gig.tier]) {
      gigsByTier[gig.tier] = []
    }
    gigsByTier[gig.tier]!.push(gig)
  })

  const tierLabels = {
    1: 'Easy (10 stars = $5)',
    2: 'Moderate (20 stars = $10)',
    3: 'Difficult (30 stars = $15)',
    4: 'Very Difficult (40 stars = $20)',
    5: 'Premium (50+ stars = $25+)',
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <TopNav />
      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-4">
            <div>
              <Link href="/" className="text-sm text-blue-600 hover:underline mb-2 inline-block">
                ← Back to Dashboard
              </Link>
              <h1 className="text-3xl font-bold text-gray-900">{kid.name}'s Gigs</h1>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-600">Stars</div>
              <div className="text-3xl font-bold text-yellow-500">
                {kid.total_stars} ⭐
              </div>
            </div>
          </div>
          <p className="text-gray-600">
            {kid.total_stars % 200}/200 toward ${Math.floor(kid.total_stars / 200) + 1} milestone
          </p>
        </div>

        {/* Active Gig */}
        {claimedGig && (
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Currently Working On
            </h2>
            <ClaimedGigStatus claimedGig={claimedGig} />
          </div>
        )}

        {/* Available Gigs */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            {claimedGig ? 'Other Available Gigs' : 'Available Gigs'}
          </h2>

          {Object.keys(gigsByTier).length > 0 ? (
            <div className="space-y-12">
              {[1, 2, 3, 4, 5].map((tier) => {
                const tierGigs = gigsByTier[tier] || []
                if (tierGigs.length === 0) return null

                return (
                  <div key={tier}>
                    <h3 className="text-xl font-bold text-gray-900 mb-6">
                      {tierLabels[tier as keyof typeof tierLabels]}
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {tierGigs.map((gig) => (
                        <GigCard
                          key={gig.id}
                          gig={gig}
                          kidId={kidId}
                          isClaimed={claimedGig?.gig_id === gig.id}
                          hasActiveGig={hasActiveGig && claimedGig?.gig_id !== gig.id}
                        />
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
              <p className="text-gray-500">
                No gigs available for your tier yet
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
