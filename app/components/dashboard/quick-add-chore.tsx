'use client'

import { useState } from 'react'
import { Plus, X, Check, ListTodo } from 'lucide-react'

interface QuickAddChoreProps {
  kidId: string
  kidName: string
  onChoreAdded?: () => void
}

export default function QuickAddChore({ kidId, kidName, onChoreAdded }: QuickAddChoreProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [checklist, setChecklist] = useState<string[]>([])
  const [newChecklistItem, setNewChecklistItem] = useState('')
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return

    setSaving(true)
    try {
      const res = await fetch('/api/adhoc-chores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kidId,
          title: title.trim(),
          description: description.trim() || null,
          checklist: checklist.filter(item => item.trim())
        })
      })

      if (res.ok) {
        setSuccess(true)
        setTimeout(() => {
          setSuccess(false)
          setIsOpen(false)
          setTitle('')
          setDescription('')
          setChecklist([])
          onChoreAdded?.()
        }, 1500)
      }
    } catch (error) {
      console.error('Failed to add chore:', error)
    } finally {
      setSaving(false)
    }
  }

  const addChecklistItem = () => {
    if (newChecklistItem.trim()) {
      setChecklist([...checklist, newChecklistItem.trim()])
      setNewChecklistItem('')
    }
  }

  const removeChecklistItem = (index: number) => {
    setChecklist(checklist.filter((_, i) => i !== index))
  }

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-3 py-2 text-sm text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
      >
        <Plus className="w-4 h-4" />
        Add Task
      </button>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-bold text-gray-900">
            {success ? 'Task Added!' : `Add Task for ${kidName}`}
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
            <p className="text-gray-600">Task has been assigned to {kidName}!</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-4 space-y-4">
            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Task Title *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Clean out the car"
                required
                autoFocus
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
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
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
              />
            </div>

            {/* Checklist */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <ListTodo className="w-4 h-4 inline-block mr-1" />
                Checklist (Optional)
              </label>

              {checklist.length > 0 && (
                <ul className="mb-2 space-y-1">
                  {checklist.map((item, idx) => (
                    <li key={idx} className="flex items-center gap-2 text-sm bg-gray-50 px-3 py-2 rounded-lg">
                      <span className="flex-1">{item}</span>
                      <button
                        type="button"
                        onClick={() => removeChecklistItem(idx)}
                        className="text-gray-400 hover:text-red-500"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}

              <div className="flex gap-2">
                <input
                  type="text"
                  value={newChecklistItem}
                  onChange={(e) => setNewChecklistItem(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      addChecklistItem()
                    }
                  }}
                  placeholder="Add checklist item..."
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                />
                <button
                  type="button"
                  onClick={addChecklistItem}
                  className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="flex-1 py-3 bg-gray-100 text-gray-700 font-semibold rounded-xl hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!title.trim() || saving}
                className="flex-1 py-3 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? 'Adding...' : 'Add Task'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
