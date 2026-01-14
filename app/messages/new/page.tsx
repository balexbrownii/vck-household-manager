import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import TopNav from '@/components/nav/top-nav'
import NewMessageForm from './new-message-form'
import { BackLink } from '@/components/ui/page-header'

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
            <BackLink href="/messages" label="Back to Messages" />
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
