import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/app/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const kidId = searchParams.get('kidId')

    if (!kidId) {
      return NextResponse.json(
        { error: 'kidId is required' },
        { status: 400 }
      )
    }

    const supabase = await createClient()
    const today = new Date().toISOString().split('T')[0]

    // Get today's chore completions for this kid
    const { data: choreCompletions, error } = await supabase
      .from('chore_completions')
      .select(`
        id,
        completed,
        verified,
        chores (
          id,
          name,
          description,
          category
        )
      `)
      .eq('kid_id', kidId)
      .eq('date', today)
      .eq('completed', false)

    if (error) {
      console.error('Error fetching today chores:', error)
      return NextResponse.json(
        { error: 'Failed to fetch chores' },
        { status: 500 }
      )
    }

    // Flatten response
    const chores = choreCompletions?.map(completion => ({
      completionId: completion.id,
      id: (completion.chores as { id: string }).id,
      name: (completion.chores as { name: string }).name,
      description: (completion.chores as { description: string }).description,
      category: (completion.chores as { category: string }).category,
      completed: completion.completed,
      verified: completion.verified,
    })) || []

    return NextResponse.json({ chores })
  } catch (error) {
    console.error('Today chores API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
