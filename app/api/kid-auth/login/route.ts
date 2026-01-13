import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/app/lib/supabase/server'
import { cookies } from 'next/headers'
import crypto from 'crypto'

// Simple hash function for PIN (in production, use bcrypt)
function hashPin(pin: string): string {
  return crypto.createHash('sha256').update(pin).digest('hex')
}

function generateSessionToken(): string {
  return crypto.randomBytes(32).toString('hex')
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

    // Get kid and verify PIN
    const { data: kid, error: kidError } = await supabase
      .from('kids')
      .select('id, name, pin_hash')
      .eq('id', kidId)
      .single()

    if (kidError || !kid) {
      return NextResponse.json(
        { error: 'Kid not found' },
        { status: 404 }
      )
    }

    // Check if PIN is set
    if (!kid.pin_hash) {
      return NextResponse.json(
        { error: 'PIN not set for this child. Please ask a parent to set your PIN.' },
        { status: 400 }
      )
    }

    // Verify PIN
    const pinHash = hashPin(pin)
    if (pinHash !== kid.pin_hash) {
      return NextResponse.json(
        { error: 'Incorrect PIN' },
        { status: 401 }
      )
    }

    // Generate session token
    const sessionToken = generateSessionToken()
    const tokenHash = hashPin(sessionToken)
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours

    // Create session in database
    const { error: sessionError } = await supabase
      .from('kid_sessions')
      .insert({
        kid_id: kidId,
        token_hash: tokenHash,
        expires_at: expiresAt.toISOString(),
      })

    if (sessionError) {
      console.error('Session creation error:', sessionError)
      return NextResponse.json(
        { error: 'Failed to create session' },
        { status: 500 }
      )
    }

    // Update last login
    await supabase
      .from('kids')
      .update({ last_login_at: new Date().toISOString() })
      .eq('id', kidId)

    // Set session cookie
    const cookieStore = await cookies()
    cookieStore.set('kid_session', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      expires: expiresAt,
      path: '/',
    })

    return NextResponse.json({
      success: true,
      kid: {
        id: kid.id,
        name: kid.name,
      },
    })
  } catch (error) {
    console.error('Kid login error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
