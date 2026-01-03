'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Gig } from '@/types'
import { Clock, Star } from 'lucide-react'

interface GigCardProps {
  gig: Gig
  kidId?: string
  isClaimed?: boolean
  hasActiveGig?: boolean
}

const tierColors = {
  1: 'bg-green-50 border-green-200',
  2: 'bg-blue-50 border-blue-200',
  3: 'bg-purple-50 border-purple-200',
  4: 'bg-orange-50 border-orange-200',
  5: 'bg-red-50 border-red-200',
}

const tierLabels = {
  1: 'Easy',
  2: 'Moderate',
  3: 'Difficult',
  4: 'Very Difficult',
  5: 'Premium',
}

export default function GigCard({
  gig,
  kidId,
  isClaimed,
  hasActiveGig,
}: GigCardProps) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleClaim = async () => {
    if (!kidId) return

    setLoading(true)
    try {
      const response = await fetch('/api/gigs/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kidId, gigId: gig.id }),
      })

      if (response.ok) {
        router.refresh()
      } else {
        const data = await response.json()
        alert(data.error || 'Failed to claim gig')
      }
    } catch (error) {
      console.error('Error claiming gig:', error)
    } finally {
      setLoading(false)
    }
  }
  return (
    <div
      className={`rounded-lg border-2 p-5 transition-all hover:shadow-md ${
        tierColors[gig.tier as keyof typeof tierColors]
      }`}
    >
      {/* Tier badge */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-bold uppercase tracking-wide text-gray-600">
          {tierLabels[gig.tier as keyof typeof tierLabels]}
        </span>
        <div className="flex items-center gap-1 text-yellow-500">
          <Star className="w-4 h-4 fill-current" />
          <span className="font-bold text-sm">{gig.stars}</span>
        </div>
      </div>

      {/* Title */}
      <h3 className="text-lg font-bold text-gray-900 mb-2">{gig.title}</h3>

      {/* Description */}
      <p className="text-sm text-gray-600 mb-4">{gig.description}</p>

      {/* Time estimate */}
      {gig.estimated_minutes && (
        <div className="flex items-center gap-2 text-xs text-gray-500 mb-4">
          <Clock className="w-4 h-4" />
          <span>~{gig.estimated_minutes} min</span>
        </div>
      )}

      {/* Checklist preview */}
      {gig.checklist.length > 0 && (
        <div className="bg-white/50 rounded p-3 mb-4 text-xs space-y-1">
          {gig.checklist.slice(0, 2).map((item, idx) => (
            <div key={idx} className="text-gray-700">
              ✓ {item}
            </div>
          ))}
          {gig.checklist.length > 2 && (
            <div className="text-gray-500">+{gig.checklist.length - 2} more</div>
          )}
        </div>
      )}

      {/* Claim button - only show when kidId is provided */}
      {kidId ? (
        <button
          onClick={handleClaim}
          disabled={loading || isClaimed || hasActiveGig}
          className={`w-full py-2 rounded font-semibold text-sm transition-colors ${
            isClaimed
              ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
              : hasActiveGig
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-primary text-white hover:bg-blue-700 disabled:opacity-50'
          }`}
        >
          {isClaimed ? 'Claimed' : hasActiveGig ? 'Finish current gig first' : loading ? 'Claiming...' : 'Claim Gig'}
        </button>
      ) : (
        <div className="w-full py-2 rounded text-center text-sm text-gray-500 bg-gray-100">
          View from kid's page to claim
        </div>
      )}
    </div>
  )
}
