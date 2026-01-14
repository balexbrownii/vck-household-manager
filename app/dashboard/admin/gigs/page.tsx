'use client'

import { useState, useEffect } from 'react'
import PageHeader from '@/components/ui/page-header'
import {
  Plus,
  Pencil,
  Trash2,
  Star,
  Clock,
  ChevronLeft,
  Check,
  X,
  Loader2,
  AlertTriangle,
  Briefcase,
} from 'lucide-react'

interface Gig {
  id: string
  title: string
  description: string
  tier: number
  stars: number
  estimated_minutes: number | null
  checklist: string[]
  active: boolean
  scope_description: string | null
  completion_criteria: string | null
  ai_review_enabled: boolean
}

interface GigFormData {
  title: string
  description: string
  tier: number
  stars: number
  estimated_minutes: number | null
  checklist: string[]
  active: boolean
  scope_description: string
  completion_criteria: string
  ai_review_enabled: boolean
}

const emptyGig: GigFormData = {
  title: '',
  description: '',
  tier: 1,
  stars: 5,
  estimated_minutes: null,
  checklist: [],
  active: true,
  scope_description: '',
  completion_criteria: '',
  ai_review_enabled: false,
}

export default function GigManagementPage() {
  const [gigs, setGigs] = useState<Gig[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [editingGig, setEditingGig] = useState<Gig | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [formData, setFormData] = useState<GigFormData>(emptyGig)
  const [checklistItem, setChecklistItem] = useState('')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadGigs()
  }, [])

  const loadGigs = async () => {
    try {
      const res = await fetch('/api/gigs/manage')
      if (res.ok) {
        const data = await res.json()
        setGigs(data.gigs || [])
      }
    } catch (err) {
      console.error('Failed to load gigs:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (gig: Gig) => {
    setEditingGig(gig)
    setFormData({
      title: gig.title,
      description: gig.description,
      tier: gig.tier,
      stars: gig.stars,
      estimated_minutes: gig.estimated_minutes,
      checklist: gig.checklist || [],
      active: gig.active,
      scope_description: gig.scope_description || '',
      completion_criteria: gig.completion_criteria || '',
      ai_review_enabled: gig.ai_review_enabled,
    })
    setIsCreating(false)
  }

  const handleCreate = () => {
    setEditingGig(null)
    setFormData(emptyGig)
    setIsCreating(true)
  }

  const handleCancel = () => {
    setEditingGig(null)
    setIsCreating(false)
    setFormData(emptyGig)
    setError(null)
  }

  const handleSave = async () => {
    if (!formData.title.trim()) {
      setError('Title is required')
      return
    }

    setSaving(true)
    setError(null)

    try {
      const url = isCreating ? '/api/gigs/manage' : `/api/gigs/manage/${editingGig?.id}`
      const method = isCreating ? 'POST' : 'PATCH'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (res.ok) {
        await loadGigs()
        handleCancel()
      } else {
        const data = await res.json()
        setError(data.error || 'Failed to save gig')
      }
    } catch (err) {
      setError('Failed to save gig')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (gigId: string) => {
    if (!confirm('Are you sure you want to delete this gig?')) return

    setDeleting(gigId)
    try {
      const res = await fetch(`/api/gigs/manage/${gigId}`, {
        method: 'DELETE',
      })

      if (res.ok) {
        await loadGigs()
      }
    } catch (err) {
      console.error('Failed to delete gig:', err)
    } finally {
      setDeleting(null)
    }
  }

  const addChecklistItem = () => {
    if (checklistItem.trim()) {
      setFormData({
        ...formData,
        checklist: [...formData.checklist, checklistItem.trim()],
      })
      setChecklistItem('')
    }
  }

  const removeChecklistItem = (index: number) => {
    setFormData({
      ...formData,
      checklist: formData.checklist.filter((_, i) => i !== index),
    })
  }

  const tierLabels: Record<number, string> = {
    1: 'Tier 1 (Easy)',
    2: 'Tier 2 (Medium)',
    3: 'Tier 3 (Hard)',
    4: 'Tier 4 (Expert)',
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto py-12 text-center">
        <Loader2 className="w-8 h-8 animate-spin mx-auto text-purple-600" />
        <p className="mt-4 text-gray-600">Loading gigs...</p>
      </div>
    )
  }

  // Show form if creating or editing
  if (isCreating || editingGig) {
    return (
      <div className="max-w-2xl mx-auto">
        <button
          onClick={handleCancel}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
        >
          <ChevronLeft className="w-5 h-5" />
          Back to Gigs
        </button>

        <div className="bg-white rounded-xl border-2 border-gray-100 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6">
            {isCreating ? 'Create New Gig' : `Edit: ${editingGig?.title}`}
          </h2>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              {error}
            </div>
          )}

          <div className="space-y-5">
            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Title *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="e.g., Clean the garage"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                placeholder="Describe what needs to be done..."
              />
            </div>

            {/* Tier and Stars */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tier
                </label>
                <select
                  value={formData.tier}
                  onChange={(e) => setFormData({ ...formData, tier: parseInt(e.target.value) })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  {[1, 2, 3, 4].map((t) => (
                    <option key={t} value={t}>{tierLabels[t]}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Stars
                </label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={formData.stars}
                  onChange={(e) => setFormData({ ...formData, stars: parseInt(e.target.value) || 5 })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Estimated Minutes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Estimated Minutes (optional)
              </label>
              <input
                type="number"
                min="1"
                value={formData.estimated_minutes || ''}
                onChange={(e) => setFormData({ ...formData, estimated_minutes: e.target.value ? parseInt(e.target.value) : null })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="e.g., 30"
              />
            </div>

            {/* Checklist */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Checklist Items
              </label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={checklistItem}
                  onChange={(e) => setChecklistItem(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addChecklistItem())}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Add checklist item..."
                />
                <button
                  type="button"
                  onClick={addChecklistItem}
                  className="px-4 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>
              {formData.checklist.length > 0 && (
                <ul className="space-y-1">
                  {formData.checklist.map((item, idx) => (
                    <li key={idx} className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                      <span className="flex-1 text-sm">{item}</span>
                      <button
                        type="button"
                        onClick={() => removeChecklistItem(idx)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* AI Review Settings */}
            <div className="border-t pt-5">
              <label className="flex items-center gap-3 mb-4">
                <input
                  type="checkbox"
                  checked={formData.ai_review_enabled}
                  onChange={(e) => setFormData({ ...formData, ai_review_enabled: e.target.checked })}
                  className="w-5 h-5 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                />
                <span className="text-sm font-medium text-gray-700">Enable AI Review</span>
              </label>

              {formData.ai_review_enabled && (
                <div className="space-y-4 pl-8">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Scope Description
                    </label>
                    <textarea
                      value={formData.scope_description}
                      onChange={(e) => setFormData({ ...formData, scope_description: e.target.value })}
                      rows={2}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none text-sm"
                      placeholder="What should the AI look for..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Completion Criteria
                    </label>
                    <textarea
                      value={formData.completion_criteria}
                      onChange={(e) => setFormData({ ...formData, completion_criteria: e.target.value })}
                      rows={2}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none text-sm"
                      placeholder="How should the AI judge if it's done..."
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Active Status */}
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={formData.active}
                onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                className="w-5 h-5 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
              />
              <span className="text-sm font-medium text-gray-700">Active (available to claim)</span>
            </label>

            {/* Actions */}
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={handleCancel}
                className="flex-1 py-3 bg-gray-100 text-gray-700 font-semibold rounded-xl hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 py-3 bg-purple-600 text-white font-semibold rounded-xl hover:bg-purple-700 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Check className="w-5 h-5" />
                    {isCreating ? 'Create Gig' : 'Save Changes'}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // List view
  return (
    <div className="max-w-4xl mx-auto">
      <PageHeader
        title="Gig Management"
        subtitle={`${gigs.length} gigs total`}
        backHref="/dashboard/admin"
        backLabel="Back to Admin"
        icon={<Briefcase className="w-7 h-7 text-purple-600" />}
        actions={
          <button
            onClick={handleCreate}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white font-semibold rounded-xl hover:bg-purple-700"
          >
            <Plus className="w-5 h-5" />
            New Gig
          </button>
        }
      />

      <div className="space-y-3">
        {gigs.map((gig) => (
          <div
            key={gig.id}
            className={`bg-white rounded-xl border-2 p-4 ${
              gig.active ? 'border-gray-100' : 'border-gray-200 bg-gray-50'
            }`}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-gray-900">{gig.title}</h3>
                  {!gig.active && (
                    <span className="px-2 py-0.5 bg-gray-200 text-gray-600 text-xs rounded-full">
                      Inactive
                    </span>
                  )}
                  {gig.ai_review_enabled && (
                    <span className="px-2 py-0.5 bg-cyan-100 text-cyan-700 text-xs rounded-full">
                      AI Review
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-600 mt-1 line-clamp-2">{gig.description}</p>
                <div className="flex items-center gap-4 mt-2 text-sm">
                  <span className="text-purple-600 font-medium">{tierLabels[gig.tier]}</span>
                  <span className="flex items-center gap-1 text-yellow-600">
                    <Star className="w-4 h-4 fill-current" />
                    {gig.stars}
                  </span>
                  {gig.estimated_minutes && (
                    <span className="flex items-center gap-1 text-gray-500">
                      <Clock className="w-4 h-4" />
                      {gig.estimated_minutes} min
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleEdit(gig)}
                  className="p-2 text-gray-500 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                >
                  <Pencil className="w-5 h-5" />
                </button>
                <button
                  onClick={() => handleDelete(gig.id)}
                  disabled={deleting === gig.id}
                  className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                >
                  {deleting === gig.id ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Trash2 className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>
          </div>
        ))}

        {gigs.length === 0 && (
          <div className="text-center py-12 bg-gray-50 rounded-xl">
            <p className="text-gray-500">No gigs created yet.</p>
            <button
              onClick={handleCreate}
              className="mt-4 px-4 py-2 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700"
            >
              Create your first gig
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
