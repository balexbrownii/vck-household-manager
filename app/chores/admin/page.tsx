import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import TopNav from '@/components/nav/top-nav'
import ChoreRoomEditor from '@/components/chores/chore-room-editor'
import Link from 'next/link'

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
const ASSIGNMENTS = ['Bathrooms & Entry', 'Kitchen', 'Living Spaces']

interface ChoreRoom {
  id: string
  assignment: string
  day_of_week: number
  room_name: string
  checklist: string[]
}

export default async function ChoresAdminPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Fetch all chore rooms
  const { data: choreRooms, error } = await supabase
    .from('chore_rooms')
    .select('*')
    .order('assignment', { ascending: true })
    .order('day_of_week', { ascending: true })

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <TopNav />
        <main className="max-w-7xl mx-auto px-4 py-8">
          <p className="text-red-600">Failed to load chore rooms</p>
        </main>
      </div>
    )
  }

  // Group rooms by assignment
  const roomsByAssignment = new Map<string, ChoreRoom[]>()
  ASSIGNMENTS.forEach((assignment) => {
    const rooms = choreRooms?.filter((r) => r.assignment === assignment) || []
    roomsByAssignment.set(assignment, rooms)
  })

  return (
    <div className="min-h-screen bg-gray-50">
      <TopNav />
      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <Link href="/chores" className="text-sm text-blue-600 hover:underline mb-2 inline-block">
                ← Back to Chores
              </Link>
              <h1 className="text-3xl font-bold text-gray-900">Edit Chore Rooms</h1>
              <p className="text-gray-600 mt-1">
                Update room names and task checklists
              </p>
            </div>
          </div>
        </div>

        {/* Editor by Assignment */}
        <div className="space-y-8">
          {ASSIGNMENTS.map((assignment) => {
            const rooms = roomsByAssignment.get(assignment) || []

            return (
              <div
                key={assignment}
                className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden"
              >
                <div className="bg-gray-800 text-white px-6 py-4">
                  <h2 className="font-bold text-xl">{assignment}</h2>
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {DAY_NAMES.map((dayName, dayIndex) => {
                      const room = rooms.find((r) => r.day_of_week === dayIndex)

                      return (
                        <ChoreRoomEditor
                          key={`${assignment}-${dayIndex}`}
                          assignment={assignment}
                          dayOfWeek={dayIndex}
                          dayName={dayName}
                          room={room}
                        />
                      )
                    })}
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Help Text */}
        <div className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-100">
          <h3 className="font-semibold text-blue-900 mb-2">Tips</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Click on any room card to edit the room name and tasks</li>
            <li>• Add tasks one per line in the checklist</li>
            <li>• Changes save automatically when you click Save</li>
            <li>• Empty days (like Sunday for some assignments) can be left blank</li>
          </ul>
        </div>
      </main>
    </div>
  )
}
