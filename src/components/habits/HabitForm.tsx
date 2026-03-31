import { useState } from 'react'
import { X } from 'lucide-react'
import { format } from 'date-fns'
import { useHabitStore } from '@/store/habitStore'
import { useUIStore } from '@/store/uiStore'
import { cn } from '@/lib/cn'
import { ATTRIBUTES } from '@/services/characterStats'
import type { FrequencyType, WeekDay, HabitAttribute } from '@/models'

const COLORS = ['#1d9bf0', '#7856ff', '#00ba7c', '#ffad1f', '#f4212e', '#ff7a00', '#e040fb', '#00bcd4']
const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']
const ATTR_KEYS = Object.keys(ATTRIBUTES) as HabitAttribute[]
type TargetPeriod = 'day' | 'week' | 'month'

interface Props { onClose: () => void }

export function HabitForm({ onClose }: Props) {
  const { add, update, habits } = useHabitStore()
  const { habitModalEditId } = useUIStore()
  const editing = habits.find(h => h.id === habitModalEditId)

  const [title, setTitle] = useState(editing?.title ?? '')
  const [color, setColor] = useState(editing?.color ?? '#7856ff')
  const [attribute, setAttribute] = useState<HabitAttribute | undefined>(editing?.attribute)
  const [freq, setFreq] = useState<FrequencyType>(editing?.schedule.frequencyType ?? 'daily')
  const [weekDays, setWeekDays] = useState<WeekDay[]>(editing?.schedule.weekDays ?? [1, 3, 5])
  const [preferredTime, setPreferredTime] = useState(editing?.schedule.preferredTime ?? '07:00')
  const [duration, setDuration] = useState(editing?.schedule.durationMinutes?.toString() ?? '30')
  const [location, setLocation] = useState(editing?.location ?? '')
  const [parentHabitId, setParentHabitId] = useState<number | undefined>(editing?.parentHabitId)
  const [targetPeriod, setTargetPeriod] = useState<TargetPeriod>(() => {
    if (editing?.targetHoursPerDay) return 'day'
    if (editing?.targetHoursPerMonth) return 'month'
    return 'week'
  })
  const [targetHours, setTargetHours] = useState<string>(
    (editing?.targetHoursPerDay ?? editing?.targetHoursPerWeek ?? editing?.targetHoursPerMonth)?.toString() ?? ''
  )

  const toggleDay = (d: WeekDay) =>
    setWeekDays(prev => prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d])

  const potentialParents = habits.filter(h => h.id !== editing?.id)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return
    const hours = targetHours ? Number(targetHours) : undefined
    const data = {
      title: title.trim(), color,
      attribute: attribute ?? undefined,
      isActive: true,
      startDate: editing?.startDate ?? format(new Date(), 'yyyy-MM-dd'),
      location: location || undefined,
      parentHabitId: parentHabitId ?? undefined,
      targetHoursPerDay: targetPeriod === 'day' ? hours : undefined,
      targetHoursPerWeek: targetPeriod === 'week' ? hours : undefined,
      targetHoursPerMonth: targetPeriod === 'month' ? hours : undefined,
      schedule: {
        frequencyType: freq,
        weekDays: freq === 'weekly' ? weekDays : undefined,
        preferredTime: preferredTime || undefined,
        durationMinutes: duration ? Number(duration) : undefined,
      },
    }
    editing?.id ? await update(editing.id, data) : await add(data)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative bg-[#16181c] border border-[#2f3336] rounded-t-2xl md:rounded-2xl w-full md:max-w-md p-5 max-h-[90dvh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-[#e7e9ea] font-semibold">{editing ? 'Edit Habit' : 'New Habit'}</h2>
          <button onClick={onClose} className="text-[#71767b] hover:text-[#e7e9ea]"><X size={20} /></button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input autoFocus value={title} onChange={e => setTitle(e.target.value)}
            placeholder="Habit name"
            className="bg-transparent border border-[#2f3336] rounded-lg px-3 py-2.5 text-[#e7e9ea] placeholder-[#536471] outline-none focus:border-[#1d9bf0] text-[15px]"
          />

          {/* Color */}
          <div>
            <label className="text-[#71767b] text-xs mb-2 block">Color</label>
            <div className="flex gap-2 flex-wrap">
              {COLORS.map(c => (
                <button key={c} type="button" onClick={() => setColor(c)}
                  className={cn('w-7 h-7 rounded-full transition-transform', color === c ? 'scale-125 ring-2 ring-white/40' : '')}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          {/* Attribute */}
          <div>
            <label className="text-[#71767b] text-xs mb-2 block">Atributo RPG</label>
            <div className="flex gap-2 flex-wrap">
              {ATTR_KEYS.map(a => {
                const attr = ATTRIBUTES[a]
                const selected = attribute === a
                return (
                  <button key={a} type="button" onClick={() => setAttribute(selected ? undefined : a)}
                    className={cn(
                      'flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors',
                      selected ? 'text-white border-transparent' : 'bg-[#1e2127] text-[#71767b] border-[#2f3336]',
                    )}
                    style={selected ? { backgroundColor: attr.color, borderColor: attr.color } : {}}
                  >
                    <span>{attr.emoji}</span> {attr.label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Frequency */}
          <div>
            <label className="text-[#71767b] text-xs mb-2 block">Frequency</label>
            <div className="flex gap-2">
              {(['daily', 'weekly', 'custom'] as FrequencyType[]).map(f => (
                <button key={f} type="button" onClick={() => setFreq(f)}
                  className={cn('flex-1 py-2 rounded-lg text-sm font-medium transition-colors capitalize',
                    freq === f ? 'bg-[#1d9bf0] text-white' : 'bg-[#1e2127] text-[#71767b]')}
                >{f}</button>
              ))}
            </div>
            {freq === 'weekly' && (
              <div className="flex gap-1.5 mt-3">
                {WEEKDAYS.map((d, i) => (
                  <button key={i} type="button" onClick={() => toggleDay(i as WeekDay)}
                    className={cn('flex-1 py-1.5 rounded-lg text-xs font-medium transition-colors',
                      weekDays.includes(i as WeekDay) ? 'text-white' : 'bg-[#1e2127] text-[#71767b]')}
                    style={weekDays.includes(i as WeekDay) ? { backgroundColor: color } : {}}
                  >{d}</button>
                ))}
              </div>
            )}
          </div>

          {/* Time & Duration */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[#71767b] text-xs mb-1 block">Preferred time</label>
              <input type="time" value={preferredTime} onChange={e => setPreferredTime(e.target.value)}
                className="w-full bg-[#1e2127] border border-[#2f3336] rounded-lg px-3 py-2 text-[#e7e9ea] text-sm outline-none focus:border-[#1d9bf0] [color-scheme:dark]" />
            </div>
            <div>
              <label className="text-[#71767b] text-xs mb-1 block">Duration (min)</label>
              <input type="number" value={duration} onChange={e => setDuration(e.target.value)}
                className="w-full bg-[#1e2127] border border-[#2f3336] rounded-lg px-3 py-2 text-[#e7e9ea] text-sm outline-none focus:border-[#1d9bf0]" />
            </div>
          </div>

          {/* Target hours */}
          <div>
            <label className="text-[#71767b] text-xs mb-2 block">Meta de horas</label>
            <div className="flex gap-2">
              <input type="number" min="0" step="0.5" value={targetHours}
                onChange={e => setTargetHours(e.target.value)} placeholder="0"
                className="flex-1 bg-[#1e2127] border border-[#2f3336] rounded-lg px-3 py-2 text-[#e7e9ea] text-sm outline-none focus:border-[#1d9bf0]"
              />
              <div className="flex rounded-lg overflow-hidden border border-[#2f3336]">
                {(['day', 'week', 'month'] as TargetPeriod[]).map(p => (
                  <button key={p} type="button" onClick={() => setTargetPeriod(p)}
                    className={cn('px-2.5 py-2 text-xs font-medium transition-colors',
                      targetPeriod === p ? 'bg-[#1d9bf0] text-white' : 'bg-[#1e2127] text-[#71767b]')}
                  >{p === 'day' ? 'dia' : p === 'week' ? 'sem' : 'mês'}</button>
                ))}
              </div>
            </div>
          </div>

          <input value={location} onChange={e => setLocation(e.target.value)}
            placeholder="Location (optional)"
            className="bg-transparent border border-[#2f3336] rounded-lg px-3 py-2 text-[#e7e9ea] placeholder-[#536471] outline-none focus:border-[#1d9bf0] text-sm"
          />

          {/* Sub-habit of */}
          {potentialParents.length > 0 && (
            <div>
              <label className="text-[#71767b] text-xs mb-1 block">Sub-hábito de</label>
              <select value={parentHabitId ?? ''}
                onChange={e => setParentHabitId(e.target.value ? Number(e.target.value) : undefined)}
                className="w-full bg-[#1e2127] border border-[#2f3336] rounded-lg px-3 py-2 text-[#e7e9ea] text-sm outline-none focus:border-[#1d9bf0]"
              >
                <option value="">— nenhum (hábito principal) —</option>
                {potentialParents.map(h => (
                  <option key={h.id} value={h.id}>{h.title}</option>
                ))}
              </select>
            </div>
          )}

          <button type="submit" disabled={!title.trim()}
            className="bg-[#1d9bf0] hover:bg-[#1a8cd8] disabled:opacity-40 text-white font-semibold py-2.5 rounded-full transition-colors"
          >
            {editing ? 'Save' : 'Add Habit'}
          </button>
        </form>
      </div>
    </div>
  )
}
