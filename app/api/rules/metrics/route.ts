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
        { error: 'Only parents can view AI metrics' },
        { status: 403 }
      )
    }

    // Get AI accuracy metrics from the view
    const { data: metrics, error: metricsError } = await supabase
      .from('ai_accuracy_metrics')
      .select('*')

    if (metricsError) {
      console.error('Error fetching AI metrics:', metricsError)
      return NextResponse.json(
        { error: 'Failed to fetch metrics' },
        { status: 500 }
      )
    }

    // Get recent disagreements for review
    const { data: recentDisagreements } = await supabase
      .from('ai_feedback_signals')
      .select(`
        id,
        entity_type,
        signal_type,
        ai_passed,
        ai_confidence,
        ai_feedback,
        parent_approved,
        parent_feedback,
        kid_notes,
        created_at
      `)
      .neq('signal_type', 'agreement')
      .order('created_at', { ascending: false })
      .limit(10)

    // Get overall totals
    const { data: totals } = await supabase
      .from('ai_feedback_signals')
      .select('signal_type')

    const totalSignals = totals?.length || 0
    const agreements = totals?.filter(t => t.signal_type === 'agreement').length || 0
    const falsePositives = totals?.filter(t => t.signal_type === 'false_positive').length || 0
    const falseNegatives = totals?.filter(t => t.signal_type === 'false_negative').length || 0

    const overallAccuracy = totalSignals > 0
      ? Math.round((agreements / totalSignals) * 100)
      : null

    return NextResponse.json({
      metrics: metrics || [],
      recentDisagreements: recentDisagreements || [],
      summary: {
        totalReviews: totalSignals,
        agreements,
        falsePositives,
        falseNegatives,
        overallAccuracy,
      }
    })
  } catch (error) {
    console.error('AI metrics API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
