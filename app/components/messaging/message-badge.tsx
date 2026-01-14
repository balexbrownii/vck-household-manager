'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { MessageSquare } from 'lucide-react'

interface MessageBadgeProps {
  className?: string
  showText?: boolean
  linkTo?: string
}

export default function MessageBadge({
  className = '',
  showText = false,
  linkTo = '/messages'
}: MessageBadgeProps) {
  const [unreadCount, setUnreadCount] = useState(0)
  const [actionCount, setActionCount] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchUnreadCount()

    // Poll for updates every 30 seconds
    const interval = setInterval(fetchUnreadCount, 30000)
    return () => clearInterval(interval)
  }, [])

  const fetchUnreadCount = async () => {
    try {
      const res = await fetch('/api/messages/unread')
      if (res.ok) {
        const data = await res.json()
        setUnreadCount(data.unreadCount || 0)
        setActionCount(data.actionRequiredCount || 0)
      }
    } catch (error) {
      console.error('Failed to fetch unread count:', error)
    } finally {
      setLoading(false)
    }
  }

  const totalBadge = unreadCount + actionCount

  return (
    <Link
      href={linkTo}
      className={`relative inline-flex items-center gap-2 p-2 rounded-lg hover:bg-gray-100 transition-colors ${className}`}
    >
      <MessageSquare className="w-5 h-5 text-gray-600" />
      {showText && <span className="text-sm text-gray-600">Messages</span>}

      {!loading && totalBadge > 0 && (
        <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-[20px] h-5 px-1.5 text-xs font-bold bg-red-500 text-white rounded-full">
          {totalBadge > 99 ? '99+' : totalBadge}
        </span>
      )}
    </Link>
  )
}

// Hook for using message count in other components
export function useUnreadMessageCount() {
  const [counts, setCounts] = useState({ unread: 0, action: 0, total: 0 })

  useEffect(() => {
    const fetchCounts = async () => {
      try {
        const res = await fetch('/api/messages/unread')
        if (res.ok) {
          const data = await res.json()
          setCounts({
            unread: data.unreadCount || 0,
            action: data.actionRequiredCount || 0,
            total: (data.unreadCount || 0) + (data.actionRequiredCount || 0)
          })
        }
      } catch (error) {
        console.error('Failed to fetch counts:', error)
      }
    }

    fetchCounts()
    const interval = setInterval(fetchCounts, 30000)
    return () => clearInterval(interval)
  }, [])

  return counts
}
