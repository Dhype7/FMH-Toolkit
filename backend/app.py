"""
ForensicsMainHand 2.0 - Flask Backend Application
"""
import os
import sys
import json
import shutil
import platform
import importlib
from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
from werkzeug.utils import secure_filename

from config.settings import Settings

# Ensure directories exist
Settings.ensure_directories()

app = Flask(__name__)
app.config['MAX_CONTENT_LENGTH'] = Settings.MAX_CONTENT_LENGTH
app.config['UPLOAD_FOLDER'] = Settings.UPLOAD_FOLDER
CORS(app, resources={r"/api/*": {"origins": "*"}})


def save_uploaded_file(file_storage):
    """Save an uploaded file and return its path"""
    if not file_storage or file_storage.filename == '':
        return None
    filename = secure_filename(file_storage.filename)
    filepath = os.path.join(Settings.UPLOAD_FOLDER, filename)
    # Avoid overwriting
    base, ext = os.path.splitext(filepath)
    counter = 1
    while os.path.exists(filepath):
        filepath = f"{base}_{counter}{ext}"
        counter += 1
    file_storage.save(filepath)
    return filepath


# ─── Health & Info ────────────────────────────────────────────────
@app.route('/api/health', methods=['GET'])
def health():
    return jsonify({"status": "ok", "version": Settings.APP_VERSION})


@app.route('/api/tools', methods=['GET'])
def check_tools():
    """Check which system tools are available"""
    raw = Settings.check_tools()
    available = [name for name, ok in raw.items() if ok]
    missing = [name for name, ok in raw.items() if not ok]
    return jsonify({
        "version": Settings.APP_VERSION,
        "available_tools": available,
        "missing_tools": missing,
    })


# ─── System Check (full dependency audit) ────────────────────────
@app.route('/api/system-check', methods=['GET'])
def system_check():
    """Full diagnostic: system tools + python packages + system info"""
    # System tools
    TOOLS = ['exiftool', 'steghide', 'binwalk', 'foremost', 'hashcat',
             'strings', 'tesseract', 'zsteg', 'file', 'xxd', 'curl', 'wget',
             'nmap', 'whois', 'dig', 'python3', 'pip3']
    tools = {t: shutil.which(t) is not None for t in TOOLS}

    # Python packages
    PACKAGES = [
        'flask', 'flask_cors', 'PIL', 'exifread', 'requests',
        'bs4', 'cryptography', 'hashlib', 'base64', 'binascii',
        'struct', 'json', 'urllib', 'subprocess', 'magic',
        'geopy',
    ]
    packages = {}
    for pkg in PACKAGES:
        try:
            importlib.import_module(pkg)
            packages[pkg] = True
        except ImportError:
            packages[pkg] = False

    # System info
    info = {
        'platform': platform.platform(),
        'python': platform.python_version(),
        'arch': platform.machine(),
        'hostname': platform.node(),
    }

    return jsonify({
        'tools': tools,
        'python_packages': packages,
        'system': info,
    })


# ─── Output Directory Setting ─────────────────────────────────────
@app.route('/api/settings/output-dir', methods=['GET'])
def get_output_dir():
    return jsonify({
        "output_dir": Settings.get_output_dir(),
        "default_output": Settings.OUTPUT_FOLDER,
    })

@app.route('/api/settings/output-dir', methods=['POST'])
def set_output_dir():
    data = request.get_json(silent=True) or {}
    path = data.get('output_dir', '').strip()
    try:
        Settings.set_output_dir(path if path else None)
        return jsonify({
            "output_dir": Settings.get_output_dir(),
            "message": f"Output directory set to: {Settings.get_output_dir()}" if Settings.get_output_dir() else "Output directory reset to default (per-file)",
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 400


# ─── Import module routes as blueprints ──────────────────────────
from modules.crypto.routes import crypto_bp
from modules.photo_analyzer.routes import photo_bp
from modules.file_analyzer.routes import file_bp
from modules.web_analyzer.routes import web_bp

app.register_blueprint(crypto_bp, url_prefix='/api/crypto')
app.register_blueprint(photo_bp, url_prefix='/api/photo')
app.register_blueprint(file_bp, url_prefix='/api/file')
app.register_blueprint(web_bp, url_prefix='/api/web')


# ─── Serve built frontend in production ──────────────────────────
from flask import send_from_directory

FRONTEND_DIR = os.environ.get('FMH_FRONTEND_DIR', os.path.join(os.path.dirname(__file__), '..', 'frontend', 'dist'))

if os.path.isdir(FRONTEND_DIR):
    @app.route('/', defaults={'path': ''})
    @app.route('/<path:path>')
    def serve_frontend(path):
        if path and os.path.exists(os.path.join(FRONTEND_DIR, path)):
            return send_from_directory(FRONTEND_DIR, path)
        return send_from_directory(FRONTEND_DIR, 'index.html')


if __name__ == '__main__':
    app.run(host=Settings.HOST, port=Settings.PORT, debug=Settings.DEBUG)
