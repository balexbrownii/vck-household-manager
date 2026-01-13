import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import crypto from 'crypto'

function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex')
}

// Verify kid session and return kid_id
async function getKidFromSession(): Promise<string | null> {
  const cookieStore = await cookies()
  const sessionToken = cookieStore.get('kid_session')?.value

  if (!sessionToken) return null

  const supabase = await createClient()
  const tokenHash = hashToken(sessionToken)

  const { data: session } = await supabase
    .from('kid_sessions')
    .select('kid_id')
    .eq('token_hash', tokenHash)
    .gt('expires_at', new Date().toISOString())
    .single()

  return session?.kid_id || null
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const kidId = searchParams.get('kidId')

    if (!kidId) {
      return NextResponse.json({ error: 'kidId required' }, { status: 400 })
    }

    // Verify authorization - either parent auth or kid session
    const { data: { user } } = await supabase.auth.getUser()
    const sessionKidId = await getKidFromSession()

    // Must be either a logged-in parent OR the kid themselves
    if (!user && sessionKidId !== kidId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get today's date in local timezone
    const today = new Date().toISOString().split('T')[0]

    // Get or create today's expectations record
    let { data: expectation, error } = await supabase
      .from('daily_expectations')
      .select('*')
      .eq('kid_id', kidId)
      .eq('date', today)
      .single()

    // If no record exists for today, create one
    if (!expectation || error?.code === 'PGRST116') {
      const { data: newExpectation, error: insertError } = await supabase
        .from('daily_expectations')
        .insert({
          kid_id: kidId,
          date: today,
          exercise_complete: false,
          reading_complete: false,
          tidy_up_complete: false,
          daily_chore_complete: false,
        })
        .select()
        .single()

      if (insertError) {
        console.error('Failed to create expectation record:', insertError)
        return NextResponse.json(
          { error: 'Failed to load expectations' },
          { status: 500 }
        )
      }

      expectation = newExpectation
    }

    return NextResponse.json({ expectation })
  } catch (error) {
    console.error('Expectations GET error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
