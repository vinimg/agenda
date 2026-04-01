# GitHub Work Queue — Claude Code Skill Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Criar a skill `/work-queue` que busca tarefas com `queuedForClaude = true` no Supabase, executa o trabalho em cada repo via SSH, e pede aprovação antes do push.

**Architecture:** SKILL.md define o protocolo que Claude segue ao ser invocado. A skill usa `gh` CLI (já configurado), SSH para `mindsim-wsl`, e delega para Codex ou Gemini conforme `preferredModel`. Supabase é consultado via `curl` com a service role key para ler/atualizar as tarefas da fila.

**Tech Stack:** Bash, `gh` CLI, SSH ControlMaster (`mindsim-wsl`), Supabase REST API, Codex companion script, Gemini agent

**Pré-requisito:** Plano 1 (PWA) deve estar deployado e com tarefas `queuedForClaude = true` no Supabase.

---

## Mapa de arquivos

| Arquivo | Ação | Responsabilidade |
|---|---|---|
| `.claude/skills/work-queue/SKILL.md` | Criar | Protocolo completo da skill |
| `.claude/skills/work-queue/fetch-queue.sh` | Criar | Script que busca fila no Supabase via curl |

---

## Task 1: Script fetch-queue.sh

**Files:**
- Create: `.claude/skills/work-queue/fetch-queue.sh`

- [ ] **Step 1: Criar `.claude/skills/work-queue/fetch-queue.sh`**

```bash
#!/usr/bin/env bash
# Busca tasks com queued_for_claude=true do Supabase
# Uso: ./fetch-queue.sh [update <remote_id>]  ← segundo arg limpa a flag

SUPABASE_URL="${VITE_SUPABASE_URL:-${SUPABASE_URL}}"
SUPABASE_KEY="${VITE_SUPABASE_ANON_KEY:-${SUPABASE_KEY}}"

if [[ -z "$SUPABASE_URL" || -z "$SUPABASE_KEY" ]]; then
  echo "ERROR: SUPABASE_URL e SUPABASE_KEY precisam estar no ambiente" >&2
  exit 1
fi

if [[ "$1" == "update" && -n "$2" ]]; then
  # Limpa a flag após execução
  curl -s -X PATCH \
    "${SUPABASE_URL}/rest/v1/tasks?id=eq.${2}" \
    -H "apikey: ${SUPABASE_KEY}" \
    -H "Authorization: Bearer ${SUPABASE_KEY}" \
    -H "Content-Type: application/json" \
    -d '{"queued_for_claude": false}' > /dev/null
  echo "OK: flag limpa para task ${2}"
  exit 0
fi

# Lista tarefas na fila
curl -s \
  "${SUPABASE_URL}/rest/v1/tasks?queued_for_claude=eq.true&status=neq.done&select=id,title,github_repo,github_number,github_type,preferred_model" \
  -H "apikey: ${SUPABASE_KEY}" \
  -H "Authorization: Bearer ${SUPABASE_KEY}"
```

- [ ] **Step 2: Tornar executável**

```bash
chmod +x /home/vini/try2/.claude/skills/work-queue/fetch-queue.sh
```

- [ ] **Step 3: Smoke test** (requer `.env` local com credenciais)

```bash
source /home/vini/try2/.env 2>/dev/null
SUPABASE_URL=$VITE_SUPABASE_URL SUPABASE_KEY=$VITE_SUPABASE_ANON_KEY \
  /home/vini/try2/.claude/skills/work-queue/fetch-queue.sh
```

Esperado: JSON array (pode estar vazio `[]` se não houver tarefas na fila).

- [ ] **Step 4: Commit**

```bash
cd /home/vini/try2
git add .claude/skills/work-queue/fetch-queue.sh
git commit -m "feat(skill): add fetch-queue.sh to read Supabase work queue"
```

---

## Task 2: SKILL.md — protocolo /work-queue

**Files:**
- Create: `.claude/skills/work-queue/SKILL.md`

- [ ] **Step 1: Criar `.claude/skills/work-queue/SKILL.md`**

```markdown
---
name: work-queue
description: Use when the user says "resolve minhas tarefas", "work on my queue", or invokes /work-queue. Fetches GitHub tasks marked queuedForClaude=true from Supabase and executes each one autonomously, asking for push approval per task.
---

# Work Queue

**Announce at start:** "Buscando tarefas na fila..."

## Step 1 — Fetch queue

Run:
```bash
source ~/.env 2>/dev/null || true
SUPABASE_URL=$VITE_SUPABASE_URL SUPABASE_KEY=$VITE_SUPABASE_ANON_KEY \
  /home/vini/try2/.claude/skills/work-queue/fetch-queue.sh
```

Parse the JSON. If the array is empty, reply: "Nenhuma tarefa na fila. Marque tarefas no app com 'Resolver com Claude'." and stop.

Otherwise display:
```
N tarefa(s) na fila:
  1. #<number> <title> (<repo>) — modelo: <preferredModel>
  2. ...
```

## Step 2 — Execute each task

For each task in the queue, in series:

### 2a — Read context

```bash
ssh mindsim-wsl "cd /mnt/c/Users/fmuradmindsimcombr/Desktop/mindsim/<REPO_NAME> && \
  gh <issue|pr> view <NUMBER> --comments 2>&1 | head -100"
```

Where `<REPO_NAME>` is the last segment of `github_repo` (e.g. `well-abandonment-diagnostic-prediction-api`).
Where `<issue|pr>` is `issue` if `github_type = 'issue'`, else `pr`.

### 2b — Checkout branch

For `github_type = 'issue'`:
```bash
ssh mindsim-wsl "cd /mnt/c/Users/fmuradmindsimcombr/Desktop/mindsim/<REPO_NAME> && \
  git fetch origin && \
  git checkout -b fix/issue-<NUMBER>-<slug> origin/develop 2>/dev/null || \
  git checkout fix/issue-<NUMBER>-<slug>"
```

For `github_type = 'pr_review'`:
```bash
ssh mindsim-wsl "cd /mnt/c/Users/fmuradmindsimcombr/Desktop/mindsim/<REPO_NAME> && \
  gh pr checkout <NUMBER>"
```

### 2c — Implement

Route by `preferredModel`:

**claude:** Implement directly using SSH tools. Read relevant files, make changes, run tests.

**codex:** Build a focused prompt with the issue/PR context and delegate:
```
/codex:rescue Resolve issue #<NUMBER> in <repo>: <title>. Branch is already checked out on mindsim-wsl at /mnt/c/Users/fmuradmindsimcombr/Desktop/mindsim/<REPO_NAME>. <full issue body>
```

**gemini:** Delegate to gemini-agent with full repo context:
```
Agent tool with subagent_type=cc-gemini-plugin:gemini-agent:
"Resolve issue #<NUMBER> in <repo>: <title>. <full issue body>. The branch is checked out on mindsim-wsl."
```

### 2d — Run tests

```bash
ssh mindsim-wsl "cd /mnt/c/Users/fmuradmindsimcombr/Desktop/mindsim/<REPO_NAME> && \
  ./mvnw test --no-transfer-progress 2>&1 | tail -20"
```

If tests fail: report the error, mark task as blocked in the summary, and move to the next task. Do NOT push.

### 2e — Show diff and ask for push approval

```bash
ssh mindsim-wsl "cd /mnt/c/Users/fmuradmindsimcombr/Desktop/mindsim/<REPO_NAME> && \
  git diff origin/develop...HEAD --stat"
```

Then ask: **"Push issue #<NUMBER> (<repo>)? (s/n)"**

If **s**:
```bash
ssh mindsim-wsl "cd /mnt/c/Users/fmuradmindsimcombr/Desktop/mindsim/<REPO_NAME> && \
  git push origin HEAD 2>&1"
# For issues: open PR
ssh mindsim-wsl "cd /mnt/c/Users/fmuradmindsimcombr/Desktop/mindsim/<REPO_NAME> && \
  gh pr create --title 'fix(<scope>): <title>' \
    --body $'## O que\n<summary>\n\n## Por que\nCloses #<NUMBER>' \
    --base develop 2>&1"
```

Then clear the flag:
```bash
source ~/.env 2>/dev/null || true
SUPABASE_URL=$VITE_SUPABASE_URL SUPABASE_KEY=$VITE_SUPABASE_ANON_KEY \
  /home/vini/try2/.claude/skills/work-queue/fetch-queue.sh update <SUPABASE_TASK_ID>
```

If **n**: skip push, keep `queuedForClaude = true`, note in summary.

## Step 3 — Summary

After all tasks:

```
Resumo:
  ✅ #10 well-abandonment — PR aberta
  ✅ #14 well-abandonment — PR atualizada
  ⏭️ #12 well-abandonment — aguarda push manual
  ❌ #11 well-abandonment — testes falhando: <erro resumido>
```

Tasks that need manual DB testing: flag them explicitly.
```

- [ ] **Step 2: Verificar que a skill é detectável**

```bash
ls /home/vini/try2/.claude/skills/work-queue/
```

Esperado: `SKILL.md  fetch-queue.sh`

- [ ] **Step 3: Commit**

```bash
cd /home/vini/try2
git add .claude/skills/work-queue/SKILL.md
git commit -m "feat(skill): add /work-queue skill for autonomous GitHub issue resolution"
```

---

## Self-review

**Cobertura do spec:**
- ✅ Busca Supabase (`queuedForClaude = true`) — fetch-queue.sh
- ✅ Roteamento por modelo (claude/codex/gemini) — SKILL.md Step 2c
- ✅ SSH para mindsim-wsl — comandos explícitos em 2a, 2b, 2d
- ✅ Testes antes do push — Step 2d com early-exit em falha
- ✅ Aprovação por tarefa — Step 2e
- ✅ Limpeza da flag após push — Step 2e
- ✅ Resumo final — Step 3
- ✅ Tasks que precisam de validação com DB — flagged no resumo

**Sem placeholders:** todos os comandos são executáveis com valores concretos ✅
