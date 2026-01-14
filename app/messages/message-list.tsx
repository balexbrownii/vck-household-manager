'use client'

import { useState } from 'react'
import {
  MessageSquare,
  Check,
  X,
  Clock,
  ChevronDown,
  ChevronUp,
  Send,
  AlertCircle,
  CheckCircle,
  Reply
} from 'lucide-react'

interface Message {
  id: string
  sender_type: 'kid' | 'parent' | 'system'
  sender_kid_id: string | null
  sender_parent_id: string | null
  recipient_type: 'kid' | 'parent' | 'all_parents'
  recipient_kid_id: string | null
  message_type: 'request' | 'approval_request' | 'response' | 'announcement' | 'notification'
  subject: string | null
  body: string
  related_entity_type: string | null
  related_entity_id: string | null
  action_required: boolean
  read_at: string | null
  responded_at: string | null
  response: string | null
  parent_message_id: string | null
  created_at: string
  sender_kid?: { id: string; name: string } | null
  recipient_kid?: { id: string; name: string } | null
}

interface MessageListProps {
  initialMessages: Message[]
}

export default function MessageList({ initialMessages }: MessageListProps) {
  const [messages, setMessages] = useState<Message[]>(initialMessages)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [responding, setResponding] = useState<string | null>(null)
  const [customResponse, setCustomResponse] = useState('')
  const [filter, setFilter] = useState<'all' | 'unread' | 'action'>('all')

  const filteredMessages = messages.filter(m => {
    if (filter === 'unread') return !m.read_at
    if (filter === 'action') return m.action_required && !m.responded_at
    return true
  })

  const markAsRead = async (messageId: string) => {
    try {
      const res = await fetch('/api/messages', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messageId, markRead: true })
      })

      if (res.ok) {
        setMessages(prev => prev.map(m =>
          m.id === messageId ? { ...m, read_at: new Date().toISOString() } : m
        ))
      }
    } catch (error) {
      console.error('Failed to mark as read:', error)
    }
  }

  const respondToMessage = async (messageId: string, response: string) => {
    try {
      const res = await fetch('/api/messages', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messageId, response, markRead: true })
      })

      if (res.ok) {
        setMessages(prev => prev.map(m =>
          m.id === messageId ? {
            ...m,
            responded_at: new Date().toISOString(),
            response,
            read_at: m.read_at || new Date().toISOString()
          } : m
        ))
        setResponding(null)
        setCustomResponse('')
      }
    } catch (error) {
      console.error('Failed to respond:', error)
    }
  }

  const getMessageIcon = (type: string) => {
    switch (type) {
      case 'request': return <MessageSquare className="w-5 h-5 text-blue-500" />
      case 'approval_request': return <AlertCircle className="w-5 h-5 text-orange-500" />
      case 'response': return <Reply className="w-5 h-5 text-green-500" />
      case 'announcement': return <Send className="w-5 h-5 text-purple-500" />
      case 'notification': return <CheckCircle className="w-5 h-5 text-gray-500" />
      default: return <MessageSquare className="w-5 h-5 text-gray-500" />
    }
  }

  const getSenderName = (message: Message) => {
    if (message.sender_type === 'system') return 'System'
    if (message.sender_type === 'parent') return 'Parent'
    if (message.sender_kid) return message.sender_kid.name
    return 'Unknown'
  }

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    return date.toLocaleDateString()
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            filter === 'all'
              ? 'bg-indigo-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          All Messages
        </button>
        <button
          onClick={() => setFilter('unread')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            filter === 'unread'
              ? 'bg-indigo-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Unread
        </button>
        <button
          onClick={() => setFilter('action')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            filter === 'action'
              ? 'bg-orange-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Needs Response
        </button>
      </div>

      {/* Messages List */}
      {filteredMessages.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-xl">
          <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">No messages found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredMessages.map((message) => (
            <div
              key={message.id}
              className={`bg-white rounded-xl border transition-all ${
                !message.read_at
                  ? 'border-indigo-200 bg-indigo-50/30'
                  : 'border-gray-200'
              } ${
                message.action_required && !message.responded_at
                  ? 'ring-2 ring-orange-200'
                  : ''
              }`}
            >
              {/* Message Header */}
              <div
                className="p-4 cursor-pointer"
                onClick={() => {
                  setExpandedId(expandedId === message.id ? null : message.id)
                  if (!message.read_at) markAsRead(message.id)
                }}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    {getMessageIcon(message.message_type)}
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900">
                          {getSenderName(message)}
                        </span>
                        {!message.read_at && (
                          <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 text-xs rounded-full">
                            New
                          </span>
                        )}
                        {message.action_required && !message.responded_at && (
                          <span className="px-2 py-0.5 bg-orange-100 text-orange-700 text-xs rounded-full">
                            Action Required
                          </span>
                        )}
                      </div>
                      {message.subject && (
                        <p className="text-sm font-medium text-gray-700 mt-1">
                          {message.subject}
                        </p>
                      )}
                      <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                        {message.body}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-gray-400">
                    <Clock className="w-4 h-4" />
                    <span className="text-sm">{formatTime(message.created_at)}</span>
                    {expandedId === message.id ? (
                      <ChevronUp className="w-5 h-5" />
                    ) : (
                      <ChevronDown className="w-5 h-5" />
                    )}
                  </div>
                </div>
              </div>

              {/* Expanded Content */}
              {expandedId === message.id && (
                <div className="px-4 pb-4 border-t border-gray-100 pt-4">
                  <div className="prose prose-sm max-w-none text-gray-700 mb-4">
                    {message.body}
                  </div>

                  {/* Response Status */}
                  {message.responded_at && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
                      <div className="flex items-center gap-2 text-green-700">
                        <CheckCircle className="w-4 h-4" />
                        <span className="font-medium">
                          Responded: {message.response}
                        </span>
                      </div>
                      <p className="text-sm text-green-600 mt-1">
                        {formatTime(message.responded_at)}
                      </p>
                    </div>
                  )}

                  {/* Action Buttons */}
                  {message.action_required && !message.responded_at && (
                    <div className="space-y-3">
                      {responding === message.id ? (
                        <div className="space-y-2">
                          <input
                            type="text"
                            value={customResponse}
                            onChange={(e) => setCustomResponse(e.target.value)}
                            placeholder="Type your response..."
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                          />
                          <div className="flex gap-2">
                            <button
                              onClick={() => respondToMessage(message.id, customResponse)}
                              disabled={!customResponse.trim()}
                              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              Send Response
                            </button>
                            <button
                              onClick={() => {
                                setResponding(null)
                                setCustomResponse('')
                              }}
                              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-wrap gap-2">
                          <button
                            onClick={() => respondToMessage(message.id, 'approved')}
                            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                          >
                            <Check className="w-4 h-4" />
                            Approve
                          </button>
                          <button
                            onClick={() => respondToMessage(message.id, 'rejected')}
                            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                          >
                            <X className="w-4 h-4" />
                            Reject
                          </button>
                          <button
                            onClick={() => respondToMessage(message.id, 'yes')}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                          >
                            Yes
                          </button>
                          <button
                            onClick={() => respondToMessage(message.id, 'no')}
                            className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                          >
                            No
                          </button>
                          <button
                            onClick={() => setResponding(message.id)}
                            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                          >
                            <Reply className="w-4 h-4" />
                            Custom Reply
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
