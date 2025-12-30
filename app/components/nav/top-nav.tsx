'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Zap, AlertTriangle, BarChart3, FileText, Settings } from 'lucide-react'

export default function TopNav() {
  const pathname = usePathname()

  const isActive = (href: string) => pathname === href

  const navItems = [
    { href: '/', label: 'Dashboard', icon: Home },
    { href: '/screen-time', label: 'Screen Time', icon: Zap },
    { href: '/timeout', label: 'Timeouts', icon: AlertTriangle },
    { href: '/gigs/inspect', label: 'Inspect Gigs', icon: Settings },
    { href: '/analytics', label: 'Analytics', icon: BarChart3 },
    { href: '/charts', label: 'Charts', icon: FileText },
  ]

  return (
    <nav className="bg-white border-b-2 border-gray-200 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between gap-1 overflow-x-auto">
          {navItems.map((item) => {
            const Icon = item.icon
            const active = isActive(item.href)

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-sm whitespace-nowrap transition-colors ${
                  active
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="hidden sm:inline">{item.label}</span>
              </Link>
            )
          })}
        </div>
      </div>
    </nav>
  )
}
