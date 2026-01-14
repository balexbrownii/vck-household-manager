'use client'

import Link from 'next/link'
import { AlertCircle, Clock, CheckSquare, Camera, ChevronRight } from 'lucide-react'

interface AttentionItem {
  type: 'gig_review' | 'timeout_pending' | 'expectations_incomplete' | 'photo_review'
  kidId?: string
  kidName: string
  message: string
  link: string
  count?: number
}

interface NeedsAttentionBannerProps {
  items: AttentionItem[]
}

export default function NeedsAttentionBanner({ items }: NeedsAttentionBannerProps) {
  if (items.length === 0) {
    return null
  }

  const getIcon = (type: AttentionItem['type']) => {
    switch (type) {
      case 'gig_review':
        return <CheckSquare className="w-4 h-4" />
      case 'timeout_pending':
        return <Clock className="w-4 h-4" />
      case 'expectations_incomplete':
        return <AlertCircle className="w-4 h-4" />
      case 'photo_review':
        return <Camera className="w-4 h-4" />
      default:
        return <AlertCircle className="w-4 h-4" />
    }
  }

  const getItemStyle = (type: AttentionItem['type']) => {
    switch (type) {
      case 'gig_review':
        return 'bg-purple-50 text-purple-700 border-purple-200'
      case 'timeout_pending':
        return 'bg-red-50 text-red-700 border-red-200'
      case 'photo_review':
        return 'bg-blue-50 text-blue-700 border-blue-200'
      case 'expectations_incomplete':
      default:
        return 'bg-amber-50 text-amber-700 border-amber-200'
    }
  }

  return (
    <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-4 mb-6">
      <div className="flex items-center gap-2 mb-3">
        <AlertCircle className="w-5 h-5 text-red-600" />
        <h2 className="font-bold text-red-900">
          Needs Attention
          <span className="ml-2 inline-flex items-center justify-center w-6 h-6 text-xs font-bold bg-red-600 text-white rounded-full">
            {items.length}
          </span>
        </h2>
      </div>

      <div className="space-y-2">
        {items.map((item, index) => (
          <Link
            key={index}
            href={item.link}
            className={`flex items-center justify-between p-3 rounded-lg border transition-all hover:shadow-sm ${getItemStyle(item.type)}`}
          >
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0">
                {getIcon(item.type)}
              </div>
              <div>
                <span className="font-medium">{item.message}</span>
                {item.count && item.count > 1 && (
                  <span className="ml-1 text-sm opacity-75">({item.count})</span>
                )}
              </div>
            </div>
            <ChevronRight className="w-4 h-4 flex-shrink-0" />
          </Link>
        ))}
      </div>
    </div>
  )
}
