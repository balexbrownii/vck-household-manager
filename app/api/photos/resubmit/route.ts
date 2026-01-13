import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import crypto from 'crypto'
import { processSubmission, getRulesForEntity } from '@/lib/ai/process-submission'
import { EntityType } from '@/types/database'

function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex')
}

/**
 * POST /api/photos/resubmit
 * Resubmit a photo after AI rejection
 * Creates a new photo record linked to the same entity
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

    // Parse form data
    const formData = await request.formData()
    const file = formData.get('photo') as File
    const originalPhotoId = formData.get('originalPhotoId') as string
    const notes = formData.get('notes') as string | null

    if (!file || !originalPhotoId) {
      return NextResponse.json(
        { error: 'Missing required fields: photo, originalPhotoId' },
        { status: 400 }
      )
    }

    // Get original photo to get entity info and submission count
    const { data: originalPhoto, error: photoError } = await supabase
      .from('completion_photos')
      .select('entity_type, entity_id, kid_id, submission_attempt')
      .eq('id', originalPhotoId)
      .single()

    if (photoError || !originalPhoto) {
      return NextResponse.json(
        { error: 'Original photo not found' },
        { status: 404 }
      )
    }

    // Verify kid owns this photo
    if (originalPhoto.kid_id !== kidId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      )
    }

    const entityType = originalPhoto.entity_type
    const entityId = originalPhoto.entity_id
    const newAttempt = (originalPhoto.submission_attempt || 1) + 1

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

    // Check if AI review is enabled
    const rules = await getRulesForEntity(entityType as EntityType, entityId)
    const aiEnabled = rules?.ai_review_enabled ?? true
    const initialStatus = aiEnabled ? 'ai_reviewing' : 'pending_review'

    // Save new photo record
    const { data: photoRecord, error: dbError } = await supabase
      .from('completion_photos')
      .insert({
        entity_type: entityType,
        entity_id: entityId,
        kid_id: kidId,
        storage_path: fileName,
        notes: notes || null,
        status: initialStatus,
        submission_attempt: newAttempt,
      })
      .select()
      .single()

    if (dbError) {
      console.error('Database error:', dbError)
      await supabase.storage.from('completion-photos').remove([fileName])
      return NextResponse.json(
        { error: 'Failed to save photo record' },
        { status: 500 }
      )
    }

    // Mark original as superseded (optional - keep for history)
    // We don't delete old photos to maintain audit trail

    // Process with AI if enabled
    let aiResult = null
    if (aiEnabled && photoRecord) {
      aiResult = await processSubmission(photoRecord.id)
    }

    return NextResponse.json({
      success: true,
      photo: {
        id: photoRecord.id,
        url: urlData.publicUrl,
        status: aiResult?.status || initialStatus,
        ai_feedback: aiResult?.feedback || null,
        submission_attempt: newAttempt,
      },
    })
  } catch (error) {
    console.error('Photo resubmit error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
