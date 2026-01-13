import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import crypto from 'crypto'

// Rate limiting configuration
const MAX_ATTEMPTS = 5 // Max failed attempts before lockout
const LOCKOUT_MINUTES = 5 // Lockout duration in minutes

// Simple hash function for PIN (in production, use bcrypt)
function hashPin(pin: string): string {
  return crypto.createHash('sha256').update(pin).digest('hex')
}

function generateSessionToken(): string {
  return crypto.randomBytes(32).toString('hex')
}

function getClientIP(request: NextRequest): string {
  // Try various headers for IP address
  const forwardedFor = request.headers.get('x-forwarded-for')
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim()
  }
  const realIP = request.headers.get('x-real-ip')
  if (realIP) {
    return realIP
  }
  return 'unknown'
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
    const ipAddress = getClientIP(request)
    const lockoutWindow = new Date(Date.now() - LOCKOUT_MINUTES * 60 * 1000).toISOString()

    // Check rate limiting - count recent failed attempts for this kid
    const { count: failedAttempts } = await supabase
      .from('login_attempts')
      .select('*', { count: 'exact', head: true })
      .eq('kid_id', kidId)
      .eq('success', false)
      .gte('attempted_at', lockoutWindow)

    if (failedAttempts !== null && failedAttempts >= MAX_ATTEMPTS) {
      // Also log this blocked attempt
      await supabase.from('login_attempts').insert({
        kid_id: kidId,
        ip_address: ipAddress,
        success: false,
      })

      return NextResponse.json(
        {
          error: `Too many failed attempts. Please wait ${LOCKOUT_MINUTES} minutes before trying again.`,
          locked: true,
          lockoutMinutes: LOCKOUT_MINUTES,
        },
        { status: 429 }
      )
    }

    // Get kid and verify PIN
    const { data: kid, error: kidError } = await supabase
      .from('kids')
      .select('id, name, pin_hash')
      .eq('id', kidId)
      .single()

    if (kidError || !kid) {
      // Log failed attempt (invalid kid)
      await supabase.from('login_attempts').insert({
        kid_id: kidId,
        ip_address: ipAddress,
        success: false,
      })

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
      // Log failed attempt
      await supabase.from('login_attempts').insert({
        kid_id: kidId,
        ip_address: ipAddress,
        success: false,
      })

      // Calculate remaining attempts
      const remainingAttempts = MAX_ATTEMPTS - (failedAttempts || 0) - 1

      return NextResponse.json(
        {
          error: 'Incorrect PIN',
          remainingAttempts: Math.max(0, remainingAttempts),
        },
        { status: 401 }
      )
    }

    // Log successful attempt
    await supabase.from('login_attempts').insert({
      kid_id: kidId,
      ip_address: ipAddress,
      success: true,
    })

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
