'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Pencil, Save, X, Plus, Trash2 } from 'lucide-react'

interface ChoreRoom {
  id: string
  assignment: string
  day_of_week: number
  room_name: string
  checklist: string[]
}

interface ChoreRoomEditorProps {
  assignment: string
  dayOfWeek: number
  dayName: string
  room?: ChoreRoom
}

export default function ChoreRoomEditor({
  assignment,
  dayOfWeek,
  dayName,
  room,
}: ChoreRoomEditorProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [roomName, setRoomName] = useState(room?.room_name || '')
  const [checklist, setChecklist] = useState<string[]>(room?.checklist || [])
  const [newTask, setNewTask] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const handleSave = async () => {
    setLoading(true)
    setError('')

    try {
      if (room) {
        // Update existing room
        const response = await fetch('/api/chores/rooms', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: room.id,
            room_name: roomName,
            checklist: checklist.filter((t) => t.trim() !== ''),
          }),
        })

        if (!response.ok) {
          const data = await response.json()
          throw new Error(data.error || 'Failed to save')
        }
      } else {
        // Create new room
        const response = await fetch('/api/chores/rooms', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            assignment,
            day_of_week: dayOfWeek,
            room_name: roomName,
            checklist: checklist.filter((t) => t.trim() !== ''),
          }),
        })

        if (!response.ok) {
          const data = await response.json()
          throw new Error(data.error || 'Failed to create')
        }
      }

      setIsEditing(false)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!room) return
    if (!confirm('Delete this room? This cannot be undone.')) return

    setLoading(true)
    setError('')

    try {
      const response = await fetch(`/api/chores/rooms?id=${room.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to delete')
      }

      setIsEditing(false)
      setRoomName('')
      setChecklist([])
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete')
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    setRoomName(room?.room_name || '')
    setChecklist(room?.checklist || [])
    setNewTask('')
    setError('')
    setIsEditing(false)
  }

  const addTask = () => {
    if (newTask.trim()) {
      setChecklist([...checklist, newTask.trim()])
      setNewTask('')
    }
  }

  const removeTask = (index: number) => {
    setChecklist(checklist.filter((_, i) => i !== index))
  }

  const updateTask = (index: number, value: string) => {
    const updated = [...checklist]
    updated[index] = value
    setChecklist(updated)
  }

  // View mode
  if (!isEditing) {
    return (
      <div
        onClick={() => setIsEditing(true)}
        className="border border-gray-200 rounded-lg p-4 cursor-pointer hover:border-blue-300 hover:bg-blue-50 transition-colors"
      >
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-semibold text-gray-500">{dayName}</span>
          <Pencil className="w-4 h-4 text-gray-400" />
        </div>
        {room ? (
          <>
            <div className="font-medium text-gray-900 mb-2">{room.room_name}</div>
            <ul className="text-sm text-gray-600 space-y-1">
              {room.checklist.map((task, idx) => (
                <li key={idx} className="flex items-start gap-1.5">
                  <span className="text-gray-400">•</span>
                  <span>{task}</span>
                </li>
              ))}
            </ul>
          </>
        ) : (
          <div className="text-gray-400 text-sm italic">No room assigned - click to add</div>
        )}
      </div>
    )
  }

  // Edit mode
  return (
    <div className="border-2 border-blue-500 rounded-lg p-4 bg-blue-50">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-semibold text-blue-700">{dayName}</span>
        <div className="flex gap-1">
          {room && (
            <button
              onClick={handleDelete}
              disabled={loading}
              className="p-1.5 text-red-600 hover:bg-red-100 rounded"
              title="Delete room"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={handleCancel}
            disabled={loading}
            className="p-1.5 text-gray-600 hover:bg-gray-100 rounded"
            title="Cancel"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-3 p-2 bg-red-100 text-red-700 text-sm rounded">
          {error}
        </div>
      )}

      {/* Room Name */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Room Name
        </label>
        <input
          type="text"
          value={roomName}
          onChange={(e) => setRoomName(e.target.value)}
          placeholder="e.g., Living Room"
          className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      {/* Checklist Tasks */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Tasks
        </label>
        <div className="space-y-2 mb-2">
          {checklist.map((task, idx) => (
            <div key={idx} className="flex gap-2">
              <input
                type="text"
                value={task}
                onChange={(e) => updateTask(idx, e.target.value)}
                className="flex-1 px-3 py-1.5 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <button
                onClick={() => removeTask(idx)}
                className="p-1.5 text-red-600 hover:bg-red-100 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            value={newTask}
            onChange={(e) => setNewTask(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addTask()}
            placeholder="Add new task..."
            className="flex-1 px-3 py-1.5 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <button
            onClick={addTask}
            className="p-1.5 text-blue-600 hover:bg-blue-100 rounded"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Save Button */}
      <button
        onClick={handleSave}
        disabled={loading || !roomName.trim()}
        className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <Save className="w-4 h-4" />
        {loading ? 'Saving...' : 'Save'}
      </button>
    </div>
  )
}
