import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import crypto from 'crypto'

function hashPin(pin: string): string {
  return crypto.createHash('sha256').update(pin).digest('hex')
}

export async function POST(request: NextRequest) {
  try {
    const { kidId, pin } = await request.json()

    if (!kidId || !pin) {
      return NextResponse.json(
        { error: 'Kid ID and PIN are required' },
        { status: 400 }
      )
    }

    // Validate PIN format (4 digits)
    if (!/^\d{4}$/.test(pin)) {
      return NextResponse.json(
        { error: 'PIN must be 4 digits' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Verify parent is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized - parent login required' },
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
        { error: 'Only parents can set PINs' },
        { status: 403 }
      )
    }

    // Hash the PIN and update
    const pinHash = hashPin(pin)

    const { error: updateError } = await supabase
      .from('kids')
      .update({ pin_hash: pinHash })
      .eq('id', kidId)

    if (updateError) {
      console.error('PIN update error:', updateError)
      return NextResponse.json(
        { error: 'Failed to set PIN' },
        { status: 500 }
      )
    }

    // Invalidate all existing sessions for this kid
    await supabase
      .from('kid_sessions')
      .delete()
      .eq('kid_id', kidId)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Set PIN error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
