'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import {
  ArrowLeft,
  Star,
  Clock,
  CheckCircle2,
  AlertCircle,
  Briefcase,
  Loader2,
} from 'lucide-react'
import { LoadingSpinner } from '@/components/ui/shared'

interface Kid {
  id: string
  name: string
  max_gig_tier: number
}

interface Gig {
  id: string
  title: string
  description: string
  tier: number
  stars: number
  estimated_minutes: number
  category: string
  instructions: string
  status: string
}

export default function GigDetailPage() {
  const router = useRouter()
  const params = useParams()
  const gigId = params.id as string

  const [kid, setKid] = useState<Kid | null>(null)
  const [gig, setGig] = useState<Gig | null>(null)
  const [loading, setLoading] = useState(true)
  const [claiming, setClaiming] = useState(false)
  const [claimed, setClaimed] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    checkSessionAndLoadGig()
  }, [gigId])

  const checkSessionAndLoadGig = async () => {
    try {
      const sessionRes = await fetch('/api/kid-auth/session')
      const sessionData = await sessionRes.json()

      if (!sessionData.authenticated || !sessionData.kid) {
        router.push('/kid-login')
        return
      }

      setKid(sessionData.kid)

      // Load gig details
      const gigRes = await fetch(`/api/gigs/${gigId}`)
      if (gigRes.ok) {
        const data = await gigRes.json()
        setGig(data.gig)

        // Check if already claimed by this kid
        if (data.gig.claimed_by === sessionData.kid.id) {
          setClaimed(true)
        }
      } else {
        setError('Gig not found')
      }
    } catch {
      router.push('/kid-login')
    } finally {
      setLoading(false)
    }
  }

  const handleClaim = async () => {
    if (!gig || !kid) return

    setClaiming(true)
    setError('')

    try {
      const res = await fetch(`/api/gigs/${gigId}/claim`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kidId: kid.id }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Failed to claim gig')
        return
      }

      setClaimed(true)
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setClaiming(false)
    }
  }

  if (loading) {
    return (
      <main className="kid-page bg-gradient-to-br from-purple-400 via-pink-500 to-red-500 flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </main>
    )
  }

  if (!gig || !kid) {
    return (
      <main className="kid-page bg-gradient-to-br from-purple-400 via-pink-500 to-red-500">
        <div className="max-w-lg mx-auto">
          <button
            onClick={() => router.push('/kid-dashboard/gigs')}
            className="flex items-center gap-2 text-white mb-6"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back to Gigs</span>
          </button>
          <div className="bg-white rounded-2xl p-8 shadow-lg text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <p className="text-gray-600">{error || 'Gig not found'}</p>
          </div>
        </div>
      </main>
    )
  }

  const canClaim = gig.tier <= kid.max_gig_tier && gig.status === 'available' && !claimed

  return (
    <main className="kid-page bg-gradient-to-br from-purple-400 via-pink-500 to-red-500 no-pull-refresh pb-24">
      <div className="max-w-lg mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => router.push('/kid-dashboard/gigs')}
            className="p-2 bg-white/20 rounded-full hover:bg-white/30 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
          <h1 className="text-xl font-bold text-white">Gig Details</h1>
        </div>

        {/* Gig Card */}
        <div className="bg-white rounded-2xl p-6 shadow-lg mb-4">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                  gig.tier === 1 ? 'bg-green-100 text-green-700' :
                  gig.tier === 2 ? 'bg-blue-100 text-blue-700' :
                  'bg-purple-100 text-purple-700'
                }`}>
                  Tier {gig.tier}
                </span>
                {gig.category && (
                  <span className="text-xs text-gray-500">{gig.category}</span>
                )}
              </div>
              <h2 className="text-xl font-bold text-gray-900">{gig.title}</h2>
            </div>
            <div className="flex items-center gap-1 bg-yellow-100 px-3 py-2 rounded-full">
              <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
              <span className="font-bold text-yellow-700 text-lg">{gig.stars}</span>
            </div>
          </div>

          {/* Time Estimate */}
          <div className="flex items-center gap-2 text-gray-600 mb-4">
            <Clock className="w-5 h-5" />
            <span>About {gig.estimated_minutes} minutes</span>
          </div>

          {/* Description */}
          <div className="mb-6">
            <h3 className="font-semibold text-gray-900 mb-2">What you&apos;ll do:</h3>
            <p className="text-gray-600">{gig.description}</p>
          </div>

          {/* Instructions */}
          {gig.instructions && (
            <div className="mb-6">
              <h3 className="font-semibold text-gray-900 mb-2">Instructions:</h3>
              <div className="bg-purple-50 rounded-lg p-4 text-gray-700 whitespace-pre-wrap">
                {gig.instructions}
              </div>
            </div>
          )}

          {/* Status Messages */}
          {claimed && (
            <div className="flex items-center gap-2 p-4 bg-green-100 rounded-lg text-green-700 mb-4">
              <CheckCircle2 className="w-5 h-5" />
              <span className="font-medium">You&apos;ve claimed this gig!</span>
            </div>
          )}

          {gig.status !== 'available' && !claimed && (
            <div className="flex items-center gap-2 p-4 bg-gray-100 rounded-lg text-gray-600 mb-4">
              <AlertCircle className="w-5 h-5" />
              <span>This gig is no longer available</span>
            </div>
          )}

          {gig.tier > kid.max_gig_tier && (
            <div className="flex items-center gap-2 p-4 bg-orange-100 rounded-lg text-orange-700 mb-4">
              <AlertCircle className="w-5 h-5" />
              <span>You need to unlock Tier {gig.tier} to claim this gig</span>
            </div>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-4 bg-red-100 border border-red-300 text-red-700 rounded-xl text-sm">
            {error}
          </div>
        )}

        {/* Action Buttons */}
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-purple-500 to-transparent">
          <div className="max-w-lg mx-auto">
            {claimed ? (
              <a
                href="/kid-dashboard/submit"
                className="w-full py-4 bg-green-500 rounded-2xl font-bold text-lg text-white shadow-lg flex items-center justify-center gap-2 hover:bg-green-600 transition-colors"
              >
                <CheckCircle2 className="w-5 h-5" />
                Submit Completed Work
              </a>
            ) : canClaim ? (
              <button
                onClick={handleClaim}
                disabled={claiming}
                className="w-full py-4 bg-white rounded-2xl font-bold text-lg text-purple-600 shadow-lg disabled:opacity-50 hover:scale-[1.02] transition-all flex items-center justify-center gap-2"
              >
                {claiming ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Claiming...</span>
                  </>
                ) : (
                  <>
                    <Briefcase className="w-5 h-5" />
                    <span>Claim This Gig</span>
                  </>
                )}
              </button>
            ) : (
              <button
                disabled
                className="w-full py-4 bg-gray-300 rounded-2xl font-bold text-lg text-gray-500 shadow-lg cursor-not-allowed"
              >
                Not Available
              </button>
            )}
          </div>
        </div>
      </div>
    </main>
  )
}
