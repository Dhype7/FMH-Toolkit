"""
ForensicsMainHand 2.0 - Photo Analyzer API Routes
"""
import os
import tempfile
from flask import Blueprint, request, jsonify, send_file
from werkzeug.utils import secure_filename
from config.settings import Settings

photo_bp = Blueprint('photo', __name__)


def _get_output_dir() -> str:
    """Get custom output directory if set"""
    return Settings.get_output_dir() or ''


def _save_upload():
    """Save uploaded file and return path"""
    if 'file' not in request.files:
        return None, jsonify({"error": "No file uploaded"}), 400
    file = request.files['file']
    if file.filename == '':
        return None, jsonify({"error": "No file selected"}), 400
    filename = secure_filename(file.filename)
    filepath = os.path.join(Settings.UPLOAD_FOLDER, filename)
    base, ext = os.path.splitext(filepath)
    counter = 1
    while os.path.exists(filepath):
        filepath = f"{base}_{counter}{ext}"
        counter += 1
    file.save(filepath)
    return filepath, None, None


# ─── EXIF Analysis ────────────────────────────────────────────────
@photo_bp.route('/exif', methods=['POST'])
def exif_analyze():
    filepath, err, code = _save_upload()
    if err:
        return err, code
    try:
        from modules.photo_analyzer.exif_analyzer import EXIFAnalyzer
        analyzer = EXIFAnalyzer(filepath)
        return jsonify(analyzer.get_summary())
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@photo_bp.route('/exif/deep', methods=['POST'])
def exif_deep():
    filepath, err, code = _save_upload()
    if err:
        return err, code
    try:
        from modules.photo_analyzer.exif_analyzer import EXIFAnalyzer
        analyzer = EXIFAnalyzer(filepath)
        return jsonify(analyzer.deep_scan())
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@photo_bp.route('/exif/suspicious', methods=['POST'])
def exif_suspicious():
    filepath, err, code = _save_upload()
    if err:
        return err, code
    try:
        from modules.photo_analyzer.exif_analyzer import EXIFAnalyzer
        analyzer = EXIFAnalyzer(filepath)
        return jsonify(analyzer.find_suspicious())
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ─── Location Analysis ───────────────────────────────────────────
@photo_bp.route('/location', methods=['POST'])
def location_analyze():
    filepath, err, code = _save_upload()
    if err:
        return err, code
    try:
        from modules.photo_analyzer.location_analyzer import LocationAnalyzer
        analyzer = LocationAnalyzer(filepath)
        return jsonify(analyzer.analyze_location())
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ─── Metadata Analysis ───────────────────────────────────────────
@photo_bp.route('/metadata', methods=['POST'])
def metadata_analyze():
    filepath, err, code = _save_upload()
    if err:
        return err, code
    try:
        from modules.photo_analyzer.metadata_analyzer import MetadataAnalyzer
        analyzer = MetadataAnalyzer(filepath)
        return jsonify(analyzer.analyze_file())
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@photo_bp.route('/metadata/deep', methods=['POST'])
def metadata_deep():
    filepath, err, code = _save_upload()
    if err:
        return err, code
    try:
        from modules.photo_analyzer.metadata_analyzer import MetadataAnalyzer
        analyzer = MetadataAnalyzer(filepath)
        return jsonify(analyzer.deep_scan())
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@photo_bp.route('/metadata/suspicious', methods=['POST'])
def metadata_suspicious():
    filepath, err, code = _save_upload()
    if err:
        return err, code
    try:
        from modules.photo_analyzer.metadata_analyzer import MetadataAnalyzer
        analyzer = MetadataAnalyzer(filepath)
        return jsonify(analyzer.find_suspicious())
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ─── String Analysis ─────────────────────────────────────────────
@photo_bp.route('/strings', methods=['POST'])
def string_analyze():
    filepath, err, code = _save_upload()
    if err:
        return err, code
    try:
        from modules.photo_analyzer.string_analyzer import StringAnalyzer
        analyzer = StringAnalyzer(filepath)
        search = request.form.get('search', '')
        if search:
            results = analyzer.search_strings(search)
            return jsonify({"matches": results, "total": len(results)})
        return jsonify(analyzer.analyze())
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@photo_bp.route('/strings/grep', methods=['POST'])
def string_grep():
    filepath, err, code = _save_upload()
    if err:
        return err, code
    try:
        from modules.photo_analyzer.string_analyzer import StringAnalyzer
        analyzer = StringAnalyzer(filepath)
        pattern = request.form.get('pattern', '')
        if not pattern:
            return jsonify({"error": "No grep pattern provided"}), 400
        results = analyzer.search_with_grep(pattern)
        return jsonify({"pattern": pattern, "matches": results, "total": len(results)})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ─── Binwalk Analysis ────────────────────────────────────────────
@photo_bp.route('/binwalk', methods=['POST'])
def binwalk_analyze():
    filepath, err, code = _save_upload()
    if err:
        return err, code
    try:
        from modules.photo_analyzer.binwalk_analyzer import BinwalkAnalyzer
        analyzer = BinwalkAnalyzer(filepath)
        action = request.form.get('action', 'scan')
        if action == 'extract':
            return jsonify(analyzer.extract_files(output_dir=_get_output_dir()))
        return jsonify(analyzer.analyze_file())
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@photo_bp.route('/binwalk/file-types', methods=['POST'])
def binwalk_file_types():
    filepath, err, code = _save_upload()
    if err:
        return err, code
    try:
        from modules.photo_analyzer.binwalk_analyzer import BinwalkAnalyzer
        analyzer = BinwalkAnalyzer(filepath)
        return jsonify({"file_types": analyzer.signature_scan()})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@photo_bp.route('/binwalk/deep', methods=['POST'])
def binwalk_deep():
    filepath, err, code = _save_upload()
    if err:
        return err, code
    try:
        from modules.photo_analyzer.binwalk_analyzer import BinwalkAnalyzer
        analyzer = BinwalkAnalyzer(filepath)
        return jsonify({"deep_scan": analyzer.deep_scan()})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ─── Zsteg Analysis ──────────────────────────────────────────────
@photo_bp.route('/zsteg', methods=['POST'])
def zsteg_analyze():
    filepath, err, code = _save_upload()
    if err:
        return err, code
    try:
        from modules.photo_analyzer.zsteg_analyzer import ZstegAnalyzer
        analyzer = ZstegAnalyzer(filepath)
        return jsonify(analyzer.analyze())
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@photo_bp.route('/zsteg/lsb', methods=['POST'])
def zsteg_lsb():
    filepath, err, code = _save_upload()
    if err:
        return err, code
    try:
        from modules.photo_analyzer.zsteg_analyzer import ZstegAnalyzer
        analyzer = ZstegAnalyzer(filepath)
        return jsonify(analyzer.lsb_scan())
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@photo_bp.route('/zsteg/msb', methods=['POST'])
def zsteg_msb():
    filepath, err, code = _save_upload()
    if err:
        return err, code
    try:
        from modules.photo_analyzer.zsteg_analyzer import ZstegAnalyzer
        analyzer = ZstegAnalyzer(filepath)
        return jsonify(analyzer.msb_scan())
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@photo_bp.route('/zsteg/all-channels', methods=['POST'])
def zsteg_all_channels():
    filepath, err, code = _save_upload()
    if err:
        return err, code
    try:
        from modules.photo_analyzer.zsteg_analyzer import ZstegAnalyzer
        analyzer = ZstegAnalyzer(filepath)
        return jsonify(analyzer.all_channels())
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@photo_bp.route('/zsteg/channel', methods=['POST'])
def zsteg_channel():
    filepath, err, code = _save_upload()
    if err:
        return err, code
    try:
        from modules.photo_analyzer.zsteg_analyzer import ZstegAnalyzer
        analyzer = ZstegAnalyzer(filepath)
        channel = request.form.get('channel', '1b,rgb,lsb')
        return jsonify(analyzer.specific_channel(channel))
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@photo_bp.route('/zsteg/extract', methods=['POST'])
def zsteg_extract():
    filepath, err, code = _save_upload()
    if err:
        return err, code
    try:
        from modules.photo_analyzer.zsteg_analyzer import ZstegAnalyzer
        analyzer = ZstegAnalyzer(filepath)
        channel = request.form.get('channel', 'b1,rgb,lsb')
        return jsonify(analyzer.extract_data(channel))
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ─── OCR ──────────────────────────────────────────────────────────
@photo_bp.route('/ocr', methods=['POST'])
def ocr_analyze():
    filepath, err, code = _save_upload()
    if err:
        return err, code
    try:
        from modules.photo_analyzer.ocr_analyzer import OCRAnalyzer
        analyzer = OCRAnalyzer(filepath)
        preprocess = request.form.get('preprocess', 'false') == 'true'
        lang = request.form.get('lang', 'eng')
        if preprocess:
            return jsonify(analyzer.extract_text_with_preprocessing(lang))
        return jsonify(analyzer.extract_text(lang))
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@photo_bp.route('/ocr/flags', methods=['POST'])
def ocr_flags():
    filepath, err, code = _save_upload()
    if err:
        return err, code
    try:
        from modules.photo_analyzer.ocr_analyzer import OCRAnalyzer
        analyzer = OCRAnalyzer(filepath)
        lang = request.form.get('lang', 'eng')
        return jsonify(analyzer.find_flags(lang))
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ─── QR/Barcode ──────────────────────────────────────────────────
@photo_bp.route('/qrcode', methods=['POST'])
def qr_analyze():
    filepath, err, code = _save_upload()
    if err:
        return err, code
    try:
        from modules.photo_analyzer.qr_barcode_analyzer import QRBarcodeAnalyzer
        analyzer = QRBarcodeAnalyzer(filepath)
        return jsonify(analyzer.analyze_code_content())
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ─── Steganography ───────────────────────────────────────────────
@photo_bp.route('/steganography/detect', methods=['POST'])
def steg_detect():
    filepath, err, code = _save_upload()
    if err:
        return err, code
    try:
        from modules.photo_analyzer.steganography import SteganographyAnalyzer
        analyzer = SteganographyAnalyzer(filepath)
        return jsonify(analyzer.detect_steganography())
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@photo_bp.route('/steganography/extract', methods=['POST'])
def steg_extract():
    filepath, err, code = _save_upload()
    if err:
        return err, code
    try:
        from modules.photo_analyzer.steganography import SteganographyAnalyzer
        password = request.form.get('password', '')
        analyzer = SteganographyAnalyzer(filepath)
        return jsonify(analyzer.extract_data(password))
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@photo_bp.route('/steganography/inject', methods=['POST'])
def steg_inject():
    filepath, err, code = _save_upload()
    if err:
        return err, code
    try:
        from modules.photo_analyzer.steganography import SteganographyAnalyzer
        text = request.form.get('text', '')
        password = request.form.get('password', '')
        analyzer = SteganographyAnalyzer(filepath)
        result = analyzer.inject_text(text, password, output_dir=_get_output_dir())
        if result.get("success") and result.get("output_path"):
            return send_file(result["output_path"], as_attachment=True)
        return jsonify(result)
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@photo_bp.route('/steganography/lsb', methods=['POST'])
def steg_lsb():
    filepath, err, code = _save_upload()
    if err:
        return err, code
    try:
        from modules.photo_analyzer.steganography import SteganographyAnalyzer
        analyzer = SteganographyAnalyzer(filepath)
        return jsonify(analyzer.lsb_detect())
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ─── Crypto Analysis ─────────────────────────────────────────────
@photo_bp.route('/crypto-analyze', methods=['POST'])
def crypto_analyze():
    data = request.get_json() or {}
    text = data.get('text', '')
    encoding = data.get('encoding', 'auto')
    try:
        from modules.photo_analyzer.crypto_analyzer import CryptoAnalyzer
        analyzer = CryptoAnalyzer()
        if encoding == 'auto':
            return jsonify(analyzer.auto_decode(text))
        decode_map = {
            'base64': analyzer.decode_base64,
            'base32': analyzer.decode_base32,
            'hex': analyzer.decode_hex,
            'rot13': analyzer.decode_rot13,
            'caesar': analyzer.decode_caesar,
            'binary': analyzer.decode_binary,
            'morse': analyzer.decode_morse,
        }
        func = decode_map.get(encoding)
        if func:
            return jsonify(func(text))
        return jsonify({"error": f"Unknown encoding: {encoding}"}), 400
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ─── File Carving ─────────────────────────────────────────────────
@photo_bp.route('/carving', methods=['POST'])
def file_carving():
    filepath, err, code = _save_upload()
    if err:
        return err, code
    try:
        from modules.photo_analyzer.file_carving_analyzer import FileCarvingAnalyzer
        analyzer = FileCarvingAnalyzer(filepath)
        action = request.form.get('action', 'scan')
        if action == 'extract':
            return jsonify(analyzer.auto_carve(output_dir=_get_output_dir()))
        return jsonify({"signatures": analyzer.scan_file_signatures()})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@photo_bp.route('/carving/signatures', methods=['POST'])
def carving_signatures():
    filepath, err, code = _save_upload()
    if err:
        return err, code
    try:
        from modules.photo_analyzer.file_carving_analyzer import FileCarvingAnalyzer
        analyzer = FileCarvingAnalyzer(filepath)
        return jsonify({"signatures": analyzer.scan_file_signatures()})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@photo_bp.route('/carving/foremost', methods=['POST'])
def carving_foremost():
    filepath, err, code = _save_upload()
    if err:
        return err, code
    try:
        from modules.photo_analyzer.file_carving_analyzer import FileCarvingAnalyzer
        analyzer = FileCarvingAnalyzer(filepath)
        return jsonify(analyzer.extract_with_foremost(output_dir=_get_output_dir()))
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@photo_bp.route('/carving/binwalk', methods=['POST'])
def carving_binwalk():
    filepath, err, code = _save_upload()
    if err:
        return err, code
    try:
        from modules.photo_analyzer.file_carving_analyzer import FileCarvingAnalyzer
        analyzer = FileCarvingAnalyzer(filepath)
        return jsonify(analyzer.extract_with_binwalk(output_dir=_get_output_dir()))
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ─── Hex Viewer (Advanced ghex-style) ────────────────────────────
@photo_bp.route('/hex', methods=['POST'])
def hex_view():
    filepath, err, code = _save_upload()
    if err:
        return err, code
    try:
        from modules.photo_analyzer.hex_viewer import HexViewer
        viewer = HexViewer(filepath)
        offset = int(request.form.get('offset', 0))
        length = int(request.form.get('length', 4096))
        return jsonify(viewer.get_hex_dump(offset, length))
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@photo_bp.route('/hex/search', methods=['POST'])
def hex_search():
    filepath, err, code = _save_upload()
    if err:
        return err, code
    try:
        from modules.photo_analyzer.hex_viewer import HexViewer
        viewer = HexViewer(filepath)
        search_type = request.form.get('type', 'hex')
        query = request.form.get('query', '')
        if search_type == 'ascii':
            return jsonify({"results": viewer.search_ascii(query)})
        elif search_type == 'regex':
            return jsonify({"results": viewer.search_regex(query)})
        return jsonify({"results": viewer.search_hex(query)})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@photo_bp.route('/hex/flags', methods=['POST'])
def hex_flags():
    filepath, err, code = _save_upload()
    if err:
        return err, code
    try:
        from modules.photo_analyzer.hex_viewer import HexViewer
        viewer = HexViewer(filepath)
        return jsonify({"flags": viewer.ctf_highlight_flags()})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@photo_bp.route('/hex/inspect', methods=['POST'])
def hex_inspect():
    """Data inspector — interpret bytes at offset"""
    filepath, err, code = _save_upload()
    if err:
        return err, code
    try:
        from modules.photo_analyzer.hex_viewer import HexViewer
        viewer = HexViewer(filepath)
        offset = int(request.form.get('offset', 0))
        return jsonify(viewer.inspect_bytes(offset))
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@photo_bp.route('/hex/goto', methods=['POST'])
def hex_goto():
    """Go to specific offset (hex, dec, oct, bin)"""
    filepath, err, code = _save_upload()
    if err:
        return err, code
    try:
        from modules.photo_analyzer.hex_viewer import HexViewer
        viewer = HexViewer(filepath)
        offset_str = request.form.get('offset', '0')
        return jsonify(viewer.goto_offset(offset_str))
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@photo_bp.route('/hex/structure', methods=['POST'])
def hex_structure():
    """Structure overlay for known file formats"""
    filepath, err, code = _save_upload()
    if err:
        return err, code
    try:
        from modules.photo_analyzer.hex_viewer import HexViewer
        viewer = HexViewer(filepath)
        return jsonify(viewer.get_structure_overlay())
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@photo_bp.route('/hex/entropy', methods=['POST'])
def hex_entropy():
    """Entropy analysis of the file"""
    filepath, err, code = _save_upload()
    if err:
        return err, code
    try:
        from modules.photo_analyzer.hex_viewer import HexViewer
        viewer = HexViewer(filepath)
        block_size = int(request.form.get('block_size', 256))
        return jsonify(viewer.entropy_analysis(block_size))
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@photo_bp.route('/hex/histogram', methods=['POST'])
def hex_histogram():
    """Byte frequency histogram"""
    filepath, err, code = _save_upload()
    if err:
        return err, code
    try:
        from modules.photo_analyzer.hex_viewer import HexViewer
        viewer = HexViewer(filepath)
        return jsonify(viewer.byte_histogram())
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@photo_bp.route('/hex/hashes', methods=['POST'])
def hex_hashes():
    """Compute file hashes (or selection)"""
    filepath, err, code = _save_upload()
    if err:
        return err, code
    try:
        from modules.photo_analyzer.hex_viewer import HexViewer
        viewer = HexViewer(filepath)
        offset = int(request.form.get('offset', 0))
        length = int(request.form.get('length', 0))
        return jsonify(viewer.compute_hashes(offset, length))
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@photo_bp.route('/hex/strings', methods=['POST'])
def hex_strings():
    """Extract strings from binary"""
    filepath, err, code = _save_upload()
    if err:
        return err, code
    try:
        from modules.photo_analyzer.hex_viewer import HexViewer
        viewer = HexViewer(filepath)
        min_len = int(request.form.get('min_length', 4))
        return jsonify({"strings": viewer.extract_strings(min_len)})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@photo_bp.route('/hex/embedded', methods=['POST'])
def hex_embedded():
    """Find embedded file signatures"""
    filepath, err, code = _save_upload()
    if err:
        return err, code
    try:
        from modules.photo_analyzer.hex_viewer import HexViewer
        viewer = HexViewer(filepath)
        return jsonify({"embedded": viewer.find_embedded_files()})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@photo_bp.route('/hex/export', methods=['POST'])
def hex_export():
    """Export byte selection in various formats"""
    filepath, err, code = _save_upload()
    if err:
        return err, code
    try:
        from modules.photo_analyzer.hex_viewer import HexViewer
        viewer = HexViewer(filepath)
        offset = int(request.form.get('offset', 0))
        length = int(request.form.get('length', 256))
        fmt = request.form.get('format', 'all')
        return jsonify(viewer.export_selection(offset, length, fmt))
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@photo_bp.route('/hex/xor', methods=['POST'])
def hex_xor():
    """XOR brute force on a region"""
    filepath, err, code = _save_upload()
    if err:
        return err, code
    try:
        from modules.photo_analyzer.hex_viewer import HexViewer
        viewer = HexViewer(filepath)
        offset = int(request.form.get('offset', 0))
        length = int(request.form.get('length', 256))
        return jsonify({"results": viewer.xor_bruteforce(offset, length)})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@photo_bp.route('/hex/info', methods=['POST'])
def hex_info():
    """Comprehensive file info"""
    filepath, err, code = _save_upload()
    if err:
        return err, code
    try:
        from modules.photo_analyzer.hex_viewer import HexViewer
        viewer = HexViewer(filepath)
        return jsonify(viewer.file_info())
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@photo_bp.route('/hex/detect-header', methods=['POST'])
def hex_detect_header():
    """Advanced file type detection (for corrupted files)"""
    filepath, err, code = _save_upload()
    if err:
        return err, code
    try:
        from modules.photo_analyzer.hex_viewer import HexViewer
        viewer = HexViewer(filepath)
        return jsonify(viewer.detect_file_type_advanced())
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@photo_bp.route('/hex/fix-header', methods=['POST'])
def hex_fix_header():
    """Auto-correct corrupted file header"""
    filepath, err, code = _save_upload()
    if err:
        return err, code
    try:
        from modules.photo_analyzer.hex_viewer import HexViewer
        viewer = HexViewer(filepath)
        target_type = request.form.get('target_type', None)
        result = viewer.auto_correct_header(target_type or None)
        return jsonify(result)
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@photo_bp.route('/hex/patch', methods=['POST'])
def hex_patch():
    """Apply byte patches (edit mode)"""
    filepath, err, code = _save_upload()
    if err:
        return err, code
    try:
        import json as json_mod
        from modules.photo_analyzer.hex_viewer import HexViewer
        viewer = HexViewer(filepath)
        patches_raw = request.form.get('patches', '[]')
        patches = json_mod.loads(patches_raw)
        result = viewer.patch_bytes(patches)
        return jsonify(result)
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@photo_bp.route('/hex/download', methods=['POST'])
def hex_download():
    """Download the (possibly patched) file"""
    filepath, err, code = _save_upload()
    if err:
        return err, code
    try:
        return send_file(filepath, as_attachment=True)
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ─── CTF Auto-Analyze ────────────────────────────────────────────
@photo_bp.route('/ctf-auto', methods=['POST'])
def ctf_auto_analyze():
    """Run all analyses on a file for CTF"""
    filepath, err, code = _save_upload()
    if err:
        return err, code
    try:
        results = {"file": os.path.basename(filepath)}

        # EXIF
        try:
            from modules.photo_analyzer.exif_analyzer import EXIFAnalyzer
            results["exif"] = EXIFAnalyzer(filepath).get_summary()
        except Exception as e:
            results["exif"] = {"error": str(e)}

        # Metadata
        try:
            from modules.photo_analyzer.metadata_analyzer import MetadataAnalyzer
            results["metadata"] = MetadataAnalyzer(filepath).analyze_file()
        except Exception as e:
            results["metadata"] = {"error": str(e)}

        # Strings
        try:
            from modules.photo_analyzer.string_analyzer import StringAnalyzer
            sa = StringAnalyzer(filepath)
            results["strings"] = {
                "patterns": sa.find_patterns(),
                "categories": sa.categorize_strings(),
            }
        except Exception as e:
            results["strings"] = {"error": str(e)}

        # Binwalk
        try:
            from modules.photo_analyzer.binwalk_analyzer import BinwalkAnalyzer
            results["binwalk"] = BinwalkAnalyzer(filepath).basic_scan()
        except Exception as e:
            results["binwalk"] = {"error": str(e)}

        # Hex flags
        try:
            from modules.photo_analyzer.hex_viewer import HexViewer
            results["hex_flags"] = HexViewer(filepath).ctf_highlight_flags()
        except Exception as e:
            results["hex_flags"] = {"error": str(e)}

        return jsonify(results)
    except Exception as e:
        return jsonify({"error": str(e)}), 500
