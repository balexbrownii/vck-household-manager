import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import TopNav from '@/components/nav/top-nav'
import WeekSelector from '@/components/dashboard/week-selector'
import Link from 'next/link'
import { Settings } from 'lucide-react'

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

interface ChoreRoom {
  id: string
  assignment: string
  day_of_week: number
  room_name: string
  checklist: string[]
}

interface ChoreAssignment {
  kid_id: string
  week: string
  assignment: string
  kid_name?: string
}

export default async function ChoresPage() {
  const supabase = await createClient()

  // Check authentication
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Fetch current rotation state
  const { data: rotationState } = await supabase
    .from('chore_rotation_state')
    .select('*')
    .single()

  const currentWeek = rotationState?.current_week || 'A'

  // Fetch all kids
  const { data: kids } = await supabase
    .from('kids')
    .select('id, name, age')
    .order('age', { ascending: true })

  // Fetch all chore assignments
  const { data: assignments } = await supabase
    .from('chore_assignments')
    .select('*')

  // Fetch all chore rooms
  const { data: choreRooms } = await supabase
    .from('chore_rooms')
    .select('*')
    .order('day_of_week', { ascending: true })

  // Create a map of kid names by ID
  const kidNames = new Map<string, string>()
  kids?.forEach((k) => kidNames.set(k.id, k.name))

  // Group assignments by week
  const assignmentsByWeek = new Map<string, ChoreAssignment[]>()
  ;['A', 'B', 'C'].forEach((week) => {
    const weekAssignments = assignments
      ?.filter((a) => a.week.trim() === week)
      .map((a) => ({
        ...a,
        kid_name: kidNames.get(a.kid_id) || 'Unknown',
      }))
      .sort((a, b) => {
        const kidA = kids?.find((k) => k.id === a.kid_id)
        const kidB = kids?.find((k) => k.id === b.kid_id)
        return (kidA?.age || 0) - (kidB?.age || 0)
      })
    assignmentsByWeek.set(week, weekAssignments || [])
  })

  // Group rooms by assignment
  const roomsByAssignment = new Map<string, ChoreRoom[]>()
  const uniqueAssignments = Array.from(new Set(choreRooms?.map((r) => r.assignment) || []))
  uniqueAssignments.forEach((assignment) => {
    const rooms = choreRooms?.filter((r) => r.assignment === assignment) || []
    roomsByAssignment.set(assignment, rooms)
  })

  const todayDayOfWeek = new Date().getDay()

  return (
    <div className="min-h-screen bg-gray-50">
      <TopNav />
      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Chore Rotation</h1>
              <p className="text-gray-600 mt-1">
                3-week rotation schedule with daily room assignments
              </p>
            </div>
            <div className="flex items-center gap-3">
              <WeekSelector currentWeek={currentWeek} />
              <Link
                href="/chores/admin"
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors"
              >
                <Settings className="w-4 h-4" />
                <span className="hidden sm:inline">Edit Rooms</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Week Assignment Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          {['A', 'B', 'C'].map((week) => {
            const isCurrentWeek = currentWeek === week
            const weekAssignments = assignmentsByWeek.get(week) || []

            return (
              <div
                key={week}
                className={`bg-white rounded-lg border-2 p-5 shadow-sm ${
                  isCurrentWeek ? 'border-blue-500 ring-2 ring-blue-100' : 'border-gray-200'
                }`}
              >
                <div className="flex items-center gap-2 mb-4">
                  <h2 className="text-xl font-bold text-gray-900">Week {week}</h2>
                  {isCurrentWeek && (
                    <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-semibold rounded">
                      Current
                    </span>
                  )}
                </div>
                <div className="space-y-3">
                  {weekAssignments.map((assignment) => (
                    <div
                      key={`${week}-${assignment.kid_id}`}
                      className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0"
                    >
                      <span className="font-medium text-gray-900">{assignment.kid_name}</span>
                      <span className="text-sm text-gray-600 bg-gray-100 px-2 py-1 rounded">
                        {assignment.assignment}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>

        {/* Daily Room Breakdown */}
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Daily Room Schedule</h2>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {uniqueAssignments.sort().map((assignment) => {
            const rooms = roomsByAssignment.get(assignment) || []

            return (
              <div
                key={assignment}
                className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden"
              >
                <div className="bg-gray-800 text-white px-4 py-3">
                  <h3 className="font-bold text-lg">{assignment}</h3>
                </div>
                <div className="divide-y divide-gray-100">
                  {rooms.map((room) => {
                    const isToday = room.day_of_week === todayDayOfWeek

                    return (
                      <div
                        key={room.id}
                        className={`px-4 py-3 ${isToday ? 'bg-yellow-50' : ''}`}
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <span
                            className={`text-sm font-semibold ${
                              isToday ? 'text-yellow-700' : 'text-gray-500'
                            }`}
                          >
                            {DAY_NAMES[room.day_of_week]}
                          </span>
                          {isToday && (
                            <span className="px-1.5 py-0.5 bg-yellow-200 text-yellow-800 text-xs font-semibold rounded">
                              Today
                            </span>
                          )}
                        </div>
                        <div className="font-medium text-gray-900 mb-1">{room.room_name}</div>
                        <ul className="text-sm text-gray-600 space-y-0.5">
                          {room.checklist.map((task, idx) => (
                            <li key={idx} className="flex items-start gap-1.5">
                              <span className="text-gray-400 mt-0.5">•</span>
                              <span>{task}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>

        {/* Legend / Info */}
        <div className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-100">
          <h3 className="font-semibold text-blue-900 mb-2">How Chore Rotation Works</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Each week, kids rotate to a different assignment area</li>
            <li>• Within each assignment, the specific room changes each day</li>
            <li>• Kitchen has the same tasks every day (after dinner cleanup)</li>
            <li>• Living Spaces and Bathrooms rotate through different rooms Mon-Sat</li>
            <li>• Sunday is typically a rest day (no Bathrooms/Living Spaces chores)</li>
          </ul>
        </div>
      </main>
    </div>
  )
}
