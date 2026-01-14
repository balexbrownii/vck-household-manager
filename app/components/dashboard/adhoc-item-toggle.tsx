'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Star, Sparkles, Music, BookOpen, Dumbbell, Clock, ListTodo, CheckCircle2, Circle } from 'lucide-react'

const iconMap: Record<string, typeof Star> = {
  star: Star,
  sparkles: Sparkles,
  music: Music,
  book: BookOpen,
  dumbbell: Dumbbell,
  clock: Clock,
}

interface AdhocItemToggleProps {
  id: string
  type: 'expectation' | 'chore'
  title: string
  description: string | null
  isComplete: boolean
  icon?: string
  checklist?: string[]
}

export default function AdhocItemToggle({
  id,
  type,
  title,
  description,
  isComplete,
  icon = 'star',
  checklist,
}: AdhocItemToggleProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [complete, setComplete] = useState(isComplete)

  const handleToggle = async () => {
    setLoading(true)
    try {
      const endpoint = type === 'expectation'
        ? '/api/adhoc-expectations'
        : '/api/adhoc-chores'

      const bodyKey = type === 'expectation' ? 'expectationId' : 'choreId'

      const res = await fetch(endpoint, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [bodyKey]: id, completed: !complete })
      })

      if (res.ok) {
        setComplete(!complete)
        router.refresh()
      }
    } catch (error) {
      console.error('Failed to toggle:', error)
    } finally {
      setLoading(false)
    }
  }

  const Icon = type === 'chore' ? ListTodo : (iconMap[icon] || Star)

  return (
    <button
      onClick={handleToggle}
      disabled={loading}
      className={`w-full flex items-center gap-4 p-4 rounded-xl border transition-all ${
        complete
          ? 'bg-green-50 border-green-200'
          : 'bg-white border-gray-200 hover:border-purple-300 hover:shadow-sm'
      } ${loading ? 'opacity-50' : ''}`}
    >
      {/* Status Icon */}
      <div className={`flex-shrink-0 ${complete ? 'text-green-500' : 'text-gray-300'}`}>
        {complete ? (
          <CheckCircle2 className="w-6 h-6" />
        ) : (
          <Circle className="w-6 h-6" />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 text-left">
        <div className={`font-medium flex items-center gap-2 ${complete ? 'text-green-700' : 'text-gray-900'}`}>
          <Icon className={`w-4 h-4 ${type === 'chore' ? 'text-indigo-500' : 'text-purple-500'}`} />
          {title}
          <span className={`text-xs px-2 py-0.5 rounded-full ${
            type === 'chore'
              ? 'bg-indigo-100 text-indigo-600'
              : 'bg-purple-100 text-purple-600'
          }`}>
            {type === 'chore' ? 'Ad-hoc' : 'Added'}
          </span>
        </div>
        {description && (
          <p className={`text-sm mt-1 ${complete ? 'text-green-600' : 'text-gray-500'}`}>
            {description}
          </p>
        )}
        {checklist && checklist.length > 0 && (
          <ul className={`text-sm mt-2 space-y-1 ${complete ? 'text-green-600' : 'text-gray-500'}`}>
            {checklist.map((item, idx) => (
              <li key={idx} className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-current" />
                {item}
              </li>
            ))}
          </ul>
        )}
      </div>
    </button>
  )
}
