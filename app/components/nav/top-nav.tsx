'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Home,
  Zap,
  AlertTriangle,
  BarChart3,
  FileText,
  ClipboardCheck,
  ClipboardList,
  UtensilsCrossed,
  Star
} from 'lucide-react'
import MessageBadge from '../messaging/message-badge'

export default function TopNav() {
  const pathname = usePathname()

  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname.startsWith(href)

  const navItems = [
    { href: '/', label: 'Dashboard', icon: Home },
    { href: '/chores', label: 'Chores', icon: ClipboardList },
    { href: '/meals', label: 'Meals', icon: UtensilsCrossed },
    { href: '/screen-time', label: 'Screen Time', icon: Zap },
    { href: '/timeout', label: 'Timeouts', icon: AlertTriangle },
    { href: '/dashboard/review', label: 'Review', icon: ClipboardCheck },
    { href: '/analytics', label: 'Analytics', icon: BarChart3 },
    { href: '/charts', label: 'Charts', icon: FileText },
  ]

  return (
    <nav className="parent-nav">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-14">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-lg flex items-center justify-center">
              <Star className="w-5 h-5 text-white fill-white" />
            </div>
            <span className="font-bold text-gray-900 hidden sm:block">StarKids</span>
          </Link>

          {/* Navigation Links */}
          <div className="flex items-center gap-1 overflow-x-auto hide-scrollbar">
            {navItems.map((item) => {
              const Icon = item.icon
              const active = isActive(item.href)

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`nav-link ${active ? 'active' : ''}`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="hidden md:inline">{item.label}</span>
                </Link>
              )
            })}
          </div>

          {/* Messages */}
          <MessageBadge />
        </div>
      </div>
    </nav>
  )
}
