import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import crypto from 'crypto'

function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex')
}

// Verify kid session and return kid_id
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

// GET: Fetch activity feed items
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)

    const kidId = searchParams.get('kidId')
    const unreadOnly = searchParams.get('unreadOnly') === 'true'
    const forParent = searchParams.get('forParent') === 'true'
    const limit = parseInt(searchParams.get('limit') || '20')

    // Check authentication
    const { data: { user } } = await supabase.auth.getUser()
    const sessionKidId = await getKidFromSession()

    if (!user && !sessionKidId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const isParent = !!user
    const isKid = !user && !!sessionKidId

    // Build query
    let query = supabase
      .from('activity_feed')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit)

    // Filter by kid if specified
    if (kidId) {
      query = query.eq('kid_id', kidId)
    }

    // For kids, only show their own activity
    if (isKid) {
      query = query.eq('kid_id', sessionKidId)
      if (unreadOnly) {
        query = query.eq('read_by_kid', false)
      }
    }

    // For parents, can filter by unread
    if (isParent && unreadOnly) {
      query = query.eq('read_by_parent', false)
    }

    const { data, error } = await query

    if (error) {
      console.error('Activity fetch error:', error)
      return NextResponse.json({ error: 'Failed to fetch activity' }, { status: 500 })
    }

    return NextResponse.json({ activity: data })
  } catch (error) {
    console.error('Activity GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST: Create a new activity item
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Check authentication
    const { data: { user } } = await supabase.auth.getUser()
    const sessionKidId = await getKidFromSession()

    if (!user && !sessionKidId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { kidId, action, entityType, entityId, message } = body

    if (!kidId || !action || !message) {
      return NextResponse.json(
        { error: 'Missing required fields: kidId, action, message' },
        { status: 400 }
      )
    }

    // Determine actor type and ID
    const isParent = !!user
    const actorType = isParent ? 'parent' : 'kid'
    const actorId = isParent ? user.id : sessionKidId

    const { data, error } = await supabase
      .from('activity_feed')
      .insert({
        kid_id: kidId,
        actor_type: actorType,
        actor_id: actorId,
        action,
        entity_type: entityType || null,
        entity_id: entityId || null,
        message,
      })
      .select()
      .single()

    if (error) {
      console.error('Activity insert error:', error)
      return NextResponse.json({ error: 'Failed to create activity' }, { status: 500 })
    }

    return NextResponse.json({ activity: data })
  } catch (error) {
    console.error('Activity POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PATCH: Mark activity as read
export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Check authentication
    const { data: { user } } = await supabase.auth.getUser()
    const sessionKidId = await getKidFromSession()

    if (!user && !sessionKidId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { activityIds, markAll } = body

    const isParent = !!user
    const readColumn = isParent ? 'read_by_parent' : 'read_by_kid'

    if (markAll) {
      // Mark all as read for this user type
      let query = supabase
        .from('activity_feed')
        .update({ [readColumn]: true })
        .eq(readColumn, false)

      // Kids can only mark their own as read
      if (!isParent && sessionKidId) {
        query = query.eq('kid_id', sessionKidId)
      }

      const { error } = await query

      if (error) {
        console.error('Activity mark all read error:', error)
        return NextResponse.json({ error: 'Failed to mark as read' }, { status: 500 })
      }
    } else if (activityIds && activityIds.length > 0) {
      const { error } = await supabase
        .from('activity_feed')
        .update({ [readColumn]: true })
        .in('id', activityIds)

      if (error) {
        console.error('Activity mark read error:', error)
        return NextResponse.json({ error: 'Failed to mark as read' }, { status: 500 })
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Activity PATCH error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
