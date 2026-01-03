'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Save, Check } from 'lucide-react'

interface Kid {
  id: string
  name: string
  age: number
}

interface Assignment {
  id: string
  kid_id: string
  week: string
  assignment: string
}

interface KidAssignmentEditorProps {
  kids: Kid[]
  assignments: Assignment[]
}

const ASSIGNMENTS = ['Kitchen', 'Living Spaces', 'Bathrooms & Entry']
const WEEKS = ['A', 'B', 'C']

export default function KidAssignmentEditor({
  kids,
  assignments,
}: KidAssignmentEditorProps) {
  const [localAssignments, setLocalAssignments] = useState<Record<string, string>>(() => {
    // Initialize with current assignments: key = `${kid_id}-${week}`, value = assignment
    const map: Record<string, string> = {}
    assignments.forEach((a) => {
      map[`${a.kid_id}-${a.week.trim()}`] = a.assignment
    })
    return map
  })
  const [saving, setSaving] = useState<string | null>(null)
  const [saved, setSaved] = useState<string | null>(null)
  const [error, setError] = useState('')
  const router = useRouter()

  const getAssignment = (kidId: string, week: string): string => {
    return localAssignments[`${kidId}-${week}`] || ''
  }

  const getAssignmentId = (kidId: string, week: string): string | undefined => {
    const found = assignments.find(
      (a) => a.kid_id === kidId && a.week.trim() === week
    )
    return found?.id
  }

  const handleChange = async (kidId: string, week: string, newAssignment: string) => {
    const key = `${kidId}-${week}`
    const assignmentId = getAssignmentId(kidId, week)

    // Update local state immediately
    setLocalAssignments((prev) => ({
      ...prev,
      [key]: newAssignment,
    }))

    setSaving(key)
    setError('')
    setSaved(null)

    try {
      if (assignmentId) {
        // Update existing assignment
        const response = await fetch('/api/chores/assignments', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: assignmentId,
            assignment: newAssignment,
          }),
        })

        if (!response.ok) {
          const data = await response.json()
          throw new Error(data.error || 'Failed to update')
        }
      } else {
        // Create new assignment
        const response = await fetch('/api/chores/assignments', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            kid_id: kidId,
            week,
            assignment: newAssignment,
          }),
        })

        if (!response.ok) {
          const data = await response.json()
          throw new Error(data.error || 'Failed to create')
        }
      }

      setSaved(key)
      setTimeout(() => setSaved(null), 2000)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save')
      // Revert on error
      setLocalAssignments((prev) => {
        const original = assignments.find(
          (a) => a.kid_id === kidId && a.week.trim() === week
        )
        return {
          ...prev,
          [key]: original?.assignment || '',
        }
      })
    } finally {
      setSaving(null)
    }
  }

  // Check for duplicate assignments within a week
  const getDuplicates = (week: string): Set<string> => {
    const assignmentsInWeek: string[] = []
    kids.forEach((kid) => {
      const assignment = getAssignment(kid.id, week)
      if (assignment) {
        assignmentsInWeek.push(assignment)
      }
    })

    const duplicates = new Set<string>()
    const seen = new Set<string>()
    assignmentsInWeek.forEach((a) => {
      if (seen.has(a)) {
        duplicates.add(a)
      }
      seen.add(a)
    })
    return duplicates
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
      <div className="bg-gray-800 text-white px-6 py-4">
        <h2 className="font-bold text-xl">Kid Assignments by Week</h2>
        <p className="text-gray-300 text-sm mt-1">
          Assign each kid to a chore area for each rotation week
        </p>
      </div>

      {error && (
        <div className="mx-6 mt-4 p-3 bg-red-100 text-red-700 rounded">
          {error}
        </div>
      )}

      <div className="p-6">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Kid</th>
                {WEEKS.map((week) => (
                  <th key={week} className="text-left py-3 px-4 font-semibold text-gray-700">
                    Week {week}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {kids.map((kid) => (
                <tr key={kid.id} className="border-b border-gray-100 last:border-0">
                  <td className="py-3 px-4">
                    <div className="font-medium text-gray-900">{kid.name}</div>
                    <div className="text-sm text-gray-500">age {kid.age}</div>
                  </td>
                  {WEEKS.map((week) => {
                    const key = `${kid.id}-${week}`
                    const currentAssignment = getAssignment(kid.id, week)
                    const duplicates = getDuplicates(week)
                    const isDuplicate = currentAssignment && duplicates.has(currentAssignment)

                    return (
                      <td key={week} className="py-3 px-4">
                        <div className="relative">
                          <select
                            value={currentAssignment}
                            onChange={(e) => handleChange(kid.id, week, e.target.value)}
                            disabled={saving === key}
                            className={`w-full px-3 py-2 border rounded text-sm appearance-none cursor-pointer
                              ${isDuplicate ? 'border-yellow-400 bg-yellow-50' : 'border-gray-300'}
                              ${saving === key ? 'opacity-50' : ''}
                              focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                            `}
                          >
                            <option value="">-- Select --</option>
                            {ASSIGNMENTS.map((assignment) => (
                              <option key={assignment} value={assignment}>
                                {assignment}
                              </option>
                            ))}
                          </select>
                          {saving === key && (
                            <div className="absolute right-2 top-1/2 -translate-y-1/2">
                              <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                            </div>
                          )}
                          {saved === key && (
                            <div className="absolute right-2 top-1/2 -translate-y-1/2">
                              <Check className="w-4 h-4 text-green-600" />
                            </div>
                          )}
                        </div>
                        {isDuplicate && (
                          <p className="text-xs text-yellow-600 mt-1">
                            Duplicate assignment
                          </p>
                        )}
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Legend */}
        <div className="mt-6 pt-4 border-t border-gray-200">
          <h4 className="font-medium text-gray-700 mb-2">Assignment Areas:</h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-sm text-gray-600">
            <div><strong>Kitchen:</strong> Daily cleanup after dinner</div>
            <div><strong>Living Spaces:</strong> Rotating rooms (Mon-Sat)</div>
            <div><strong>Bathrooms & Entry:</strong> Rotating bathrooms (Mon-Sat)</div>
          </div>
        </div>
      </div>
    </div>
  )
}
