import { useEffect } from 'react'
import { format } from 'date-fns'
import { Plus } from 'lucide-react'
import { useHabitStore } from '@/store/habitStore'
import { useTaskStore } from '@/store/taskStore'
import { useCalendarStore } from '@/store/calendarStore'
import { useUIStore } from '@/store/uiStore'
import { HabitCheckRow } from '@/components/habits/HabitCheckRow'
import { TaskItem } from '@/components/tasks/TaskItem'
import { TaskForm } from '@/components/tasks/TaskForm'

export function TodayPage() {
  const today = format(new Date(), 'yyyy-MM-dd')
  const { load: loadHabits, markEntry } = useHabitStore()
  const { tasks, load: loadTasks } = useTaskStore()
  const { events, loadRange } = useCalendarStore()
  const { openTaskModal, taskModalOpen, closeTaskModal } = useUIStore()

  useEffect(() => {
    loadHabits()
    loadTasks()
    loadRange(today, today)
  }, [today])

  const todayEvents = events.filter(e => e.date === today && e.source === 'habit')
  const todayTasks = tasks.filter(t => (t.scheduledDate ?? t.dueDate) === today)

  return (
    <div className="max-w-xl mx-auto px-4 pb-24 md:pb-8 pt-6">
      <div className="mb-6">
        <p className="text-[#71767b] text-sm">{format(new Date(), 'EEEE, MMMM d')}</p>
        <h1 className="text-[#e7e9ea] text-2xl font-bold">Today</h1>
      </div>

      {/* Habits */}
      {todayEvents.length > 0 && (
        <section className="mb-6">
          <h2 className="text-[#71767b] text-xs font-semibold uppercase tracking-wider mb-3">HABITS</h2>
          <div className="divide-y divide-[#2f3336] border border-[#2f3336] rounded-xl overflow-hidden">
            {todayEvents.map(ev => (
              <HabitCheckRow
                key={ev.id}
                event={ev}
                onToggle={async (habitId, completed) => {
                  await markEntry(habitId, today, completed ? 'completed' : 'missed')
                  await loadRange(today, today)
                }}
              />
            ))}
          </div>
        </section>
      )}

      {/* Tasks */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-[#71767b] text-xs font-semibold uppercase tracking-wider">TASKS</h2>
          <button
            onClick={() => openTaskModal()}
            className="text-[#1d9bf0] hover:text-[#1a8cd8] transition-colors"
          >
            <Plus size={18} />
          </button>
        </div>

        {todayTasks.length === 0 ? (
          <p className="text-[#536471] text-sm text-center py-8">No tasks for today</p>
        ) : (
          <div className="divide-y divide-[#2f3336] border border-[#2f3336] rounded-xl overflow-hidden">
            {todayTasks.map(task => (
              <TaskItem key={task.id} task={task} />
            ))}
          </div>
        )}
      </section>

      {/* FAB */}
      <button
        onClick={() => openTaskModal()}
        className="md:hidden fixed bottom-20 right-4 w-14 h-14 bg-[#1d9bf0] rounded-full flex items-center justify-center shadow-lg"
      >
        <Plus size={24} className="text-white" />
      </button>

      {taskModalOpen && <TaskForm onClose={closeTaskModal} defaultDate={today} />}
    </div>
  )
}
