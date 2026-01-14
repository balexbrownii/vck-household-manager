import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Check authentication - only parents can override
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { kidId, action, reason, bonusMinutes } = await request.json()

    if (!kidId || !action) {
      return NextResponse.json(
        { error: 'Missing required fields: kidId, action' },
        { status: 400 }
      )
    }

    if (!['unlock', 'lock', 'add_time'].includes(action)) {
      return NextResponse.json(
        { error: 'Invalid action. Must be: unlock, lock, or add_time' },
        { status: 400 }
      )
    }

    // Get today's date
    const today = new Date().toISOString().split('T')[0]

    // Get or create today's session
    let { data: session, error: sessionError } = await supabase
      .from('screen_time_sessions')
      .select('*')
      .eq('kid_id', kidId)
      .eq('date', today)
      .single()

    if (sessionError && sessionError.code !== 'PGRST116') {
      console.error('Session fetch error:', sessionError)
      return NextResponse.json({ error: 'Failed to fetch session' }, { status: 500 })
    }

    // Get kid's base screen time settings
    const { data: kid, error: kidError } = await supabase
      .from('kids')
      .select('screen_time_weekday_minutes, screen_time_weekend_minutes')
      .eq('id', kidId)
      .single()

    if (kidError || !kid) {
      return NextResponse.json({ error: 'Kid not found' }, { status: 404 })
    }

    const isWeekend = [0, 6].includes(new Date().getDay())
    const baseMinutes = isWeekend ? kid.screen_time_weekend_minutes : kid.screen_time_weekday_minutes

    // Create session if doesn't exist
    if (!session) {
      const { data: newSession, error: createError } = await supabase
        .from('screen_time_sessions')
        .insert({
          kid_id: kidId,
          date: today,
          base_minutes_allowed: baseMinutes,
          bonus_minutes_allowed: 0,
          total_minutes_allowed: baseMinutes,
          minutes_used: 0,
          is_weekend: isWeekend,
        })
        .select()
        .single()

      if (createError) {
        console.error('Session create error:', createError)
        return NextResponse.json({ error: 'Failed to create session' }, { status: 500 })
      }

      session = newSession
    }

    // Handle different actions
    let updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    }

    switch (action) {
      case 'unlock':
        updateData = {
          ...updateData,
          unlocked_at: new Date().toISOString(),
          locked_at: null,
          manually_unlocked: true,
          manually_unlocked_by: user.id,
          manually_locked: false,
          manually_locked_by: null,
          override_reason: reason || 'Manual unlock by parent',
        }
        break

      case 'lock':
        updateData = {
          ...updateData,
          locked_at: new Date().toISOString(),
          manually_locked: true,
          manually_locked_by: user.id,
          manually_unlocked: false,
          override_reason: reason || 'Manual lock by parent',
        }
        break

      case 'add_time':
        if (!bonusMinutes || bonusMinutes <= 0) {
          return NextResponse.json(
            { error: 'bonusMinutes must be a positive number' },
            { status: 400 }
          )
        }
        const newBonus = (session.bonus_minutes_allowed || 0) + bonusMinutes
        updateData = {
          ...updateData,
          bonus_minutes_allowed: newBonus,
          total_minutes_allowed: session.base_minutes_allowed + newBonus,
          override_reason: reason || `Added ${bonusMinutes} bonus minutes`,
        }
        break
    }

    const { data: updatedSession, error: updateError } = await supabase
      .from('screen_time_sessions')
      .update(updateData)
      .eq('id', session.id)
      .select()
      .single()

    if (updateError) {
      console.error('Session update error:', updateError)
      return NextResponse.json({ error: 'Failed to update session' }, { status: 500 })
    }

    // Log activity
    const actionMessages: Record<string, string> = {
      unlock: 'Screen time manually unlocked',
      lock: 'Screen time manually locked',
      add_time: `Added ${bonusMinutes} bonus minutes`,
    }

    // Get kid name for activity message
    const { data: kidData } = await supabase
      .from('kids')
      .select('name')
      .eq('id', kidId)
      .single()

    await supabase.from('activity_feed').insert({
      kid_id: kidId,
      actor_type: 'parent',
      actor_id: user.id,
      action: `screen_time_${action}`,
      entity_type: 'screen_time',
      entity_id: session.id,
      message: `${actionMessages[action]} for ${kidData?.name || 'kid'}${reason ? `: ${reason}` : ''}`,
    })

    return NextResponse.json({ session: updatedSession })
  } catch (error) {
    console.error('Screen time override error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
