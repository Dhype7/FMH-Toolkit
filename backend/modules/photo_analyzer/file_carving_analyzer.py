"""
ForensicsMainHand 2.0 - Photo Analyzer: File Carving
"""
import subprocess
import shutil
import os
import tempfile
import re
from typing import Dict, List, Any


class FileCarvingAnalyzer:
    """File carving using foremost and binwalk"""

    SIGNATURES = {
        b'\xFF\xD8\xFF': ('JPEG', '.jpg'),
        b'\x89\x50\x4E\x47': ('PNG', '.png'),
        b'\x47\x49\x46\x38': ('GIF', '.gif'),
        b'\x50\x4B\x03\x04': ('ZIP/DOCX/APK', '.zip'),
        b'\x25\x50\x44\x46': ('PDF', '.pdf'),
        b'\x52\x61\x72\x21': ('RAR', '.rar'),
        b'\x1F\x8B\x08': ('GZIP', '.gz'),
        b'\x42\x5A\x68': ('BZIP2', '.bz2'),
        b'\x37\x7A\xBC\xAF': ('7-Zip', '.7z'),
        b'\x00\x00\x01\x00': ('ICO', '.ico'),
        b'\x4D\x5A': ('EXE/DLL', '.exe'),
        b'\x7F\x45\x4C\x46': ('ELF', '.elf'),
    }

    def __init__(self, filepath: str):
        self.filepath = filepath

    @staticmethod
    def check_foremost_available() -> bool:
        return shutil.which('foremost') is not None

    @staticmethod
    def check_binwalk_available() -> bool:
        return shutil.which('binwalk') is not None

    def extract_with_foremost(self, output_dir: str = '') -> Dict[str, Any]:
        """Extract files using foremost"""
        if not self.check_foremost_available():
            return {"error": "foremost is not installed"}
        try:
            if output_dir:
                output_dir = os.path.join(output_dir, os.path.basename(self.filepath) + '_foremost')
                os.makedirs(output_dir, exist_ok=True)
            else:
                output_dir = tempfile.mkdtemp(prefix='fmh_foremost_')
            result = subprocess.run(
                ['foremost', '-i', self.filepath, '-o', output_dir, '-T'],
                capture_output=True, text=True, timeout=120
            )
            extracted = []
            for root, dirs, files in os.walk(output_dir):
                for f in files:
                    fpath = os.path.join(root, f)
                    extracted.append({
                        "name": f,
                        "path": fpath,
                        "size": os.path.getsize(fpath)
                    })
            return {
                "output": result.stdout,
                "output_dir": output_dir,
                "extracted_files": extracted,
                "total": len(extracted)
            }
        except Exception as e:
            return {"error": str(e)}

    def extract_with_binwalk(self, output_dir: str = '') -> Dict[str, Any]:
        """Extract files using binwalk"""
        if not self.check_binwalk_available():
            return {"error": "binwalk is not installed"}
        try:
            if output_dir:
                output_dir = os.path.join(output_dir, os.path.basename(self.filepath) + '_binwalk')
                os.makedirs(output_dir, exist_ok=True)
            else:
                output_dir = tempfile.mkdtemp(prefix='fmh_binwalk_')
            result = subprocess.run(
                ['binwalk', '-e', '-C', output_dir, self.filepath],
                capture_output=True, text=True, timeout=120
            )
            extracted = []
            for root, dirs, files in os.walk(output_dir):
                for f in files:
                    fpath = os.path.join(root, f)
                    extracted.append({
                        "name": f,
                        "path": fpath,
                        "size": os.path.getsize(fpath)
                    })
            return {
                "output": result.stdout,
                "output_dir": output_dir,
                "extracted_files": extracted,
                "total": len(extracted)
            }
        except Exception as e:
            return {"error": str(e)}

    def scan_file_signatures(self) -> List[Dict[str, Any]]:
        """Scan for embedded file signatures"""
        results = []
        try:
            with open(self.filepath, 'rb') as f:
                data = f.read()

            for sig, (name, ext) in self.SIGNATURES.items():
                offset = 0
                while True:
                    idx = data.find(sig, offset)
                    if idx == -1:
                        break
                    results.append({
                        "type": name,
                        "extension": ext,
                        "offset": idx,
                        "offset_hex": hex(idx)
                    })
                    offset = idx + 1
        except Exception as e:
            results.append({"error": str(e)})
        return results

    def auto_carve(self, output_dir: str = '') -> Dict[str, Any]:
        """Auto-carve using best available tool"""
        if self.check_foremost_available():
            return self.extract_with_foremost(output_dir=output_dir)
        elif self.check_binwalk_available():
            return self.extract_with_binwalk(output_dir=output_dir)
        else:
            return {
                "error": "Neither foremost nor binwalk is available",
                "signatures": self.scan_file_signatures()
            }
