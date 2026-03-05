"""
ForensicsMainHand 2.0 - Configuration Settings
"""
import os
import shutil


class Settings:
    """Application configuration"""
    APP_NAME = "ForensicsMainHand"
    APP_VERSION = "2.0"
    APP_DESCRIPTION = "Comprehensive Digital Forensics Analysis Suite"

    # Server settings
    HOST = "127.0.0.1"
    PORT = 5000
    DEBUG = False

    # Upload settings
    UPLOAD_FOLDER = os.path.join(os.path.dirname(os.path.dirname(__file__)), "uploads")
    OUTPUT_FOLDER = os.path.join(os.path.dirname(os.path.dirname(__file__)), "outputs")
    MAX_CONTENT_LENGTH = 500 * 1024 * 1024  # 500MB max upload

    # User-configurable output directory (None = use default per-file paths)
    CUSTOM_OUTPUT_DIR: str | None = None

    # Supported file formats
    SUPPORTED_IMAGE_FORMATS = {'.jpg', '.jpeg', '.png', '.gif', '.bmp', '.tiff', '.tif', '.webp', '.ico', '.svg'}
    SUPPORTED_ARCHIVE_FORMATS = {'.zip', '.tar', '.gz', '.bz2', '.xz', '.7z', '.rar', '.lz4', '.zst', '.arj'}
    SUPPORTED_AUDIO_FORMATS = {'.wav', '.mp3', '.ogg', '.flac'}

    # CTF Patterns
    CTF_PATTERNS = {
        'flag': r'(?i)(flag\{[^}]+\}|ctf\{[^}]+\}|HTB\{[^}]+\}|picoCTF\{[^}]+\}|THM\{[^}]+\})',
        'base64': r'[A-Za-z0-9+/]{20,}={0,2}',
        'hex': r'(?:0x)?[0-9a-fA-F]{16,}',
        'url': r'https?://[^\s<>"{}|\\^`\[\]]+',
        'email': r'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}',
        'ip': r'\b(?:\d{1,3}\.){3}\d{1,3}\b',
        'hash_md5': r'\b[a-fA-F0-9]{32}\b',
        'hash_sha1': r'\b[a-fA-F0-9]{40}\b',
        'hash_sha256': r'\b[a-fA-F0-9]{64}\b',
    }

    # Tool paths
    TOOLS = {
        'exiftool': 'exiftool',
        'steghide': 'steghide',
        'binwalk': 'binwalk',
        'foremost': 'foremost',
        'zsteg': 'zsteg',
        'strings': 'strings',
        'tesseract': 'tesseract',
        'hashcat': 'hashcat',
    }

    @classmethod
    def check_tools(cls) -> dict:
        """Check which tools are available"""
        results = {}
        for name, cmd in cls.TOOLS.items():
            results[name] = shutil.which(cmd) is not None
        return results

    @classmethod
    def get_missing_tools(cls) -> list:
        """Get list of missing tools"""
        tools = cls.check_tools()
        return [name for name, available in tools.items() if not available]

    @classmethod
    def is_tool_available(cls, tool_name: str) -> bool:
        """Check if a specific tool is available"""
        cmd = cls.TOOLS.get(tool_name)
        if not cmd:
            return False
        return shutil.which(cmd) is not None

    @classmethod
    def ensure_directories(cls):
        """Ensure upload and output directories exist"""
        os.makedirs(cls.UPLOAD_FOLDER, exist_ok=True)
        os.makedirs(cls.OUTPUT_FOLDER, exist_ok=True)
        if cls.CUSTOM_OUTPUT_DIR:
            os.makedirs(cls.CUSTOM_OUTPUT_DIR, exist_ok=True)

    @classmethod
    def get_output_dir(cls) -> str | None:
        """Return the custom output dir if set, else None."""
        return cls.CUSTOM_OUTPUT_DIR

    @classmethod
    def set_output_dir(cls, path: str | None):
        """Set (or clear) the custom output dir."""
        if path:
            path = os.path.expanduser(path)
            os.makedirs(path, exist_ok=True)
        cls.CUSTOM_OUTPUT_DIR = path or None
