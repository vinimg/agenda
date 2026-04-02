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

If `VITE_SUPABASE_URL` is empty after sourcing, stop with: "ERROR: VITE_SUPABASE_URL não encontrado em ~/.env"

Parse the JSON array. Each object has fields: `id`, `title`, `github_repo`, `github_number`, `github_type`, `preferred_model`.
Store the `id` field as `<SUPABASE_TASK_ID>` — it will be used later to clear the flag.

If the array is empty, reply: "Nenhuma tarefa na fila. Marque tarefas no app com 'Resolver com Claude'." and stop.

Otherwise display:
```
N tarefa(s) na fila:
  1. #<github_number> <title> (<github_repo last segment>) — modelo: <preferred_model>
  2. ...
```

## Step 2 — Execute each task

For each task in the queue, in series:

### 2a — Read context

```bash
ssh mindsim-wsl "cd /mnt/c/Users/fmuradmindsimcombr/Desktop/mindsim/<REPO_NAME> && \
  gh <issue|pr> view <NUMBER> --comments 2>&1 | head -150"
```

- `<REPO_NAME>` = last segment of `github_repo` (e.g. `well-abandonment-diagnostic-prediction-api`)
- `<issue|pr>` = `issue` if `github_type = 'issue'`, else `pr`

If SSH fails (connection refused, timeout), mark task as ❌ blocked in summary and move to next task.

### 2b — Checkout branch

For `github_type = 'issue'`:

`<slug>` = issue title in lowercase, spaces replaced with hyphens, truncated to 30 chars, non-alphanumeric removed (e.g. "Fix null pointer in API" → `fix-null-pointer-in-api`).

```bash
ssh mindsim-wsl "cd /mnt/c/Users/fmuradmindsimcombr/Desktop/mindsim/<REPO_NAME> && \
  git fetch origin && \
  (git checkout -b fix/issue-<NUMBER>-<slug> origin/develop 2>/dev/null || \
   git checkout fix/issue-<NUMBER>-<slug>)"
```

For `github_type = 'pr_review'`:
```bash
ssh mindsim-wsl "cd /mnt/c/Users/fmuradmindsimcombr/Desktop/mindsim/<REPO_NAME> && \
  gh pr checkout <NUMBER>"
```

### 2c — Implement

Route by `preferred_model`:

**claude:** Implement directly using SSH tools. Read relevant files, make changes via SSH, stage and commit:
```bash
ssh mindsim-wsl "cd /mnt/c/Users/fmuradmindsimcombr/Desktop/mindsim/<REPO_NAME> && \
  git add -p && git commit -m 'fix(<scope>): <title> — closes #<NUMBER>'"
```
`<scope>` = repo name abbreviation (e.g. `well-abandonment` → `well`, `gateway` → `gateway`).

**codex:** Build a focused prompt with the issue/PR context and delegate:
```
/codex:rescue Resolve issue #<NUMBER> in <repo>: <title>. Branch is already checked out on mindsim-wsl at /mnt/c/Users/fmuradmindsimcombr/Desktop/mindsim/<REPO_NAME>. <full issue body>
```

**gemini:** Delegate to gemini-agent with full repo context:
```
Agent tool with subagent_type=cc-gemini-plugin:gemini-agent:
"Resolve issue #<NUMBER> in <repo>: <title>. <full issue body>. The branch is checked out on mindsim-wsl at /mnt/c/Users/fmuradmindsimcombr/Desktop/mindsim/<REPO_NAME>. Commit the changes."
```

### 2d — Run tests

Detect build system:
```bash
ssh mindsim-wsl "ls /mnt/c/Users/fmuradmindsimcombr/Desktop/mindsim/<REPO_NAME>/pom.xml /mnt/c/Users/fmuradmindsimcombr/Desktop/mindsim/<REPO_NAME>/package.json 2>/dev/null"
```

- If `pom.xml` exists: `./mvnw test --no-transfer-progress 2>&1 | tail -30`
- If `package.json` exists: `npm test 2>&1 | tail -30`
- Otherwise: skip tests with a note in the summary.

Run via SSH:
```bash
ssh mindsim-wsl "cd /mnt/c/Users/fmuradmindsimcombr/Desktop/mindsim/<REPO_NAME> && \
  <test-command>"
```

If tests fail: report the error, mark task as ❌ blocked in the summary, and move to the next task. Do NOT push.

### 2e — Show diff and ask for push approval

```bash
ssh mindsim-wsl "cd /mnt/c/Users/fmuradmindsimcombr/Desktop/mindsim/<REPO_NAME> && \
  git diff origin/develop...HEAD --stat"
```

Then ask: **"Push #<NUMBER> <title> (<REPO_NAME>)? (s/n)"**

If **s**:
```bash
ssh mindsim-wsl "cd /mnt/c/Users/fmuradmindsimcombr/Desktop/mindsim/<REPO_NAME> && \
  git push origin HEAD 2>&1"
```

For `github_type = 'issue'` only — open a new PR:
```bash
ssh mindsim-wsl "cd /mnt/c/Users/fmuradmindsimcombr/Desktop/mindsim/<REPO_NAME> && \
  gh pr create --title 'fix(<scope>): <title>' \
    --body $'## O que\n<one-line summary of change>\n\n## Por que\nCloses #<NUMBER>' \
    --base develop 2>&1"
```

For `github_type = 'pr_review'` — the PR already exists, just push. Do NOT run `gh pr create`.

Then clear the Supabase flag using the `id` stored in Step 1 (the script accepts `update <id>` as args):
```bash
source ~/.env 2>/dev/null || true
SUPABASE_URL=$VITE_SUPABASE_URL SUPABASE_KEY=$VITE_SUPABASE_ANON_KEY \
  /home/vini/try2/.claude/skills/work-queue/fetch-queue.sh update <SUPABASE_TASK_ID>
```

If **n**: skip push, keep `queuedForClaude = true`, note in summary as ⏭️.

## Step 3 — Summary

After all tasks:

```
Resumo:
  ✅ #10 <repo> — PR aberta
  ✅ #14 <repo> — PR atualizada (pr_review)
  ⏭️ #12 <repo> — aguarda push manual
  ❌ #11 <repo> — testes falhando: <erro resumido>
```

Tasks that need manual DB testing: flag them explicitly with "⚠️ requer validação manual com banco".
