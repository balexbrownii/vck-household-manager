import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import crypto from 'crypto'

function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex')
}

export async function POST() {
  try {
    const cookieStore = await cookies()
    const sessionToken = cookieStore.get('kid_session')?.value

    if (sessionToken) {
      const supabase = await createClient()
      const tokenHash = hashToken(sessionToken)

      // Delete session from database
      await supabase
        .from('kid_sessions')
        .delete()
        .eq('token_hash', tokenHash)

      // Clear cookie
      cookieStore.delete('kid_session')
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Kid logout error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
