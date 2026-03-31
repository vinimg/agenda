import { create } from 'zustand'
import type { CalendarEvent } from '../models'
import { getCalendarEventsForRange } from '../services/habitScheduler'

interface CalendarState {
  events: CalendarEvent[]
  loading: boolean
  loadRange: (start: string, end: string) => Promise<void>
}

export const useCalendarStore = create<CalendarState>((set) => ({
  events: [],
  loading: false,
  loadRange: async (start, end) => {
    set({ loading: true })
    const events = await getCalendarEventsForRange(start, end)
    set({ events, loading: false })
  },
}))
