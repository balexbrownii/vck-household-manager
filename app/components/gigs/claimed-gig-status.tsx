'use client'

import { ClaimedGig, Gig } from '@/types'
import { Clock, CheckCircle2, AlertCircle } from 'lucide-react'

interface ClaimedGigStatusProps {
  claimedGig: ClaimedGig & { gigs: Gig }
}

export default function ClaimedGigStatus({ claimedGig }: ClaimedGigStatusProps) {
  const gig = claimedGig.gigs
  const claimedDate = new Date(claimedGig.claimed_at)
  const hoursAgo = Math.floor(
    (Date.now() - claimedDate.getTime()) / (1000 * 60 * 60)
  )

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-xl font-bold text-gray-900">{gig.title}</h3>
          <p className="text-sm text-gray-600 mt-1">
            Claimed {hoursAgo > 0 ? `${hoursAgo}h ago` : 'just now'}
          </p>
        </div>

        {claimedGig.inspection_status === 'approved' && (
          <div className="flex items-center gap-2 px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-semibold">
            <CheckCircle2 className="w-4 h-4" />
            Approved
          </div>
        )}

        {claimedGig.inspection_status === 'rejected' && (
          <div className="flex items-center gap-2 px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm font-semibold">
            <AlertCircle className="w-4 h-4" />
            Rejected
          </div>
        )}

        {!claimedGig.inspection_status && (
          <div className="flex items-center gap-2 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-semibold">
            <Clock className="w-4 h-4" />
            In Progress
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 sm:gap-4 gap-2">
        <div>
          <div className="text-sm text-gray-600">Estimated Time</div>
          <div className="font-bold text-gray-900">
            {gig.estimated_minutes ? `${gig.estimated_minutes}m` : 'N/A'}
          </div>
        </div>
        <div>
          <div className="text-sm text-gray-600">Stars</div>
          <div className="font-bold text-yellow-600">{gig.stars} ⭐</div>
        </div>
        <div>
          <div className="text-sm text-gray-600">Status</div>
          <div className="font-bold text-gray-900">
            {claimedGig.inspection_status || 'Pending'}
          </div>
        </div>
      </div>
    </div>
  )
}
