import { useState } from 'react'
import { X } from 'lucide-react'
import { useTaskStore } from '@/store/taskStore'
import { useUIStore } from '@/store/uiStore'
import { cn } from '@/lib/cn'
import type { TaskPriority } from '@/models'

interface Props {
  onClose: () => void
  defaultDate?: string
}

const priorities: TaskPriority[] = ['low', 'medium', 'high']

export function TaskForm({ onClose, defaultDate }: Props) {
  const { add, update, tasks } = useTaskStore()
  const { taskModalEditId } = useUIStore()

  const editing = tasks.find(t => t.id === taskModalEditId)

  const [title, setTitle] = useState(editing?.title ?? '')
  const [priority, setPriority] = useState<TaskPriority>(editing?.priority ?? 'medium')
  const [urgency, setUrgency] = useState<number>(editing?.urgency ?? 3)
  const [difficulty, setDifficulty] = useState<number>(editing?.difficulty ?? 3)
  const [scheduledDate, setScheduledDate] = useState(editing?.scheduledDate ?? defaultDate ?? '')
  const [scheduledTime, setScheduledTime] = useState(editing?.scheduledTime ?? '')
  const [location, setLocation] = useState(editing?.location ?? '')
  const [estimatedMinutes, setEstimatedMinutes] = useState(editing?.estimatedMinutes?.toString() ?? '')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return

    const data = {
      title: title.trim(),
      priority,
      urgency: urgency as 1 | 2 | 3 | 4 | 5,
      difficulty: difficulty as 1 | 2 | 3 | 4 | 5,
      status: editing?.status ?? 'todo' as const,
      scheduledDate: scheduledDate || undefined,
      scheduledTime: scheduledTime || undefined,
      location: location || undefined,
      estimatedMinutes: estimatedMinutes ? Number(estimatedMinutes) : undefined,
    }

    if (editing?.id) {
      await update(editing.id, data)
    } else {
      await add(data)
    }
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative bg-[#16181c] border border-[#2f3336] rounded-t-2xl md:rounded-2xl w-full md:max-w-md p-5 max-h-[90dvh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-[#e7e9ea] font-semibold">{editing ? 'Edit Task' : 'New Task'}</h2>
          <button onClick={onClose} className="text-[#71767b] hover:text-[#e7e9ea]">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <input
            autoFocus
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="Task title"
            className="bg-transparent border border-[#2f3336] rounded-lg px-3 py-2.5 text-[#e7e9ea] placeholder-[#536471] outline-none focus:border-[#1d9bf0] text-[15px]"
          />

          {/* Priority */}
          <div className="flex gap-2">
            {priorities.map(p => (
              <button
                key={p}
                type="button"
                onClick={() => setPriority(p)}
                className={cn(
                  'flex-1 py-2 rounded-lg text-sm font-medium transition-colors capitalize',
                  priority === p
                    ? p === 'high' ? 'bg-[#f4212e] text-white'
                      : p === 'medium' ? 'bg-[#ffad1f] text-black'
                      : 'bg-[#536471] text-white'
                    : 'bg-[#1e2127] text-[#71767b]',
                )}
              >
                {p}
              </button>
            ))}
          </div>

          {/* Urgency */}
          <div>
            <div className="text-[#71767b] text-xs mb-1">Urgency</div>
            <div className="flex gap-1">
              {[1,2,3,4,5].map(v => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setUrgency(v)}
                  className={cn(
                    'flex-1 py-1.5 rounded text-xs font-medium transition-colors',
                    urgency === v ? 'bg-[#f4212e] text-white' : 'bg-[#1e2127] text-[#71767b]',
                  )}
                >
                  U{v}
                </button>
              ))}
            </div>
          </div>

          {/* Difficulty */}
          <div>
            <div className="text-[#71767b] text-xs mb-1">Difficulty</div>
            <div className="flex gap-1">
              {[1,2,3,4,5].map(v => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setDifficulty(v)}
                  className={cn(
                    'flex-1 py-1.5 rounded text-xs font-medium transition-colors',
                    difficulty === v ? 'bg-[#7856ff] text-white' : 'bg-[#1e2127] text-[#71767b]',
                  )}
                >
                  D{v}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <input
              type="date"
              value={scheduledDate}
              onChange={e => setScheduledDate(e.target.value)}
              className="bg-[#1e2127] border border-[#2f3336] rounded-lg px-3 py-2 text-[#e7e9ea] text-sm outline-none focus:border-[#1d9bf0] [color-scheme:dark]"
            />
            <input
              type="time"
              value={scheduledTime}
              onChange={e => setScheduledTime(e.target.value)}
              placeholder="Time"
              className="bg-[#1e2127] border border-[#2f3336] rounded-lg px-3 py-2 text-[#e7e9ea] text-sm outline-none focus:border-[#1d9bf0] [color-scheme:dark]"
            />
          </div>

          <input
            value={location}
            onChange={e => setLocation(e.target.value)}
            placeholder="Location (optional)"
            className="bg-transparent border border-[#2f3336] rounded-lg px-3 py-2 text-[#e7e9ea] placeholder-[#536471] outline-none focus:border-[#1d9bf0] text-sm"
          />

          <input
            type="number"
            value={estimatedMinutes}
            onChange={e => setEstimatedMinutes(e.target.value)}
            placeholder="Estimated minutes (optional)"
            className="bg-transparent border border-[#2f3336] rounded-lg px-3 py-2 text-[#e7e9ea] placeholder-[#536471] outline-none focus:border-[#1d9bf0] text-sm"
          />

          <button
            type="submit"
            disabled={!title.trim()}
            className="bg-[#1d9bf0] hover:bg-[#1a8cd8] disabled:opacity-40 text-white font-semibold py-2.5 rounded-full transition-colors mt-1"
          >
            {editing ? 'Save' : 'Add Task'}
          </button>
        </form>
      </div>
    </div>
  )
}
