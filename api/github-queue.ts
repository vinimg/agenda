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
  if (!res.ok) {
    console.error('GitHub API error', res.status, await res.text())
    return []
  }
  const data = await res.json() as { items?: GithubItem[] }
  return data.items ?? []
}

export default async function handler(_req: VercelRequest, res: VercelResponse) {
  const hasToken = !!GH_TOKEN
  const hasUser = !!GH_USER

  if (!hasToken || !hasUser) {
    return res.status(500).json({ error: 'missing env vars', hasToken, hasUser })
  }

  const query = `assignee:${GH_USER} type:issue state:open`
  const url = `https://api.github.com/search/issues?q=${encodeURIComponent(query)}&per_page=5`
  const ghRes = await fetch(url, {
    headers: { Authorization: `Bearer ${GH_TOKEN}`, Accept: 'application/vnd.github+json' },
  })
  const status = ghRes.status
  const body = await ghRes.text()

  res.status(200).json({ debug: true, status, user: GH_USER, body: body.slice(0, 500) })
}
