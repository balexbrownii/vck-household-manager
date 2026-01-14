/**
 * AI submission processing orchestration
 * Handles the flow from photo upload to AI evaluation to status update
 */

import { createClient } from '@/lib/supabase/server'
import { evaluatePhoto, isAIConfigured } from './claude-vision'
import { EntityType, AIRules, PhotoStatus } from '@/types/database'

interface ProcessResult {
  success: boolean
  status: PhotoStatus
  feedback: string | null
  error?: string
}

/**
 * Get AI rules for a given entity (gig, chore, or expectation)
 */
export async function getRulesForEntity(
  entityType: EntityType,
  entityId: string
): Promise<AIRules | null> {
  const supabase = await createClient()

  switch (entityType) {
    case 'gig': {
      const { data, error } = await supabase
        .from('gigs')
        .select('scope_description, completion_criteria, checklist, ai_review_enabled')
        .eq('id', entityId)
        .single()

      if (error || !data) {
        console.error('Failed to get gig rules:', error)
        return null
      }

      return {
        scope_description: data.scope_description || data.checklist?.join(', ') || '',
        completion_criteria: data.completion_criteria || '',
        checklist: data.checklist || [],
        ai_review_enabled: data.ai_review_enabled ?? true,
      }
    }

    case 'chore': {
      const { data, error } = await supabase
        .from('chore_rooms')
        .select('scope_description, completion_criteria, checklist, ai_review_enabled')
        .eq('id', entityId)
        .single()

      if (error || !data) {
        console.error('Failed to get chore rules:', error)
        return null
      }

      return {
        scope_description: data.scope_description || '',
        completion_criteria: data.completion_criteria || '',
        checklist: data.checklist || [],
        ai_review_enabled: data.ai_review_enabled ?? true,
      }
    }

    case 'expectation': {
      // For expectations, the entityId is the expectation type (exercise, reading, etc.)
      // We need to look up the expectation_rules table
      const { data, error } = await supabase
        .from('expectation_rules')
        .select('scope_description, completion_criteria, ai_review_enabled')
        .eq('expectation_type', entityId)
        .single()

      if (error || !data) {
        console.error('Failed to get expectation rules:', error)
        return null
      }

      return {
        scope_description: data.scope_description,
        completion_criteria: data.completion_criteria,
        ai_review_enabled: data.ai_review_enabled ?? true,
      }
    }

    default:
      return null
  }
}

/**
 * Process a submission through AI evaluation
 * Called after photo upload if AI review is enabled
 */
export async function processSubmission(photoId: string): Promise<ProcessResult> {
  const supabase = await createClient()

  // 1. Get the photo record
  const { data: photo, error: photoError } = await supabase
    .from('completion_photos')
    .select('*')
    .eq('id', photoId)
    .single()

  if (photoError || !photo) {
    return {
      success: false,
      status: 'pending_review',
      feedback: null,
      error: 'Photo not found',
    }
  }

  // 2. Get rules for this entity
  const rules = await getRulesForEntity(
    photo.entity_type as EntityType,
    photo.entity_id
  )

  // 3. If no rules or AI disabled, skip to parent review
  if (!rules || !rules.ai_review_enabled) {
    await supabase
      .from('completion_photos')
      .update({ status: 'pending_review' })
      .eq('id', photoId)

    return {
      success: true,
      status: 'pending_review',
      feedback: null,
    }
  }

  // 4. Check if AI is configured
  if (!isAIConfigured()) {
    console.warn('AI not configured, skipping to parent review')
    await supabase
      .from('completion_photos')
      .update({ status: 'pending_review' })
      .eq('id', photoId)

    return {
      success: true,
      status: 'pending_review',
      feedback: null,
    }
  }

  // 5. Get public URL for the photo
  const { data: urlData } = supabase.storage
    .from('completion-photos')
    .getPublicUrl(photo.storage_path)

  if (!urlData?.publicUrl) {
    return {
      success: false,
      status: 'pending_review',
      feedback: null,
      error: 'Could not get photo URL',
    }
  }

  // 6. Run AI evaluation (includes learned patterns from parent feedback)
  const startTime = Date.now()
  const result = await evaluatePhoto(
    urlData.publicUrl,
    rules,
    photo.entity_type as EntityType,
    photo.notes,
    photo.entity_id  // Pass entity ID for entity-specific learned patterns
  )
  const processingTime = Date.now() - startTime

  // 7. Determine new status
  const newStatus: PhotoStatus = result.passed ? 'pending_review' : 'needs_revision'

  // 8. Update photo record
  const { error: updateError } = await supabase
    .from('completion_photos')
    .update({
      status: newStatus,
      ai_reviewed_at: new Date().toISOString(),
      ai_passed: result.passed,
      ai_feedback: result.feedback,
      ai_confidence: result.confidence,
    })
    .eq('id', photoId)

  if (updateError) {
    console.error('Failed to update photo status:', updateError)
    return {
      success: false,
      status: photo.status as PhotoStatus,
      feedback: null,
      error: 'Failed to update status',
    }
  }

  // 9. Log AI decision for audit trail
  await supabase.from('ai_review_logs').insert({
    completion_photo_id: photoId,
    entity_type: photo.entity_type,
    entity_id: photo.entity_id,
    rules_used: rules,
    ai_response: result,
    passed: result.passed,
    confidence: result.confidence,
    processing_time_ms: processingTime,
    model_used: 'claude-sonnet-4-20250514',
  })

  return {
    success: true,
    status: newStatus,
    feedback: result.feedback,
  }
}

/**
 * Escalate a submission directly to parent review
 * Used when kid clicks "Ask Parent" button
 */
export async function escalateToParent(photoId: string): Promise<ProcessResult> {
  const supabase = await createClient()

  const { error } = await supabase
    .from('completion_photos')
    .update({
      status: 'pending_review',
      escalated_to_parent: true,
    })
    .eq('id', photoId)

  if (error) {
    return {
      success: false,
      status: 'needs_revision',
      feedback: null,
      error: 'Failed to escalate',
    }
  }

  return {
    success: true,
    status: 'pending_review',
    feedback: null,
  }
}
