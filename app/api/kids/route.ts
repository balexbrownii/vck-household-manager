import { NextResponse } from 'next/server'
import { createClient } from '@/app/lib/supabase/server'

export async function GET() {
  try {
    const supabase = await createClient()

    // Fetch all kids (public info only for login selection)
    const { data: kids, error } = await supabase
      .from('kids')
      .select('id, name, age, pin_hash')
      .order('age', { ascending: false })

    if (error) {
      console.error('Error fetching kids:', error)
      return NextResponse.json(
        { error: 'Failed to fetch kids' },
        { status: 500 }
      )
    }

    // Return kids with just a boolean for pin_hash (don't expose actual hash)
    const safeKids = kids.map(kid => ({
      id: kid.id,
      name: kid.name,
      age: kid.age,
      pin_hash: kid.pin_hash ? 'set' : null,
    }))

    return NextResponse.json({ kids: safeKids })
  } catch (error) {
    console.error('Kids API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
