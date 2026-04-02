import type { VercelRequest, VercelResponse } from '@vercel/node'

const SUPABASE_URL = process.env.VITE_SUPABASE_URL ?? ''
const SERVICE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY ?? ''

export default async function handler(_req: VercelRequest, res: VercelResponse) {
  if (!SUPABASE_URL || !SERVICE_KEY) {
    return res.status(500).json({ error: 'Supabase not configured' })
  }

  const url = `${SUPABASE_URL}/rest/v1/tasks?queued_for_claude=eq.true&select=id,title,github_repo,github_number,github_type,preferred_model,status`
  const response = await fetch(url, {
    headers: {
      apikey: SERVICE_KEY,
      Authorization: `Bearer ${SERVICE_KEY}`,
      'Content-Type': 'application/json',
    },
  })

  if (!response.ok) {
    return res.status(502).json({ error: `Supabase error: ${response.status}` })
  }

  const tasks = await response.json()
  res.status(200).json({ tasks })
}
