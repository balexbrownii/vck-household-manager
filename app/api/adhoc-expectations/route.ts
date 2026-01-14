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

// GET: Fetch ad-hoc expectations
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
      .from('adhoc_expectations')
      .select('*')
      .eq('date', date)
      .order('created_at', { ascending: true })

    if (isKid) {
      // Kids only see their own expectations
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
      console.error('Adhoc expectations fetch error:', error)
      return NextResponse.json({ error: 'Failed to fetch ad-hoc expectations' }, { status: 500 })
    }

    return NextResponse.json({ expectations: data })
  } catch (error) {
    console.error('Adhoc expectations GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST: Create ad-hoc expectation (parent only)
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Check authentication - parent only
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized - parents only' }, { status: 401 })
    }

    const body = await request.json()
    const { kidId, title, description, icon, date } = body

    if (!kidId || !title) {
      return NextResponse.json(
        { error: 'Missing required fields: kidId, title' },
        { status: 400 }
      )
    }

    // Get kid name for notifications
    const { data: kid } = await supabase
      .from('kids')
      .select('name')
      .eq('id', kidId)
      .single()

    // Create the ad-hoc expectation
    const { data, error } = await supabase
      .from('adhoc_expectations')
      .insert({
        kid_id: kidId,
        title,
        description: description || null,
        icon: icon || 'star',
        date: date || new Date().toISOString().split('T')[0],
        assigned_by: user.id
      })
      .select()
      .single()

    if (error) {
      console.error('Adhoc expectation create error:', error)
      return NextResponse.json({ error: 'Failed to create ad-hoc expectation' }, { status: 500 })
    }

    // Log activity
    await supabase.from('activity_feed').insert({
      kid_id: kidId,
      actor_type: 'parent',
      actor_id: user.id,
      action: 'adhoc_expectation_assigned',
      entity_type: 'adhoc_expectation',
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
      body: `You have a new task for today: ${title}${description ? ' - ' + description : ''}`
    })

    return NextResponse.json({ expectation: data })
  } catch (error) {
    console.error('Adhoc expectations POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PATCH: Update ad-hoc expectation (mark complete)
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
    const { expectationId, completed, note } = body

    if (!expectationId) {
      return NextResponse.json({ error: 'Missing expectationId' }, { status: 400 })
    }

    const updateData: Record<string, unknown> = {}

    // Kids can mark expectations as completed
    if (isKid && completed !== undefined) {
      updateData.completed = completed
      updateData.completed_at = completed ? new Date().toISOString() : null
      updateData.completed_by_kid = completed
      if (note) updateData.completion_note = note
    }

    // Parents can also mark expectations as completed
    if (isParent) {
      if (completed !== undefined) {
        updateData.completed = completed
        updateData.completed_at = completed ? new Date().toISOString() : null
        updateData.completed_by = completed ? user.id : null
        updateData.completed_by_kid = false
      }
      if (note !== undefined) {
        updateData.completion_note = note
      }
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'No updates specified' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('adhoc_expectations')
      .update(updateData)
      .eq('id', expectationId)
      .select()
      .single()

    if (error) {
      console.error('Adhoc expectation update error:', error)
      return NextResponse.json({ error: 'Failed to update ad-hoc expectation' }, { status: 500 })
    }

    // Log activity for completions
    if (completed) {
      const actorId = isKid ? sessionKidId : user?.id
      const actorType = isKid ? 'kid' : 'parent'

      await supabase.from('activity_feed').insert({
        kid_id: data.kid_id,
        actor_type: actorType,
        actor_id: actorId,
        action: 'adhoc_expectation_completed',
        entity_type: 'adhoc_expectation',
        entity_id: expectationId,
        message: `Completed task: ${data.title}`
      })
    }

    return NextResponse.json({ expectation: data })
  } catch (error) {
    console.error('Adhoc expectations PATCH error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE: Remove ad-hoc expectation (parent only)
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Check authentication - parent only
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized - parents only' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const expectationId = searchParams.get('expectationId')

    if (!expectationId) {
      return NextResponse.json({ error: 'Missing expectationId' }, { status: 400 })
    }

    const { error } = await supabase
      .from('adhoc_expectations')
      .delete()
      .eq('id', expectationId)

    if (error) {
      console.error('Adhoc expectation delete error:', error)
      return NextResponse.json({ error: 'Failed to delete ad-hoc expectation' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Adhoc expectations DELETE error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
