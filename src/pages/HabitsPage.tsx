import { useEffect, useState } from 'react'
import { Plus, Pencil, Trash2, Flame, ChevronDown, ChevronRight } from 'lucide-react'
import { startOfWeek, endOfWeek, format } from 'date-fns'
import { useHabitStore } from '@/store/habitStore'
import { useUIStore } from '@/store/uiStore'
import { HabitForm } from '@/components/habits/HabitForm'
import { db } from '@/db'
import { computeCharacterStats, ATTRIBUTES } from '@/services/characterStats'
import { cn } from '@/lib/cn'
import type { Habit, HabitEntry } from '@/models'

// ─── Character card ───────────────────────────────────────────────────────────
function CharacterCard({ habits, entries }: { habits: Habit[]; entries: HabitEntry[] }) {
  const stats = computeCharacterStats(habits, entries)
  if (stats.activeAttributes.length === 0) return null

  const levelIcon = stats.overallLevel >= 16 ? '👑'
    : stats.overallLevel >= 11 ? '🛡️'
    : stats.overallLevel >= 6  ? '⚔️'
    : '🌱'

  return (
    <div className="mb-6 bg-[#16181c] border border-[#2f3336] rounded-xl p-4" data-testid="character-card">
      <div className="flex items-center gap-3 mb-3">
        <span className="text-2xl">{levelIcon}</span>
        <div>
          <p className="text-[#e7e9ea] font-bold text-sm">Nível {stats.overallLevel} · {stats.title}</p>
          <p className="text-[#71767b] text-xs">Personagem em evolução</p>
        </div>
      </div>
      <div className="flex flex-col gap-2">
        {stats.activeAttributes.map(a => (
          <div key={a.attribute} className="flex items-center gap-2">
            <span className="text-sm w-5 text-center">{a.emoji}</span>
            <span className="text-[#71767b] text-xs w-24 shrink-0">{a.label}</span>
            <div className="flex-1 bg-[#2f3336] rounded-full h-1.5 overflow-hidden">
              <div className="h-full rounded-full transition-all duration-500"
                style={{ width: `${Math.max(2, a.progress * 100)}%`, backgroundColor: a.color }} />
            </div>
            <span className="text-[#71767b] text-xs w-8 text-right">Lv{a.level}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Habit row (standalone or child) ─────────────────────────────────────────
function HabitRow({ habit, indent = false }: { habit: Habit; indent?: boolean }) {
  const { remove } = useHabitStore()
  const { openHabitModal } = useUIStore()
  const schedLabel = scheduleLabel(habit)

  return (
    <div className={cn(
      'flex items-center gap-3 px-4 py-3 hover:bg-[#1e2127] group transition-colors',
      indent && 'pl-8 border-l-2',
    )}
    style={indent ? { borderLeftColor: habit.color + '66' } : {}}
    >
      <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: habit.color }} />
      <div className="flex-1 min-w-0">
        <p className="text-[#e7e9ea] text-sm font-medium">{habit.title}</p>
        <p className="text-[#71767b] text-xs mt-0.5">
          {schedLabel}
          {habit.schedule.preferredTime && ` · ${habit.schedule.preferredTime}`}
          {habit.location && ` · ${habit.location}`}
          {habit.attribute && ` · ${ATTRIBUTES[habit.attribute].emoji}`}
        </p>
      </div>
      {(habit.currentStreak ?? 0) > 0 && (
        <div className="flex items-center gap-0.5 text-[#ffad1f]">
          <Flame size={12} /><span className="text-xs font-semibold">{habit.currentStreak}</span>
        </div>
      )}
      <div className="hidden group-hover:flex items-center gap-2">
        <button onClick={() => habit.id && openHabitModal(habit.id)}
          className="text-[#71767b] hover:text-[#e7e9ea] transition-colors"><Pencil size={13} /></button>
        <button onClick={() => habit.id && remove(habit.id)}
          className="text-[#71767b] hover:text-[#f4212e] transition-colors"><Trash2 size={13} /></button>
      </div>
    </div>
  )
}

// ─── Week progress bar ────────────────────────────────────────────────────────
function ProgressBar({ actual, target, color }: { actual: number; target: number; color: string }) {
  const pct = Math.min(100, (actual / target) * 100)
  return (
    <div className="px-4 py-2 border-t border-[#2f3336]">
      <div className="flex justify-between text-xs text-[#71767b] mb-1">
        <span>Meta: {target}h/sem</span>
        <span style={{ color }}>{actual.toFixed(1)}h · {Math.round(pct)}%</span>
      </div>
      <div className="bg-[#2f3336] rounded-full h-1 overflow-hidden">
        <div className="h-full rounded-full transition-all"
          style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
    </div>
  )
}

const DAY_NAMES = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
const FREQ_LABELS: Record<string, string> = { daily: 'Diário', weekly: 'Semanal', monthly: 'Mensal', custom: 'Custom' }

function scheduleLabel(habit: Habit): string {
  if (habit.schedule.frequencyType === 'weekly' && habit.schedule.weekDays?.length) {
    return habit.schedule.weekDays.map(d => DAY_NAMES[d]).join(', ')
  }
  return FREQ_LABELS[habit.schedule.frequencyType] ?? habit.schedule.frequencyType
}

// ─── Main page ────────────────────────────────────────────────────────────────
export function HabitsPage() {
  const { habits, load } = useHabitStore()
  const { openHabitModal, closeHabitModal, habitModalOpen } = useUIStore()
  const [weekEntries, setWeekEntries] = useState<HabitEntry[]>([])
  const [allEntries, setAllEntries] = useState<HabitEntry[]>([])
  const [collapsed, setCollapsed] = useState<Set<number>>(new Set())

  useEffect(() => { load() }, [])

  useEffect(() => {
    const ws = format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd')
    const we = format(endOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd')
    db.habitEntries.where('date').between(ws, we, true, true).toArray().then(setWeekEntries)
    db.habitEntries.toArray().then(setAllEntries)
  }, [habits])

  const weekHours = (habitId: number): number => {
    const h = habits.find(x => x.id === habitId)
    return weekEntries
      .filter(e => e.habitId === habitId && e.status === 'completed')
      .reduce((sum, e) => sum + (e.actualMinutes ?? h?.schedule.durationMinutes ?? 0), 0) / 60
  }

  // Build tree
  const childrenOf: Record<number, Habit[]> = {}
  const topLevel: Habit[] = []
  for (const h of habits) {
    if (h.parentHabitId) {
      if (!childrenOf[h.parentHabitId]) childrenOf[h.parentHabitId] = []
      childrenOf[h.parentHabitId].push(h)
    } else {
      topLevel.push(h)
    }
  }

  const toggle = (id: number) => setCollapsed(prev => {
    const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n
  })

  return (
    <div className="max-w-xl mx-auto px-4 pb-24 md:pb-8 pt-6">
      <CharacterCard habits={habits} entries={allEntries} />

      <div className="flex items-center justify-between mb-4">
        <h1 className="text-[#e7e9ea] text-2xl font-bold">Habits</h1>
        <button onClick={() => openHabitModal()}
          className="flex items-center gap-2 bg-[#1d9bf0] hover:bg-[#1a8cd8] text-white px-4 py-2 rounded-full text-sm font-semibold transition-colors">
          <Plus size={16} /> New
        </button>
      </div>

      {habits.length === 0 ? (
        <p className="text-[#536471] text-sm text-center py-16">
          Nenhum hábito ainda.<br />
          <span className="text-[#71767b]">Adicione um para começar a evoluir.</span>
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {topLevel.map(habit => {
            const children = childrenOf[habit.id!] ?? []
            const isParent = children.length > 0
            const isOpen = !collapsed.has(habit.id!)
            const target = habit.targetHoursPerWeek
            const actual = children.reduce((s, c) => s + weekHours(c.id!), 0) + weekHours(habit.id!)

            return (
              <div key={habit.id}
                className="bg-[#16181c] border border-[#2f3336] rounded-xl overflow-hidden">
                {/* Top-level habit row */}
                <div className="flex items-center gap-3 px-4 py-3 hover:bg-[#1e2127] group transition-colors">
                  {isParent && (
                    <button onClick={() => toggle(habit.id!)}
                      className="text-[#71767b] hover:text-[#e7e9ea] shrink-0">
                      {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                    </button>
                  )}
                  <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: habit.color }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-[#e7e9ea] text-sm font-semibold">{habit.title}</p>
                    <p className="text-[#71767b] text-xs mt-0.5">
                      {scheduleLabel(habit)}
                      {habit.schedule.preferredTime && ` · ${habit.schedule.preferredTime}`}
                      {habit.location && ` · ${habit.location}`}
                      {habit.attribute && ` · ${ATTRIBUTES[habit.attribute].emoji} ${ATTRIBUTES[habit.attribute].label}`}
                    </p>
                  </div>
                  {(habit.currentStreak ?? 0) > 0 && (
                    <div className="flex items-center gap-0.5 text-[#ffad1f]">
                      <Flame size={12} /><span className="text-xs font-semibold">{habit.currentStreak}</span>
                    </div>
                  )}
                  <div className="hidden group-hover:flex items-center gap-2">
                    <button onClick={() => habit.id && openHabitModal(habit.id)}
                      className="text-[#71767b] hover:text-[#e7e9ea] transition-colors"><Pencil size={13} /></button>
                    <button onClick={() => habit.id && useHabitStore.getState().remove(habit.id)}
                      className="text-[#71767b] hover:text-[#f4212e] transition-colors"><Trash2 size={13} /></button>
                  </div>
                </div>

                {/* Progress bar */}
                {target && <ProgressBar actual={actual} target={target} color={habit.color} />}

                {/* Children */}
                {isParent && isOpen && (
                  <div className="border-t border-[#2f3336] divide-y divide-[#2f3336]">
                    {children.map(child => <HabitRow key={child.id} habit={child} indent />)}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      <button onClick={() => openHabitModal()}
        className="md:hidden fixed bottom-20 right-4 w-14 h-14 bg-[#1d9bf0] rounded-full flex items-center justify-center shadow-lg">
        <Plus size={24} className="text-white" />
      </button>

      {habitModalOpen && <HabitForm onClose={closeHabitModal} />}
    </div>
  )
}
