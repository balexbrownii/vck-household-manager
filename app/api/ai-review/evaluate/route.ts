import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { processSubmission } from '@/lib/ai/process-submission'

/**
 * POST /api/ai-review/evaluate
 * Manually trigger AI evaluation for a photo
 * Used for re-evaluation or debugging
 * Body: { photoId: string }
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Check authentication (parent only)
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check role
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || !['parent', 'admin'].includes(profile.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { photoId } = body

    if (!photoId) {
      return NextResponse.json(
        { error: 'photoId is required' },
        { status: 400 }
      )
    }

    // Process the submission
    const result = await processSubmission(photoId)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'AI evaluation failed' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      status: result.status,
      feedback: result.feedback,
    })
  } catch (error) {
    console.error('AI evaluation error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
