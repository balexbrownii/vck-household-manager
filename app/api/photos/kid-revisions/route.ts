import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import crypto from 'crypto'

function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex')
}

/**
 * GET /api/photos/kid-revisions
 * Get submissions that need revision for the logged-in kid
 */
export async function GET(request: NextRequest) {
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

    // Get photos needing revision
    const { data: photos, error: photosError } = await supabase
      .from('completion_photos')
      .select('*')
      .eq('kid_id', kidId)
      .eq('status', 'needs_revision')
      .order('uploaded_at', { ascending: false })

    if (photosError) {
      console.error('Error fetching revisions:', photosError)
      return NextResponse.json(
        { error: 'Failed to fetch revisions' },
        { status: 500 }
      )
    }

    // Enrich with entity details
    const enrichedPhotos = await Promise.all(
      (photos || []).map(async (photo) => {
        let entityDetails = null

        if (photo.entity_type === 'gig') {
          const { data: gig } = await supabase
            .from('gigs')
            .select('title, stars, description')
            .eq('id', photo.entity_id)
            .single()
          entityDetails = gig
        } else if (photo.entity_type === 'chore') {
          const { data: chore } = await supabase
            .from('chore_rooms')
            .select('room_name, assignment')
            .eq('id', photo.entity_id)
            .single()
          entityDetails = chore
        } else if (photo.entity_type === 'expectation') {
          // For expectations, entityId is the type
          const { data: rule } = await supabase
            .from('expectation_rules')
            .select('expectation_type, scope_description')
            .eq('expectation_type', photo.entity_id)
            .single()
          entityDetails = rule
        }

        // Get photo URL
        const { data: urlData } = supabase.storage
          .from('completion-photos')
          .getPublicUrl(photo.storage_path)

        return {
          ...photo,
          photoUrl: urlData?.publicUrl || null,
          entityDetails,
        }
      })
    )

    return NextResponse.json({
      submissions: enrichedPhotos,
      count: enrichedPhotos.length,
    })
  } catch (error) {
    console.error('Error fetching kid revisions:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
