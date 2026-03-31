import { supabase } from '@/lib/supabase'
import { db } from '@/db'
import type { Task, Habit, HabitEntry } from '@/models'

// ─── Pull Supabase → Dexie (merge, Supabase wins) ────────────────────────────
export async function pullFromSupabase(userId: string): Promise<void> {
  if (!supabase) return

  const [{ data: rHabits }, { data: rTasks }, { data: rEntries }] = await Promise.all([
    supabase.from('habits').select('*').eq('user_id', userId).order('created_at'),
    supabase.from('tasks').select('*').eq('user_id', userId).order('created_at'),
    supabase.from('habit_entries').select('*').eq('user_id', userId),
  ])

  if (rHabits) {
    for (const r of rHabits) {
      const existing = r.local_id ? await db.habits.get(r.local_id) : null
      const h: Habit = {
        ...(existing?.id ? { id: existing.id } : {}),
        title: r.title, description: r.description, color: r.color,
        icon: r.icon, attribute: r.attribute,
        schedule: r.schedule, location: r.location,
        startDate: r.start_date, endDate: r.end_date,
        isActive: r.is_active,
        currentStreak: r.current_streak ?? 0,
        longestStreak: r.longest_streak ?? 0,
        parentHabitId: r.parent_local_id ?? undefined,
        targetHoursPerDay: r.target_hours_per_day ?? undefined,
        targetHoursPerWeek: r.target_hours_per_week ?? undefined,
        targetHoursPerMonth: r.target_hours_per_month ?? undefined,
        createdAt: r.created_at, updatedAt: r.updated_at, remoteId: r.id,
      } as Habit
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      existing ? await db.habits.update(existing.id!, h as any) : await db.habits.add(h)
    }
  }

  if (rTasks) {
    for (const r of rTasks) {
      const existing = r.local_id ? await db.tasks.get(r.local_id) : null
      const t: Task = {
        ...(existing?.id ? { id: existing.id } : {}),
        title: r.title, description: r.description,
        status: r.status, priority: r.priority,
        urgency: r.urgency, difficulty: r.difficulty,
        dueDate: r.due_date, dueTime: r.due_time,
        scheduledDate: r.scheduled_date, scheduledTime: r.scheduled_time,
        estimatedMinutes: r.estimated_minutes, location: r.location,
        tags: r.tags, color: r.color, completedAt: r.completed_at,
        createdAt: r.created_at, updatedAt: r.updated_at, remoteId: r.id,
      } as Task
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      existing ? await db.tasks.update(existing.id!, t as any) : await db.tasks.add(t)
    }
  }

  if (rEntries) {
    for (const r of rEntries) {
      const existing = r.local_id ? await db.habitEntries.get(r.local_id) : null
      const e: HabitEntry = {
        ...(existing?.id ? { id: existing.id } : {}),
        habitId: r.habit_local_id, date: r.date, status: r.status,
        completedAt: r.completed_at, notes: r.notes,
        actualMinutes: r.actual_minutes, remoteId: r.id,
      } as HabitEntry
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      existing ? await db.habitEntries.update(existing.id!, e as any) : await db.habitEntries.add(e)
    }
  }
}

// ─── Push individual records ──────────────────────────────────────────────────
export async function pushTask(task: Task, userId: string): Promise<void> {
  if (!supabase || !task.id) return
  try {
    const { data } = await supabase.from('tasks').upsert({
      ...(task.remoteId ? { id: task.remoteId } : {}),
      user_id: userId, local_id: task.id,
      title: task.title, description: task.description,
      status: task.status, priority: task.priority,
      urgency: task.urgency, difficulty: task.difficulty,
      due_date: task.dueDate, due_time: task.dueTime,
      scheduled_date: task.scheduledDate, scheduled_time: task.scheduledTime,
      estimated_minutes: task.estimatedMinutes, location: task.location,
      tags: task.tags, color: task.color, completed_at: task.completedAt,
      created_at: task.createdAt, updated_at: task.updatedAt,
    }).select('id').single()
    if (data?.id && !task.remoteId) await db.tasks.update(task.id, { remoteId: data.id })
  } catch { /* non-fatal */ }
}

export async function deleteRemoteTask(remoteId: string): Promise<void> {
  if (!supabase) return
  try { await supabase.from('tasks').delete().eq('id', remoteId) } catch {}
}

export async function pushHabit(habit: Habit, userId: string): Promise<void> {
  if (!supabase || !habit.id) return
  try {
    const { data } = await supabase.from('habits').upsert({
      ...(habit.remoteId ? { id: habit.remoteId } : {}),
      user_id: userId, local_id: habit.id,
      parent_local_id: habit.parentHabitId ?? null,
      title: habit.title, description: habit.description,
      color: habit.color, icon: habit.icon, attribute: habit.attribute ?? null,
      schedule: habit.schedule, location: habit.location,
      start_date: habit.startDate, end_date: habit.endDate ?? null,
      is_active: habit.isActive,
      current_streak: habit.currentStreak ?? 0,
      longest_streak: habit.longestStreak ?? 0,
      target_hours_per_day: habit.targetHoursPerDay ?? null,
      target_hours_per_week: habit.targetHoursPerWeek ?? null,
      target_hours_per_month: habit.targetHoursPerMonth ?? null,
      created_at: habit.createdAt, updated_at: habit.updatedAt,
    }).select('id').single()
    if (data?.id && !habit.remoteId) await db.habits.update(habit.id, { remoteId: data.id })
  } catch {}
}

export async function deleteRemoteHabit(remoteId: string): Promise<void> {
  if (!supabase) return
  try { await supabase.from('habits').delete().eq('id', remoteId) } catch {}
}

export async function pushHabitEntry(entry: HabitEntry, userId: string): Promise<void> {
  if (!supabase || !entry.id) return
  try {
    const { data } = await supabase.from('habit_entries').upsert({
      ...(entry.remoteId ? { id: entry.remoteId } : {}),
      user_id: userId, local_id: entry.id,
      habit_local_id: entry.habitId, date: entry.date,
      status: entry.status, completed_at: entry.completedAt,
      notes: entry.notes, actual_minutes: entry.actualMinutes,
    }).select('id').single()
    if (data?.id && !entry.remoteId) await db.habitEntries.update(entry.id, { remoteId: data.id })
  } catch {}
}
