#!/usr/bin/env bash
# Busca tasks com queued_for_claude=true do Supabase
# Uso: ./fetch-queue.sh [update <remote_id>]  ← segundo arg limpa a flag
set -euo pipefail

SUPABASE_URL="${VITE_SUPABASE_URL:-${SUPABASE_URL:-}}"
SUPABASE_KEY="${VITE_SUPABASE_ANON_KEY:-${SUPABASE_KEY:-}}"

if [[ -z "$SUPABASE_URL" || -z "$SUPABASE_KEY" ]]; then
  echo "ERROR: SUPABASE_URL e SUPABASE_KEY precisam estar no ambiente" >&2
  exit 1
fi

if [[ "$1" == "update" && -n "${2:-}" ]]; then
  # Validate ID to prevent query-string injection
  if [[ ! "${2}" =~ ^[a-zA-Z0-9_-]+$ ]]; then
    echo "ERROR: remote_id invalido: ${2}" >&2
    exit 1
  fi
  # Limpa a flag após execução
  curl -sf --max-time 10 -X PATCH \
    "${SUPABASE_URL}/rest/v1/tasks?id=eq.${2}" \
    -H "apikey: ${SUPABASE_KEY}" \
    -H "Authorization: Bearer ${SUPABASE_KEY}" \
    -H "Content-Type: application/json" \
    -d '{"queued_for_claude": false}' > /dev/null
  echo "OK: flag limpa para task ${2}"
  exit 0
fi

# Lista tarefas na fila
curl -sf --max-time 10 \
  "${SUPABASE_URL}/rest/v1/tasks?queued_for_claude=eq.true&status=neq.done&select=id,title,github_repo,github_number,github_type,preferred_model" \
  -H "apikey: ${SUPABASE_KEY}" \
  -H "Authorization: Bearer ${SUPABASE_KEY}"
