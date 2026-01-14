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

// GET: Fetch ad-hoc chores
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)

    const kidId = searchParams.get('kidId')
    const date = searchParams.get('date') || new Date().toISOString().split('T')[0]
    const pendingOnly = searchParams.get('pendingOnly') === 'true'

    // Check authentication
    const { data: { user } } = await supabase.auth.getUser()
    const sessionKidId = await getKidFromSession()

    if (!user && !sessionKidId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const isKid = !user && !!sessionKidId

    // Build query
    let query = supabase
      .from('adhoc_chores')
      .select(`
        *,
        kid:kids(id, name)
      `)
      .eq('date', date)
      .order('created_at', { ascending: true })

    if (isKid) {
      // Kids only see their own chores
      query = query.eq('kid_id', sessionKidId)
    } else if (kidId) {
      // Parents can filter by kid
      query = query.eq('kid_id', kidId)
    }

    if (pendingOnly) {
      query = query.eq('completed', false)
    }

    const { data, error } = await query

    if (error) {
      console.error('Adhoc chores fetch error:', error)
      return NextResponse.json({ error: 'Failed to fetch ad-hoc chores' }, { status: 500 })
    }

    return NextResponse.json({ chores: data })
  } catch (error) {
    console.error('Adhoc chores GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST: Create ad-hoc chore (parent only)
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Check authentication - parent only
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized - parents only' }, { status: 401 })
    }

    const body = await request.json()
    const { kidId, title, description, checklist, date } = body

    if (!kidId || !title) {
      return NextResponse.json(
        { error: 'Missing required fields: kidId, title' },
        { status: 400 }
      )
    }

    // Create the ad-hoc chore
    const { data, error } = await supabase
      .from('adhoc_chores')
      .insert({
        kid_id: kidId,
        title,
        description: description || null,
        checklist: checklist || [],
        date: date || new Date().toISOString().split('T')[0],
        assigned_by: user.id
      })
      .select(`
        *,
        kid:kids(id, name)
      `)
      .single()

    if (error) {
      console.error('Adhoc chore create error:', error)
      return NextResponse.json({ error: 'Failed to create ad-hoc chore' }, { status: 500 })
    }

    // Log activity
    await supabase.from('activity_feed').insert({
      kid_id: kidId,
      actor_type: 'parent',
      actor_id: user.id,
      action: 'adhoc_chore_assigned',
      entity_type: 'adhoc_chore',
      entity_id: data.id,
      message: `New task assigned: ${title}`
    })

    // Create notification message for the kid
    await supabase.from('family_messages').insert({
      sender_type: 'parent',
      sender_parent_id: user.id,
      recipient_type: 'kid',
      recipient_kid_id: kidId,
      message_type: 'notification',
      subject: 'New Task',
      body: `You have a new task: ${title}${description ? ' - ' + description : ''}`
    })

    return NextResponse.json({ chore: data })
  } catch (error) {
    console.error('Adhoc chores POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PATCH: Update ad-hoc chore (mark complete, verify)
export async function PATCH(request: NextRequest) {
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

    const body = await request.json()
    const { choreId, completed, verified, notes } = body

    if (!choreId) {
      return NextResponse.json({ error: 'Missing choreId' }, { status: 400 })
    }

    const updateData: Record<string, unknown> = {}

    // Kids can mark chores as completed
    if (isKid && completed !== undefined) {
      updateData.completed = completed
      updateData.completed_at = completed ? new Date().toISOString() : null
      updateData.completed_by_kid = completed
    }

    // Parents can verify chores
    if (isParent) {
      if (completed !== undefined) {
        updateData.completed = completed
        updateData.completed_at = completed ? new Date().toISOString() : null
        updateData.completed_by_kid = false
      }
      if (verified !== undefined) {
        updateData.verified = verified
        updateData.verified_at = verified ? new Date().toISOString() : null
        updateData.verified_by = verified ? user.id : null
      }
      if (notes !== undefined) {
        updateData.notes = notes
      }
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'No updates specified' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('adhoc_chores')
      .update(updateData)
      .eq('id', choreId)
      .select(`
        *,
        kid:kids(id, name)
      `)
      .single()

    if (error) {
      console.error('Adhoc chore update error:', error)
      return NextResponse.json({ error: 'Failed to update ad-hoc chore' }, { status: 500 })
    }

    // Log activity and send messages for completions
    if (isKid && completed) {
      await supabase.from('activity_feed').insert({
        kid_id: sessionKidId,
        actor_type: 'kid',
        actor_id: sessionKidId,
        action: 'adhoc_chore_completed',
        entity_type: 'adhoc_chore',
        entity_id: choreId,
        message: `Completed task: ${data.title}`
      })

      // Send message to parent
      await supabase.from('family_messages').insert({
        sender_type: 'kid',
        sender_kid_id: sessionKidId,
        recipient_type: 'parent',
        message_type: 'approval_request',
        subject: 'Task Completed',
        body: `I finished the task: ${data.title}`,
        related_entity_type: 'adhoc_chore',
        related_entity_id: choreId,
        action_required: true
      })
    }

    if (isParent && verified) {
      // Send confirmation to kid
      await supabase.from('family_messages').insert({
        sender_type: 'parent',
        sender_parent_id: user.id,
        recipient_type: 'kid',
        recipient_kid_id: data.kid_id,
        message_type: 'response',
        subject: 'Task Verified',
        body: `Great job completing "${data.title}"!`
      })
    }

    return NextResponse.json({ chore: data })
  } catch (error) {
    console.error('Adhoc chores PATCH error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE: Remove ad-hoc chore (parent only)
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Check authentication - parent only
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized - parents only' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const choreId = searchParams.get('choreId')

    if (!choreId) {
      return NextResponse.json({ error: 'Missing choreId' }, { status: 400 })
    }

    const { error } = await supabase
      .from('adhoc_chores')
      .delete()
      .eq('id', choreId)

    if (error) {
      console.error('Adhoc chore delete error:', error)
      return NextResponse.json({ error: 'Failed to delete ad-hoc chore' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Adhoc chores DELETE error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
