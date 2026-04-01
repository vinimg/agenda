import { db } from '@/db'
import { pushTask } from '@/services/sync'
import type { Task } from '@/models'

const GH_TOKEN = import.meta.env.VITE_GITHUB_TOKEN as string
const GH_USER  = import.meta.env.VITE_GITHUB_USERNAME as string

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

async function fetchGithub(query: string): Promise<GithubItem[]> {
  if (!GH_TOKEN) return []
  const url = `https://api.github.com/search/issues?q=${encodeURIComponent(query)}&per_page=50`
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${GH_TOKEN}`, Accept: 'application/vnd.github+json' },
  })
  if (!res.ok) return []
  const data = await res.json()
  return data.items ?? []
}

export async function syncGithubTasks(userId: string): Promise<void> {
  if (!GH_TOKEN || !GH_USER) return

  const [issues, prs] = await Promise.all([
    fetchGithub(`assignee:${GH_USER} type:issue state:open`),
    fetchGithub(`author:${GH_USER} type:pr state:open`),
  ])

  const items: Array<{ item: GithubItem; type: 'issue' | 'pr_review' }> = [
    ...issues.map(i => ({ item: i, type: 'issue' as const })),
    ...prs.map(i => ({ item: i, type: 'pr_review' as const })),
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
      if (saved) pushTask(saved, userId)
    }
  }
}
