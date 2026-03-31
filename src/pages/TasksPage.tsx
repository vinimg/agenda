import { useEffect } from 'react'
import { Plus } from 'lucide-react'
import { useTaskStore } from '@/store/taskStore'
import { useUIStore } from '@/store/uiStore'
import { TaskItem } from '@/components/tasks/TaskItem'
import { TaskForm } from '@/components/tasks/TaskForm'
import { scoreTask } from '@/services/priorityScore'
import type { Task } from '@/models'

export function TasksPage() {
  const { tasks, load } = useTaskStore()
  const { openTaskModal, closeTaskModal, taskModalOpen } = useUIStore()

  useEffect(() => { load() }, [])

  const activeTasks = tasks.filter(t => t.status !== 'done' && t.status !== 'cancelled')
  const done = tasks.filter(t => t.status === 'done')

  const doFirst = activeTasks.filter(t => scoreTask(t).category === 'do-first')
  const quickWin = activeTasks.filter(t => scoreTask(t).category === 'quick-win')
  const schedule = activeTasks.filter(t => scoreTask(t).category === 'schedule')
  const fillLater = activeTasks.filter(t => scoreTask(t).category === 'fill-later')

  const Section = ({
    emoji, title, subtitle, items, accent,
  }: { emoji: string; title: string; subtitle: string; items: Task[]; accent: string }) =>
    items.length === 0 ? null : (
      <section className="mb-6">
        <div className="flex items-center gap-2 mb-2 px-1">
          <span>{emoji}</span>
          <h2 className="text-[#e7e9ea] text-sm font-semibold uppercase tracking-wider">{title}</h2>
          <span className="text-[#71767b] text-xs">{subtitle}</span>
          <span className="ml-auto text-[#71767b] text-xs">{items.length}</span>
        </div>
        <div className="divide-y divide-[#2f3336] border rounded-xl overflow-hidden" style={{ borderColor: accent + '44' }}>
          {items.map(task => (
            <div key={task.id} className="relative">
              <TaskItem task={task} />
              <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 text-[10px] px-1.5 py-0.5 rounded pointer-events-none" style={{ backgroundColor: accent + '22', color: accent }}>
                {scoreTask(task).bestTime}
              </div>
            </div>
          ))}
        </div>
      </section>
    )

  const DoneSection = ({ items }: { items: Task[] }) =>
    items.length === 0 ? null : (
      <section className="mb-6">
        <h2 className="text-[#71767b] text-xs font-semibold uppercase tracking-wider mb-2 px-1">DONE ({items.length})</h2>
        <div className="divide-y divide-[#2f3336] border border-[#2f3336] rounded-xl overflow-hidden">
          {items.map(task => <TaskItem key={task.id} task={task} />)}
        </div>
      </section>
    )

  return (
    <div className="max-w-xl mx-auto px-4 pb-24 md:pb-8 pt-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-[#e7e9ea] text-2xl font-bold">Tasks</h1>
        <button
          onClick={() => openTaskModal()}
          className="flex items-center gap-2 bg-[#1d9bf0] hover:bg-[#1a8cd8] text-white px-4 py-2 rounded-full text-sm font-semibold transition-colors"
        >
          <Plus size={16} /> New
        </button>
      </div>

      <Section emoji="🔴" title="Faz Agora" subtitle="urgente + difícil" items={doFirst} accent="#f4212e" />
      <Section emoji="🟠" title="Quick Wins" subtitle="urgente + fácil" items={quickWin} accent="#ffad1f" />
      <Section emoji="🟡" title="Agenda Foco" subtitle="foco profundo" items={schedule} accent="#7856ff" />
      <Section emoji="🟢" title="Quando Der" subtitle="sem pressa" items={fillLater} accent="#00ba7c" />

      <DoneSection items={done} />

      {tasks.length === 0 && (
        <p className="text-[#536471] text-sm text-center py-16">No tasks yet</p>
      )}

      <button
        onClick={() => openTaskModal()}
        className="md:hidden fixed bottom-20 right-4 w-14 h-14 bg-[#1d9bf0] rounded-full flex items-center justify-center shadow-lg"
      >
        <Plus size={24} className="text-white" />
      </button>

      {taskModalOpen && <TaskForm onClose={closeTaskModal} />}
    </div>
  )
}
