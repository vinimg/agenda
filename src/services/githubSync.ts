import { db } from '@/db'
import { supabase } from '@/lib/supabase'
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

async function pushGithubTask(task: Task, userId: string): Promise<void> {
  if (!supabase || !task.id || !task.githubRepo || !task.githubNumber) return
  const githubRemoteId = `${task.githubRepo}#${task.githubNumber}`
  try {
    const { data } = await supabase.from('tasks').upsert({
      user_id: userId,
      local_id: task.id,
      title: task.title,
      status: task.status,
      priority: task.priority,
      source: 'github',
      github_repo: task.githubRepo,
      github_number: task.githubNumber,
      github_type: task.githubType ?? null,
      github_remote_id: githubRemoteId,
      queued_for_claude: task.queuedForClaude ?? false,
      preferred_model: task.preferredModel ?? 'claude',
      created_at: task.createdAt,
      updated_at: task.updatedAt,
    }, { onConflict: 'user_id,github_remote_id' }).select('id').single()
    if (data?.id) await db.tasks.update(task.id, { remoteId: data.id })
  } catch { /* non-fatal */ }
}

export async function syncGithubTasks(userId: string | null): Promise<void> {
  const res = await fetch('/api/github-queue')
  if (!res.ok) return
  const { issues, prs } = await res.json() as { issues: GithubItem[]; prs: GithubItem[] }

  const items: Array<{ item: GithubItem; type: 'issue' | 'pr_review' }> = [
    ...(issues ?? []).map(i => ({ item: i, type: 'issue' as const })),
    ...(prs ?? []).map(i => ({ item: i, type: 'pr_review' as const })),
  ]

  for (const { item, type } of items) {
    const repo = repoFromUrl(item.repository_url)
    const remoteId = `${repo}#${item.number}`

    const existing = await db.tasks.where('remoteId').equals(remoteId).first()

    if (existing) {
      const patch: Partial<Task> = { title: item.title, updatedAt: new Date().toISOString() }
      if (item.state === 'closed' && existing.status !== 'done') patch.status = 'done'
      await db.tasks.update(existing.id!, patch)
      if (userId) await pushGithubTask({ ...existing, ...patch }, userId)
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
      if (userId) {
        const saved = await db.tasks.get(id)
        if (saved) await pushGithubTask(saved, userId)
      }
    }
  }
}
