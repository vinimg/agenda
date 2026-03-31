import { startOfWeek, endOfWeek, eachDayOfInterval, format, isToday } from 'date-fns'
import { useDroppable } from '@dnd-kit/core'
import { cn } from '@/lib/cn'
import { useTaskStore } from '@/store/taskStore'
import type { CalendarEvent } from '@/models'

interface Props {
  anchor: Date
  events: CalendarEvent[]
  singleDay?: boolean
}

const HOURS = Array.from({ length: 24 }, (_, i) => i)

function DroppableSlot({ id, children }: { id: string; children?: React.ReactNode }) {
  const { isOver, setNodeRef } = useDroppable({ id })
  return (
    <div
      ref={setNodeRef}
      className={cn('h-14 border-b border-[#2f3336]/50', isOver && 'bg-[#1d9bf0]/10')}
    >
      {children}
    </div>
  )
}

export function WeekView({ anchor, events, singleDay }: Props) {
  useTaskStore()
  const days = singleDay
    ? [anchor]
    : eachDayOfInterval({ start: startOfWeek(anchor), end: endOfWeek(anchor) })

  const now = new Date()
  const currentHour = now.getHours() + now.getMinutes() / 60

  return (
    <div className="flex flex-col h-full">
      {/* Day headers */}
      <div className="flex border-b border-[#2f3336] sticky top-0 bg-black z-10">
        <div className="w-12 shrink-0" />
        {days.map(day => {
          const today = isToday(day)
          return (
            <div key={format(day, 'yyyy-MM-dd')} className="flex-1 text-center py-2">
              <div className="text-[#71767b] text-xs">{format(day, 'EEE')}</div>
              <div className={cn(
                'text-sm font-semibold mx-auto w-7 h-7 flex items-center justify-center rounded-full mt-0.5',
                today ? 'bg-[#1d9bf0] text-white' : 'text-[#e7e9ea]',
              )}>
                {format(day, 'd')}
              </div>
            </div>
          )
        })}
      </div>

      {/* Time grid */}
      <div className="flex-1 overflow-y-auto">
        <div className="flex relative">
          {/* Hour labels */}
          <div className="w-12 shrink-0">
            {HOURS.map(h => (
              <div key={h} className="h-14 flex items-start justify-end pr-2 pt-0.5">
                <span className="text-[10px] text-[#536471]">
                  {h === 0 ? '' : `${h < 10 ? '0' : ''}${h}:00`}
                </span>
              </div>
            ))}
          </div>

          {/* Day columns */}
          {days.map(day => {
            const dateStr = format(day, 'yyyy-MM-dd')
            const dayEvents = events.filter(e => e.date === dateStr && !e.allDay && e.startTime)

            return (
              <div key={dateStr} className="flex-1 relative border-l border-[#2f3336]">
                {/* Hour lines */}
                {HOURS.map(h => (
                  <DroppableSlot key={h} id={`${dateStr}-${h}`} />
                ))}

                {/* Current time line */}
                {isToday(day) && (
                  <div
                    className="absolute left-0 right-0 border-t-2 border-[#1d9bf0] z-20 pointer-events-none"
                    style={{ top: `${currentHour * 56}px` }}
                  >
                    <div className="w-2 h-2 rounded-full bg-[#1d9bf0] -mt-1 -ml-1" />
                  </div>
                )}

                {/* Events */}
                {dayEvents.map(ev => {
                  const [h, m] = (ev.startTime ?? '00:00').split(':').map(Number)
                  const top = (h + m / 60) * 56
                  const duration = ev.endTime
                    ? (() => {
                        const [eh, em] = ev.endTime.split(':').map(Number)
                        return ((eh + em / 60) - (h + m / 60)) * 56
                      })()
                    : 56

                  return (
                    <div
                      key={ev.id}
                      className="absolute left-1 right-1 rounded px-1.5 py-0.5 text-[11px] overflow-hidden cursor-pointer"
                      style={{
                        top: `${top}px`,
                        height: `${Math.max(duration, 20)}px`,
                        backgroundColor: ev.color + '33',
                        borderLeft: `3px solid ${ev.color}`,
                        color: ev.color,
                      }}
                    >
                      <div className="font-medium truncate">{ev.title}</div>
                      {ev.startTime && <div className="opacity-70">{ev.startTime}</div>}
                    </div>
                  )
                })}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
