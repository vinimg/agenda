# GitHub Work Queue — PWA Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Integrar issues e PRs do GitHub na agenda PWA — sync on-load, seção GitHub na TasksPage com seletor de modelo, e token dashboard na SettingsPage.

**Architecture:** GitHub REST API é chamada no boot do app e os resultados são upsertados no Dexie (local) e Supabase (remoto) usando a infra de sync já existente. Novos campos opcionais são adicionados ao modelo Task sem breaking change. Token usage é buscado das APIs dos provedores e exibido em Settings.

**Tech Stack:** React 18, TypeScript, Dexie 4, Zustand, Supabase, GitHub REST API v3, TailwindCSS

---

## Mapa de arquivos

| Arquivo | Ação | Responsabilidade |
|---|---|---|
| `src/models/index.ts` | Modificar | Adicionar campos GitHub + preferredModel ao Task |
| `src/db/index.ts` | Modificar | Dexie v4 com novos índices |
| `src/services/githubSync.ts` | Criar | Fetch issues/PRs do GitHub → upsert Dexie |
| `src/services/tokenUsage.ts` | Criar | Fetch uso de tokens de cada provedor |
| `src/services/sync.ts` | Modificar | Incluir campos GitHub no push/pull Supabase |
| `src/App.tsx` | Modificar | Chamar syncGithubTasks no boot |
| `src/components/tasks/GithubTaskBadge.tsx` | Criar | Badge GH + seletor de modelo |
| `src/pages/TasksPage.tsx` | Modificar | Seção "GitHub" separada das tarefas manuais |
| `src/components/settings/TokenDashboard.tsx` | Criar | Widget de uso de tokens por modelo |
| `src/pages/SettingsPage.tsx` | Modificar | Adicionar TokenDashboard + config modelo padrão |
| `.env.example` | Modificar | Documentar VITE_GITHUB_TOKEN e chaves dos provedores |

---

## Task 1: Estender o modelo Task e migrar Dexie

**Files:**
- Modify: `src/models/index.ts`
- Modify: `src/db/index.ts`

- [ ] **Step 1: Adicionar campos ao interface Task em `src/models/index.ts`**

Após o campo `remoteId?: string`, adicionar:

```ts
  // GitHub integration
  source?: 'manual' | 'github'
  githubRepo?: string
  githubNumber?: number
  githubType?: 'issue' | 'pr_review'
  queuedForClaude?: boolean
  preferredModel?: 'claude' | 'codex' | 'gemini'
```

- [ ] **Step 2: Adicionar versão 4 ao Dexie em `src/db/index.ts`**

Após o bloco `this.version(3).stores({...})`, adicionar:

```ts
    this.version(4).stores({
      tasks:        '++id, status, priority, urgency, difficulty, dueDate, scheduledDate, habitId, *tags, source, queuedForClaude',
      habits:       '++id, isActive, startDate, parentHabitId, attribute',
      habitEntries: '++id, habitId, date, status, [habitId+date]',
    })
```

- [ ] **Step 3: Verificar que o app ainda compila**

```bash
cd /home/vini/try2 && npm run build 2>&1 | tail -5
```

Esperado: `✓ built in` sem erros TypeScript.

- [ ] **Step 4: Commit**

```bash
cd /home/vini/try2
git add src/models/index.ts src/db/index.ts
git commit -m "feat(model): add GitHub task fields and Dexie v4 migration"
```

---

## Task 2: Supabase migration + sync.ts

**Files:**
- Modify: `src/services/sync.ts`

- [ ] **Step 1: Rodar migration SQL no Supabase**

No Supabase Dashboard → SQL Editor, executar:

```sql
ALTER TABLE tasks
  ADD COLUMN IF NOT EXISTS source text DEFAULT 'manual',
  ADD COLUMN IF NOT EXISTS github_repo text,
  ADD COLUMN IF NOT EXISTS github_number integer,
  ADD COLUMN IF NOT EXISTS github_type text,
  ADD COLUMN IF NOT EXISTS queued_for_claude boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS preferred_model text DEFAULT 'claude';

CREATE TABLE IF NOT EXISTS token_usage (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users ON DELETE CASCADE,
  model text NOT NULL,
  task_remote_id text,
  tokens_used integer,
  cost_usd numeric(10,6),
  executed_at timestamptz DEFAULT now()
);

ALTER TABLE token_usage ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users see own usage" ON token_usage
  FOR ALL USING (auth.uid() = user_id);
```

- [ ] **Step 2: Atualizar `pushTask` em `src/services/sync.ts`**

No objeto passado ao `supabase.from('tasks').upsert({...})`, adicionar após `completed_at: task.completedAt,`:

```ts
      source: task.source ?? 'manual',
      github_repo: task.githubRepo ?? null,
      github_number: task.githubNumber ?? null,
      github_type: task.githubType ?? null,
      queued_for_claude: task.queuedForClaude ?? false,
      preferred_model: task.preferredModel ?? 'claude',
```

- [ ] **Step 3: Atualizar `pullFromSupabase` em `src/services/sync.ts`**

No bloco de mapeamento `const t: Task = {...}`, adicionar após `remoteId: r.id,`:

```ts
        source: r.source ?? 'manual',
        githubRepo: r.github_repo ?? undefined,
        githubNumber: r.github_number ?? undefined,
        githubType: r.github_type ?? undefined,
        queuedForClaude: r.queued_for_claude ?? false,
        preferredModel: r.preferred_model ?? 'claude',
```

- [ ] **Step 4: Verificar build**

```bash
cd /home/vini/try2 && npm run build 2>&1 | tail -5
```

Esperado: sem erros.

- [ ] **Step 5: Commit**

```bash
cd /home/vini/try2
git add src/services/sync.ts
git commit -m "feat(sync): include GitHub fields in Supabase push/pull"
```

---

## Task 3: Serviço de sync GitHub

**Files:**
- Create: `src/services/githubSync.ts`
- Modify: `.env.example`
- Modify: `src/App.tsx`

- [ ] **Step 1: Adicionar variável ao `.env.example`**

Adicionar ao final do arquivo:

```
VITE_GITHUB_TOKEN=ghp_your_token_here
VITE_GITHUB_USERNAME=vinimg
VITE_ANTHROPIC_KEY=sk-ant-your_key
VITE_OPENAI_KEY=sk-your_key
VITE_GOOGLE_KEY=your_google_key
```

- [ ] **Step 2: Criar `src/services/githubSync.ts`**

```ts
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
  // "https://api.github.com/repos/FMurad00/well-abandonment-..." → "FMurad00/well-..."
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

    // dedup: find by remoteId
    const existing = await db.tasks.where('remoteId').equals(remoteId).first()

    if (existing) {
      // issue fechada no GitHub → marca done
      if (item.state === 'closed' && existing.status !== 'done') {
        await db.tasks.update(existing.id!, { status: 'done', updatedAt: new Date().toISOString() })
      } else {
        // atualiza título, preserva queuedForClaude e preferredModel
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
```

- [ ] **Step 3: Chamar `syncGithubTasks` no boot em `src/App.tsx`**

Adicionar import no topo, junto aos outros imports de services:

```ts
import { syncGithubTasks } from '@/services/githubSync'
```

Adicionar após o `useEffect` existente que chama `pullFromSupabase`:

```ts
  useEffect(() => {
    if (user) syncGithubTasks(user.id)
  }, [user?.id])
```

- [ ] **Step 4: Verificar build**

```bash
cd /home/vini/try2 && npm run build 2>&1 | tail -5
```

Esperado: sem erros TypeScript.

- [ ] **Step 5: Smoke test manual**

Adicionar `VITE_GITHUB_TOKEN` e `VITE_GITHUB_USERNAME` ao `.env` local, rodar `npm run dev`, abrir o app e verificar na aba Network que a chamada `api.github.com/search/issues` retorna 200 e que novas tarefas aparecem com `source: 'github'` no IndexedDB (DevTools → Application → IndexedDB → AgendaDB → tasks).

- [ ] **Step 6: Commit**

```bash
cd /home/vini/try2
git add src/services/githubSync.ts src/App.tsx .env.example
git commit -m "feat(github): sync open issues and PRs assigned to user on app load"
```

---

## Task 4: UI — GithubTaskBadge + seção GitHub na TasksPage

**Files:**
- Create: `src/components/tasks/GithubTaskBadge.tsx`
- Modify: `src/pages/TasksPage.tsx`
- Modify: `src/store/taskStore.ts`

- [ ] **Step 1: Criar `src/components/tasks/GithubTaskBadge.tsx`**

```tsx
import { ExternalLink } from 'lucide-react'
import type { Task } from '@/models'
import { useTaskStore } from '@/store/taskStore'

const MODEL_OPTIONS = [
  { value: 'claude', label: 'Claude', color: '#1d9bf0' },
  { value: 'codex',  label: 'Codex',  color: '#7856ff' },
  { value: 'gemini', label: 'Gemini', color: '#ffad1f' },
] as const

interface Props { task: Task }

export function GithubTaskBadge({ task }: Props) {
  const { update } = useTaskStore()
  if (task.source !== 'github' || !task.githubRepo || !task.githubNumber) return null

  const ghUrl = `https://github.com/${task.githubRepo}/${task.githubType === 'issue' ? 'issues' : 'pull'}/${task.githubNumber}`
  const model = task.preferredModel ?? 'claude'
  const isQueued = task.queuedForClaude ?? false

  function toggleQueue(m: 'claude' | 'codex' | 'gemini') {
    if (isQueued && model === m) {
      update(task.id!, { queuedForClaude: false })
    } else {
      update(task.id!, { queuedForClaude: true, preferredModel: m })
    }
  }

  return (
    <div className="flex items-center gap-2 mt-2 flex-wrap">
      <a
        href={ghUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-1 px-2 py-0.5 rounded-full border border-[#2f3336] text-[#71767b] text-[10px] hover:border-[#71767b] transition-colors"
      >
        <span className="font-mono">GH #{task.githubNumber}</span>
        <ExternalLink size={9} />
      </a>

      <span className="text-[#536471] text-[10px]">Resolver com:</span>

      {MODEL_OPTIONS.map(opt => {
        const active = isQueued && model === opt.value
        return (
          <button
            key={opt.value}
            onClick={() => toggleQueue(opt.value as 'claude' | 'codex' | 'gemini')}
            className="px-2 py-0.5 rounded-full text-[10px] font-semibold border transition-colors"
            style={{
              borderColor: active ? opt.color : '#2f3336',
              color: active ? opt.color : '#536471',
              backgroundColor: active ? opt.color + '18' : 'transparent',
            }}
          >
            {opt.label}
          </button>
        )
      })}
    </div>
  )
}
```

- [ ] **Step 2: Adicionar seção GitHub à TasksPage**

No `src/pages/TasksPage.tsx`, após os imports existentes adicionar:

```ts
import { GithubTaskBadge } from '@/components/tasks/GithubTaskBadge'
```

Após a linha `const done = tasks.filter(t => t.status === 'done')`, adicionar:

```ts
  const githubTasks = activeTasks.filter(t => t.source === 'github')
  const manualTasks = activeTasks.filter(t => t.source !== 'github')
  const queued = githubTasks.filter(t => t.queuedForClaude)
```

Dentro do `return(...)`, antes das seções existentes (`doFirst`, `quickWin` etc.), adicionar:

```tsx
      {githubTasks.length > 0 && (
        <section className="mb-6">
          <div className="flex items-center gap-2 mb-2 px-1">
            <span className="text-xs font-mono bg-[#2f3336] text-[#71767b] px-1.5 py-0.5 rounded">GH</span>
            <h2 className="text-[#e7e9ea] text-sm font-semibold uppercase tracking-wider">GitHub</h2>
            <span className="text-[#71767b] text-xs">{githubTasks.length} abertos</span>
            {queued.length > 0 && (
              <span className="ml-auto text-[10px] px-2 py-0.5 rounded-full bg-[#1d9bf018] border border-[#1d9bf030] text-[#1d9bf0]">
                {queued.length} na fila
              </span>
            )}
          </div>
          <div className="divide-y divide-[#2f3336] border border-[#2f3336] rounded-xl overflow-hidden">
            {githubTasks.map(task => (
              <div key={task.id} className="px-4 py-3">
                <TaskItem task={task} />
                <GithubTaskBadge task={task} />
              </div>
            ))}
          </div>
        </section>
      )}
```

E substituir `activeTasks` pelo `manualTasks` nos filtros de `doFirst`, `quickWin`, `schedule`, `fillLater`:

```ts
  const doFirst  = manualTasks.filter(t => scoreTask(t).category === 'do-first')
  const quickWin = manualTasks.filter(t => scoreTask(t).category === 'quick-win')
  const schedule = manualTasks.filter(t => scoreTask(t).category === 'schedule')
  const fillLater = manualTasks.filter(t => scoreTask(t).category === 'fill-later')
```

- [ ] **Step 3: Verificar build**

```bash
cd /home/vini/try2 && npm run build 2>&1 | tail -5
```

Esperado: sem erros.

- [ ] **Step 4: Commit**

```bash
cd /home/vini/try2
git add src/components/tasks/GithubTaskBadge.tsx src/pages/TasksPage.tsx
git commit -m "feat(ui): add GitHub task section with model selector to TasksPage"
```

---

## Task 5: Token usage service + TokenDashboard

**Files:**
- Create: `src/services/tokenUsage.ts`
- Create: `src/components/settings/TokenDashboard.tsx`
- Modify: `src/pages/SettingsPage.tsx`

- [ ] **Step 1: Criar `src/services/tokenUsage.ts`**

```ts
export interface ModelUsage {
  model: 'claude' | 'codex' | 'gemini'
  label: string
  color: string
  tokensUsed: number | null
  costUsd: number | null
  error?: string
}

async function fetchAnthropicUsage(): Promise<Pick<ModelUsage, 'tokensUsed' | 'costUsd' | 'error'>> {
  // Anthropic não expõe API pública de usage — retorna null com aviso
  return { tokensUsed: null, costUsd: null, error: 'Verifique em console.anthropic.com' }
}

async function fetchOpenAIUsage(): Promise<Pick<ModelUsage, 'tokensUsed' | 'costUsd' | 'error'>> {
  const key = import.meta.env.VITE_OPENAI_KEY as string
  if (!key) return { tokensUsed: null, costUsd: null, error: 'VITE_OPENAI_KEY não configurada' }
  try {
    const date = new Date().toISOString().slice(0, 10).replace(/-/g, '-')
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
  // Google Cloud Billing API requer OAuth — retorna null com aviso
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
```

- [ ] **Step 2: Criar `src/components/settings/TokenDashboard.tsx`**

```tsx
import { useEffect, useState } from 'react'
import { fetchAllUsage, type ModelUsage } from '@/services/tokenUsage'

export function TokenDashboard() {
  const [usage, setUsage] = useState<ModelUsage[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAllUsage().then(u => { setUsage(u); setLoading(false) })
  }, [])

  if (loading) {
    return (
      <div className="border border-[#2f3336] rounded-xl p-4 mb-4">
        <p className="text-[#71767b] text-xs mb-3 uppercase tracking-wider">Uso de tokens</p>
        <div className="space-y-2">
          {[1, 2, 3].map(i => <div key={i} className="h-8 bg-[#2f3336] rounded animate-pulse" />)}
        </div>
      </div>
    )
  }

  return (
    <div className="border border-[#2f3336] rounded-xl p-4 mb-4">
      <p className="text-[#71767b] text-xs mb-3 uppercase tracking-wider">Uso de tokens</p>
      <div className="space-y-3">
        {usage.map(u => (
          <div key={u.model}>
            <div className="flex justify-between items-center mb-1">
              <span className="text-sm font-semibold" style={{ color: u.color }}>{u.label}</span>
              {u.error ? (
                <span className="text-[#536471] text-[10px]">{u.error}</span>
              ) : (
                <span className="text-[#e7e9ea] text-xs">
                  {u.tokensUsed !== null ? `${u.tokensUsed.toLocaleString()} tokens` : '—'}
                  {u.costUsd !== null ? ` · $${u.costUsd.toFixed(4)}` : ''}
                </span>
              )}
            </div>
            <div className="h-1.5 bg-[#2f3336] rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: u.tokensUsed ? `${Math.min((u.tokensUsed / 1_000_000) * 100, 100)}%` : '0%',
                  backgroundColor: u.color,
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Adicionar TokenDashboard à SettingsPage**

No `src/pages/SettingsPage.tsx`, adicionar import:

```ts
import { TokenDashboard } from '@/components/settings/TokenDashboard'
```

Adicionar `<TokenDashboard />` antes do bloco existente de "Supabase sync":

```tsx
      <TokenDashboard />

      <div className="border border-[#2f3336] rounded-xl p-4 text-[#71767b] text-sm">
```

- [ ] **Step 4: Verificar build**

```bash
cd /home/vini/try2 && npm run build 2>&1 | tail -5
```

Esperado: sem erros.

- [ ] **Step 5: Commit**

```bash
cd /home/vini/try2
git add src/services/tokenUsage.ts src/components/settings/TokenDashboard.tsx src/pages/SettingsPage.tsx
git commit -m "feat(settings): add token usage dashboard for Claude, Codex and Gemini"
```

---

## Self-review

**Cobertura do spec:**
- ✅ Task 1: modelo de dados + Dexie v4
- ✅ Task 2: Supabase migration + sync
- ✅ Task 3: sync GitHub on-load
- ✅ Task 4: UI — badge GH + seletor de modelo + seção na TasksPage
- ✅ Task 5: token usage + dashboard
- ⚠️ Anthropic e Google não têm API pública de usage acessível via browser — documentado no código com fallback

**Consistência de tipos:**
- `preferredModel?: 'claude' | 'codex' | 'gemini'` definido em Task (Task 1) e usado no GithubTaskBadge (Task 4) ✅
- `source?: 'manual' | 'github'` consistente em todos os pontos ✅
- `pushTask` e `pullFromSupabase` usam os mesmos nomes de campo snake_case ✅

**Sem placeholders:** código completo em todos os steps ✅
