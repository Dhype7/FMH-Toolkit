<div align="center">

```
███████╗███╗   ███╗██╗  ██╗
██╔════╝████╗ ████║██║  ██║
█████╗  ██╔████╔██║███████║
██╔══╝  ██║╚██╔╝██║██╔══██║
██║     ██║ ╚═╝ ██║██║  ██║
╚═╝     ╚═╝     ╚═╝╚═╝  ╚═╝
```

# ForensicsMainHand 2.0

**All-in-one Cyber Forensics & Security Toolkit**

[![License: AGPL-3.0](https://img.shields.io/badge/License-AGPL--3.0-blue.svg)](LICENSE)
[![Python](https://img.shields.io/badge/Python-3.10+-green.svg)](https://python.org)
[![React](https://img.shields.io/badge/React-18+-61DAFB.svg)](https://react.dev)
[![Flask](https://img.shields.io/badge/Flask-3.x-black.svg)](https://flask.palletsprojects.com)
[![Made by](https://img.shields.io/badge/Made%20by-Nurunim--Co-purple.svg)](https://github.com/Dhype7)

*Offensive & Defensive · Open Source · Practical · Fast*

</div>

---

## What is FMH-Toolkit?

**ForensicsMainHand 2.0** is a powerful, locally-hosted web application that brings together 50+ cybersecurity and digital forensics tools under one modern interface. Built for CTF players, penetration testers, security researchers, and digital forensics analysts — it runs entirely on your machine, keeping your data private.

No cloud. No subscriptions. No limits.

---

## Modules

### 🔐 Cryptography
- Classical ciphers: Caesar, ROT13, Atbash, Vigenère, Affine, Playfair, Rail Fence, Substitution, Bacon, Scytale
- Binary, Hex, ASCII, XOR operations
- Advanced encryption: AES-256, DES, Blowfish, RSA-2048, RC4, One-Time Pad
- Encoding: Base64, Base32, Base16
- Morse code: text ↔ morse, audio generation & WAV decoding
- Hash tools: compute (MD5–SHA3-512, BLAKE2) & identify unknown hashes
- Brute force: Caesar, XOR single-byte, Rail Fence, Playfair dictionary attack
- Frequency analysis

### 📷 Photo Analyzer
- EXIF metadata extraction (basic + deep + suspicious)
- GPS location with reverse geocoding
- Full metadata via `exiftool`
- String extraction with CTF flag detection
- Steganography detection & extraction (steghide + LSB)
- Steganography injection (embed text/files into images)
- Binwalk analysis & extraction
- Zsteg analysis (LSB, MSB, all channels, exact channel)
- OCR text extraction (Tesseract) + flag finder
- QR Code & Barcode reading
- File carving (foremost + binwalk + magic byte signatures)
- Advanced Hex Viewer: search, flags, inspect, entropy, histogram, patch, export, XOR brute force, structure overlay, fix corrupted headers
- CTF Auto-Analyzer — runs all tools automatically on any file

### 📄 File Analyzer
- File type detection & magic bytes
- Windowed entropy analysis (detect encryption/compression)
- String extraction (modes: all, unique, filter by length/pattern)
- Hash computation (MD5, SHA-1, SHA-256, SHA-512)
- Archive extraction (ZIP, TAR, RAR, 7z, GZ, BZ2, XZ, ZST, LZ4, CAB, DMG, ISO) with password support
- File compression (9 formats + password protection)
- Archive password cracking (via John the Ripper)
- Recursive extraction (nested archives, configurable depth)
- File carving (foremost + magic byte scanner)
- Steganography multi-tool analysis (7 tools: steghide, zsteg, strings, binwalk, exiftool, foremost, identify)
- Custom output directory support

### 🌐 Web Analyzer
- HTTP headers inspection
- DNS resolution (A, AAAA, CNAME, MX, TXT, NS records)
- WHOIS lookup
- Port scanning (TCP connect scan)
- Security headers audit with grade (A+ to F)
- XSS vulnerability detection
- Login page discovery (common path enumeration)
- Login brute force (for authorized testing)
- **[Recommended]** [WebRocker](https://webrocker.onrender.com/) — advanced web recon platform by Nurunim-Co

---

## Installation

### Requirements
- Linux / macOS (Windows: use WSL)
- `git`, `curl`, `python3`, `node` (installer handles the rest)

```bash
git clone https://github.com/Dhype7/FMH-Toolkit.git
cd FMH-Toolkit
chmod +x install.sh
./install.sh
```

The installer automatically:
1. Detects your package manager (apt / dnf / pacman / brew)
2. Installs system tools: `exiftool`, `steghide`, `binwalk`, `foremost`, `tesseract`, `zsteg`, `hashcat`
3. Creates a Python virtual environment and installs backend dependencies
4. Builds the React frontend
5. Creates the `fmh` command for system-wide access

---

## Usage

```bash
# Launch from anywhere (after install):
fmh

# Or from the project directory:
./launch.sh
```

Opens automatically at **http://localhost:5000**

Press `Ctrl+C` to stop.

---

## Tech Stack

| Layer    | Technology                        |
|----------|------------------------------------|
| Backend  | Python 3 · Flask · flask-cors      |
| Frontend | React 18 · TypeScript · Vite       |
| Styling  | Tailwind CSS · Framer Motion       |
| Tools    | exiftool · steghide · binwalk · foremost · zsteg · tesseract · john |

---

## Project Structure

```
FMH-Toolkit/
├── backend/
│   ├── app.py                  # Flask app entry point
│   ├── requirements.txt
│   ├── config/settings.py      # Global config & output dir
│   └── modules/
│       ├── crypto/             # Cryptography module
│       ├── photo_analyzer/     # Photo & file forensics
│       ├── file_analyzer/      # File analysis & extraction
│       └── web_analyzer/       # Web reconnaissance
├── frontend/
│   ├── src/
│   │   ├── pages/              # Module pages
│   │   ├── components/         # UI components (Sidebar, ResultsPanel)
│   │   └── utils/api.ts        # Axios API client
│   └── package.json
├── install.sh                  # One-command installer
├── launch.sh                   # Launcher (auto-generated)
├── LICENSE
└── README.md
```

---

## Key Features

- **Custom Output Directory** — Set a global output path for all extractions, carvings, and exported files
- **CTF Auto-Analyze** — Run every forensics tool on a file with one click
- **Dark Cyber UI** — Purpose-built cybersecurity theme with neon accents
- **Fully Local** — All processing happens on your machine; no data leaves your system
- **50+ Tools** — Everything in one place, no switching between CLIs

---

## License

This project is licensed under **AGPL-3.0** with additional terms.

- ✅ Free to use for personal, educational, and research purposes  
- ✅ Fork it, study it, contribute back  
- ❌ Do NOT sell it or offer it as a paid product/service  
- ❌ Do NOT rebrand and claim it as your own  
- ❌ Forks MUST remain open source (AGPL copyleft)  

See [LICENSE](LICENSE) for full details.

---

## Credits

**Created by [Nurunim-Co](https://github.com/Dhype7)**  
Lead Developer: **dhype7** · Security researcher · CTF player · Tool builder

Also check out **[WebRocker](https://webrocker.onrender.com/)** — a web analysis platform by Nurunim-Co, developed by **sa05e60**.

---

<div align="center">
⭐ If this tool helped you, consider giving it a star!
</div>
