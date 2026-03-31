#!/usr/bin/env bash
# Build + screenshot + copy to Windows Desktop

set -e

DESKTOP="/mnt/c/Users/vini/Desktop"
DEST="$DESKTOP/agenda"
CHROME="/mnt/c/Program Files/Google/Chrome/Application/chrome.exe"
SCREENSHOT="$DESKTOP/agenda-preview.png"

echo "→ Building..."
npm run build

echo "→ Copying dist to Windows Desktop..."
rm -rf "$DEST"
cp -r dist "$DEST"
echo "  Copied to: $DEST"

WSL_IP=$(hostname -I | awk '{print $1}')

echo "→ Starting preview server for screenshot..."
npx --yes serve dist -p 4322 --no-clipboard &
SERVER_PID=$!
sleep 2

echo "→ Taking screenshot (via WSL IP $WSL_IP)..."
"$CHROME" \
  --headless=new \
  --screenshot="$(wslpath -w "$SCREENSHOT")" \
  --window-size=1280,800 \
  --no-sandbox \
  --disable-gpu \
  "http://$WSL_IP:4322" 2>/dev/null

kill $SERVER_PID 2>/dev/null || true

echo "✓ Screenshot saved: $SCREENSHOT"
echo "✓ App files at: $DEST"
echo ""
echo "Open in browser: file:///C:/Users/vini/Desktop/agenda/index.html"
