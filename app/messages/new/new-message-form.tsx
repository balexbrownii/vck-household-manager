'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Send, Users, User } from 'lucide-react'

interface Kid {
  id: string
  name: string
}

interface NewMessageFormProps {
  kids: Kid[]
}

export default function NewMessageForm({ kids }: NewMessageFormProps) {
  const router = useRouter()
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')

  const [recipientType, setRecipientType] = useState<'kid' | 'all_kids'>('all_kids')
  const [recipientKidId, setRecipientKidId] = useState('')
  const [messageType, setMessageType] = useState<'announcement' | 'notification'>('announcement')
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSending(true)

    try {
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipientType: recipientType === 'all_kids' ? 'all_parents' : 'kid', // all_parents means all kids see it
          recipientKidId: recipientType === 'kid' ? recipientKidId : null,
          messageType,
          subject: subject || null,
          body,
          actionRequired: false
        })
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to send message')
      }

      router.push('/messages')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send message')
    } finally {
      setSending(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      {/* Recipient Type */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Send To
        </label>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => setRecipientType('all_kids')}
            className={`flex items-center gap-2 px-4 py-3 rounded-lg border-2 transition-colors ${
              recipientType === 'all_kids'
                ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
            }`}
          >
            <Users className="w-5 h-5" />
            All Kids
          </button>
          <button
            type="button"
            onClick={() => setRecipientType('kid')}
            className={`flex items-center gap-2 px-4 py-3 rounded-lg border-2 transition-colors ${
              recipientType === 'kid'
                ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
            }`}
          >
            <User className="w-5 h-5" />
            Specific Kid
          </button>
        </div>
      </div>

      {/* Kid Selector (if specific kid selected) */}
      {recipientType === 'kid' && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Kid
          </label>
          <select
            value={recipientKidId}
            onChange={(e) => setRecipientKidId(e.target.value)}
            required={recipientType === 'kid'}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          >
            <option value="">Choose a kid...</option>
            {kids.map((kid) => (
              <option key={kid.id} value={kid.id}>
                {kid.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Message Type */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Message Type
        </label>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => setMessageType('announcement')}
            className={`px-4 py-2 rounded-lg border transition-colors ${
              messageType === 'announcement'
                ? 'border-purple-600 bg-purple-50 text-purple-700'
                : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
            }`}
          >
            Announcement
          </button>
          <button
            type="button"
            onClick={() => setMessageType('notification')}
            className={`px-4 py-2 rounded-lg border transition-colors ${
              messageType === 'notification'
                ? 'border-blue-600 bg-blue-50 text-blue-700'
                : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
            }`}
          >
            Notification
          </button>
        </div>
      </div>

      {/* Subject */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Subject (Optional)
        </label>
        <input
          type="text"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder="e.g., Time to start chores!"
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
        />
      </div>

      {/* Message Body */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Message
        </label>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          required
          rows={5}
          placeholder="Type your message here..."
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
        />
      </div>

      {/* Submit */}
      <div className="flex justify-end gap-3 pt-4">
        <button
          type="button"
          onClick={() => router.back()}
          className="px-6 py-3 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={sending || !body.trim()}
          className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <Send className="w-5 h-5" />
          {sending ? 'Sending...' : 'Send Message'}
        </button>
      </div>
    </form>
  )
}
