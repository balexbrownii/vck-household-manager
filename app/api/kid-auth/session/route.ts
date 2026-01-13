import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import crypto from 'crypto'

function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex')
}

export async function GET() {
  try {
    const cookieStore = await cookies()
    const sessionToken = cookieStore.get('kid_session')?.value

    if (!sessionToken) {
      return NextResponse.json({ authenticated: false })
    }

    const supabase = await createClient()
    const tokenHash = hashToken(sessionToken)

    // Look up session
    const { data: session, error: sessionError } = await supabase
      .from('kid_sessions')
      .select(`
        id,
        kid_id,
        expires_at,
        kids (
          id,
          name,
          age,
          total_stars,
          max_gig_tier
        )
      `)
      .eq('token_hash', tokenHash)
      .gt('expires_at', new Date().toISOString())
      .single()

    if (sessionError || !session) {
      // Clear invalid cookie
      cookieStore.delete('kid_session')
      return NextResponse.json({ authenticated: false })
    }

    // Update last used
    await supabase
      .from('kid_sessions')
      .update({ last_used_at: new Date().toISOString() })
      .eq('id', session.id)

    return NextResponse.json({
      authenticated: true,
      kid: session.kids,
    })
  } catch (error) {
    console.error('Session check error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
