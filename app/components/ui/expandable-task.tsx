'use client'

import { useState, useRef, useEffect } from 'react'
import { Check, ChevronRight } from 'lucide-react'

interface ExpandableTaskProps {
  id: string
  title: string
  subtitle?: string
  completed: boolean
  onComplete: (id: string, note?: string) => void | Promise<void>
  disabled?: boolean
  icon?: React.ReactNode
  expandedContent?: React.ReactNode
}

export function ExpandableTask({
  id,
  title,
  subtitle,
  completed,
  onComplete,
  disabled = false,
  icon,
  expandedContent,
}: ExpandableTaskProps) {
  const [expanded, setExpanded] = useState(false)
  const [note, setNote] = useState('')
  const [loading, setLoading] = useState(false)
  const noteInputRef = useRef<HTMLTextAreaElement>(null)

  // Focus note input when expanded
  useEffect(() => {
    if (expanded && noteInputRef.current) {
      // Small delay to allow animation
      setTimeout(() => noteInputRef.current?.focus(), 100)
    }
  }, [expanded])

  const handleHeaderClick = () => {
    if (completed || disabled) return
    setExpanded(!expanded)
  }

  const handleComplete = async (withNote: boolean) => {
    if (loading || completed || disabled) return

    setLoading(true)
    try {
      await onComplete(id, withNote ? note : undefined)
      setExpanded(false)
      setNote('')
    } finally {
      setLoading(false)
    }
  }

  const handleSkip = () => {
    setExpanded(false)
    setNote('')
  }

  return (
    <div className={`task-item ${expanded ? 'expanded' : ''}`}>
      {/* Header - Tap to expand */}
      <div
        className="task-item-header"
        onClick={handleHeaderClick}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && handleHeaderClick()}
        aria-expanded={expanded}
        aria-disabled={completed || disabled}
      >
        {/* Checkbox */}
        <div className={`task-item-checkbox ${completed ? 'completed' : ''}`}>
          {completed && <Check className="w-4 h-4 text-white" strokeWidth={3} />}
        </div>

        {/* Content */}
        <div className="task-item-content">
          <div className={`task-item-title ${completed ? 'completed' : ''}`}>
            {title}
          </div>
          {subtitle && (
            <div className="task-item-subtitle">{subtitle}</div>
          )}
        </div>

        {/* Icon / Chevron */}
        {!completed && (
          <div className={`transition-transform duration-200 ${expanded ? 'rotate-90' : ''}`}>
            {icon || <ChevronRight className="w-5 h-5 text-gray-400" />}
          </div>
        )}
      </div>

      {/* Expanded Actions */}
      {expanded && !completed && (
        <div className="task-item-actions">
          {/* Custom expanded content (checklist, etc.) */}
          {expandedContent && (
            <div className="task-item-expanded-content mb-3 p-3 bg-gray-50 rounded-lg">
              {expandedContent}
            </div>
          )}

          {/* Note Input */}
          <div className="task-item-note">
            <textarea
              ref={noteInputRef}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Add a note (optional)..."
              className="input resize-none h-20"
              disabled={loading}
            />
          </div>

          {/* Action Buttons */}
          <button
            onClick={handleSkip}
            disabled={loading}
            className="btn btn-secondary"
            type="button"
          >
            Cancel
          </button>
          <button
            onClick={() => handleComplete(note.trim().length > 0)}
            disabled={loading}
            className="btn btn-primary"
            type="button"
          >
            {loading ? (
              <span className="animate-spin">⏳</span>
            ) : (
              <>
                <Check className="w-4 h-4" />
                <span>Done</span>
              </>
            )}
          </button>
        </div>
      )}
    </div>
  )
}

// Compact version without expand - just for viewing
export function TaskItem({
  title,
  subtitle,
  completed,
  icon,
}: {
  title: string
  subtitle?: string
  completed: boolean
  icon?: React.ReactNode
}) {
  return (
    <div className="task-item">
      <div className="task-item-header" style={{ cursor: 'default' }}>
        <div className={`task-item-checkbox ${completed ? 'completed' : ''}`}>
          {completed && <Check className="w-4 h-4 text-white" strokeWidth={3} />}
        </div>
        <div className="task-item-content">
          <div className={`task-item-title ${completed ? 'completed' : ''}`}>
            {title}
          </div>
          {subtitle && <div className="task-item-subtitle">{subtitle}</div>}
        </div>
        {icon}
      </div>
    </div>
  )
}
