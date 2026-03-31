import type { Task } from '../models'

type Category = 'do-first' | 'schedule' | 'quick-win' | 'fill-later'

export function scoreTask(task: Task): { score: number; category: Category; bestTime: string } {
  const urgency = task.urgency ?? 3
  const difficulty = task.difficulty ?? 3

  const score = urgency * 3 + difficulty * 2

  let category: Category
  if (urgency >= 4 && difficulty >= 4) {
    category = 'do-first'
  } else if (urgency < 4 && difficulty >= 4) {
    category = 'schedule'
  } else if (urgency >= 4 && difficulty < 4) {
    category = 'quick-win'
  } else {
    category = 'fill-later'
  }

  let bestTime: string
  if (difficulty >= 4) {
    bestTime = 'Manhã (9-11h)'
  } else if (difficulty >= 2) {
    bestTime = 'Meio-dia (11-13h)'
  } else {
    bestTime = 'Tarde (14-16h)'
  }

  return { score, category, bestTime }
}
