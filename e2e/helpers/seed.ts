import type { Page } from '@playwright/test'

export async function seedDB(page: Page) {
  await page.goto('/')
  await page.waitForLoadState('networkidle')

  await page.evaluate(async () => {
    const today = new Date().toISOString().slice(0, 10)
    const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10)
    const now = new Date().toISOString()

    await new Promise<void>((resolve, reject) => {
      const req = indexedDB.open('AgendaDB')
      req.onerror = () => reject(req.error)
      req.onsuccess = () => {
        const db = req.result
        const tx = db.transaction(['tasks', 'habits', 'habitEntries'], 'readwrite')
        const habitsStore = tx.objectStore('habits')
        const tasks = tx.objectStore('tasks')
        const entries = tx.objectStore('habitEntries')

        habitsStore.clear(); tasks.clear(); entries.clear()

        // Parent habit with sub-habits
        const addParent = habitsStore.add({
          title: 'Morning Run', color: '#7856ff', isActive: true,
          attribute: 'strength', targetHoursPerWeek: 5,
          startDate: today, currentStreak: 5, longestStreak: 12,
          location: 'Local Park',
          schedule: { frequencyType: 'daily', preferredTime: '07:00', durationMinutes: 45 },
          createdAt: now, updatedAt: now,
        })
        addParent.onsuccess = (e) => {
          const parentId = (e.target as IDBRequest).result as number
          habitsStore.add({
            title: 'Gym', color: '#ffad1f', isActive: true,
            attribute: 'strength', parentHabitId: parentId,
            startDate: today, currentStreak: 2, longestStreak: 8,
            location: 'Academia',
            schedule: { frequencyType: 'weekly', weekDays: [1, 3, 5], preferredTime: '18:00', durationMinutes: 60 },
            createdAt: now, updatedAt: now,
          })
        }

        // Standalone habit with completion
        const addRead = habitsStore.add({
          title: 'Read 30 min', color: '#00ba7c', isActive: true,
          attribute: 'intelligence',
          startDate: today, currentStreak: 3, longestStreak: 21,
          schedule: { frequencyType: 'daily', preferredTime: '22:00', durationMinutes: 30 },
          createdAt: now, updatedAt: now,
        })
        addRead.onsuccess = () => {
          const readId = addRead.result as number
          entries.add({ habitId: readId, date: today, status: 'completed', completedAt: now })
        }

        tasks.add({ title: 'Review pull requests', status: 'todo', priority: 'high', urgency: 5, difficulty: 3, scheduledDate: today, scheduledTime: '10:00', estimatedMinutes: 30, location: 'Home office', createdAt: now, updatedAt: now })
        tasks.add({ title: 'Deploy agenda to Vercel', status: 'todo', priority: 'high', urgency: 4, difficulty: 2, scheduledDate: today, scheduledTime: '14:00', location: 'Home office', createdAt: now, updatedAt: now })
        tasks.add({ title: 'Setup Supabase', status: 'done', priority: 'medium', urgency: 3, difficulty: 4, scheduledDate: today, completedAt: now, createdAt: now, updatedAt: now })
        tasks.add({ title: 'Design system tokens', status: 'todo', priority: 'medium', scheduledDate: tomorrow, createdAt: now, updatedAt: now })

        tx.oncomplete = () => { db.close(); resolve() }
        tx.onerror = () => reject(tx.error)
      }
    })
  })
}
