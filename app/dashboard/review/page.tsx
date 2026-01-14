'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import PageHeader from '@/components/ui/page-header'
import {
  Camera,
  Loader2,
  CheckCircle,
  XCircle,
  Star,
  Image,
  MessageSquare,
  User,
  Clock,
  Briefcase,
  Sparkles,
  Hand,
  RefreshCw,
} from 'lucide-react'

interface Kid {
  id: string
  name: string
}

interface Submission {
  id: string
  entity_type: 'gig' | 'chore' | 'expectation'
  entity_id: string
  storage_path: string
  notes: string | null
  status: string
  uploaded_at: string
  photoUrl: string
  kids: Kid
  // AI fields
  ai_passed: boolean | null
  ai_feedback: string | null
  ai_confidence: number | null
  escalated_to_parent: boolean
  submission_attempt: number
  entityDetails: {
    title?: string
    name?: string
    stars?: number
  } | null
}

export default function ReviewPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null)
  const [reviewing, setReviewing] = useState(false)
  const [feedback, setFeedback] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    loadSubmissions()
  }, [])

  const loadSubmissions = async () => {
    try {
      const res = await fetch('/api/photos/pending')
      if (!res.ok) {
        if (res.status === 401) {
          router.push('/login')
          return
        }
        throw new Error('Failed to load submissions')
      }
      const data = await res.json()
      setSubmissions(data.submissions || [])
    } catch (err) {
      setError('Failed to load pending submissions')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleReview = async (action: 'approve' | 'reject') => {
    if (!selectedSubmission) return

    setReviewing(true)
    setError('')

    try {
      const res = await fetch(`/api/photos/${selectedSubmission.id}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, feedback: feedback || undefined }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Failed to review submission')
        return
      }

      // Remove from list and close modal
      setSubmissions(prev => prev.filter(s => s.id !== selectedSubmission.id))
      setSelectedSubmission(null)
      setFeedback('')
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setReviewing(false)
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-purple-600 animate-spin" />
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        <PageHeader
          title="Review Submissions"
          subtitle={`${submissions.length} pending ${submissions.length === 1 ? 'submission' : 'submissions'}`}
          backHref="/dashboard"
          backLabel="Back to Dashboard"
          icon={<Camera className="w-7 h-7 text-purple-600" />}
        />

        {error && (
          <div className="mb-4 p-4 bg-red-100 border border-red-300 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        {/* Submissions Grid */}
        {submissions.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {submissions.map(submission => (
              <button
                key={submission.id}
                onClick={() => setSelectedSubmission(submission)}
                className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow text-left"
              >
                {/* Photo Preview */}
                <div className="aspect-video bg-gray-100 relative">
                  <img
                    src={submission.photoUrl}
                    alt="Submission"
                    className="w-full h-full object-cover"
                  />
                  {/* Badges */}
                  <div className="absolute top-2 left-2 flex flex-col gap-1">
                    {/* AI Passed Badge */}
                    {submission.ai_passed && (
                      <div className="flex items-center gap-1 bg-green-100 text-green-700 px-2 py-1 rounded text-xs font-medium">
                        <Sparkles className="w-3 h-3" />
                        AI Passed
                      </div>
                    )}
                    {/* Escalated Badge */}
                    {submission.escalated_to_parent && (
                      <div className="flex items-center gap-1 bg-orange-100 text-orange-700 px-2 py-1 rounded text-xs font-medium">
                        <Hand className="w-3 h-3" />
                        Kid Request
                      </div>
                    )}
                    {/* Resubmission Badge */}
                    {submission.submission_attempt > 1 && (
                      <div className="flex items-center gap-1 bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs font-medium">
                        <RefreshCw className="w-3 h-3" />
                        Attempt #{submission.submission_attempt}
                      </div>
                    )}
                  </div>
                  <div className={`absolute top-2 right-2 px-2 py-1 rounded text-xs font-medium ${
                    submission.entity_type === 'gig'
                      ? 'bg-purple-100 text-purple-700'
                      : 'bg-blue-100 text-blue-700'
                  }`}>
                    {submission.entity_type}
                  </div>
                </div>

                {/* Info */}
                <div className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                      <User className="w-4 h-4 text-purple-600" />
                    </div>
                    <span className="font-medium text-gray-900">
                      {submission.kids.name}
                    </span>
                  </div>

                  <h3 className="font-semibold text-gray-900 mb-1">
                    {submission.entityDetails?.title || submission.entityDetails?.name || 'Unknown task'}
                  </h3>

                  {submission.entityDetails?.stars && (
                    <div className="flex items-center gap-1 text-yellow-600 mb-2">
                      <Star className="w-4 h-4 fill-yellow-500" />
                      <span className="text-sm font-medium">{submission.entityDetails.stars} stars</span>
                    </div>
                  )}

                  <div className="flex items-center gap-1 text-gray-500 text-sm">
                    <Clock className="w-4 h-4" />
                    <span>
                      {new Date(submission.uploaded_at).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        hour: 'numeric',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-xl p-12 text-center shadow-sm">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">All caught up!</h2>
            <p className="text-gray-600">No pending submissions to review.</p>
          </div>
        )}

        {/* Review Modal */}
        {selectedSubmission && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
              {/* Photo */}
              <div className="aspect-video bg-gray-100 relative">
                <img
                  src={selectedSubmission.photoUrl}
                  alt="Submission"
                  className="w-full h-full object-contain"
                />
                <button
                  onClick={() => {
                    setSelectedSubmission(null)
                    setFeedback('')
                  }}
                  className="absolute top-4 right-4 p-2 bg-white rounded-full shadow-lg hover:bg-gray-100"
                >
                  <XCircle className="w-5 h-5 text-gray-600" />
                </button>
              </div>

              {/* Details */}
              <div className="p-6">
                {/* Kid & Task Info */}
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                    <span className="text-lg font-bold text-purple-600">
                      {selectedSubmission.kids.name.charAt(0)}
                    </span>
                  </div>
                  <div>
                    <div className="font-bold text-gray-900">{selectedSubmission.kids.name}</div>
                    <div className="text-sm text-gray-500 capitalize">{selectedSubmission.entity_type}</div>
                  </div>
                </div>

                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  {selectedSubmission.entityDetails?.title || selectedSubmission.entityDetails?.name}
                </h3>

                {selectedSubmission.entityDetails?.stars && (
                  <div className="flex items-center gap-2 mb-4">
                    <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                    <span className="font-medium text-yellow-700">
                      {selectedSubmission.entityDetails.stars} stars to award
                    </span>
                  </div>
                )}

                {/* AI Review Info */}
                {(selectedSubmission.ai_passed !== null || selectedSubmission.escalated_to_parent) && (
                  <div className={`rounded-lg p-4 mb-4 ${
                    selectedSubmission.ai_passed
                      ? 'bg-green-50 border border-green-200'
                      : selectedSubmission.escalated_to_parent
                      ? 'bg-orange-50 border border-orange-200'
                      : 'bg-gray-50 border border-gray-200'
                  }`}>
                    <div className="flex items-start gap-3">
                      {selectedSubmission.ai_passed ? (
                        <Sparkles className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                      ) : selectedSubmission.escalated_to_parent ? (
                        <Hand className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
                      ) : (
                        <Sparkles className="w-5 h-5 text-gray-600 flex-shrink-0 mt-0.5" />
                      )}
                      <div className="flex-1">
                        <div className="font-medium text-gray-900 text-sm mb-1">
                          {selectedSubmission.ai_passed
                            ? 'AI Review: Passed'
                            : selectedSubmission.escalated_to_parent
                            ? 'Kid requested direct parent review'
                            : 'AI Review Skipped'}
                          {selectedSubmission.ai_confidence && (
                            <span className="text-gray-500 font-normal ml-2">
                              ({Math.round(selectedSubmission.ai_confidence * 100)}% confidence)
                            </span>
                          )}
                        </div>
                        {selectedSubmission.ai_feedback && (
                          <p className="text-sm text-gray-600">{selectedSubmission.ai_feedback}</p>
                        )}
                        {selectedSubmission.submission_attempt > 1 && (
                          <p className="text-xs text-gray-500 mt-1">
                            This is submission attempt #{selectedSubmission.submission_attempt}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Kid's Notes */}
                {selectedSubmission.notes && (
                  <div className="bg-gray-50 rounded-lg p-4 mb-4">
                    <div className="flex items-center gap-2 text-gray-600 mb-2">
                      <MessageSquare className="w-4 h-4" />
                      <span className="text-sm font-medium">What {selectedSubmission.kids.name} says they did:</span>
                    </div>
                    <p className="text-gray-700">{selectedSubmission.notes}</p>
                  </div>
                )}

                {/* Feedback Input */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Feedback (optional)
                  </label>
                  <textarea
                    value={feedback}
                    onChange={e => setFeedback(e.target.value)}
                    placeholder="Add a note for your child..."
                    className="w-full p-3 border border-gray-300 rounded-lg resize-none h-20 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3">
                  <button
                    onClick={() => handleReview('reject')}
                    disabled={reviewing}
                    className="flex-1 py-3 px-4 bg-red-100 text-red-700 rounded-xl font-medium hover:bg-red-200 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {reviewing ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <>
                        <XCircle className="w-5 h-5" />
                        <span>Needs Redo</span>
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => handleReview('approve')}
                    disabled={reviewing}
                    className="flex-1 py-3 px-4 bg-green-600 text-white rounded-xl font-medium hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {reviewing ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <>
                        <CheckCircle className="w-5 h-5" />
                        <span>Approve</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
