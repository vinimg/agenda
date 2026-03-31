import { MapPin, Clock, Pencil, Trash2 } from 'lucide-react'
import { useDraggable } from '@dnd-kit/core'
import { cn } from '@/lib/cn'
import { useTaskStore } from '@/store/taskStore'
import { useUIStore } from '@/store/uiStore'
import type { Task } from '@/models'

const priorityColor = {
  low: '#536471',
  medium: '#ffad1f',
  high: '#f4212e',
}

interface Props {
  task: Task
}

export function TaskItem({ task }: Props) {
  const { toggleDone, remove } = useTaskStore()
  const { openTaskModal } = useUIStore()
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `task-${task.id}`,
    data: { task },
  })

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'flex items-start gap-3 px-4 py-3 bg-[#16181c] hover:bg-[#1e2127] group transition-colors',
        isDragging && 'opacity-50',
      )}
    >
      {/* Drag handle */}
      <div {...attributes} {...listeners} className="mt-0.5 cursor-grab active:cursor-grabbing text-[#536471] hover:text-[#71767b] shrink-0 touch-none">
        <svg width="10" height="16" viewBox="0 0 10 16" fill="currentColor">
          <circle cx="2" cy="2" r="1.5" /><circle cx="8" cy="2" r="1.5" />
          <circle cx="2" cy="8" r="1.5" /><circle cx="8" cy="8" r="1.5" />
          <circle cx="2" cy="14" r="1.5" /><circle cx="8" cy="14" r="1.5" />
        </svg>
      </div>

      <button
        onClick={() => task.id && toggleDone(task.id)}
        className={cn(
          'mt-0.5 w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-colors',
          task.status === 'done'
            ? 'bg-[#1d9bf0] border-[#1d9bf0]'
            : 'border-[#536471] hover:border-[#1d9bf0]',
        )}
      >
        {task.status === 'done' && (
          <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
            <path d="M1 4l3 3 5-6" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </button>

      <div className="flex-1 min-w-0">
        <div className="flex items-start gap-2">
          <div
            className="mt-1.5 w-1.5 h-1.5 rounded-full shrink-0"
            style={{ backgroundColor: priorityColor[task.priority] }}
          />
          <span className={cn('text-[15px] leading-snug', task.status === 'done' ? 'line-through text-[#536471]' : 'text-[#e7e9ea]')}>
            {task.title}
          </span>
        </div>

        <div className="flex items-center gap-3 mt-1 pl-3.5">
          {(task.scheduledTime ?? task.dueTime) && (
            <span className="flex items-center gap-1 text-xs text-[#71767b]">
              <Clock size={11} />
              {task.scheduledTime ?? task.dueTime}
            </span>
          )}
          {task.location && (
            <span className="flex items-center gap-1 text-xs text-[#71767b]">
              <MapPin size={11} />
              {task.location}
            </span>
          )}
        </div>
      </div>

      <div className="hidden group-hover:flex items-center gap-2 shrink-0">
        <button
          onClick={() => task.id && openTaskModal(task.id)}
          className="text-[#71767b] hover:text-[#e7e9ea] transition-colors"
        >
          <Pencil size={14} />
        </button>
        <button
          onClick={() => task.id && remove(task.id)}
          className="text-[#71767b] hover:text-[#f4212e] transition-colors"
        >
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  )
}
