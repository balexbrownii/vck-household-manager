'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import {
  Camera,
  ArrowLeft,
  Loader2,
  CheckCircle2,
  Upload,
  X,
  Briefcase,
  Clock,
  Star,
} from 'lucide-react'

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

    setSubmitting(true)
    setError('')

    try {
      const formData = new FormData()
      formData.append('photo', photo)
      formData.append('entityType', selectedItem.type)
      formData.append('entityId', selectedItem.id)
      if (notes) {
        formData.append('notes', notes)
      }

      const res = await fetch('/api/photos/upload', {
        method: 'POST',
        body: formData,
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Failed to submit')
        return
      }

      setSuccess(true)

      // Reset after delay
      setTimeout(() => {
        router.push('/kid-dashboard')
      }, 2000)
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-purple-400 via-pink-500 to-red-500 flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-white animate-spin" />
      </main>
    )
  }

  if (success) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-8 shadow-xl text-center max-w-md">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-10 h-10 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Submitted!</h1>
          <p className="text-gray-600">
            Your work has been sent for parent review. Great job!
          </p>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-purple-400 via-pink-500 to-red-500 p-4">
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

        {/* Step 3: Add Notes (Optional) */}
        <div className="bg-white rounded-2xl p-6 mb-4 shadow-lg">
          <h2 className="text-lg font-bold text-gray-900 mb-4">
            3. Add notes (optional)
          </h2>
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="Anything you want to tell your parents about this work?"
            className="w-full p-3 border border-gray-300 rounded-xl resize-none h-24 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
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
          disabled={!selectedItem || !photo || submitting}
          className="w-full py-4 bg-white rounded-2xl font-bold text-lg shadow-lg disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.02] transition-all flex items-center justify-center gap-2"
        >
          {submitting ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Submitting...</span>
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
