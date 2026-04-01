# GitHub Work Queue — Design Spec

**Data:** 2026-04-01
**Status:** Aprovado

## Objetivo

Integrar issues e PRs do GitHub na agenda PWA para que o usuário escolha quais resolver, e invocar o Claude Code para executar o trabalho de forma autônoma, pedindo aprovação apenas no push final.

---

## Arquitetura

Três componentes conectados pelo Supabase como camada de estado compartilhado:

```
GitHub API
    ↓ (sync on app load)
PWA (Dexie + Supabase)
    ↓ (queuedForClaude = true)
Claude Code skill /work-queue
    ↓ (SSH → mindsim-wsl)
Git push (com aprovação do usuário)
```

---

## Seção 1 — Modelo de dados

### Extensão do `Task` (src/models/index.ts)

Campos opcionais adicionados ao interface existente — sem breaking change:

```ts
source?: 'manual' | 'github'
githubRepo?: string       // ex: "FMurad00/well-abandonment-diagnostic-prediction-api"
githubNumber?: number     // número da issue ou PR
githubType?: 'issue' | 'pr_review'
queuedForClaude?: boolean // true = usuário quer que Claude resolva
```

### Dexie (src/db/index.ts)

Nova versão v4 adicionando índices:

```ts
tasks: '++id, status, priority, urgency, difficulty, dueDate, scheduledDate, habitId, *tags, source, queuedForClaude'
```

### Supabase

Mesmas colunas adicionadas à tabela `tasks`:

```sql
ALTER TABLE tasks
  ADD COLUMN source text DEFAULT 'manual',
  ADD COLUMN github_repo text,
  ADD COLUMN github_number integer,
  ADD COLUMN github_type text,
  ADD COLUMN queued_for_claude boolean DEFAULT false;
```

---

## Seção 2 — Sync GitHub → PWA

### Trigger

`syncGithubTasks(userId)` chamado em `App.tsx` junto com `pullFromSupabase`, uma vez por sessão ao carregar.

### Fonte de dados

```
gh issue list --assignee @me --state open --json number,title,url,repository (todos os repos da org)
gh pr list --author @me --state open --json number,title,url,repository,reviewRequests (PRs com review pendente)
```

Token GitHub lido da variável de ambiente `VITE_GITHUB_TOKEN`.

### Regras de upsert

- Dedup por `(githubRepo, githubNumber)` — nunca duplica
- Se já existe localmente: atualiza `title`, preserva `queuedForClaude`
- Se issue/PR foi fechada no GitHub: seta `status: 'done'` automaticamente
- `source: 'github'`, `remoteId: "{repo}#{number}"`

### UI na TasksPage

- Tarefas GitHub exibem badge `GH` com link para o repo
- Botão **"Resolver com Claude"** no detalhe da tarefa → seta `queuedForClaude: true` e sincroniza com Supabase
- Seção visual separada "GitHub" dentro da TasksPage para não misturar com tarefas manuais

---

## Seção 3 — Skill `/work-queue`

### Localização

`.claude/skills/work-queue/SKILL.md`

### Invocação

`/work-queue` ou linguagem natural: "resolve minhas tarefas", "trabalha na fila"

### Fluxo de execução

```
1. Busca Supabase → tasks onde queued_for_claude = true, status != 'done'
2. Exibe lista consolidada com repo e tipo
3. Para cada tarefa (em série):
   a. gh issue view N --repo <repo> OU gh pr view N + review comments
   b. SSH mindsim-wsl → checkout branch correta
      - Issue: criar branch fix/issue-{N}-slug a partir de develop
      - PR review: checkout da branch existente da PR
   c. Implementa a solução (usa contexto do issue/review comment)
   d. Executa testes unitários (mvn test ou equivalente do repo)
   e. Se testes passam:
      → mostra diff resumido
      → pergunta: "push issue #N no repo X? (s/n)"
   f. Se aprovado: git push + gh pr create/update
   g. Seta queued_for_claude = false no Supabase
4. Resumo final: resolvidas / bloqueadas / aguardando testes manuais
```

### Tratamento de bloqueios

- Testes falhando → explica o erro, pula para próxima tarefa, reporta no resumo final
- Implementação ambígua (múltiplas interpretações do issue) → pausa e pergunta antes de continuar
- Tarefa que requer DB → implementa, avisa no resumo que precisa de validação manual

---

## Seção 4 — Visibilidade de tokens e seleção de modelo

### Token Dashboard (PWA)

Exibido na tela Settings e como widget colapsável na Today page. Busca dados ao carregar o app em paralelo:

| Provedor | Endpoint |
|---|---|
| Anthropic (Claude) | `GET https://api.anthropic.com/v1/usage` ⚠️ verificar disponibilidade na implementação |
| OpenAI (Codex) | `GET https://api.openai.com/v1/usage?date=YYYY-MM` |
| Google (Gemini) | Cloud Billing API |

Chaves de API armazenadas em `.env` (`VITE_ANTHROPIC_KEY`, `VITE_OPENAI_KEY`, `VITE_GOOGLE_KEY`) — nunca no Supabase.

Para cada modelo exibe:
- Tokens usados no mês atual
- Custo estimado em USD
- Barra de progresso contra budget mensal configurável nas Settings (`monthlyBudgetUSD` por modelo)
- Alerta visual quando ultrapassar 80% do budget

### Seleção de modelo por tarefa

Botão "Resolver com Claude" vira um seletor ao toque:

```
Resolver com:  [ Claude ]  [ Codex ]  [ Gemini ]
```

Campo adicionado ao modelo `Task`:

```ts
preferredModel?: 'claude' | 'codex' | 'gemini'  // default: 'claude'
```

Settings permite configurar o modelo padrão global.

### Roteamento no work-queue skill

```
preferredModel = 'claude'  → executa diretamente (fluxo SSH + implementação)
preferredModel = 'codex'   → delega via /codex:rescue com contexto da issue/PR
preferredModel = 'gemini'  → delega via gemini-agent com contexto
```

Ao concluir cada tarefa, o skill registra no Supabase:

```sql
-- nova tabela
CREATE TABLE token_usage (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users,
  model text,           -- 'claude' | 'codex' | 'gemini'
  task_remote_id text,  -- "{repo}#{number}"
  tokens_used integer,
  cost_usd numeric(10,6),
  executed_at timestamptz DEFAULT now()
);
```

---

## Fora do escopo

- Sync automático em background (cron/webhook) — on-demand only
- Criação de issues pelo PWA
- Execução paralela de tarefas — sempre em série para manter controle
