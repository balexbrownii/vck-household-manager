'use client'

import { ClaimedGig, Gig } from '@/types'
import { useState } from 'react'
import { CheckCircle2, XCircle } from 'lucide-react'
import { toast } from '@/lib/toast'

interface GigInspectionFormProps {
  claimedGig: ClaimedGig & { gigs: Gig }
  onApprove?: () => void
  onReject?: () => void
}

export default function GigInspectionForm({
  claimedGig,
  onApprove,
  onReject,
}: GigInspectionFormProps) {
  const [loading, setLoading] = useState(false)
  const [notes, setNotes] = useState('')
  const [result, setResult] = useState<'approved' | 'rejected' | null>(null)

  const gig = claimedGig.gigs

  const handleApprove = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/gigs/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          claimedGigId: claimedGig.id,
          notes: notes || null,
        }),
      })

      if (response.ok) {
        setResult('approved')
        if (onApprove) onApprove()
      } else {
        toast.error('Failed to approve gig')
      }
    } catch {
      toast.error('Failed to approve gig')
    } finally {
      setLoading(false)
    }
  }

  const handleReject = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/gigs/reject', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          claimedGigId: claimedGig.id,
          reason: notes || null,
        }),
      })

      if (response.ok) {
        setResult('rejected')
        if (onReject) onReject()
      } else {
        toast.error('Failed to reject gig')
      }
    } catch {
      toast.error('Failed to reject gig')
    } finally {
      setLoading(false)
    }
  }

  if (result === 'approved') {
    return (
      <div className="bg-green-50 border-2 border-green-200 rounded-lg p-6 text-center">
        <CheckCircle2 className="w-12 h-12 text-success mx-auto mb-3" />
        <h3 className="text-lg font-bold text-gray-900 mb-2">Gig Approved!</h3>
        <p className="text-gray-600 mb-4">
          {gig.stars} stars awarded to {claimedGig.kid_id}
        </p>
      </div>
    )
  }

  if (result === 'rejected') {
    return (
      <div className="bg-orange-50 border-2 border-orange-200 rounded-lg p-6 text-center">
        <XCircle className="w-12 h-12 text-warning mx-auto mb-3" />
        <h3 className="text-lg font-bold text-gray-900 mb-2">Gig Rejected</h3>
        <p className="text-gray-600">Kid can redo this gig for full credit.</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-6">
      {/* Gig details */}
      <div>
        <h3 className="text-lg font-bold text-gray-900 mb-4">{gig.title}</h3>

        {/* Checklist to verify */}
        <div className="bg-gray-50 rounded p-4 mb-4">
          <div className="text-sm font-semibold text-gray-700 mb-3">
            Inspection Checklist
          </div>
          <div className="space-y-2">
            {gig.checklist.map((item, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-gray-300 rounded hover:border-primary cursor-pointer" />
                <span className="text-sm text-gray-700">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Notes field */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Notes (optional)
        </label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Add inspection notes..."
          rows={3}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-none"
        />
      </div>

      {/* Action buttons */}
      <div className="flex gap-3">
        <button
          onClick={handleApprove}
          disabled={loading}
          className="flex-1 bg-success text-white py-3 rounded-lg font-semibold hover:bg-green-700 disabled:opacity-50 transition-colors"
        >
          {loading ? 'Processing...' : '✓ Approve & Award Stars'}
        </button>
        <button
          onClick={handleReject}
          disabled={loading}
          className="flex-1 bg-warning text-white py-3 rounded-lg font-semibold hover:bg-orange-600 disabled:opacity-50 transition-colors"
        >
          {loading ? 'Processing...' : 'Reject (Redo)'}
        </button>
      </div>
    </div>
  )
}
