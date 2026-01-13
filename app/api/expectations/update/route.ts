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

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Parse request body
    const { kidId, expectationId, type, completed, note } = await request.json()

    if (!kidId || !type) {
      return NextResponse.json(
        { error: 'Missing required fields: kidId and type' },
        { status: 400 }
      )
    }

    // Map type to column name
    const typeToColumn: Record<string, string> = {
      exercise: 'exercise_complete',
      reading: 'reading_complete',
      tidy_up: 'tidy_up_complete',
      daily_chore: 'daily_chore_complete',
    }

    const column = typeToColumn[type]
    if (!column) {
      return NextResponse.json(
        { error: 'Invalid type. Must be: exercise, reading, tidy_up, or daily_chore' },
        { status: 400 }
      )
    }

    // Verify authorization - either parent auth or kid session
    const { data: { user } } = await supabase.auth.getUser()
    const sessionKidId = await getKidFromSession()

    // Must be either a logged-in parent OR the kid themselves
    if (!user && sessionKidId !== kidId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get today's date
    const today = new Date().toISOString().split('T')[0]

    // Build update object
    const updateData: Record<string, unknown> = {
      [column]: completed !== false,
      updated_at: new Date().toISOString(),
    }

    // If expectationId provided, update by ID; otherwise upsert by kid_id + date
    if (expectationId) {
      // Verify the expectation belongs to this kid
      const { data: existing } = await supabase
        .from('daily_expectations')
        .select('kid_id')
        .eq('id', expectationId)
        .single()

      if (!existing || existing.kid_id !== kidId) {
        return NextResponse.json(
          { error: 'Expectation not found or unauthorized' },
          { status: 404 }
        )
      }

      const { data, error } = await supabase
        .from('daily_expectations')
        .update(updateData)
        .eq('id', expectationId)
        .select()
        .single()

      if (error) {
        console.error('Update error:', error)
        return NextResponse.json(
          { error: 'Failed to update expectation' },
          { status: 500 }
        )
      }

      // If there's a note, log a completion photo record for tracking
      if (note && note.trim()) {
        await supabase.from('completion_photos').insert({
          entity_type: 'expectation',
          entity_id: expectationId,
          kid_id: kidId,
          storage_path: '', // No actual photo, just a note
          caption: note.trim(),
          status: 'approved', // Auto-approve expectation notes
          notes: `Completed ${type}: ${note.trim()}`,
        })
      }

      return NextResponse.json({ expectation: data })
    } else {
      // Upsert by kid_id + date
      const { data, error } = await supabase
        .from('daily_expectations')
        .upsert(
          {
            kid_id: kidId,
            date: today,
            ...updateData,
          },
          { onConflict: 'kid_id,date' }
        )
        .select()
        .single()

      if (error) {
        console.error('Upsert error:', error)
        return NextResponse.json(
          { error: 'Failed to update expectation' },
          { status: 500 }
        )
      }

      // If there's a note, log it
      if (note && note.trim() && data) {
        await supabase.from('completion_photos').insert({
          entity_type: 'expectation',
          entity_id: data.id,
          kid_id: kidId,
          storage_path: '',
          caption: note.trim(),
          status: 'approved',
          notes: `Completed ${type}: ${note.trim()}`,
        })
      }

      return NextResponse.json({ expectation: data })
    }
  } catch (error) {
    console.error('Expectations update error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
