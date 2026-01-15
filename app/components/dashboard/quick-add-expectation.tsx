'use client'

import { useState } from 'react'
import { Plus, X, Check, Star, Sparkles, Music, BookOpen, Dumbbell, Clock } from 'lucide-react'
import { toast } from '@/lib/toast'

interface QuickAddExpectationProps {
  kidId: string
  kidName: string
  onExpectationAdded?: () => void
}

const iconOptions = [
  { value: 'star', label: 'Star', icon: Star },
  { value: 'sparkles', label: 'Sparkles', icon: Sparkles },
  { value: 'music', label: 'Music', icon: Music },
  { value: 'book', label: 'Book', icon: BookOpen },
  { value: 'dumbbell', label: 'Exercise', icon: Dumbbell },
  { value: 'clock', label: 'Clock', icon: Clock },
]

const presetTasks = [
  { title: 'Practice piano for 30 minutes', icon: 'music' },
  { title: 'Do 10 math problems', icon: 'book' },
  { title: 'Go for a walk', icon: 'dumbbell' },
  { title: 'Clean your desk', icon: 'sparkles' },
  { title: 'Drink 4 glasses of water', icon: 'clock' },
]

export default function QuickAddExpectation({ kidId, kidName, onExpectationAdded }: QuickAddExpectationProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [icon, setIcon] = useState('star')
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [showCustom, setShowCustom] = useState(false)

  const handleSubmit = async (taskTitle?: string) => {
    const finalTitle = taskTitle || title.trim()
    if (!finalTitle) return

    setSaving(true)
    try {
      const res = await fetch('/api/adhoc-expectations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kidId,
          title: finalTitle,
          description: description.trim() || null,
          icon,
        })
      })

      if (res.ok) {
        setSuccess(true)
        setTimeout(() => {
          setSuccess(false)
          setIsOpen(false)
          setTitle('')
          setDescription('')
          setIcon('star')
          setShowCustom(false)
          onExpectationAdded?.()
        }, 1500)
      } else {
        toast.error('Failed to add task')
      }
    } catch {
      toast.error('Failed to add task')
    } finally {
      setSaving(false)
    }
  }

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-3 py-2 text-sm text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
        title="Add a quick task for today"
      >
        <Star className="w-4 h-4" />
        Task
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
            <p className="text-gray-600">Task has been added to {kidName}&apos;s expectations!</p>
          </div>
        ) : showCustom ? (
          <div className="p-4 space-y-4">
            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Task Title *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Practice piano for 30 minutes"
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

            {/* Icon Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Icon
              </label>
              <div className="flex flex-wrap gap-2">
                {iconOptions.map((opt) => {
                  const Icon = opt.icon
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setIcon(opt.value)}
                      className={`p-3 rounded-xl border transition-colors ${
                        icon === opt.value
                          ? 'border-purple-500 bg-purple-50 text-purple-700'
                          : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                    </button>
                  )
                })}
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
                className="flex-1 py-3 bg-purple-600 text-white font-semibold rounded-xl hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? 'Adding...' : 'Add Task'}
              </button>
            </div>
          </div>
        ) : (
          <div className="p-4">
            <p className="text-sm text-gray-600 mb-4">Choose a preset task or create your own:</p>

            {/* Preset Tasks */}
            <div className="space-y-2 mb-4">
              {presetTasks.map((task, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setIcon(task.icon)
                    handleSubmit(task.title)
                  }}
                  disabled={saving}
                  className="w-full p-3 text-left bg-purple-50 hover:bg-purple-100 rounded-xl text-purple-800 font-medium transition-colors disabled:opacity-50"
                >
                  {task.title}
                </button>
              ))}
            </div>

            {/* Custom Button */}
            <button
              onClick={() => setShowCustom(true)}
              className="w-full p-3 text-center bg-gray-100 hover:bg-gray-200 rounded-xl text-gray-700 font-medium transition-colors"
            >
              ✏️ Create custom task
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
