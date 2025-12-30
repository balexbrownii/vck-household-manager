import { createClient } from '@/lib/supabase/server'
import { Gig, Kid } from '@/types'
import GigCard from '@/components/gigs/gig-card'
import { redirect } from 'next/navigation'

export default async function GigsPage() {
  const supabase = await createClient()

  // Check authentication
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Fetch all gigs
  const { data: gigs, error: gigsError } = await supabase
    .from('gigs')
    .select('*')
    .eq('active', true)
    .order('tier', { ascending: true })
    .order('stars', { ascending: true })

  if (gigsError || !gigs) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">Failed to load gigs</p>
      </div>
    )
  }

  // Fetch all kids to show in kid selector
  const { data: kids } = await supabase
    .from('kids')
    .select('*')
    .order('age', { ascending: true })

  // Group gigs by tier
  const gigsByTier: Record<number, Gig[]> = {}
  gigs.forEach((gig) => {
    if (!gigsByTier[gig.tier]) {
      gigsByTier[gig.tier] = []
    }
    gigsByTier[gig.tier].push(gig)
  })

  const tierLabels = {
    1: 'Easy (10 stars = $5)',
    2: 'Moderate (20 stars = $10)',
    3: 'Difficult (30 stars = $15)',
    4: 'Very Difficult (40 stars = $20)',
    5: 'Premium (50+ stars = $25+)',
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-3xl font-bold text-gray-900">Available Gigs</h1>
          <p className="text-gray-600 mt-2">
            Earn stars by completing tasks and projects
          </p>
        </div>

        {/* Gigs by tier */}
        <div className="space-y-12">
          {[1, 2, 3, 4, 5].map((tier) => {
            const tierGigs = gigsByTier[tier] || []
            if (tierGigs.length === 0) return null

            return (
              <div key={tier}>
                <h2 className="text-2xl font-bold text-gray-900 mb-6">
                  {tierLabels[tier as keyof typeof tierLabels]}
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {tierGigs.map((gig) => (
                    <GigCard
                      key={gig.id}
                      gig={gig}
                      onClaim={(gigId) => {
                        // This will be handled by kid selector below
                        alert('Select a kid first in the sidebar')
                      }}
                    />
                  ))}
                </div>
              </div>
            )
          })}
        </div>

        {/* Info section */}
        <div className="mt-16 bg-blue-50 border border-blue-200 rounded-lg p-8">
          <h3 className="text-lg font-bold text-gray-900 mb-4">How it works:</h3>
          <ul className="space-y-3 text-gray-700">
            <li>
              <strong>1. Claim a gig:</strong> Kids select a gig and start working
            </li>
            <li>
              <strong>2. Complete the work:</strong> Follow the checklist items
            </li>
            <li>
              <strong>3. Request inspection:</strong> Parent reviews and approves
            </li>
            <li>
              <strong>4. Earn stars:</strong> Stars go toward $100 milestones
            </li>
            <li>
              <strong>One gig at a time:</strong> Must finish or abandon before claiming another
            </li>
          </ul>
        </div>
      </div>
    </main>
  )
}
