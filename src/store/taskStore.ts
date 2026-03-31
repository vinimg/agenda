import { create } from 'zustand'
import { db } from '../db'
import type { Task } from '../models'
import { pushTask, deleteRemoteTask } from '../services/sync'
import { useAuthStore } from './authStore'

interface TaskState {
  tasks: Task[]
  loading: boolean
  load: () => Promise<void>
  add: (t: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>
  update: (id: number, patch: Partial<Task>) => Promise<void>
  remove: (id: number) => Promise<void>
  toggleDone: (id: number) => Promise<void>
}

function getUid() { return useAuthStore.getState().user?.id }

export const useTaskStore = create<TaskState>((set, get) => ({
  tasks: [],
  loading: false,

  load: async () => {
    set({ loading: true })
    const tasks = await db.tasks.toArray()
    tasks.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    set({ tasks, loading: false })
  },

  add: async (t) => {
    const now = new Date().toISOString()
    const id = await db.tasks.add({ ...t, createdAt: now, updatedAt: now } as Task)
    await get().load()
    const uid = getUid()
    if (uid) { const task = await db.tasks.get(id); if (task) pushTask(task, uid) }
  },

  update: async (id, patch) => {
    await db.tasks.update(id, { ...patch, updatedAt: new Date().toISOString() })
    await get().load()
    const uid = getUid()
    if (uid) { const task = await db.tasks.get(id); if (task) pushTask(task, uid) }
  },

  remove: async (id) => {
    const task = await db.tasks.get(id)
    await db.tasks.delete(id)
    set({ tasks: get().tasks.filter(t => t.id !== id) })
    if (task?.remoteId) deleteRemoteTask(task.remoteId)
  },

  toggleDone: async (id) => {
    const task = get().tasks.find(t => t.id === id)
    if (!task) return
    const isDone = task.status === 'done'
    await get().update(id, {
      status: isDone ? 'todo' : 'done',
      completedAt: isDone ? undefined : new Date().toISOString(),
    })
  },
}))
