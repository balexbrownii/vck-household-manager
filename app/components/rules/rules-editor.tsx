'use client'

import { useState } from 'react'
import { Save, X, Eye, EyeOff, Sparkles } from 'lucide-react'

interface RulesEditorProps {
  title: string
  subtitle?: string
  scopeDescription: string
  completionCriteria: string
  aiReviewEnabled: boolean
  checklist?: string[]
  onSave: (rules: {
    scope_description: string
    completion_criteria: string
    ai_review_enabled: boolean
  }) => Promise<void>
  onCancel: () => void
}

export default function RulesEditor({
  title,
  subtitle,
  scopeDescription,
  completionCriteria,
  aiReviewEnabled,
  checklist,
  onSave,
  onCancel,
}: RulesEditorProps) {
  const [scope, setScope] = useState(scopeDescription)
  const [criteria, setCriteria] = useState(completionCriteria)
  const [aiEnabled, setAiEnabled] = useState(aiReviewEnabled)
  const [saving, setSaving] = useState(false)
  const [showPreview, setShowPreview] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    try {
      await onSave({
        scope_description: scope,
        completion_criteria: criteria,
        ai_review_enabled: aiEnabled,
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="bg-white rounded-2xl border-2 border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="bg-purple-50 px-6 py-4 border-b border-purple-100">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
            {subtitle && (
              <p className="text-sm text-gray-600">{subtitle}</p>
            )}
          </div>
          <button
            onClick={onCancel}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-6 space-y-6">
        {/* AI Toggle */}
        <div className="flex items-center justify-between p-4 bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl border border-purple-100">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Sparkles className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="font-medium text-gray-900">AI Review</p>
              <p className="text-sm text-gray-600">
                {aiEnabled
                  ? 'AI will pre-screen submissions before parent review'
                  : 'Submissions go directly to parent review'}
              </p>
            </div>
          </div>
          <button
            onClick={() => setAiEnabled(!aiEnabled)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              aiEnabled ? 'bg-purple-600' : 'bg-gray-300'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                aiEnabled ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        {/* Scope Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Task Scope
          </label>
          <p className="text-xs text-gray-500 mb-2">
            Describe what needs to be done. This helps AI understand the task.
          </p>
          <textarea
            value={scope}
            onChange={(e) => setScope(e.target.value)}
            rows={3}
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:ring-0 resize-none"
            placeholder="e.g., Clean and organize the kitchen after dinner"
          />
        </div>

        {/* Completion Criteria */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Completion Criteria
          </label>
          <p className="text-xs text-gray-500 mb-2">
            What should the photo show? Be specific so AI can evaluate accurately.
          </p>
          <textarea
            value={criteria}
            onChange={(e) => setCriteria(e.target.value)}
            rows={4}
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:ring-0 resize-none"
            placeholder="e.g., Photo showing: counters wiped and clear, dishes done or in dishwasher, sink clean, floor swept"
          />
        </div>

        {/* Checklist Preview (read-only) */}
        {checklist && checklist.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Checklist Items (Reference)
            </label>
            <div className="bg-gray-50 rounded-xl p-4">
              <ul className="space-y-2">
                {checklist.map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                    <span className="text-purple-500 mt-0.5">•</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* Preview Toggle */}
        <button
          onClick={() => setShowPreview(!showPreview)}
          className="flex items-center gap-2 text-sm text-purple-600 hover:text-purple-700"
        >
          {showPreview ? (
            <>
              <EyeOff className="w-4 h-4" /> Hide AI Preview
            </>
          ) : (
            <>
              <Eye className="w-4 h-4" /> Preview AI Prompt
            </>
          )}
        </button>

        {/* AI Prompt Preview */}
        {showPreview && (
          <div className="bg-gray-900 rounded-xl p-4 text-sm font-mono text-gray-300 overflow-x-auto">
            <p className="text-purple-400 mb-2">{"// What AI will see:"}</p>
            <p className="text-green-400 mb-1">TASK SCOPE:</p>
            <p className="mb-3">{scope || '(not set)'}</p>
            <p className="text-green-400 mb-1">COMPLETION CRITERIA:</p>
            <p className="mb-3">{criteria || '(not set)'}</p>
            {checklist && checklist.length > 0 && (
              <>
                <p className="text-green-400 mb-1">CHECKLIST:</p>
                {checklist.map((item, i) => (
                  <p key={i}>{i + 1}. {item}</p>
                ))}
              </>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end gap-3">
        <button
          onClick={onCancel}
          className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          {saving ? 'Saving...' : 'Save Rules'}
        </button>
      </div>
    </div>
  )
}
