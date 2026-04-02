import { db } from '@/db'
import { pushTask } from '@/services/sync'
import type { Task } from '@/models'

interface GithubItem {
  number: number
  title: string
  state: string
  pull_request?: unknown
  repository_url: string
}

function repoFromUrl(url: string): string {
  return url.replace('https://api.github.com/repos/', '')
}

export async function syncGithubTasks(userId: string | null): Promise<void> {
  const res = await fetch('/api/github-queue')
  if (!res.ok) return
  const { issues, prs } = await res.json() as { issues: GithubItem[]; prs: GithubItem[] }

  const [issueItems, prItems] = [issues ?? [], prs ?? []]

  const items: Array<{ item: GithubItem; type: 'issue' | 'pr_review' }> = [
    ...issueItems.map(i => ({ item: i, type: 'issue' as const })),
    ...prItems.map(i => ({ item: i, type: 'pr_review' as const })),
  ]

  for (const { item, type } of items) {
    const repo = repoFromUrl(item.repository_url)
    const remoteId = `${repo}#${item.number}`

    const existing = await db.tasks.where('remoteId').equals(remoteId).first()

    if (existing) {
      if (item.state === 'closed' && existing.status !== 'done') {
        await db.tasks.update(existing.id!, { status: 'done', updatedAt: new Date().toISOString() })
      } else {
        await db.tasks.update(existing.id!, { title: item.title, updatedAt: new Date().toISOString() })
      }
    } else {
      const now = new Date().toISOString()
      const task: Omit<Task, 'id'> = {
        title: item.title,
        status: 'todo',
        priority: 'medium',
        source: 'github',
        githubRepo: repo,
        githubNumber: item.number,
        githubType: type,
        queuedForClaude: false,
        preferredModel: 'claude',
        remoteId,
        createdAt: now,
        updatedAt: now,
      }
      const id = await db.tasks.add(task as Task)
      const saved = await db.tasks.get(id)
      if (saved && userId) pushTask(saved, userId)
    }
  }
}
