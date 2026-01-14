import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import crypto from 'crypto'
import { processSubmission, getRulesForEntity } from '@/lib/ai/process-submission'
import { EntityType } from '@/types/database'

function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex')
}

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

    // Parse form data
    const formData = await request.formData()
    const file = formData.get('photo') as File
    const entityType = formData.get('entityType') as string
    const entityId = formData.get('entityId') as string
    const notes = formData.get('notes') as string | null

    if (!file || !entityType || !entityId) {
      return NextResponse.json(
        { error: 'Missing required fields: photo, entityType, entityId' },
        { status: 400 }
      )
    }

    // Validate entity type
    if (!['gig', 'chore', 'expectation'].includes(entityType)) {
      return NextResponse.json(
        { error: 'Invalid entity type' },
        { status: 400 }
      )
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/heic']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Only JPEG, PNG, WebP, and HEIC are allowed.' },
        { status: 400 }
      )
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File too large. Maximum size is 10MB.' },
        { status: 400 }
      )
    }

    // Generate unique filename
    const timestamp = Date.now()
    const randomId = crypto.randomBytes(8).toString('hex')
    const extension = file.name.split('.').pop() || 'jpg'
    const fileName = `${kidId}/${entityType}/${entityId}/${timestamp}-${randomId}.${extension}`

    // Upload to Supabase Storage
    const arrayBuffer = await file.arrayBuffer()
    const buffer = new Uint8Array(arrayBuffer)

    const { error: uploadError } = await supabase.storage
      .from('completion-photos')
      .upload(fileName, buffer, {
        contentType: file.type,
        upsert: false,
      })

    if (uploadError) {
      console.error('Upload error:', uploadError)
      return NextResponse.json(
        { error: 'Failed to upload photo' },
        { status: 500 }
      )
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('completion-photos')
      .getPublicUrl(fileName)

    // Check if AI review is enabled for this entity
    const rules = await getRulesForEntity(entityType as EntityType, entityId)
    const aiEnabled = rules?.ai_review_enabled ?? true
    const initialStatus = aiEnabled ? 'ai_reviewing' : 'pending_review'

    // Save photo record to database
    const { data: photoRecord, error: dbError } = await supabase
      .from('completion_photos')
      .insert({
        entity_type: entityType,
        entity_id: entityId,
        kid_id: kidId,
        storage_path: fileName,
        notes: notes || null,
        status: initialStatus,
        submission_attempt: 1,
      })
      .select()
      .single()

    if (dbError) {
      console.error('Database error:', dbError)
      // Try to clean up uploaded file
      await supabase.storage.from('completion-photos').remove([fileName])
      return NextResponse.json(
        { error: 'Failed to save photo record' },
        { status: 500 }
      )
    }

    // If AI review is enabled, process the submission
    let aiResult = null
    if (aiEnabled && photoRecord) {
      aiResult = await processSubmission(photoRecord.id)
    }

    // Get kid name for the message
    const { data: kid } = await supabase
      .from('kids')
      .select('name')
      .eq('id', kidId)
      .single()

    const kidName = kid?.name || 'Your child'
    const entityLabel = entityType === 'gig' ? 'gig' : entityType === 'chore' ? 'chore' : 'expectation'

    // Get entity name and handle entity-specific logic
    let entityName = entityLabel
    if (entityType === 'gig') {
      const { data: gig } = await supabase
        .from('gigs')
        .select('title')
        .eq('id', entityId)
        .single()
      if (gig?.title) entityName = gig.title

      // Clear any previous rejection status when resubmitting
      await supabase
        .from('claimed_gigs')
        .update({
          inspection_status: null,
          inspection_notes: null,
          inspected_by: null,
          inspected_at: null,
        })
        .eq('gig_id', entityId)
        .eq('kid_id', kidId)
        .is('completed_at', null)
    } else if (entityType === 'chore') {
      // Get room details for chores
      const { data: room } = await supabase
        .from('chore_rooms')
        .select('room_name, assignment')
        .eq('id', entityId)
        .single()

      if (room?.room_name) {
        entityName = room.room_name

        // Get today's date
        const today = new Date().toISOString().split('T')[0]

        // Check if completion record exists, if not create it
        const { data: existingCompletion } = await supabase
          .from('chore_completions')
          .select('id')
          .eq('kid_id', kidId)
          .eq('date', today)
          .eq('room_name', room.room_name)
          .single()

        if (existingCompletion) {
          // Update existing completion - mark as submitted and clear rejection
          await supabase
            .from('chore_completions')
            .update({
              submitted_for_review_at: new Date().toISOString(),
              inspection_status: null,
              kid_notes: notes || null,
            })
            .eq('id', existingCompletion.id)
        } else {
          // Create new completion record
          await supabase
            .from('chore_completions')
            .insert({
              kid_id: kidId,
              date: today,
              assignment: room.assignment,
              room_name: room.room_name,
              completed: false,
              submitted_for_review_at: new Date().toISOString(),
              kid_notes: notes || null,
            })
        }
      }
    }

    // Send notification to parents (if not auto-approved by AI)
    const finalStatus = aiResult?.status || initialStatus
    if (finalStatus === 'pending_review') {
      await supabase.from('family_messages').insert({
        sender_type: 'kid',
        sender_kid_id: kidId,
        recipient_type: 'parent',
        message_type: 'approval_request',
        subject: `${kidName} submitted ${entityLabel}`,
        body: `${kidName} has submitted "${entityName}" for review. Please check and approve or provide feedback.`,
        related_entity_type: entityType,
        related_entity_id: entityId,
        action_required: true
      })

      // Log to activity feed
      await supabase.from('activity_feed').insert({
        kid_id: kidId,
        actor_type: 'kid',
        actor_id: kidId,
        action: 'submission_uploaded',
        entity_type: entityType,
        entity_id: entityId,
        message: `Submitted "${entityName}" for review`
      })
    }

    return NextResponse.json({
      success: true,
      photo: {
        id: photoRecord.id,
        url: urlData.publicUrl,
        status: aiResult?.status || initialStatus,
        ai_feedback: aiResult?.feedback || null,
      },
    })
  } catch (error) {
    console.error('Photo upload error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
