'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import {
  Camera,
  ArrowLeft,
  CheckCircle2,
  Upload,
  X,
  Briefcase,
  Clock,
  Star,
  Loader2,
  Sparkles,
  AlertCircle,
  MessageSquare,
} from 'lucide-react'
import { LoadingSpinner } from '@/components/ui/shared'

interface Kid {
  id: string
  name: string
}

interface WorkItem {
  id: string
  type: 'gig' | 'chore' | 'expectation'
  title: string
  description?: string
  stars?: number
}

interface SubmissionResult {
  photo: {
    id: string
    status: string
    ai_feedback: string | null
  }
}

// Helper to get context-aware placeholder for notes
function getNotesPlaceholder(type?: string): string {
  switch (type) {
    case 'gig':
      return 'Example: "I finished washing the car. I scrubbed all the doors and windows, and rinsed everything off."'
    case 'chore':
      return 'Example: "I cleaned my room. I made my bed, picked up clothes, and vacuumed the floor."'
    case 'expectation':
      return 'Example: "I did 20 minutes of exercise. I ran around the block twice and did jumping jacks."'
    default:
      return 'Describe what you did and how you did it...'
  }
}

// Helper to get hint text based on task type
function getExampleHint(type?: string): string {
  switch (type) {
    case 'gig':
      return 'What steps did you complete?'
    case 'chore':
      return 'What did you clean/organize?'
    case 'expectation':
      return 'How long? What activity?'
    default:
      return ''
  }
}

export default function SubmitWorkPage() {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [kid, setKid] = useState<Kid | null>(null)
  const [loading, setLoading] = useState(true)
  const [workItems, setWorkItems] = useState<WorkItem[]>([])
  const [selectedItem, setSelectedItem] = useState<WorkItem | null>(null)
  const [photo, setPhoto] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [submissionResult, setSubmissionResult] = useState<SubmissionResult | null>(null)
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

      // Load active gigs and chores for this kid
      const [gigsRes, choresRes] = await Promise.all([
        fetch(`/api/gigs/claimed?kidId=${sessionData.kid.id}`).catch(() => null),
        fetch(`/api/chores/today?kidId=${sessionData.kid.id}`).catch(() => null),
      ])

      const items: WorkItem[] = []

      if (gigsRes?.ok) {
        const gigsData = await gigsRes.json()
        if (gigsData.gigs) {
          items.push(
            ...gigsData.gigs.map((g: { id: string; title: string; description: string; stars: number }) => ({
              id: g.id,
              type: 'gig' as const,
              title: g.title,
              description: g.description,
              stars: g.stars,
            }))
          )
        }
      }

      if (choresRes?.ok) {
        const choresData = await choresRes.json()
        if (choresData.chores) {
          items.push(
            ...choresData.chores.map((c: { id: string; name: string; description: string }) => ({
              id: c.id,
              type: 'chore' as const,
              title: c.name,
              description: c.description,
            }))
          )
        }
      }

      setWorkItems(items)
    } catch {
      router.push('/kid-login')
    } finally {
      setLoading(false)
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/heic']
    if (!allowedTypes.includes(file.type)) {
      setError('Please select a valid image (JPEG, PNG, or WebP)')
      return
    }

    // Validate file size (10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError('Image is too large. Maximum size is 10MB.')
      return
    }

    setPhoto(file)
    setError('')

    // Create preview
    const reader = new FileReader()
    reader.onload = () => {
      setPhotoPreview(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  const handleCameraClick = () => {
    fileInputRef.current?.click()
  }

  const handleRemovePhoto = () => {
    setPhoto(null)
    setPhotoPreview(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleSubmit = async () => {
    if (!selectedItem || !photo) {
      setError('Please select a task and take a photo')
      return
    }

    // Notes are now required
    if (!notes.trim()) {
      setError('Please describe what you did - this helps with review!')
      return
    }

    if (notes.trim().length < 10) {
      setError('Please add a bit more detail about what you did')
      return
    }

    setSubmitting(true)
    setError('')

    try {
      const formData = new FormData()
      formData.append('photo', photo)
      formData.append('entityType', selectedItem.type)
      formData.append('entityId', selectedItem.id)
      formData.append('notes', notes.trim())

      const res = await fetch('/api/photos/upload', {
        method: 'POST',
        body: formData,
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Failed to submit')
        return
      }

      setSubmissionResult(data)
      setSuccess(true)

      // For needs_revision, don't auto-redirect - let kid see feedback
      if (data.photo?.status !== 'needs_revision') {
        setTimeout(() => {
          router.push('/kid-dashboard')
        }, 3000)
      }
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <main className="kid-page bg-gradient-to-br from-purple-400 via-pink-500 to-red-500 flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </main>
    )
  }

  if (success && submissionResult) {
    const status = submissionResult.photo?.status
    const feedback = submissionResult.photo?.ai_feedback

    // AI needs revision - show feedback and options
    if (status === 'needs_revision') {
      return (
        <main className="kid-page bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-8 shadow-xl text-center max-w-md mx-4">
            <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-10 h-10 text-orange-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Almost There!</h1>
            <p className="text-gray-600 mb-4">
              The AI reviewer has some suggestions:
            </p>
            {feedback && (
              <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 mb-6 text-left">
                <div className="flex items-start gap-2">
                  <Sparkles className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />
                  <p className="text-gray-700 text-sm">{feedback}</p>
                </div>
              </div>
            )}
            <div className="space-y-3">
              <button
                onClick={() => router.push('/kid-dashboard/revisions')}
                className="w-full py-3 bg-purple-600 text-white rounded-xl font-semibold hover:bg-purple-700 transition-colors"
              >
                Fix and Resubmit
              </button>
              <button
                onClick={() => router.push('/kid-dashboard')}
                className="w-full py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition-colors"
              >
                Go Back Home
              </button>
            </div>
          </div>
        </main>
      )
    }

    // AI passed or pending parent review
    return (
      <main className="kid-page bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-8 shadow-xl text-center max-w-md mx-4">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-10 h-10 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {status === 'pending_review' ? 'Looks Great!' : 'Submitted!'}
          </h1>
          <p className="text-gray-600 mb-2">
            {status === 'pending_review'
              ? 'AI review passed! Sent to your parents for final approval.'
              : 'Your work has been sent for review. Great job!'}
          </p>
          {feedback && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-3 mt-4">
              <div className="flex items-start gap-2">
                <Sparkles className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                <p className="text-gray-600 text-sm">{feedback}</p>
              </div>
            </div>
          )}
          <p className="text-xs text-gray-400 mt-4">Returning to dashboard...</p>
        </div>
      </main>
    )
  }

  return (
    <main className="kid-page bg-gradient-to-br from-purple-400 via-pink-500 to-red-500 no-pull-refresh">
      <div className="max-w-lg mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => router.push('/kid-dashboard')}
            className="p-2 bg-white/20 rounded-full hover:bg-white/30 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
          <h1 className="text-xl font-bold text-white">Submit Work</h1>
        </div>

        {/* Step 1: Select Task */}
        <div className="bg-white rounded-2xl p-6 mb-4 shadow-lg">
          <h2 className="text-lg font-bold text-gray-900 mb-4">
            1. What did you complete?
          </h2>

          {workItems.length > 0 ? (
            <div className="space-y-3">
              {workItems.map(item => (
                <button
                  key={`${item.type}-${item.id}`}
                  onClick={() => setSelectedItem(item)}
                  className={`w-full p-4 rounded-xl text-left transition-all border-2 ${
                    selectedItem?.id === item.id && selectedItem?.type === item.type
                      ? 'border-purple-500 bg-purple-50'
                      : 'border-gray-200 hover:border-purple-300'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      item.type === 'gig' ? 'bg-purple-100' : 'bg-blue-100'
                    }`}>
                      {item.type === 'gig' ? (
                        <Briefcase className="w-5 h-5 text-purple-600" />
                      ) : (
                        <Clock className="w-5 h-5 text-blue-600" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">{item.title}</div>
                      <div className="text-sm text-gray-500 capitalize">{item.type}</div>
                    </div>
                    {item.stars && (
                      <div className="flex items-center gap-1 bg-yellow-100 px-2 py-1 rounded-full">
                        <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                        <span className="font-bold text-yellow-700 text-sm">{item.stars}</span>
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 text-gray-500">
              <p>No active tasks to submit.</p>
              <p className="text-sm mt-2">
                Claim a gig or check your chores first!
              </p>
            </div>
          )}
        </div>

        {/* Step 2: Take Photo */}
        <div className="bg-white rounded-2xl p-6 mb-4 shadow-lg">
          <h2 className="text-lg font-bold text-gray-900 mb-4">
            2. Take a photo of your work
          </h2>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleFileSelect}
            className="hidden"
          />

          {photoPreview ? (
            <div className="relative">
              <img
                src={photoPreview}
                alt="Preview"
                className="w-full rounded-xl object-cover max-h-64"
              />
              <button
                onClick={handleRemovePhoto}
                className="absolute top-2 right-2 p-2 bg-red-500 rounded-full text-white hover:bg-red-600 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={handleCameraClick}
              className="w-full py-12 border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center gap-3 hover:border-purple-400 hover:bg-purple-50 transition-all"
            >
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center">
                <Camera className="w-8 h-8 text-purple-600" />
              </div>
              <span className="text-gray-600 font-medium">Tap to take a photo</span>
            </button>
          )}
        </div>

        {/* Step 3: Describe What You Did (Required) */}
        <div className="bg-white rounded-2xl p-6 mb-4 shadow-lg">
          <h2 className="text-lg font-bold text-gray-900 mb-2 flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-purple-600" />
            3. Describe what you did
          </h2>
          <p className="text-sm text-gray-500 mb-4">
            Tell us what you did so we can check your work!
          </p>
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder={getNotesPlaceholder(selectedItem?.type)}
            className={`w-full p-3 border-2 rounded-xl resize-none h-28 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
              notes.trim().length > 0 && notes.trim().length < 10
                ? 'border-orange-300'
                : notes.trim().length >= 10
                ? 'border-green-300'
                : 'border-gray-200'
            }`}
          />
          <div className="flex justify-between items-center mt-2">
            <p className="text-xs text-gray-400">
              {notes.trim().length >= 10 ? (
                <span className="text-green-600">Good description!</span>
              ) : (
                `${Math.max(0, 10 - notes.trim().length)} more characters needed`
              )}
            </p>
            {selectedItem && (
              <p className="text-xs text-purple-500">
                {getExampleHint(selectedItem.type)}
              </p>
            )}
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-4 bg-red-100 border border-red-300 text-red-700 rounded-xl text-sm">
            {error}
          </div>
        )}

        {/* Submit Button */}
        <button
          onClick={handleSubmit}
          disabled={!selectedItem || !photo || notes.trim().length < 10 || submitting}
          className="w-full py-4 bg-white rounded-2xl font-bold text-lg shadow-lg disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.02] transition-all flex items-center justify-center gap-2"
        >
          {submitting ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Reviewing...</span>
            </>
          ) : (
            <>
              <Upload className="w-5 h-5" />
              <span className="text-purple-600">Submit for Review</span>
            </>
          )}
        </button>
      </div>
    </main>
  )
}
