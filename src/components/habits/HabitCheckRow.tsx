import { MapPin, Clock } from 'lucide-react'
import { cn } from '@/lib/cn'
import type { CalendarEvent } from '@/models'

interface Props {
  event: CalendarEvent
  onToggle: (habitId: number, completed: boolean) => void
}

export function HabitCheckRow({ event, onToggle }: Props) {
  return (
    <div className="flex items-center gap-3 px-4 py-3 bg-[#16181c] hover:bg-[#1e2127] transition-colors">
      <button
        onClick={() => onToggle(event.habitId!, !event.isCompleted)}
        className={cn(
          'w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors',
          event.isCompleted
            ? 'bg-[#00ba7c] border-[#00ba7c]'
            : 'border-[#536471] hover:border-[#71767b]',
        )}
      >
        {event.isCompleted && (
          <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
            <path d="M1 4l3 3 5-6" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </button>

      <div
        className="w-2 h-2 rounded-full shrink-0"
        style={{ backgroundColor: event.color }}
      />

      <div className="flex-1 min-w-0">
        <span className={cn('text-[15px]', event.isCompleted ? 'line-through text-[#536471]' : 'text-[#e7e9ea]')}>
          {event.title}
        </span>
        <div className="flex items-center gap-3 mt-0.5">
          {event.startTime && (
            <span className="flex items-center gap-1 text-xs text-[#71767b]">
              <Clock size={11} />
              {event.startTime}
            </span>
          )}
          {event.location && (
            <span className="flex items-center gap-1 text-xs text-[#71767b]">
              <MapPin size={11} />
              {event.location}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
