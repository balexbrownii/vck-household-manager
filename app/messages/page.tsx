import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import TopNav from '@/components/nav/top-nav'
import MessageList from './message-list'
import { MessageSquare, Plus } from 'lucide-react'
import Link from 'next/link'

export default async function MessagesPage() {
  const supabase = await createClient()

  // Check authentication
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Fetch messages for parents
  const { data: messages, error } = await supabase
    .from('family_messages')
    .select(`
      *,
      sender_kid:kids!family_messages_sender_kid_id_fkey(id, name),
      recipient_kid:kids!family_messages_recipient_kid_id_fkey(id, name)
    `)
    .or('recipient_type.eq.parent,recipient_type.eq.all_parents,sender_type.eq.kid')
    .order('created_at', { ascending: false })
    .limit(100)

  if (error) {
    console.error('Messages fetch error:', error)
  }

  // Count stats
  const allMessages = messages || []
  const unreadCount = allMessages.filter(m => !m.read_at).length
  const actionCount = allMessages.filter(m => m.action_required && !m.responded_at).length

  return (
    <>
      <TopNav />
      <main className="parent-page">
        <div className="parent-content">
          {/* Header */}
          <div className="dashboard-header mb-8">
            <div>
              <h1 className="dashboard-title flex items-center gap-3">
                <MessageSquare className="w-8 h-8 text-indigo-600" />
                Message Center
              </h1>
              <p className="dashboard-subtitle">
                Communication hub for family messages and approvals
              </p>
            </div>
            <Link
              href="/messages/new"
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              <Plus className="w-5 h-5" />
              <span className="hidden sm:inline">New Message</span>
            </Link>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <div className="text-3xl font-bold text-gray-900">{allMessages.length}</div>
              <div className="text-sm text-gray-500">Total Messages</div>
            </div>
            <div className="bg-indigo-50 rounded-xl border border-indigo-200 p-4">
              <div className="text-3xl font-bold text-indigo-600">{unreadCount}</div>
              <div className="text-sm text-indigo-600">Unread</div>
            </div>
            <div className="bg-orange-50 rounded-xl border border-orange-200 p-4">
              <div className="text-3xl font-bold text-orange-600">{actionCount}</div>
              <div className="text-sm text-orange-600">Needs Response</div>
            </div>
          </div>

          {/* Message List */}
          <MessageList initialMessages={allMessages} />
        </div>
      </main>
    </>
  )
}
