'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  Briefcase,
  ChevronLeft,
  Star,
  Clock,
  ChevronRight,
  Filter,
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
}

export default function GigsPage() {
  const router = useRouter()
  const [kid, setKid] = useState<Kid | null>(null)
  const [loading, setLoading] = useState(true)
  const [gigs, setGigs] = useState<Gig[]>([])
  const [filter, setFilter] = useState<'all' | 'quick' | 'medium' | 'big'>('all')

  useEffect(() => {
    checkSessionAndLoadData()
  }, [])

  const checkSessionAndLoadData = async () => {
    try {
      const sessionRes = await fetch('/api/kid-auth/session')
      const sessionData = await sessionRes.json()

      if (!sessionData.authenticated || !sessionData.kid) {
        router.push('/kid-login')
        return
      }

      setKid(sessionData.kid)

      // Load available gigs
      const gigsRes = await fetch('/api/gigs?status=available')
      if (gigsRes.ok) {
        const data = await gigsRes.json()
        // Filter by kid's tier
        const kidTier = sessionData.kid.max_gig_tier || 1
        setGigs(
          (data.gigs || []).filter((g: Gig) => g.tier <= kidTier)
        )
      }
    } catch {
      router.push('/kid-login')
    } finally {
      setLoading(false)
    }
  }

  const filteredGigs = gigs.filter(gig => {
    if (filter === 'all') return true
    if (filter === 'quick') return gig.estimated_minutes <= 15
    if (filter === 'medium') return gig.estimated_minutes > 15 && gig.estimated_minutes <= 30
    if (filter === 'big') return gig.estimated_minutes > 30
    return true
  })

  if (loading) {
    return (
      <main className="kid-page bg-gradient-to-br from-purple-400 via-pink-500 to-red-500 flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </main>
    )
  }

  if (!kid) return null

  return (
    <main className="kid-page bg-gradient-to-br from-purple-400 via-pink-500 to-red-500 no-pull-refresh">
      <div className="max-w-lg mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => router.push('/kid-dashboard')}
            className="p-2 bg-white/20 rounded-full hover:bg-white/30 transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-white" />
          </button>
          <h1 className="text-xl font-bold text-white">Available Gigs</h1>
        </div>

        {/* Filter Pills */}
        <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
          {[
            { key: 'all', label: 'All' },
            { key: 'quick', label: '⚡ Quick (15min)' },
            { key: 'medium', label: '⏱ Medium (30min)' },
            { key: 'big', label: '🎯 Big Jobs' },
          ].map(f => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key as typeof filter)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                filter === f.key
                  ? 'bg-white text-purple-600 shadow-lg'
                  : 'bg-white/20 text-white hover:bg-white/30'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Tier Info */}
        <div className="bg-white/20 rounded-xl p-3 mb-4 text-white text-sm flex items-center gap-2">
          <Filter className="w-4 h-4" />
          <span>Showing Tier {kid.max_gig_tier} and below</span>
        </div>

        {/* Gigs List */}
        <div className="space-y-3">
          {filteredGigs.length > 0 ? (
            filteredGigs.map(gig => (
              <a
                key={gig.id}
                href={`/kid-dashboard/gigs/${gig.id}`}
                className="block bg-white rounded-2xl p-4 shadow-lg hover:scale-[1.02] transition-all"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
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
                    <h3 className="font-bold text-gray-900 mb-1">{gig.title}</h3>
                    <p className="text-sm text-gray-600 line-clamp-2">{gig.description}</p>
                    <div className="flex items-center gap-3 mt-2 text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        <span>~{gig.estimated_minutes} min</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <div className="flex items-center gap-1 bg-yellow-100 px-3 py-1 rounded-full">
                      <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                      <span className="font-bold text-yellow-700">{gig.stars}</span>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  </div>
                </div>
              </a>
            ))
          ) : (
            <div className="bg-white rounded-2xl p-8 shadow-lg text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Briefcase className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-gray-600">
                {filter === 'all'
                  ? 'No gigs available right now. Check back later!'
                  : 'No gigs match this filter. Try a different one!'}
              </p>
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
