import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import TopNav from '@/components/nav/top-nav'
import NewMessageForm from './new-message-form'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default async function NewMessagePage() {
  const supabase = await createClient()

  // Check authentication
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Fetch kids for recipient selection
  const { data: kids } = await supabase
    .from('kids')
    .select('id, name')
    .order('name')

  return (
    <>
      <TopNav />
      <main className="parent-page">
        <div className="parent-content max-w-2xl">
          {/* Header */}
          <div className="mb-8">
            <Link
              href="/messages"
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Messages
            </Link>
            <h1 className="dashboard-title">New Message</h1>
            <p className="dashboard-subtitle">
              Send a message or announcement to your kids
            </p>
          </div>

          {/* Form */}
          <NewMessageForm kids={kids || []} />
        </div>
      </main>
    </>
  )
}
