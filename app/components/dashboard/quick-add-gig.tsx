'use client'

import { useState } from 'react'
import { Plus, X, Check, Briefcase, Star, Clock, Loader2 } from 'lucide-react'

interface QuickAddGigProps {
  kidId: string
  kidName: string
  onGigAdded?: () => void
}

const presetGigs = [
  { title: 'Help with dinner prep', stars: 5, minutes: 15 },
  { title: 'Clean up the playroom', stars: 8, minutes: 20 },
  { title: 'Fold and put away laundry', stars: 10, minutes: 25 },
  { title: 'Wash the car', stars: 15, minutes: 30 },
  { title: 'Organize the pantry', stars: 12, minutes: 30 },
]

export default function QuickAddGig({ kidId, kidName, onGigAdded }: QuickAddGigProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [stars, setStars] = useState(5)
  const [estimatedMinutes, setEstimatedMinutes] = useState<number | null>(null)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [showCustom, setShowCustom] = useState(false)

  const handleSubmit = async (preset?: { title: string; stars: number; minutes?: number }) => {
    const finalTitle = preset?.title || title.trim()
    const finalStars = preset?.stars || stars
    const finalMinutes = preset?.minutes || estimatedMinutes

    if (!finalTitle) return

    setSaving(true)
    try {
      const res = await fetch('/api/adhoc-gigs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kidId,
          title: finalTitle,
          description: description.trim() || null,
          stars: finalStars,
          estimated_minutes: finalMinutes,
        })
      })

      if (res.ok) {
        setSuccess(true)
        setTimeout(() => {
          setSuccess(false)
          setIsOpen(false)
          setTitle('')
          setDescription('')
          setStars(5)
          setEstimatedMinutes(null)
          setShowCustom(false)
          onGigAdded?.()
        }, 1500)
      }
    } catch (error) {
      console.error('Failed to add gig:', error)
    } finally {
      setSaving(false)
    }
  }

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-3 py-2 text-sm text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
      >
        <Briefcase className="w-4 h-4" />
        Add Gig
      </button>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-purple-500" />
            {success ? 'Gig Assigned!' : `Assign Gig to ${kidName}`}
          </h3>
          <button
            onClick={() => setIsOpen(false)}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        {success ? (
          <div className="p-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="w-8 h-8 text-green-600" />
            </div>
            <p className="text-gray-600">Gig has been assigned to {kidName}!</p>
            <p className="text-sm text-gray-500 mt-2">They&apos;ll get a notification.</p>
          </div>
        ) : showCustom ? (
          <div className="p-4 space-y-4">
            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Gig Title *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Help organize the garage"
                autoFocus
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description (Optional)
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Any additional details..."
                rows={2}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
              />
            </div>

            {/* Stars and Time */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Stars
                </label>
                <div className="flex items-center gap-2">
                  <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                  <input
                    type="number"
                    min="1"
                    max="50"
                    value={stars}
                    onChange={(e) => setStars(parseInt(e.target.value) || 5)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Est. Minutes
                </label>
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-gray-400" />
                  <input
                    type="number"
                    min="5"
                    max="120"
                    value={estimatedMinutes || ''}
                    onChange={(e) => setEstimatedMinutes(e.target.value ? parseInt(e.target.value) : null)}
                    placeholder="Optional"
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowCustom(false)}
                className="flex-1 py-3 bg-gray-100 text-gray-700 font-semibold rounded-xl hover:bg-gray-200"
              >
                Back
              </button>
              <button
                onClick={() => handleSubmit()}
                disabled={!title.trim() || saving}
                className="flex-1 py-3 bg-purple-600 text-white font-semibold rounded-xl hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Assigning...
                  </>
                ) : (
                  'Assign Gig'
                )}
              </button>
            </div>
          </div>
        ) : (
          <div className="p-4">
            <p className="text-sm text-gray-600 mb-4">Choose a preset or create custom:</p>

            {/* Preset Gigs */}
            <div className="space-y-2 mb-4">
              {presetGigs.map((gig, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSubmit(gig)}
                  disabled={saving}
                  className="w-full p-3 text-left bg-purple-50 hover:bg-purple-100 rounded-xl transition-colors disabled:opacity-50"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-purple-800">{gig.title}</span>
                    <div className="flex items-center gap-3 text-sm">
                      {gig.minutes && (
                        <span className="text-gray-500">{gig.minutes}m</span>
                      )}
                      <span className="flex items-center gap-1 text-yellow-600 font-semibold">
                        <Star className="w-4 h-4 fill-current" />
                        {gig.stars}
                      </span>
                    </div>
                  </div>
                </button>
              ))}
            </div>

            {/* Custom Button */}
            <button
              onClick={() => setShowCustom(true)}
              className="w-full p-3 text-center bg-gray-100 hover:bg-gray-200 rounded-xl text-gray-700 font-medium transition-colors"
            >
              <Plus className="w-4 h-4 inline mr-2" />
              Create custom gig
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
