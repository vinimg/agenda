import { create } from 'zustand'
import { format } from 'date-fns'

type CalendarView = 'month' | 'week' | 'day'

interface UIState {
  calendarView: CalendarView
  selectedDate: string
  taskModalOpen: boolean
  taskModalEditId: number | undefined
  habitModalOpen: boolean
  habitModalEditId: number | undefined
  setCalendarView: (v: CalendarView) => void
  setSelectedDate: (d: string) => void
  openTaskModal: (editId?: number) => void
  closeTaskModal: () => void
  openHabitModal: (editId?: number) => void
  closeHabitModal: () => void
}

export const useUIStore = create<UIState>((set) => ({
  calendarView: 'month',
  selectedDate: format(new Date(), 'yyyy-MM-dd'),
  taskModalOpen: false,
  taskModalEditId: undefined,
  habitModalOpen: false,
  habitModalEditId: undefined,
  setCalendarView: (calendarView) => set({ calendarView }),
  setSelectedDate: (selectedDate) => set({ selectedDate }),
  openTaskModal: (editId) => set({ taskModalOpen: true, taskModalEditId: editId }),
  closeTaskModal: () => set({ taskModalOpen: false, taskModalEditId: undefined }),
  openHabitModal: (editId) => set({ habitModalOpen: true, habitModalEditId: editId }),
  closeHabitModal: () => set({ habitModalOpen: false, habitModalEditId: undefined }),
}))
