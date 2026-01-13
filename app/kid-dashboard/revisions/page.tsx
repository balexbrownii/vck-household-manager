'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft,
  Camera,
  Sparkles,
  AlertCircle,
  Send,
  Hand,
  Loader2,
  CheckCircle2,
  X,
  RefreshCw,
} from 'lucide-react'
import { LoadingSpinner } from '@/components/ui/shared'

interface Kid {
  id: string
  name: string
}

interface RevisionItem {
  id: string
  entity_type: 'gig' | 'chore' | 'expectation'
  entity_id: string
  ai_feedback: string | null
  notes: string | null
  photoUrl: string | null
  submission_attempt: number
  entityDetails: {
    title?: string
    room_name?: string
    assignment?: string
    expectation_type?: string
    scope_description?: string
    stars?: number
  } | null
}

export default function RevisionsPage() {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [kid, setKid] = useState<Kid | null>(null)
  const [loading, setLoading] = useState(true)
  const [revisions, setRevisions] = useState<RevisionItem[]>([])
  const [selectedItem, setSelectedItem] = useState<RevisionItem | null>(null)
  const [newPhoto, setNewPhoto] = useState<File | null>(null)
  const [newPhotoPreview, setNewPhotoPreview] = useState<string | null>(null)
  const [newNotes, setNewNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [escalating, setEscalating] = useState(false)
  const [success, setSuccess] = useState<'resubmit' | 'escalate' | null>(null)
  const [error, setError] = useState('')

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

      // Load revisions
      const revisionsRes = await fetch('/api/photos/kid-revisions')
      if (revisionsRes.ok) {
        const data = await revisionsRes.json()
        setRevisions(data.submissions || [])
      }
    } catch {
      router.push('/kid-login')
    } finally {
      setLoading(false)
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/heic']
    if (!allowedTypes.includes(file.type)) {
      setError('Please select a valid image (JPEG, PNG, or WebP)')
      return
    }

    if (file.size > 10 * 1024 * 1024) {
      setError('Image is too large. Maximum size is 10MB.')
      return
    }

    setNewPhoto(file)
    setError('')

    const reader = new FileReader()
    reader.onload = () => {
      setNewPhotoPreview(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  const handleResubmit = async () => {
    if (!selectedItem || !newPhoto) {
      setError('Please take a new photo')
      return
    }

    if (!newNotes.trim() || newNotes.trim().length < 10) {
      setError('Please describe what you fixed (at least 10 characters)')
      return
    }

    setSubmitting(true)
    setError('')

    try {
      const formData = new FormData()
      formData.append('photo', newPhoto)
      formData.append('originalPhotoId', selectedItem.id)
      formData.append('notes', newNotes.trim())

      const res = await fetch('/api/photos/resubmit', {
        method: 'POST',
        body: formData,
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Failed to resubmit')
        return
      }

      setSuccess('resubmit')

      // Remove from list if passed AI review
      if (data.photo?.status !== 'needs_revision') {
        setRevisions(prev => prev.filter(r => r.id !== selectedItem.id))
      }

      setTimeout(() => {
        setSuccess(null)
        setSelectedItem(null)
        resetForm()
        checkSessionAndLoadData() // Refresh the list
      }, 2500)
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleEscalate = async () => {
    if (!selectedItem) return

    setEscalating(true)
    setError('')

    try {
      const res = await fetch('/api/photos/escalate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ photoId: selectedItem.id }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Failed to escalate')
        return
      }

      setSuccess('escalate')
      setRevisions(prev => prev.filter(r => r.id !== selectedItem.id))

      setTimeout(() => {
        setSuccess(null)
        setSelectedItem(null)
        resetForm()
      }, 2500)
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setEscalating(false)
    }
  }

  const resetForm = () => {
    setNewPhoto(null)
    setNewPhotoPreview(null)
    setNewNotes('')
    setError('')
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const getItemTitle = (item: RevisionItem): string => {
    if (!item.entityDetails) return 'Unknown Task'

    if (item.entity_type === 'gig') {
      return item.entityDetails.title || 'Gig'
    } else if (item.entity_type === 'chore') {
      return item.entityDetails.room_name || 'Chore'
    } else if (item.entity_type === 'expectation') {
      const types: Record<string, string> = {
        exercise: 'Exercise',
        reading: 'Reading',
        tidy_up: 'Tidy Up',
        daily_chore: 'Daily Chore',
      }
      return types[item.entityDetails.expectation_type || ''] || 'Expectation'
    }
    return 'Task'
  }

  if (loading) {
    return (
      <main className="kid-page bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </main>
    )
  }

  if (success) {
    return (
      <main className={`kid-page flex items-center justify-center ${
        success === 'resubmit'
          ? 'bg-gradient-to-br from-green-400 to-green-600'
          : 'bg-gradient-to-br from-blue-400 to-blue-600'
      }`}>
        <div className="bg-white rounded-2xl p-8 shadow-xl text-center max-w-md mx-4">
          <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 ${
            success === 'resubmit' ? 'bg-green-100' : 'bg-blue-100'
          }`}>
            {success === 'resubmit' ? (
              <CheckCircle2 className="w-10 h-10 text-green-600" />
            ) : (
              <Hand className="w-10 h-10 text-blue-600" />
            )}
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {success === 'resubmit' ? 'Resubmitted!' : 'Sent to Parents!'}
          </h1>
          <p className="text-gray-600">
            {success === 'resubmit'
              ? 'Your new photo is being reviewed.'
              : 'Your parents will review your work directly.'}
          </p>
        </div>
      </main>
    )
  }

  // Detail view for selected item
  if (selectedItem) {
    return (
      <main className="kid-page bg-gradient-to-br from-orange-400 to-orange-600 no-pull-refresh">
        <div className="max-w-lg mx-auto">
          {/* Header */}
          <div className="flex items-center gap-4 mb-6">
            <button
              onClick={() => {
                setSelectedItem(null)
                resetForm()
              }}
              className="p-2 bg-white/20 rounded-full hover:bg-white/30 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-white" />
            </button>
            <h1 className="text-xl font-bold text-white">Fix & Resubmit</h1>
          </div>

          {/* Task Info */}
          <div className="bg-white rounded-2xl p-6 mb-4 shadow-lg">
            <h2 className="text-lg font-bold text-gray-900 mb-2">
              {getItemTitle(selectedItem)}
            </h2>
            <p className="text-sm text-gray-500 capitalize mb-4">
              {selectedItem.entity_type} • Attempt #{selectedItem.submission_attempt}
            </p>

            {/* Original Photo */}
            {selectedItem.photoUrl && (
              <div className="mb-4">
                <p className="text-xs text-gray-500 mb-2">Your previous submission:</p>
                <img
                  src={selectedItem.photoUrl}
                  alt="Previous submission"
                  className="w-full rounded-xl object-cover max-h-40 opacity-75"
                />
              </div>
            )}

            {/* AI Feedback */}
            {selectedItem.ai_feedback && (
              <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
                <div className="flex items-start gap-2">
                  <Sparkles className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-orange-800 text-sm mb-1">
                      AI Feedback
                    </p>
                    <p className="text-gray-700 text-sm">{selectedItem.ai_feedback}</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Take New Photo */}
          <div className="bg-white rounded-2xl p-6 mb-4 shadow-lg">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Camera className="w-5 h-5 text-purple-600" />
              Take a New Photo
            </h3>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleFileSelect}
              className="hidden"
            />

            {newPhotoPreview ? (
              <div className="relative">
                <img
                  src={newPhotoPreview}
                  alt="New submission preview"
                  className="w-full rounded-xl object-cover max-h-48"
                />
                <button
                  onClick={() => {
                    setNewPhoto(null)
                    setNewPhotoPreview(null)
                    if (fileInputRef.current) fileInputRef.current.value = ''
                  }}
                  className="absolute top-2 right-2 p-2 bg-red-500 rounded-full text-white hover:bg-red-600 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full py-10 border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center gap-3 hover:border-purple-400 hover:bg-purple-50 transition-all"
              >
                <div className="w-14 h-14 bg-purple-100 rounded-full flex items-center justify-center">
                  <Camera className="w-7 h-7 text-purple-600" />
                </div>
                <span className="text-gray-600 font-medium">Tap to take a new photo</span>
              </button>
            )}
          </div>

          {/* Describe What You Fixed */}
          <div className="bg-white rounded-2xl p-6 mb-4 shadow-lg">
            <h3 className="text-lg font-bold text-gray-900 mb-2 flex items-center gap-2">
              <RefreshCw className="w-5 h-5 text-purple-600" />
              What Did You Fix?
            </h3>
            <p className="text-sm text-gray-500 mb-4">
              Explain what changes you made based on the feedback.
            </p>
            <textarea
              value={newNotes}
              onChange={e => setNewNotes(e.target.value)}
              placeholder='Example: "I fixed the things AI mentioned. I wiped the counter again and put the dishes in the dishwasher."'
              className={`w-full p-3 border-2 rounded-xl resize-none h-24 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                newNotes.trim().length >= 10 ? 'border-green-300' : 'border-gray-200'
              }`}
            />
            <p className="text-xs text-gray-400 mt-2">
              {newNotes.trim().length >= 10 ? (
                <span className="text-green-600">Good explanation!</span>
              ) : (
                `${Math.max(0, 10 - newNotes.trim().length)} more characters needed`
              )}
            </p>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-4 p-4 bg-red-100 border border-red-300 text-red-700 rounded-xl text-sm">
              {error}
            </div>
          )}

          {/* Action Buttons */}
          <div className="space-y-3">
            <button
              onClick={handleResubmit}
              disabled={!newPhoto || newNotes.trim().length < 10 || submitting}
              className="w-full py-4 bg-white rounded-2xl font-bold text-lg shadow-lg disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.02] transition-all flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Submitting...</span>
                </>
              ) : (
                <>
                  <Send className="w-5 h-5 text-purple-600" />
                  <span className="text-purple-600">Resubmit for Review</span>
                </>
              )}
            </button>

            <button
              onClick={handleEscalate}
              disabled={escalating}
              className="w-full py-3 bg-white/20 rounded-2xl font-medium text-white hover:bg-white/30 transition-all flex items-center justify-center gap-2"
            >
              {escalating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Sending...</span>
                </>
              ) : (
                <>
                  <Hand className="w-4 h-4" />
                  <span>Ask Parent to Review Instead</span>
                </>
              )}
            </button>
          </div>
        </div>
      </main>
    )
  }

  // List view
  return (
    <main className="kid-page bg-gradient-to-br from-orange-400 to-orange-600">
      <div className="max-w-lg mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => router.push('/kid-dashboard')}
            className="p-2 bg-white/20 rounded-full hover:bg-white/30 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-white">Needs Revision</h1>
            <p className="text-white/80 text-sm">
              {revisions.length} item{revisions.length !== 1 ? 's' : ''} to fix
            </p>
          </div>
        </div>

        {revisions.length > 0 ? (
          <div className="space-y-3">
            {revisions.map(item => (
              <button
                key={item.id}
                onClick={() => setSelectedItem(item)}
                className="w-full bg-white rounded-2xl p-4 shadow-lg text-left hover:scale-[1.02] transition-all"
              >
                <div className="flex items-start gap-4">
                  {/* Thumbnail */}
                  {item.photoUrl && (
                    <img
                      src={item.photoUrl}
                      alt="Submission"
                      className="w-16 h-16 rounded-xl object-cover flex-shrink-0"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-gray-900 mb-1">
                      {getItemTitle(item)}
                    </h3>
                    <p className="text-xs text-gray-500 capitalize mb-2">
                      {item.entity_type} • Attempt #{item.submission_attempt}
                    </p>
                    {item.ai_feedback && (
                      <div className="flex items-start gap-1.5">
                        <AlertCircle className="w-4 h-4 text-orange-500 flex-shrink-0 mt-0.5" />
                        <p className="text-sm text-gray-600 line-clamp-2">
                          {item.ai_feedback}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-2xl p-8 shadow-lg text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">All Caught Up!</h2>
            <p className="text-gray-600">
              No submissions need revision right now.
            </p>
            <button
              onClick={() => router.push('/kid-dashboard')}
              className="mt-6 px-6 py-3 bg-purple-600 text-white rounded-xl font-semibold hover:bg-purple-700 transition-colors"
            >
              Back to Dashboard
            </button>
          </div>
        )}
      </div>
    </main>
  )
}
