'use client'

import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'

interface PageHeaderProps {
  title: string
  subtitle?: string
  backHref?: string
  backLabel?: string
  icon?: React.ReactNode
  actions?: React.ReactNode
}

/**
 * Consistent page header component with optional back navigation.
 * Use this for all admin and detail pages to ensure consistent navigation patterns.
 */
export default function PageHeader({
  title,
  subtitle,
  backHref,
  backLabel,
  icon,
  actions,
}: PageHeaderProps) {
  const router = useRouter()

  const handleBack = () => {
    if (backHref) {
      router.push(backHref)
    } else {
      router.back()
    }
  }

  return (
    <div className="mb-6">
      {/* Back Button */}
      {(backHref || backLabel) && (
        backHref ? (
          <Link
            href={backHref}
            className="inline-flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900 mb-3 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            {backLabel || 'Back'}
          </Link>
        ) : (
          <button
            onClick={handleBack}
            className="inline-flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900 mb-3 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            {backLabel || 'Back'}
          </button>
        )
      )}

      {/* Title Row */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            {icon}
            {title}
          </h1>
          {subtitle && (
            <p className="text-gray-600 mt-1">{subtitle}</p>
          )}
        </div>
        {actions && (
          <div className="flex items-center gap-2 flex-shrink-0">
            {actions}
          </div>
        )}
      </div>
    </div>
  )
}

/**
 * Simple back link for use in server components.
 * Renders as a Link element for better SEO and accessibility.
 */
export function BackLink({
  href,
  label = 'Back',
}: {
  href: string
  label?: string
}) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900 mb-3 transition-colors"
    >
      <ChevronLeft className="w-4 h-4" />
      {label}
    </Link>
  )
}
