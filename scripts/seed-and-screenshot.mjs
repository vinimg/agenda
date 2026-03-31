import { chromium } from 'playwright'

const DESKTOP = '/mnt/c/Users/vini/Desktop'
const BASE = 'http://172.20.9.106:4322'

const browser = await chromium.launch({ headless: true })
const ctx = await browser.newContext()
const page = await ctx.newPage()
await page.setViewportSize({ width: 1280, height: 800 })

// First load — app registers the DB schema
await page.goto(BASE, { waitUntil: 'networkidle' })

// Seed using raw IndexedDB (no CDN dependency)
await page.evaluate(async () => {
  const today = new Date().toISOString().slice(0, 10)
  const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10)
  const now = new Date().toISOString()

  await new Promise((resolve, reject) => {
    const req = indexedDB.open('AgendaDB')
    req.onerror = () => reject(req.error)
    req.onsuccess = () => {
      const db = req.result
      const tx = db.transaction(['tasks', 'habits', 'habitEntries'], 'readwrite')

      const habits = tx.objectStore('habits')
      const tasks = tx.objectStore('tasks')
      const entries = tx.objectStore('habitEntries')

      // Clear all
      habits.clear(); tasks.clear(); entries.clear()

      // Add habits
      habits.add({ title: 'Morning Run', color: '#7856ff', isActive: true, startDate: today, currentStreak: 5, longestStreak: 12, location: 'Local Park', schedule: { frequencyType: 'daily', preferredTime: '07:00', durationMinutes: 45 }, createdAt: now, updatedAt: now })
      habits.add({ title: 'Read 30 min', color: '#00ba7c', isActive: true, startDate: today, currentStreak: 3, longestStreak: 21, schedule: { frequencyType: 'daily', preferredTime: '22:00', durationMinutes: 30 }, createdAt: now, updatedAt: now })
      habits.add({ title: 'Gym', color: '#ffad1f', isActive: true, startDate: today, currentStreak: 2, longestStreak: 8, location: 'Academia', schedule: { frequencyType: 'weekly', weekDays: [1,3,5], preferredTime: '18:00', durationMinutes: 60 }, createdAt: now, updatedAt: now })

      // Habit entry — Read done today
      entries.add({ habitId: 2, date: today, status: 'completed', completedAt: now })

      // Tasks
      tasks.add({ title: 'Review pull requests', status: 'todo', priority: 'high', scheduledDate: today, scheduledTime: '10:00', estimatedMinutes: 30, createdAt: now, updatedAt: now })
      tasks.add({ title: 'Deploy agenda to Vercel', status: 'todo', priority: 'high', scheduledDate: today, scheduledTime: '14:00', location: 'Home office', createdAt: now, updatedAt: now })
      tasks.add({ title: 'Setup Supabase', status: 'done', priority: 'medium', scheduledDate: today, completedAt: now, createdAt: now, updatedAt: now })
      tasks.add({ title: 'Design system tokens', status: 'todo', priority: 'medium', scheduledDate: tomorrow, createdAt: now, updatedAt: now })

      tx.oncomplete = () => { db.close(); resolve() }
      tx.onerror = () => reject(tx.error)
    }
  })
})

// Screenshots — reload each page fresh so stores pick up seeded data
const pages = [
  { url: '/', name: '1-today' },
  { url: '/calendar', name: '2-calendar' },
  { url: '/tasks', name: '3-tasks' },
  { url: '/habits', name: '4-habits' },
]

for (const { url, name } of pages) {
  await page.goto(`${BASE}${url}`, { waitUntil: 'networkidle' })
  await page.waitForTimeout(1500)
  await page.screenshot({ path: `${DESKTOP}/agenda-${name}.png` })
  console.log(`✓ ${name}`)
}

await browser.close()
console.log('\nDone — check Windows Desktop')
