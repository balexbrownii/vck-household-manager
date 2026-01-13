'use client'

import { Star, Trophy } from 'lucide-react'
import Link from 'next/link'

// Star Badge - displays star count
export function StarBadge({
  count,
  size = 'md',
}: {
  count: number
  size?: 'sm' | 'md' | 'lg'
}) {
  const sizeClasses = {
    sm: 'text-sm px-2 py-0.5',
    md: 'text-base px-3 py-1',
    lg: 'text-lg px-4 py-1.5',
  }

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  }

  return (
    <div className={`star-display ${sizeClasses[size]}`}>
      <Star className={`${iconSizes[size]} fill-current`} />
      <span>{count}</span>
    </div>
  )
}

// Progress Card - shows progress toward a goal
export function ProgressCard({
  current,
  target,
  label,
  sublabel,
  icon,
  gradient = 'gold',
}: {
  current: number
  target: number
  label: string
  sublabel?: string
  icon?: React.ReactNode
  gradient?: 'gold' | 'green' | 'purple' | 'blue'
}) {
  const percentage = Math.min((current / target) * 100, 100)

  const gradientClasses = {
    gold: 'from-yellow-400 to-orange-500',
    green: 'from-green-400 to-emerald-500',
    purple: 'from-purple-400 to-pink-500',
    blue: 'from-blue-400 to-cyan-500',
  }

  return (
    <div className="kid-section">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          {icon || <Star className="w-6 h-6 text-yellow-500 fill-yellow-500" />}
          <div>
            <div className="text-2xl font-bold text-gray-900">{current}</div>
            <div className="text-sm text-gray-500">{label}</div>
          </div>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Trophy className="w-5 h-5 text-purple-500" />
          <span>{target - (current % target)} to go!</span>
        </div>
      </div>

      <div className="progress-bar">
        <div
          className={`progress-fill bg-gradient-to-r ${gradientClasses[gradient]}`}
          style={{ width: `${percentage}%` }}
        />
      </div>

      {sublabel && (
        <p className="text-xs text-gray-500 mt-2 text-center">{sublabel}</p>
      )}
    </div>
  )
}

// Quick Action Button - used in dashboard grids
export function QuickActionButton({
  href,
  icon,
  label,
  iconBgColor = 'bg-gray-100',
  iconColor = 'text-gray-600',
}: {
  href: string
  icon: React.ReactNode
  label: string
  iconBgColor?: string
  iconColor?: string
}) {
  return (
    <Link href={href} className="quick-action">
      <div className={`quick-action-icon ${iconBgColor}`}>
        <div className={iconColor}>{icon}</div>
      </div>
      <span className="quick-action-label">{label}</span>
    </Link>
  )
}

// Section Header
export function SectionHeader({
  icon,
  title,
  action,
}: {
  icon: React.ReactNode
  title: string
  action?: React.ReactNode
}) {
  return (
    <div className="flex items-center justify-between mb-4">
      <h2 className="kid-section-title">
        {icon}
        {title}
      </h2>
      {action}
    </div>
  )
}

// Loading Spinner
export function LoadingSpinner({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
  }

  return (
    <div className={`${sizeClasses[size]} animate-spin`}>
      <svg
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="text-current"
      >
        <circle
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="3"
          strokeOpacity="0.2"
        />
        <path
          d="M12 2C6.48 2 2 6.48 2 12"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
        />
      </svg>
    </div>
  )
}

// Empty State
export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon: React.ReactNode
  title: string
  description?: string
  action?: React.ReactNode
}) {
  return (
    <div className="text-center py-8">
      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
        {icon}
      </div>
      <h3 className="font-semibold text-gray-900 mb-1">{title}</h3>
      {description && <p className="text-sm text-gray-500 mb-4">{description}</p>}
      {action}
    </div>
  )
}
