import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import {
  Users,
  Briefcase,
  Home,
  Utensils,
  Tv,
  AlertTriangle,
  FileText,
  ClipboardCheck,
  Star,
  Activity,
  ChevronRight,
} from 'lucide-react'

interface AdminCard {
  title: string
  description: string
  href: string
  icon: React.ReactNode
  color: string
  badge?: number
}

export default async function AdminHubPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login')
  }

  // Fetch counts for badges
  const [
    pendingGigsResult,
    pendingPhotosResult,
    kidsResult,
  ] = await Promise.all([
    supabase
      .from('claimed_gigs')
      .select('id', { count: 'exact' })
      .is('inspection_status', null)
      .not('completed_at', 'is', null),
    supabase
      .from('completion_photos')
      .select('id', { count: 'exact' })
      .eq('status', 'pending_review'),
    supabase
      .from('kids')
      .select('id', { count: 'exact' }),
  ])

  const pendingGigs = pendingGigsResult.count || 0
  const pendingPhotos = pendingPhotosResult.count || 0
  const totalKids = kidsResult.count || 0

  const adminCards: AdminCard[] = [
    {
      title: 'Manage Kids',
      description: `${totalKids} kids registered. Manage PINs and profiles.`,
      href: '/dashboard/kids',
      icon: <Users className="w-6 h-6" />,
      color: 'bg-pink-100 text-pink-600',
    },
    {
      title: 'Gig Management',
      description: 'Create, edit, and manage available gigs.',
      href: '/dashboard/admin/gigs',
      icon: <Briefcase className="w-6 h-6" />,
      color: 'bg-purple-100 text-purple-600',
    },
    {
      title: 'Review Submissions',
      description: 'Review gig completions and photo submissions.',
      href: '/dashboard/review',
      icon: <ClipboardCheck className="w-6 h-6" />,
      color: 'bg-green-100 text-green-600',
      badge: pendingGigs + pendingPhotos,
    },
    {
      title: 'Chore Assignments',
      description: 'Configure chore rotations and room assignments.',
      href: '/chores/admin',
      icon: <Home className="w-6 h-6" />,
      color: 'bg-blue-100 text-blue-600',
    },
    {
      title: 'Meal Planning',
      description: 'Plan meals and manage recipes.',
      href: '/meals',
      icon: <Utensils className="w-6 h-6" />,
      color: 'bg-orange-100 text-orange-600',
    },
    {
      title: 'Screen Time',
      description: 'View and override screen time settings.',
      href: '/screen-time',
      icon: <Tv className="w-6 h-6" />,
      color: 'bg-indigo-100 text-indigo-600',
    },
    {
      title: 'Timeouts',
      description: 'Manage timeout violations and history.',
      href: '/timeout',
      icon: <AlertTriangle className="w-6 h-6" />,
      color: 'bg-red-100 text-red-600',
    },
    {
      title: 'Star Adjustments',
      description: 'Manually add or deduct stars.',
      href: '/dashboard/admin/stars',
      icon: <Star className="w-6 h-6" />,
      color: 'bg-yellow-100 text-yellow-600',
    },
    {
      title: 'Activity Log',
      description: 'View all family activity history.',
      href: '/dashboard/admin/activity',
      icon: <Activity className="w-6 h-6" />,
      color: 'bg-gray-100 text-gray-600',
    },
    {
      title: 'AI Review Rules',
      description: 'Configure AI photo review settings.',
      href: '/dashboard/rules',
      icon: <FileText className="w-6 h-6" />,
      color: 'bg-cyan-100 text-cyan-600',
    },
  ]

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Admin Hub</h1>
        <p className="text-gray-600 mt-1">Manage all family settings and configurations</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {adminCards.map((card) => (
          <Link
            key={card.href}
            href={card.href}
            className="bg-white rounded-xl border-2 border-gray-100 p-5 hover:border-gray-200 hover:shadow-md transition-all group"
          >
            <div className="flex items-start justify-between">
              <div className={`w-12 h-12 rounded-xl ${card.color} flex items-center justify-center`}>
                {card.icon}
              </div>
              {card.badge !== undefined && card.badge > 0 && (
                <span className="px-2.5 py-1 bg-red-100 text-red-700 text-sm font-semibold rounded-full">
                  {card.badge}
                </span>
              )}
            </div>
            <div className="mt-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-gray-900">{card.title}</h3>
                <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-gray-600 transition-colors" />
              </div>
              <p className="text-sm text-gray-500 mt-1">{card.description}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
