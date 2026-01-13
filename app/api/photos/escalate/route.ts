import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import crypto from 'crypto'

function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex')
}

/**
 * POST /api/photos/escalate
 * Kid requests parent to review directly (bypasses AI)
 * Body: { photoId: string }
 */
export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const sessionToken = cookieStore.get('kid_session')?.value

    if (!sessionToken) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    const supabase = await createClient()
    const tokenHash = hashToken(sessionToken)

    // Verify kid session
    const { data: session, error: sessionError } = await supabase
      .from('kid_sessions')
      .select('kid_id')
      .eq('token_hash', tokenHash)
      .gt('expires_at', new Date().toISOString())
      .single()

    if (sessionError || !session) {
      return NextResponse.json(
        { error: 'Invalid session' },
        { status: 401 }
      )
    }

    const kidId = session.kid_id

    const body = await request.json()
    const { photoId } = body

    if (!photoId) {
      return NextResponse.json(
        { error: 'photoId is required' },
        { status: 400 }
      )
    }

    // Get photo and verify ownership
    const { data: photo, error: photoError } = await supabase
      .from('completion_photos')
      .select('kid_id, status')
      .eq('id', photoId)
      .single()

    if (photoError || !photo) {
      return NextResponse.json(
        { error: 'Photo not found' },
        { status: 404 }
      )
    }

    // Verify kid owns this photo
    if (photo.kid_id !== kidId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      )
    }

    // Only allow escalation for needs_revision or ai_reviewing status
    if (!['needs_revision', 'ai_reviewing'].includes(photo.status)) {
      return NextResponse.json(
        { error: 'Photo cannot be escalated in current status' },
        { status: 400 }
      )
    }

    // Update photo to pending_review with escalation flag
    const { error: updateError } = await supabase
      .from('completion_photos')
      .update({
        status: 'pending_review',
        escalated_to_parent: true,
        ai_feedback: photo.status === 'needs_revision'
          ? 'Kid requested parent review after AI feedback.'
          : 'Kid requested parent review.',
      })
      .eq('id', photoId)

    if (updateError) {
      console.error('Update error:', updateError)
      return NextResponse.json(
        { error: 'Failed to escalate photo' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Photo sent to parent for review',
      status: 'pending_review',
    })
  } catch (error) {
    console.error('Photo escalate error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
