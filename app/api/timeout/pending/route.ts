import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const kidId = searchParams.get('kidId')

    // Try parent auth first
    const {
      data: { user },
    } = await supabase.auth.getUser()

    let authenticatedKidId = kidId

    // If no parent auth, try kid session
    if (!user) {
      const cookieStore = await cookies()
      const sessionToken = cookieStore.get('kid_session')?.value

      if (!sessionToken) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }

      // Verify kid session
      const { data: session, error: sessionError } = await supabase
        .from('kid_sessions')
        .select('kid_id, expires_at')
        .eq('session_token', sessionToken)
        .single()

      if (sessionError || !session) {
        return NextResponse.json({ error: 'Invalid session' }, { status: 401 })
      }

      if (new Date(session.expires_at) < new Date()) {
        return NextResponse.json({ error: 'Session expired' }, { status: 401 })
      }

      authenticatedKidId = session.kid_id
    }

    if (!authenticatedKidId) {
      return NextResponse.json(
        { error: 'Missing kidId parameter' },
        { status: 400 }
      )
    }

    // Fetch pending timeout (not completed) for this kid
    const { data: timeout, error } = await supabase
      .from('timeout_violations')
      .select('*')
      .eq('kid_id', authenticatedKidId)
      .is('completed_at', null)
      .order('started_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch pending timeout' },
        { status: 500 }
      )
    }

    return NextResponse.json({ timeout: timeout || null })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
