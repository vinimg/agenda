export type TaskStatus = 'todo' | 'in_progress' | 'done' | 'cancelled'
export type TaskPriority = 'low' | 'medium' | 'high'

export interface Task {
  id?: number
  title: string
  description?: string
  status: TaskStatus
  priority: TaskPriority
  urgency?: 1 | 2 | 3 | 4 | 5
  difficulty?: 1 | 2 | 3 | 4 | 5
  dueDate?: string        // 'YYYY-MM-DD'
  dueTime?: string        // 'HH:mm'
  scheduledDate?: string  // 'YYYY-MM-DD'
  scheduledTime?: string  // 'HH:mm'
  estimatedMinutes?: number
  location?: string
  locationUrl?: string
  tags?: string[]
  color?: string
  habitId?: number
  createdAt: string
  updatedAt: string
  completedAt?: string
  syncedAt?: string
  remoteId?: string
}

export type FrequencyType = 'daily' | 'weekly' | 'monthly' | 'custom'
export type WeekDay = 0 | 1 | 2 | 3 | 4 | 5 | 6
export type HabitAttribute = 'strength' | 'intelligence' | 'discipline' | 'wellness' | 'social' | 'creativity'

export interface HabitSchedule {
  frequencyType: FrequencyType
  weekDays?: WeekDay[]
  monthDays?: number[]
  intervalDays?: number
  preferredTime?: string   // 'HH:mm'
  durationMinutes?: number
}

export interface Habit {
  id?: number
  title: string
  description?: string
  color: string
  icon?: string
  attribute?: HabitAttribute
  schedule: HabitSchedule
  location?: string
  locationUrl?: string
  startDate: string
  endDate?: string
  isActive: boolean
  currentStreak?: number
  longestStreak?: number
  parentHabitId?: number
  targetHoursPerDay?: number
  targetHoursPerWeek?: number
  targetHoursPerMonth?: number
  createdAt: string
  updatedAt: string
  syncedAt?: string
  remoteId?: string
}

export type EntryStatus = 'completed' | 'skipped' | 'missed'

export interface HabitEntry {
  id?: number
  habitId: number
  date: string           // 'YYYY-MM-DD'
  status: EntryStatus
  completedAt?: string
  notes?: string
  actualMinutes?: number
  syncedAt?: string
  remoteId?: string
}

export type CalendarEventSource = 'task' | 'habit'

export interface CalendarEvent {
  id: string
  source: CalendarEventSource
  sourceId: number
  title: string
  color: string
  icon?: string
  date: string
  startTime?: string
  endTime?: string
  allDay: boolean
  location?: string
  locationUrl?: string
  isCompleted: boolean
  isHabitDue: boolean
  taskId?: number
  habitId?: number
  habitEntryId?: number
}
