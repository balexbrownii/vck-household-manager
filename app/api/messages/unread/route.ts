import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import crypto from 'crypto'

function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex')
}

async function getKidFromSession(): Promise<string | null> {
  const cookieStore = await cookies()
  const sessionToken = cookieStore.get('kid_session')?.value

  if (!sessionToken) return null

  const supabase = await createClient()
  const tokenHash = hashToken(sessionToken)

  const { data: session } = await supabase
    .from('kid_sessions')
    .select('kid_id')
    .eq('token_hash', tokenHash)
    .gt('expires_at', new Date().toISOString())
    .single()

  return session?.kid_id || null
}

// GET: Get unread message count
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Check authentication
    const { data: { user } } = await supabase.auth.getUser()
    const sessionKidId = await getKidFromSession()

    if (!user && !sessionKidId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const isParent = !!user
    const isKid = !user && !!sessionKidId

    let count = 0
    let actionRequiredCount = 0

    if (isKid) {
      // Count unread messages for this kid
      const { count: unreadCount } = await supabase
        .from('family_messages')
        .select('*', { count: 'exact', head: true })
        .eq('recipient_kid_id', sessionKidId)
        .is('read_at', null)

      count = unreadCount || 0
    } else if (isParent) {
      // Count unread messages to parents
      const { count: unreadCount } = await supabase
        .from('family_messages')
        .select('*', { count: 'exact', head: true })
        .in('recipient_type', ['parent', 'all_parents'])
        .is('read_at', null)

      // Count messages requiring action
      const { count: actionCount } = await supabase
        .from('family_messages')
        .select('*', { count: 'exact', head: true })
        .eq('action_required', true)
        .is('responded_at', null)

      count = unreadCount || 0
      actionRequiredCount = actionCount || 0
    }

    return NextResponse.json({
      unreadCount: count,
      actionRequiredCount,
      totalBadge: count + actionRequiredCount
    })
  } catch (error) {
    console.error('Unread count error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
