#!/usr/bin/env bash
# ForensicsMainHand 2.0 — Launcher
SOURCE="${BASH_SOURCE[0]}"
while [[ -L "$SOURCE" ]]; do
    DIR="$(cd "$(dirname "$SOURCE")" && pwd)"
    SOURCE="$(readlink "$SOURCE")"
    [[ "$SOURCE" != /* ]] && SOURCE="$DIR/$SOURCE"
done
SCRIPT_DIR="$(cd "$(dirname "$SOURCE")" && pwd)"
CYAN='\033[0;36m'
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${CYAN}"
echo "  ┌─────────────────────────────────────────┐"
echo "  │   ForensicsMainHand 2.0 — Starting...   │"
echo "  │                                         │"
echo "  │   created by: Nurunim-Co                │"
echo "  │   by: dhype7                            │"
echo "  │   GitHub: github.com/Dhype7/FMH-Toolkit │"
echo "  └─────────────────────────────────────────┘"
echo -e "${NC}"

# Check if backend port is already in use
if lsof -i :5000 &>/dev/null; then
    echo -e "${RED}[!] Port 5000 already in use. Kill existing process first.${NC}"
    echo "    Run: kill \$(lsof -t -i:5000)"
    exit 1
fi

# Start backend
cd "$SCRIPT_DIR/backend"
source venv/bin/activate
export FLASK_APP=app.py
export FLASK_ENV=production

# Serve frontend static files from Flask
export FMH_FRONTEND_DIR="$SCRIPT_DIR/frontend/dist"

# Use gunicorn for production (no dev server warning)
if command -v gunicorn &>/dev/null; then
    gunicorn -w 2 -b 127.0.0.1:5000 --timeout 120 --log-level error app:app &
else
    python3 app.py &
fi
BACKEND_PID=$!

echo -e "${GREEN}[✓] Backend started (PID: $BACKEND_PID)${NC}"

# Wait for backend to be ready
sleep 2

# Open browser
if command -v xdg-open &>/dev/null; then
    xdg-open "http://localhost:5000" 2>/dev/null &
elif command -v open &>/dev/null; then
    open "http://localhost:5000" &
fi

echo -e "${GREEN}[✓] ForensicsMainHand 2.0 running at: ${CYAN}http://localhost:5000${NC}"
echo -e "${GREEN}    Press Ctrl+C to stop${NC}"

# Handle cleanup
cleanup() {
    echo ""
    echo -e "${CYAN}[*] Shutting down...${NC}"
    kill $BACKEND_PID 2>/dev/null
    deactivate 2>/dev/null
    echo -e "${GREEN}[✓] Stopped.${NC}"
    exit 0
}

trap cleanup SIGINT SIGTERM

# Wait for backend
wait $BACKEND_PID
