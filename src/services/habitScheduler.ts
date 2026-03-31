import { addDays, format, parseISO, getDay, getDate, differenceInDays } from 'date-fns'
import { db } from '../db'
import type { CalendarEvent, Habit, HabitEntry } from '../models'

function getScheduledDatesInRange(habit: Habit, start: Date, end: Date): string[] {
  const dates: string[] = []
  const habitStart = parseISO(habit.startDate)
  const habitEnd = habit.endDate ? parseISO(habit.endDate) : null
  const { frequencyType, weekDays, monthDays, intervalDays } = habit.schedule

  let current = start > habitStart ? start : habitStart
  while (current <= end) {
    if (habitEnd && current > habitEnd) break

    let include = false
    switch (frequencyType) {
      case 'daily':
        include = true
        break
      case 'weekly':
        include = (weekDays ?? []).includes(getDay(current) as 0|1|2|3|4|5|6)
        break
      case 'monthly':
        include = (monthDays ?? []).includes(getDate(current))
        break
      case 'custom':
        include = differenceInDays(current, habitStart) % (intervalDays ?? 1) === 0
        break
    }

    if (include) dates.push(format(current, 'yyyy-MM-dd'))
    current = addDays(current, 1)
  }

  return dates
}

export async function getCalendarEventsForRange(
  startStr: string,
  endStr: string,
): Promise<CalendarEvent[]> {
  const start = parseISO(startStr)
  const end = parseISO(endStr)
  const [habits, tasks, entries] = await Promise.all([
    db.habits.filter(h => !!h.isActive).toArray(),
    db.tasks
      .filter(t => {
        const d = t.scheduledDate ?? t.dueDate
        return !!d && d >= startStr && d <= endStr
      })
      .toArray(),
    db.habitEntries
      .filter(e => e.date >= startStr && e.date <= endStr)
      .toArray(),
  ])

  // Index entries by habitId+date for O(1) lookup
  const entryMap = new Map<string, HabitEntry>()
  for (const e of entries) {
    entryMap.set(`${e.habitId}:${e.date}`, e)
  }

  const events: CalendarEvent[] = []

  // Habit events
  for (const habit of habits) {
    if (!habit.id) continue
    const scheduledDates = getScheduledDatesInRange(habit, start, end)

    for (const date of scheduledDates) {
      const entry = entryMap.get(`${habit.id}:${date}`)
      const isCompleted = entry?.status === 'completed'
      const startTime = habit.schedule.preferredTime
      const endTime = startTime && habit.schedule.durationMinutes
        ? format(
            new Date(`1970-01-01T${startTime}:00`).getTime() + habit.schedule.durationMinutes * 60000,
            'HH:mm',
          )
        : undefined

      events.push({
        id: `habit-${habit.id}-${date}`,
        source: 'habit',
        sourceId: habit.id,
        title: habit.title,
        color: habit.color,
        icon: habit.icon,
        date,
        startTime,
        endTime,
        allDay: !startTime,
        location: habit.location,
        locationUrl: habit.locationUrl,
        isCompleted,
        isHabitDue: !isCompleted,
        habitId: habit.id,
        habitEntryId: entry?.id,
      })
    }
  }

  // Task events
  for (const task of tasks) {
    if (!task.id) continue
    const date = task.scheduledDate ?? task.dueDate!
    const startTime = task.scheduledTime ?? task.dueTime
    const endTime = startTime && task.estimatedMinutes
      ? format(
          new Date(`1970-01-01T${startTime}:00`).getTime() + task.estimatedMinutes * 60000,
          'HH:mm',
        )
      : undefined

    events.push({
      id: `task-${task.id}`,
      source: 'task',
      sourceId: task.id,
      title: task.title,
      color: task.color ?? '#1d9bf0',
      date,
      startTime,
      endTime,
      allDay: !startTime,
      location: task.location,
      locationUrl: task.locationUrl,
      isCompleted: task.status === 'done',
      isHabitDue: false,
      taskId: task.id,
    })
  }

  // Sort: allDay first, then by startTime
  events.sort((a, b) => {
    if (a.allDay && !b.allDay) return -1
    if (!a.allDay && b.allDay) return 1
    return (a.startTime ?? '').localeCompare(b.startTime ?? '')
  })

  return events
}

export async function markHabitEntry(
  habitId: number,
  date: string,
  status: 'completed' | 'skipped' | 'missed',
): Promise<void> {
  const existing = await db.habitEntries
    .where('[habitId+date]')
    .equals([habitId, date])
    .first()

  if (existing?.id) {
    await db.habitEntries.update(existing.id, {
      status,
      completedAt: status === 'completed' ? new Date().toISOString() : undefined,
    })
  } else {
    await db.habitEntries.add({
      habitId,
      date,
      status,
      completedAt: status === 'completed' ? new Date().toISOString() : undefined,
    })
  }

  await recalculateStreak(habitId)
}

async function recalculateStreak(habitId: number): Promise<void> {
  const habit = await db.habits.get(habitId)
  if (!habit) return

  const entries = await db.habitEntries
    .where('habitId').equals(habitId)
    .filter(e => e.status === 'completed')
    .toArray()

  const completedDates = new Set(entries.map(e => e.date))

  let current = new Date()
  let streak = 0

  for (let i = 0; i < 365; i++) {
    const d = format(addDays(current, -i), 'yyyy-MM-dd')
    const scheduled = getScheduledDatesInRange(
      habit,
      parseISO(d),
      parseISO(d),
    )
    if (scheduled.length === 0) continue // not a scheduled day, skip
    if (completedDates.has(d)) {
      streak++
    } else if (d <= format(new Date(), 'yyyy-MM-dd')) {
      break // missed a scheduled day → streak ends
    }
  }

  const longest = Math.max(streak, habit.longestStreak ?? 0)
  await db.habits.update(habitId, { currentStreak: streak, longestStreak: longest })
}
