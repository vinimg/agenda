import { startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, format, isSameMonth, isToday } from 'date-fns'
import { cn } from '@/lib/cn'
import type { CalendarEvent } from '@/models'

interface Props {
  anchor: Date
  events: CalendarEvent[]
  onDayClick: (d: Date) => void
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export function MonthView({ anchor, events, onDayClick }: Props) {
  const days = eachDayOfInterval({
    start: startOfWeek(startOfMonth(anchor)),
    end: endOfWeek(endOfMonth(anchor)),
  })

  const eventsByDate = new Map<string, CalendarEvent[]>()
  for (const ev of events) {
    const list = eventsByDate.get(ev.date) ?? []
    list.push(ev)
    eventsByDate.set(ev.date, list)
  }

  return (
    <div className="p-2">
      {/* Weekday headers */}
      <div className="grid grid-cols-7 mb-1">
        {WEEKDAYS.map(d => (
          <div key={d} className="text-center text-[#536471] text-xs py-1 font-medium">{d}</div>
        ))}
      </div>

      {/* Days grid */}
      <div className="grid grid-cols-7 gap-px bg-[#2f3336]">
        {days.map(day => {
          const key = format(day, 'yyyy-MM-dd')
          const dayEvents = eventsByDate.get(key) ?? []
          const inMonth = isSameMonth(day, anchor)
          const today = isToday(day)

          return (
            <div
              key={key}
              onClick={() => onDayClick(day)}
              className={cn(
                'bg-black p-1 min-h-20 cursor-pointer hover:bg-[#16181c] transition-colors',
                !inMonth && 'opacity-30',
              )}
            >
              <div className="flex justify-center mb-1">
                <span className={cn(
                  'text-sm w-7 h-7 flex items-center justify-center rounded-full font-medium',
                  today ? 'bg-[#1d9bf0] text-white' : 'text-[#e7e9ea]',
                )}>
                  {format(day, 'd')}
                </span>
              </div>

              <div className="flex flex-col gap-px">
                {dayEvents.slice(0, 3).map(ev => (
                  <div
                    key={ev.id}
                    className="flex items-center gap-1 px-1 py-0.5 rounded text-[10px] truncate"
                    style={{ backgroundColor: ev.color + '33', color: ev.color }}
                  >
                    {ev.isCompleted && <span>✓</span>}
                    <span className="truncate">{ev.title}</span>
                  </div>
                ))}
                {dayEvents.length > 3 && (
                  <span className="text-[10px] text-[#71767b] px-1">+{dayEvents.length - 3} more</span>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
