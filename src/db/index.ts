import Dexie, { type EntityTable } from 'dexie'
import type { Task, Habit, HabitEntry } from '../models'

class AgendaDatabase extends Dexie {
  tasks!: EntityTable<Task, 'id'>
  habits!: EntityTable<Habit, 'id'>
  habitEntries!: EntityTable<HabitEntry, 'id'>

  constructor() {
    super('AgendaDB')
    this.version(1).stores({
      tasks:        '++id, status, priority, dueDate, scheduledDate, habitId, *tags',
      habits:       '++id, isActive, startDate',
      habitEntries: '++id, habitId, date, status, [habitId+date]',
    })
    this.version(2).stores({
      tasks:        '++id, status, priority, urgency, difficulty, dueDate, scheduledDate, habitId, *tags',
      habits:       '++id, isActive, startDate',
      habitEntries: '++id, habitId, date, status, [habitId+date]',
    })
    this.version(3).stores({
      tasks:        '++id, status, priority, urgency, difficulty, dueDate, scheduledDate, habitId, *tags',
      habits:       '++id, isActive, startDate, parentHabitId, attribute',
      habitEntries: '++id, habitId, date, status, [habitId+date]',
    })
  }
}

export const db = new AgendaDatabase()
