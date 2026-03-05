"""
ForensicsMainHand 2.0 - File Analyzer Routes
Endpoints: info, entropy, strings, hashes, extract, carve, compress,
           crack-password, recursive-extract, stego
"""
import os
from flask import Blueprint, request, jsonify
from werkzeug.utils import secure_filename
from config.settings import Settings
from .file_utils import FileUtils

file_bp = Blueprint('file', __name__)


def _get_output_dir() -> str:
    """Return custom output dir from Settings, or empty string for default."""
    return Settings.get_output_dir() or ''


def _save_upload():
    """Save uploaded file and return its path, or (None, error_response)."""
    if 'file' not in request.files:
        return None, (jsonify({"error": "No file uploaded"}), 400)
    f = request.files['file']
    if not f.filename:
        return None, (jsonify({"error": "No file selected"}), 400)
    filename = secure_filename(f.filename)
    filepath = os.path.join(Settings.UPLOAD_FOLDER, filename)
    # Avoid overwriting
    base, ext = os.path.splitext(filepath)
    counter = 1
    while os.path.exists(filepath):
        filepath = f"{base}_{counter}{ext}"
        counter += 1
    f.save(filepath)
    return filepath, None


# ── File Info ─────────────────────────────────────────────────────
@file_bp.route('/info', methods=['POST'])
def file_info():
    filepath, err = _save_upload()
    if err:
        return err
    result = FileUtils.get_file_info(filepath)
    return jsonify(result)


# ── Entropy ───────────────────────────────────────────────────────
@file_bp.route('/entropy', methods=['POST'])
def file_entropy():
    filepath, err = _save_upload()
    if err:
        return err
    window_size = int(request.form.get('window_size', 0))
    result = FileUtils.calculate_entropy(filepath, window_size=window_size)
    return jsonify(result)


# ── Strings ───────────────────────────────────────────────────────
@file_bp.route('/strings', methods=['POST'])
def file_strings():
    filepath, err = _save_upload()
    if err:
        return err
    min_length = int(request.form.get('min_length', 4))
    mode = request.form.get('mode', 'both')
    unique = request.form.get('unique', 'false').lower() == 'true'
    filter_str = request.form.get('filter', '')
    result = FileUtils.extract_strings(filepath, min_length=min_length, mode=mode,
                                       unique=unique, filter_str=filter_str)
    return jsonify(result)


# ── Hashes ────────────────────────────────────────────────────────
@file_bp.route('/hashes', methods=['POST'])
def file_hashes():
    filepath, err = _save_upload()
    if err:
        return err
    result = FileUtils.compute_hashes(filepath)
    return jsonify(result)


# ── Archive Extraction ────────────────────────────────────────────
@file_bp.route('/extract', methods=['POST'])
def file_extract():
    filepath, err = _save_upload()
    if err:
        return err
    password = request.form.get('password', '')
    result = FileUtils.extract_archive(filepath, password=password, output_dir=_get_output_dir())
    return jsonify(result)


# ── File Compression ──────────────────────────────────────────────
@file_bp.route('/compress', methods=['POST'])
def file_compress():
    filepath, err = _save_upload()
    if err:
        return err
    fmt = request.form.get('format', 'zip')
    password = request.form.get('password', '')
    result = FileUtils.compress_file(filepath, fmt=fmt, password=password, output_dir=_get_output_dir())
    return jsonify(result)


# ── File Carving ──────────────────────────────────────────────────
@file_bp.route('/carve', methods=['POST'])
def file_carve():
    filepath, err = _save_upload()
    if err:
        return err
    method = request.form.get('method', 'foremost')
    result = FileUtils.file_carving(filepath, method=method, output_dir=_get_output_dir())
    return jsonify(result)


# ── Archive Password Cracking ─────────────────────────────────────
@file_bp.route('/crack-password', methods=['POST'])
def file_crack_password():
    filepath, err = _save_upload()
    if err:
        return err
    wordlist = request.form.get('wordlist', '/usr/share/wordlists/rockyou.txt')
    result = FileUtils.crack_archive_password(filepath, wordlist=wordlist)
    return jsonify(result)


# ── Recursive Archive Extraction ──────────────────────────────────
@file_bp.route('/recursive-extract', methods=['POST'])
def file_recursive_extract():
    filepath, err = _save_upload()
    if err:
        return err
    max_depth = int(request.form.get('max_depth', 5))
    result = FileUtils.recursive_extract(filepath, max_depth=max_depth, output_dir=_get_output_dir())
    return jsonify(result)


# ── Steganography Analysis ────────────────────────────────────────
@file_bp.route('/stego', methods=['POST'])
def file_stego():
    filepath, err = _save_upload()
    if err:
        return err
    result = FileUtils.analyze_steganography(filepath)
    return jsonify(result)
