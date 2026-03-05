#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════════
#  ForensicsMainHand 2.0 — Installation Script
#  Installs all dependencies and creates 'fmh' command
# ═══════════════════════════════════════════════════════════════

set -e

# Colors
CYAN='\033[0;36m'
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BOLD='\033[1m'
NC='\033[0m'

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

banner() {
    echo -e "${CYAN}"
    echo "  ╔═══════════════════════════════════════════════════╗"
    echo "  ║                                                   ║"
    echo "  ║     ███████╗███╗   ███╗██╗  ██╗  ██████╗  ██████╗║"
    echo "  ║     ██╔════╝████╗ ████║██║  ██║  ╚════██╗██╔═████╗"
    echo "  ║     █████╗  ██╔████╔██║███████║   █████╔╝██║██╔██║"
    echo "  ║     ██╔══╝  ██║╚██╔╝██║██╔══██║  ██╔═══╝ ████╔╝██║"
    echo "  ║     ██║     ██║ ╚═╝ ██║██║  ██║  ███████╗╚██████╔╝"
    echo "  ║     ╚═╝     ╚═╝     ╚═╝╚═╝  ╚═╝  ╚══════╝ ╚═════╝║"
    echo "  ║                                                   ║"
    echo "  ║        Forensics Main Hand 2.0 — Installer        ║"
    echo "  ║              Cyber Forensics Toolkit               ║"
    echo "  ╚═══════════════════════════════════════════════════╝"
    echo -e "${NC}"
}

log() { echo -e "${GREEN}[✓]${NC} $1"; }
warn() { echo -e "${YELLOW}[!]${NC} $1"; }
err() { echo -e "${RED}[✗]${NC} $1"; }
info() { echo -e "${CYAN}[*]${NC} $1"; }

check_root() {
    if [[ $EUID -ne 0 ]]; then
        warn "Running without root. Will use sudo for system-level installs."
        SUDO="sudo"
    else
        SUDO=""
    fi
}

detect_pkg_manager() {
    if command -v apt-get &>/dev/null; then
        PKG="apt-get"
        PKG_INSTALL="$SUDO apt-get install -y"
        PKG_UPDATE="$SUDO apt-get update"
    elif command -v dnf &>/dev/null; then
        PKG="dnf"
        PKG_INSTALL="$SUDO dnf install -y"
        PKG_UPDATE="$SUDO dnf check-update || true"
    elif command -v pacman &>/dev/null; then
        PKG="pacman"
        PKG_INSTALL="$SUDO pacman -S --noconfirm"
        PKG_UPDATE="$SUDO pacman -Sy"
    elif command -v brew &>/dev/null; then
        PKG="brew"
        PKG_INSTALL="brew install"
        PKG_UPDATE="brew update"
    else
        err "No supported package manager found (apt, dnf, pacman, brew)"
        exit 1
    fi
    log "Detected package manager: ${BOLD}$PKG${NC}"
}

install_system_deps() {
    info "Updating package lists..."
    $PKG_UPDATE 2>/dev/null || true

    info "Installing system dependencies..."

    # Python
    if ! command -v python3 &>/dev/null; then
        $PKG_INSTALL python3 python3-pip python3-venv
    else
        log "Python3 already installed: $(python3 --version)"
    fi

    # Node.js
    if ! command -v node &>/dev/null; then
        info "Installing Node.js..."
        if [[ "$PKG" == "apt-get" ]]; then
            curl -fsSL https://deb.nodesource.com/setup_20.x | $SUDO bash -
            $PKG_INSTALL nodejs
        elif [[ "$PKG" == "dnf" ]]; then
            $PKG_INSTALL nodejs npm
        elif [[ "$PKG" == "pacman" ]]; then
            $PKG_INSTALL nodejs npm
        elif [[ "$PKG" == "brew" ]]; then
            $PKG_INSTALL node
        fi
    else
        log "Node.js already installed: $(node --version)"
    fi

    # npm
    if ! command -v npm &>/dev/null; then
        $PKG_INSTALL npm 2>/dev/null || true
    fi

    # Forensic tools
    local tools=(
        "exiftool:libimage-exiftool-perl"
        "steghide:steghide"
        "binwalk:binwalk"
        "foremost:foremost"
        "strings:binutils"
        "tesseract:tesseract-ocr"
    )

    for entry in "${tools[@]}"; do
        local cmd="${entry%%:*}"
        local pkg="${entry##*:}"
        if command -v "$cmd" &>/dev/null; then
            log "$cmd already installed"
        else
            info "Installing $cmd..."
            $PKG_INSTALL "$pkg" 2>/dev/null || warn "Could not install $pkg — install manually"
        fi
    done

    # zsteg (Ruby gem)
    if command -v gem &>/dev/null; then
        if ! command -v zsteg &>/dev/null; then
            info "Installing zsteg..."
            $SUDO gem install zsteg 2>/dev/null || warn "Could not install zsteg — install Ruby and run: gem install zsteg"
        else
            log "zsteg already installed"
        fi
    else
        warn "Ruby not found. Install Ruby and then: gem install zsteg"
    fi

    # hashcat (optional)
    if ! command -v hashcat &>/dev/null; then
        $PKG_INSTALL hashcat 2>/dev/null || warn "hashcat not found — install manually for hash cracking"
    else
        log "hashcat already installed"
    fi
}

setup_backend() {
    info "Setting up Python backend..."
    cd "$SCRIPT_DIR/backend"

    # Create virtual environment
    if [[ ! -d "venv" ]]; then
        python3 -m venv venv
        log "Virtual environment created"
    else
        log "Virtual environment already exists"
    fi

    # Activate and install
    source venv/bin/activate
    pip install --upgrade pip setuptools wheel 2>/dev/null
    pip install -r requirements.txt
    deactivate

    log "Backend dependencies installed"
    cd "$SCRIPT_DIR"
}

setup_frontend() {
    info "Setting up React frontend..."
    cd "$SCRIPT_DIR/frontend"

    npm install
    npm run build

    log "Frontend built successfully"
    cd "$SCRIPT_DIR"
}

create_launcher() {
    info "Creating 'fmh' launcher command..."

    # Create the launcher script
    cat > "$SCRIPT_DIR/launch.sh" << 'LAUNCHER'
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
LAUNCHER

    chmod +x "$SCRIPT_DIR/launch.sh"

    # Create symlink in /usr/local/bin
    local FMH_BIN="/usr/local/bin/fmh"
    $SUDO rm -f "$FMH_BIN"
    $SUDO ln -sf "$SCRIPT_DIR/launch.sh" "$FMH_BIN"

    if [[ -L "$FMH_BIN" ]]; then
        log "Command 'fmh' installed at $FMH_BIN"
        log "You can now run ${BOLD}fmh${NC} from anywhere!"
    else
        warn "Could not create symlink. You can run: $SCRIPT_DIR/launch.sh"
    fi
}

update_backend_serve_static() {
    # Patch app.py to serve the built frontend in production
    info "Configuring backend to serve frontend build..."
    cat > "$SCRIPT_DIR/backend/serve_frontend.py" << 'SERVEPY'
"""Serve the built frontend from Flask in production."""
import os
from flask import send_from_directory

def register_frontend(app):
    frontend_dir = os.environ.get('FMH_FRONTEND_DIR', None)
    if not frontend_dir or not os.path.isdir(frontend_dir):
        return

    @app.route('/', defaults={'path': ''})
    @app.route('/<path:path>')
    def serve_frontend(path):
        if path and os.path.exists(os.path.join(frontend_dir, path)):
            return send_from_directory(frontend_dir, path)
        return send_from_directory(frontend_dir, 'index.html')
SERVEPY
    log "Frontend serving configured"
}

# ═══════════════════════════════════════════════════
#  MAIN
# ═══════════════════════════════════════════════════
main() {
    banner
    check_root
    detect_pkg_manager

    echo ""
    info "Installing ForensicsMainHand 2.0..."
    echo ""

    install_system_deps
    echo ""
    setup_backend
    echo ""
    setup_frontend
    echo ""
    update_backend_serve_static
    create_launcher

    echo ""
    echo -e "${GREEN}═══════════════════════════════════════════════════${NC}"
    echo -e "${GREEN}  Installation complete!${NC}"
    echo -e "${GREEN}═══════════════════════════════════════════════════${NC}"
    echo ""
    echo -e "  ${CYAN}Run the tool:${NC}"
    echo -e "    ${BOLD}fmh${NC}          — Launch from anywhere"
    echo -e "    ${BOLD}./launch.sh${NC}  — Launch from this directory"
    echo ""
    echo -e "  ${CYAN}Access at:${NC} ${BOLD}http://localhost:5000${NC}"
    echo ""
}

main "$@"
