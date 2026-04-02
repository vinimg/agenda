import type { VercelRequest, VercelResponse } from '@vercel/node'

const GH_TOKEN = process.env.GITHUB_TOKEN as string
const GH_USER  = process.env.GITHUB_USERNAME as string

interface GithubItem {
  number: number
  title: string
  state: string
  pull_request?: unknown
  repository_url: string
}

async function fetchGithub(query: string): Promise<GithubItem[]> {
  const url = `https://api.github.com/search/issues?q=${encodeURIComponent(query)}&per_page=50`
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${GH_TOKEN}`, Accept: 'application/vnd.github+json' },
  })
  if (!res.ok) return []
  const data = await res.json() as { items?: GithubItem[] }
  return data.items ?? []
}

export default async function handler(_req: VercelRequest, res: VercelResponse) {
  if (!GH_TOKEN || !GH_USER) {
    return res.status(500).json({ error: 'GITHUB_TOKEN or GITHUB_USERNAME not configured' })
  }

  const [issues, prs] = await Promise.all([
    fetchGithub(`assignee:${GH_USER} type:issue state:open`),
    fetchGithub(`author:${GH_USER} type:pr state:open`),
  ])

  res.status(200).json({ issues, prs })
}
