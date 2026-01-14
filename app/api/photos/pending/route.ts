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
        ai_passed,
        ai_feedback,
        ai_confidence,
        escalated_to_parent,
        submission_attempt,
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

    // Get gig IDs that have pending photo submissions
    const gigIdsWithPhotos = new Set(
      (photos || [])
        .filter(p => p.entity_type === 'gig')
        .map(p => p.entity_id)
    )

    // Get claimed gigs pending inspection (no photo submitted yet)
    // These are gigs that kids claimed but haven't submitted proof for
    const { data: pendingDirectGigs, error: gigsError } = await supabase
      .from('claimed_gigs')
      .select(`
        id,
        kid_id,
        gig_id,
        claimed_at,
        inspection_status,
        inspection_notes,
        kids (
          id,
          name
        ),
        gigs (
          id,
          title,
          description,
          stars,
          checklist
        )
      `)
      .is('completed_at', null)
      .or('inspection_status.is.null,inspection_status.eq.rejected')
      .order('claimed_at', { ascending: false })

    if (gigsError) {
      console.error('Error fetching pending gigs:', gigsError)
    }

    // Filter out gigs that already have pending photo submissions
    const directInspectionGigs = (pendingDirectGigs || [])
      .filter(g => !gigIdsWithPhotos.has(g.gig_id))
      .map(g => ({
        id: `direct-${g.id}`,
        claimedGigId: g.id,
        entity_type: 'gig' as const,
        entity_id: g.gig_id,
        storage_path: null,
        notes: null,
        status: g.inspection_status === 'rejected' ? 'rejected' : 'pending_inspection',
        uploaded_at: g.claimed_at,
        ai_passed: null,
        ai_feedback: null,
        ai_confidence: null,
        escalated_to_parent: false,
        submission_attempt: 1,
        kids: g.kids,
        photoUrl: null,
        isDirectInspection: true,
        rejectionNotes: g.inspection_notes,
        entityDetails: {
          title: (g.gigs as any)?.title,
          stars: (g.gigs as any)?.stars,
          description: (g.gigs as any)?.description,
          checklist: (g.gigs as any)?.checklist,
        },
      }))

    // Enrich photo submissions with entity details
    const enrichedPhotos = await Promise.all(
      (photos || []).map(async (photo) => {
        let entityDetails = null

        if (photo.entity_type === 'gig') {
          const { data: gig } = await supabase
            .from('gigs')
            .select('title, stars, description, checklist')
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
          isDirectInspection: false,
        }
      })
    )

    // Combine both types of submissions
    const allSubmissions = [...enrichedPhotos, ...directInspectionGigs]

    return NextResponse.json({ submissions: allSubmissions })
  } catch (error) {
    console.error('Pending photos API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
