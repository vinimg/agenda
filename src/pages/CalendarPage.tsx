import { useEffect, useState } from 'react'
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addMonths, subMonths, addWeeks, subWeeks, addDays, subDays } from 'date-fns'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { DndContext, type DragEndEvent } from '@dnd-kit/core'
import { useCalendarStore } from '@/store/calendarStore'
import { useTaskStore } from '@/store/taskStore'
import { MonthView } from '@/components/calendar/MonthView'
import { WeekView } from '@/components/calendar/WeekView'
import { YearView } from '@/components/calendar/YearView'
import { cn } from '@/lib/cn'

type View = 'month' | 'week' | 'day' | 'year'

export function CalendarPage() {
  const [view, setView] = useState<View>('month')
  const [anchor, setAnchor] = useState(new Date())
  const { events, loadRange } = useCalendarStore()
  const { update: updateTask } = useTaskStore()

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over) return
    const task = active.data.current?.task
    if (!task?.id) return
    // over.id is like "2024-03-15-9"
    const parts = String(over.id).split('-')
    const hour = parts.pop()
    const dateStr = parts.join('-')
    if (!dateStr || hour === undefined) return
    const scheduledTime = `${hour.padStart(2, '0')}:00`
    updateTask(task.id, { scheduledDate: dateStr, scheduledTime })
  }

  useEffect(() => {
    if (view === 'year') return
    let start: string, end: string
    if (view === 'month') {
      start = format(startOfWeek(startOfMonth(anchor)), 'yyyy-MM-dd')
      end = format(endOfWeek(endOfMonth(anchor)), 'yyyy-MM-dd')
    } else if (view === 'week') {
      start = format(startOfWeek(anchor), 'yyyy-MM-dd')
      end = format(endOfWeek(anchor), 'yyyy-MM-dd')
    } else {
      start = end = format(anchor, 'yyyy-MM-dd')
    }
    loadRange(start, end)
  }, [anchor, view])

  const navigate = (dir: 1 | -1) => {
    if (view === 'month') setAnchor(dir === 1 ? addMonths(anchor, 1) : subMonths(anchor, 1))
    else if (view === 'week') setAnchor(dir === 1 ? addWeeks(anchor, 1) : subWeeks(anchor, 1))
    else if (view === 'year') setAnchor(dir === 1 ? addMonths(anchor, 12) : subMonths(anchor, 12))
    else setAnchor(dir === 1 ? addDays(anchor, 1) : subDays(anchor, 1))
  }

  const title = view === 'month'
    ? format(anchor, 'MMMM yyyy')
    : view === 'week'
    ? `${format(startOfWeek(anchor), 'MMM d')} – ${format(endOfWeek(anchor), 'MMM d, yyyy')}`
    : view === 'year'
    ? format(anchor, 'yyyy')
    : format(anchor, 'EEEE, MMMM d')

  return (
    <DndContext onDragEnd={handleDragEnd}>
    <div className="flex flex-col h-full pb-16 md:pb-0">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#2f3336]">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="text-[#71767b] hover:text-[#e7e9ea] p-1">
            <ChevronLeft size={20} />
          </button>
          <span className="text-[#e7e9ea] font-semibold text-[15px] min-w-48 text-center">{title}</span>
          <button onClick={() => navigate(1)} className="text-[#71767b] hover:text-[#e7e9ea] p-1">
            <ChevronRight size={20} />
          </button>
        </div>

        <div className="flex gap-1">
          {(['month', 'week', 'day', 'year'] as View[]).map(v => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={cn(
                'px-3 py-1 rounded-full text-sm font-medium transition-colors capitalize',
                view === v ? 'bg-[#1d9bf0] text-white' : 'text-[#71767b] hover:text-[#e7e9ea]',
              )}
            >
              {v}
            </button>
          ))}
        </div>
      </div>

      {/* Calendar body */}
      <div className="flex-1 overflow-auto">
        {view === 'month' && <MonthView anchor={anchor} events={events} onDayClick={setAnchor} />}
        {(view === 'week' || view === 'day') && (
          <WeekView anchor={anchor} events={events} singleDay={view === 'day'} />
        )}
        {view === 'year' && (
          <YearView anchor={anchor} onDayClick={(d) => { setAnchor(d); setView('day') }} />
        )}
      </div>
    </div>
    </DndContext>
  )
}
