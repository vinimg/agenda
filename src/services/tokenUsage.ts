export interface ModelUsage {
  model: 'claude' | 'codex' | 'gemini'
  label: string
  color: string
  tokensUsed: number | null
  costUsd: number | null
  error?: string
}

async function fetchAnthropicUsage(): Promise<Pick<ModelUsage, 'tokensUsed' | 'costUsd' | 'error'>> {
  return { tokensUsed: null, costUsd: null, error: 'Verifique em console.anthropic.com' }
}

async function fetchOpenAIUsage(): Promise<Pick<ModelUsage, 'tokensUsed' | 'costUsd' | 'error'>> {
  const key = import.meta.env.VITE_OPENAI_KEY as string
  if (!key) return { tokensUsed: null, costUsd: null, error: 'VITE_OPENAI_KEY não configurada' }
  try {
    const date = new Date().toISOString().slice(0, 10)
    const res = await fetch(`https://api.openai.com/v1/usage?date=${date}`, {
      headers: { Authorization: `Bearer ${key}` },
    })
    if (!res.ok) return { tokensUsed: null, costUsd: null, error: `HTTP ${res.status}` }
    const data = await res.json()
    const tokens = (data.data ?? []).reduce((acc: number, d: { n_context_tokens_total?: number }) => acc + (d.n_context_tokens_total ?? 0), 0)
    return { tokensUsed: tokens, costUsd: null }
  } catch (e) {
    return { tokensUsed: null, costUsd: null, error: String(e) }
  }
}

async function fetchGeminiUsage(): Promise<Pick<ModelUsage, 'tokensUsed' | 'costUsd' | 'error'>> {
  return { tokensUsed: null, costUsd: null, error: 'Verifique em console.cloud.google.com' }
}

export async function fetchAllUsage(): Promise<ModelUsage[]> {
  const [anthropic, openai, gemini] = await Promise.all([
    fetchAnthropicUsage(),
    fetchOpenAIUsage(),
    fetchGeminiUsage(),
  ])
  return [
    { model: 'claude', label: 'Claude',  color: '#1d9bf0', ...anthropic },
    { model: 'codex',  label: 'Codex',   color: '#7856ff', ...openai   },
    { model: 'gemini', label: 'Gemini',  color: '#ffad1f', ...gemini   },
  ]
}
