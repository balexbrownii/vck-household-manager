'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft,
  Loader2,
  CheckCircle2,
  Circle,
  Clock,
  Camera,
} from 'lucide-react'

interface Kid {
  id: string
  name: string
}

interface ChoreAssignment {
  assignment: string
  week: string
}

interface Chore {
  id: string
  completionId: string
  name: string
  description: string
  category: string
  completed: boolean
  verified: boolean
}

export default function ChoresPage() {
  const router = useRouter()
  const [kid, setKid] = useState<Kid | null>(null)
  const [loading, setLoading] = useState(true)
  const [choreAssignment, setChoreAssignment] = useState<ChoreAssignment | null>(null)
  const [chores, setChores] = useState<Chore[]>([])

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

      // Load chore assignment and today's chores
      const [assignmentRes, choresRes] = await Promise.all([
        fetch(`/api/chores/assignments?kidId=${sessionData.kid.id}`).catch(() => null),
        fetch(`/api/chores/today?kidId=${sessionData.kid.id}`).catch(() => null),
      ])

      if (assignmentRes?.ok) {
        const data = await assignmentRes.json()
        setChoreAssignment(data.assignment || null)
      }

      if (choresRes?.ok) {
        const data = await choresRes.json()
        setChores(data.chores || [])
      }
    } catch {
      router.push('/kid-login')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-blue-400 via-cyan-500 to-teal-500 flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-white animate-spin" />
      </main>
    )
  }

  if (!kid) return null

  const completedCount = chores.filter(c => c.completed).length
  const totalCount = chores.length
  const allDone = totalCount > 0 && completedCount === totalCount

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-400 via-cyan-500 to-teal-500 p-4">
      <div className="max-w-lg mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => router.push('/kid-dashboard')}
            className="p-2 bg-white/20 rounded-full hover:bg-white/30 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
          <h1 className="text-xl font-bold text-white">My Chores</h1>
        </div>

        {/* Assignment Header */}
        {choreAssignment && (
          <div className="bg-white rounded-2xl p-6 mb-4 shadow-lg">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <Clock className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">
                  {choreAssignment.assignment}
                </h2>
                <p className="text-sm text-gray-500">This week&apos;s rotation</p>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="mb-2">
              <div className="flex justify-between text-sm text-gray-600 mb-1">
                <span>Today&apos;s Progress</span>
                <span>{completedCount}/{totalCount} done</span>
              </div>
              <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-blue-400 to-teal-400 rounded-full transition-all"
                  style={{ width: totalCount > 0 ? `${(completedCount / totalCount) * 100}%` : '0%' }}
                />
              </div>
            </div>
          </div>
        )}

        {/* All Done Message */}
        {allDone && (
          <div className="bg-green-100 border-2 border-green-300 rounded-2xl p-6 mb-4 text-center">
            <div className="text-4xl mb-2">🎉</div>
            <h3 className="text-lg font-bold text-green-700 mb-1">
              All chores done!
            </h3>
            <p className="text-green-600 text-sm">
              Great job today! You&apos;re all set.
            </p>
          </div>
        )}

        {/* Chores List */}
        <div className="bg-white rounded-2xl p-6 shadow-lg">
          <h3 className="font-bold text-gray-900 mb-4">Today&apos;s Tasks</h3>

          {chores.length > 0 ? (
            <div className="space-y-3">
              {chores.map(chore => (
                <div
                  key={chore.id}
                  className={`flex items-start gap-3 p-4 rounded-xl transition-all ${
                    chore.completed
                      ? 'bg-green-50 border-2 border-green-200'
                      : 'bg-gray-50 border-2 border-gray-100'
                  }`}
                >
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                    chore.completed
                      ? 'bg-green-500'
                      : 'border-2 border-gray-300'
                  }`}>
                    {chore.completed && (
                      <CheckCircle2 className="w-4 h-4 text-white" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className={`font-medium ${
                      chore.completed ? 'text-green-700 line-through' : 'text-gray-900'
                    }`}>
                      {chore.name}
                    </div>
                    {chore.description && (
                      <div className="text-sm text-gray-500 mt-1">
                        {chore.description}
                      </div>
                    )}
                    {chore.category && (
                      <div className="text-xs text-gray-400 mt-1 capitalize">
                        {chore.category}
                      </div>
                    )}
                    {chore.verified && (
                      <div className="flex items-center gap-1 mt-2 text-xs text-green-600">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Verified by parent</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Circle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No chores assigned for today.</p>
            </div>
          )}
        </div>

        {/* Submit Work Button */}
        {chores.some(c => !c.completed) && (
          <a
            href="/kid-dashboard/submit"
            className="fixed bottom-4 left-4 right-4 max-w-lg mx-auto py-4 bg-white rounded-2xl font-bold text-lg text-blue-600 shadow-lg flex items-center justify-center gap-2 hover:scale-[1.02] transition-all"
          >
            <Camera className="w-5 h-5" />
            Submit Completed Chore
          </a>
        )}
      </div>
    </main>
  )
}
