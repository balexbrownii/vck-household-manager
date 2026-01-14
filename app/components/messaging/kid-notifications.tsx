'use client'

import { useState, useEffect } from 'react'
import { Bell, CheckCircle, X, MessageSquare, AlertCircle } from 'lucide-react'

interface Message {
  id: string
  sender_type: 'kid' | 'parent' | 'system'
  message_type: string
  subject: string | null
  body: string
  response: string | null
  read_at: string | null
  created_at: string
}

export default function KidNotifications() {
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set())

  useEffect(() => {
    fetchMessages()
    const interval = setInterval(fetchMessages, 30000)
    return () => clearInterval(interval)
  }, [])

  const fetchMessages = async () => {
    try {
      const res = await fetch('/api/messages?unreadOnly=true&limit=5')
      if (res.ok) {
        const data = await res.json()
        setMessages(data.messages || [])
      }
    } catch (error) {
      console.error('Failed to fetch messages:', error)
    } finally {
      setLoading(false)
    }
  }

  const markAsRead = async (messageId: string) => {
    try {
      await fetch('/api/messages', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messageId, markRead: true })
      })
      setDismissedIds(prev => new Set([...Array.from(prev), messageId]))
    } catch (error) {
      console.error('Failed to mark as read:', error)
    }
  }

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    return date.toLocaleDateString()
  }

  const getIcon = (type: string, response: string | null) => {
    if (response === 'approved' || response === 'yes') {
      return <CheckCircle className="w-5 h-5 text-green-500" />
    }
    if (response === 'rejected' || response === 'no') {
      return <X className="w-5 h-5 text-red-500" />
    }
    if (type === 'response') {
      return <MessageSquare className="w-5 h-5 text-blue-500" />
    }
    return <Bell className="w-5 h-5 text-purple-500" />
  }

  const getBackground = (response: string | null) => {
    if (response === 'approved' || response === 'yes') return 'bg-green-50 border-green-200'
    if (response === 'rejected' || response === 'no') return 'bg-red-50 border-red-200'
    return 'bg-white border-gray-200'
  }

  const visibleMessages = messages.filter(m => !dismissedIds.has(m.id))

  if (loading || visibleMessages.length === 0) {
    return null
  }

  return (
    <section className="kid-section border-2 border-purple-200 bg-purple-50/50">
      <h2 className="kid-section-title mb-3">
        <Bell className="w-5 h-5 text-purple-500" />
        <span>Notifications</span>
        <span className="ml-auto px-2 py-0.5 bg-purple-200 text-purple-700 text-xs rounded-full">
          {visibleMessages.length}
        </span>
      </h2>

      <div className="space-y-2">
        {visibleMessages.map((message) => (
          <div
            key={message.id}
            className={`p-3 rounded-xl border ${getBackground(message.response)} relative`}
          >
            <button
              onClick={() => markAsRead(message.id)}
              className="absolute top-2 right-2 p-1 hover:bg-black/5 rounded-full"
              aria-label="Dismiss"
            >
              <X className="w-4 h-4 text-gray-400" />
            </button>

            <div className="flex items-start gap-3 pr-6">
              {getIcon(message.message_type, message.response)}
              <div className="flex-1 min-w-0">
                {message.subject && (
                  <p className="font-medium text-gray-900 text-sm">{message.subject}</p>
                )}
                <p className="text-gray-700 text-sm">{message.body}</p>
                <p className="text-gray-400 text-xs mt-1">{formatTime(message.created_at)}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
