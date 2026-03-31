#!/bin/bash
# deploy.sh — validate locally, then push to production
# Usage: ./scripts/deploy.sh
# Requires: npx vercel login (once), plus VITE_SUPABASE_* vars in .env.production

set -e
cd "$(dirname "$0")/.."

echo "=== 1/4 Build ==="
npm run build

echo "=== 2/4 E2E tests ==="
npx playwright test --reporter=list

echo "=== 3/4 Type check ==="
npx tsc --noEmit

echo "=== 4/4 Deploy to Vercel ==="
npx vercel deploy --prod --yes

echo "✓ Deploy completo"
