import { create } from 'zustand'
import { db } from '../db'
import type { Habit, EntryStatus, HabitEntry } from '../models'
import { markHabitEntry } from '../services/habitScheduler'
import { pushHabit, deleteRemoteHabit, pushHabitEntry } from '../services/sync'
import { useAuthStore } from './authStore'

interface HabitState {
  habits: Habit[]
  loading: boolean
  load: () => Promise<void>
  add: (h: Omit<Habit, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>
  update: (id: number, patch: Partial<Habit>) => Promise<void>
  remove: (id: number) => Promise<void>
  markEntry: (habitId: number, date: string, status: EntryStatus) => Promise<void>
}

function getUid() { return useAuthStore.getState().user?.id }

export const useHabitStore = create<HabitState>((set, get) => ({
  habits: [],
  loading: false,

  load: async () => {
    set({ loading: true })
    const habits = await db.habits.toArray()
    habits.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    set({ habits, loading: false })
  },

  add: async (h) => {
    const now = new Date().toISOString()
    const id = await db.habits.add({ ...h, createdAt: now, updatedAt: now } as Habit)
    await get().load()
    const uid = getUid()
    if (uid) { const habit = await db.habits.get(id); if (habit) pushHabit(habit, uid) }
  },

  update: async (id, patch) => {
    await db.habits.update(id, { ...patch, updatedAt: new Date().toISOString() })
    await get().load()
    const uid = getUid()
    if (uid) { const habit = await db.habits.get(id); if (habit) pushHabit(habit, uid) }
  },

  remove: async (id) => {
    const habit = await db.habits.get(id)
    await db.habits.delete(id)
    await db.habitEntries.where('habitId').equals(id).delete()
    set({ habits: get().habits.filter(h => h.id !== id) })
    if (habit?.remoteId) deleteRemoteHabit(habit.remoteId)
  },

  markEntry: async (habitId, date, status) => {
    await markHabitEntry(habitId, date, status)
    await get().load()
    const uid = getUid()
    if (uid) {
      const entry = await db.habitEntries
        .where('[habitId+date]').equals([habitId, date]).first() as HabitEntry | undefined
      if (entry) pushHabitEntry(entry, uid)
    }
  },
}))
