'use client'

import { useState } from 'react'
import { MessageSquare, Send, X } from 'lucide-react'

interface KidQuickMessageProps {
  onMessageSent?: () => void
}

const quickMessages = [
  { label: 'Can I have a snack?', body: 'Can I have a snack?' },
  { label: 'Can I play games?', body: 'Can I play games?' },
  { label: 'Can I watch TV?', body: 'Can I watch TV?' },
  { label: 'I need help', body: 'I need help with something. Can you come here?' },
]

export default function KidQuickMessage({ onMessageSent }: KidQuickMessageProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [customMessage, setCustomMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [showCustom, setShowCustom] = useState(false)
  const [success, setSuccess] = useState(false)

  const sendMessage = async (body: string) => {
    setSending(true)
    try {
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipientType: 'parent',
          messageType: 'request',
          body,
          actionRequired: true
        })
      })

      if (res.ok) {
        setSuccess(true)
        setCustomMessage('')
        setShowCustom(false)
        setTimeout(() => {
          setSuccess(false)
          setIsOpen(false)
          onMessageSent?.()
        }, 1500)
      }
    } catch (error) {
      console.error('Failed to send message:', error)
    } finally {
      setSending(false)
    }
  }

  const handleSubmitCustom = (e: React.FormEvent) => {
    e.preventDefault()
    if (customMessage.trim()) {
      sendMessage(customMessage.trim())
    }
  }

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="quick-action"
      >
        <div className="quick-action-icon bg-blue-100">
          <MessageSquare className="w-6 h-6 text-blue-600" />
        </div>
        <span className="quick-action-label">Ask Mom/Dad</span>
      </button>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end justify-center z-50 p-4">
      <div className="bg-white rounded-t-3xl rounded-b-xl w-full max-w-lg animate-slide-up">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-bold text-gray-900">
            {success ? '✓ Sent!' : 'Send a Message'}
          </h3>
          <button
            onClick={() => setIsOpen(false)}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4">
          {success ? (
            <div className="py-8 text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <MessageSquare className="w-8 h-8 text-green-600" />
              </div>
              <p className="text-gray-600">Your message was sent to Mom/Dad!</p>
            </div>
          ) : showCustom ? (
            <form onSubmit={handleSubmitCustom} className="space-y-4">
              <textarea
                value={customMessage}
                onChange={(e) => setCustomMessage(e.target.value)}
                placeholder="Type your message..."
                rows={3}
                autoFocus
                className="w-full p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-lg"
              />
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowCustom(false)}
                  className="flex-1 py-3 bg-gray-100 text-gray-700 font-semibold rounded-xl hover:bg-gray-200"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={!customMessage.trim() || sending}
                  className="flex-1 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <Send className="w-5 h-5" />
                  {sending ? 'Sending...' : 'Send'}
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-3">
              <p className="text-gray-600 text-sm mb-4">Tap to send a quick message:</p>

              {quickMessages.map((msg, idx) => (
                <button
                  key={idx}
                  onClick={() => sendMessage(msg.body)}
                  disabled={sending}
                  className="w-full p-4 text-left bg-blue-50 hover:bg-blue-100 rounded-xl text-blue-800 font-medium transition-colors disabled:opacity-50"
                >
                  {msg.label}
                </button>
              ))}

              <button
                onClick={() => setShowCustom(true)}
                className="w-full p-4 text-center bg-purple-50 hover:bg-purple-100 rounded-xl text-purple-800 font-medium transition-colors mt-4"
              >
                ✏️ Write my own message
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
