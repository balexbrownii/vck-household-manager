import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = await createClient()

    // Verify parent is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Verify user is a parent
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || !['parent', 'admin'].includes(profile.role)) {
      return NextResponse.json(
        { error: 'Only parents can view pending submissions' },
        { status: 403 }
      )
    }

    // Get all pending photo submissions
    const { data: photos, error } = await supabase
      .from('completion_photos')
      .select(`
        id,
        entity_type,
        entity_id,
        storage_path,
        notes,
        status,
        uploaded_at,
        kids (
          id,
          name
        )
      `)
      .eq('status', 'pending_review')
      .order('uploaded_at', { ascending: false })

    if (error) {
      console.error('Error fetching pending photos:', error)
      return NextResponse.json(
        { error: 'Failed to fetch pending submissions' },
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
            .select('title, stars')
            .eq('id', photo.entity_id)
            .single()
          entityDetails = gig
        } else if (photo.entity_type === 'chore') {
          const { data: chore } = await supabase
            .from('chores')
            .select('name')
            .eq('id', photo.entity_id)
            .single()
          entityDetails = chore
        }

        // Get public URL for the photo
        const { data: urlData } = supabase.storage
          .from('completion-photos')
          .getPublicUrl(photo.storage_path)

        return {
          ...photo,
          photoUrl: urlData.publicUrl,
          entityDetails,
        }
      })
    )

    return NextResponse.json({ submissions: enrichedPhotos })
  } catch (error) {
    console.error('Pending photos API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
