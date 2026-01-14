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

// GET: Fetch messages
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)

    const kidId = searchParams.get('kidId')
    const unreadOnly = searchParams.get('unreadOnly') === 'true'
    const actionRequired = searchParams.get('actionRequired') === 'true'
    const limit = parseInt(searchParams.get('limit') || '50')

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
      .from('family_messages')
      .select(`
        *,
        sender_kid:kids!family_messages_sender_kid_id_fkey(id, name),
        recipient_kid:kids!family_messages_recipient_kid_id_fkey(id, name)
      `)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (isKid) {
      // Kids see messages where they are sender or recipient
      query = query.or(`sender_kid_id.eq.${sessionKidId},recipient_kid_id.eq.${sessionKidId}`)

      if (unreadOnly) {
        query = query.is('read_at', null).eq('recipient_kid_id', sessionKidId)
      }
    } else if (isParent) {
      // Parents see messages to them or all messages if filtering by kid
      if (kidId) {
        query = query.or(`sender_kid_id.eq.${kidId},recipient_kid_id.eq.${kidId}`)
      } else {
        // Show messages to parents (not kid-to-kid)
        query = query.or('recipient_type.eq.parent,recipient_type.eq.all_parents,sender_type.eq.kid')
      }

      if (unreadOnly) {
        query = query.is('read_at', null).in('recipient_type', ['parent', 'all_parents'])
      }

      if (actionRequired) {
        query = query.eq('action_required', true).is('responded_at', null)
      }
    }

    const { data, error } = await query

    if (error) {
      console.error('Messages fetch error:', error)
      return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 })
    }

    return NextResponse.json({ messages: data })
  } catch (error) {
    console.error('Messages GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST: Send a new message
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
    const {
      recipientType,
      recipientKidId,
      messageType,
      subject,
      body: messageBody,
      relatedEntityType,
      relatedEntityId,
      actionRequired,
      parentMessageId
    } = body

    if (!recipientType || !messageType || !messageBody) {
      return NextResponse.json(
        { error: 'Missing required fields: recipientType, messageType, body' },
        { status: 400 }
      )
    }

    const isParent = !!user
    const isKid = !user && !!sessionKidId

    // Build message record
    const messageData: Record<string, unknown> = {
      sender_type: isParent ? 'parent' : 'kid',
      sender_parent_id: isParent ? user.id : null,
      sender_kid_id: isKid ? sessionKidId : null,
      recipient_type: recipientType,
      recipient_kid_id: recipientKidId || null,
      message_type: messageType,
      subject: subject || null,
      body: messageBody,
      related_entity_type: relatedEntityType || null,
      related_entity_id: relatedEntityId || null,
      action_required: actionRequired || false,
      parent_message_id: parentMessageId || null,
    }

    const { data, error } = await supabase
      .from('family_messages')
      .insert(messageData)
      .select(`
        *,
        sender_kid:kids!family_messages_sender_kid_id_fkey(id, name),
        recipient_kid:kids!family_messages_recipient_kid_id_fkey(id, name)
      `)
      .single()

    if (error) {
      console.error('Message insert error:', error)
      return NextResponse.json({ error: 'Failed to send message' }, { status: 500 })
    }

    return NextResponse.json({ message: data })
  } catch (error) {
    console.error('Messages POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PATCH: Update message (mark read, respond)
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
    const { messageId, messageIds, markRead, response } = body

    const isParent = !!user

    // Handle marking multiple messages as read
    if (messageIds && messageIds.length > 0 && markRead) {
      const { error } = await supabase
        .from('family_messages')
        .update({ read_at: new Date().toISOString() })
        .in('id', messageIds)
        .is('read_at', null)

      if (error) {
        console.error('Bulk mark read error:', error)
        return NextResponse.json({ error: 'Failed to mark as read' }, { status: 500 })
      }

      return NextResponse.json({ success: true, updatedCount: messageIds.length })
    }

    // Handle single message update
    if (!messageId) {
      return NextResponse.json({ error: 'Missing messageId' }, { status: 400 })
    }

    const updateData: Record<string, unknown> = {}

    if (markRead) {
      updateData.read_at = new Date().toISOString()
    }

    if (response && isParent) {
      updateData.response = response
      updateData.responded_at = new Date().toISOString()

      // If this is a response to an approval request, we might need to take action
      const { data: originalMessage } = await supabase
        .from('family_messages')
        .select('*')
        .eq('id', messageId)
        .single()

      // Send notification back to kid if it was their request
      if (originalMessage && originalMessage.sender_kid_id) {
        await supabase.from('family_messages').insert({
          sender_type: 'parent',
          sender_parent_id: user.id,
          recipient_type: 'kid',
          recipient_kid_id: originalMessage.sender_kid_id,
          message_type: 'response',
          subject: `Re: ${originalMessage.subject || 'Your request'}`,
          body: response === 'approved' || response === 'yes'
            ? 'Your request has been approved!'
            : response === 'rejected' || response === 'no'
              ? 'Your request was not approved.'
              : response,
          parent_message_id: messageId,
        })
      }
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'No updates specified' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('family_messages')
      .update(updateData)
      .eq('id', messageId)
      .select()
      .single()

    if (error) {
      console.error('Message update error:', error)
      return NextResponse.json({ error: 'Failed to update message' }, { status: 500 })
    }

    return NextResponse.json({ message: data })
  } catch (error) {
    console.error('Messages PATCH error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
