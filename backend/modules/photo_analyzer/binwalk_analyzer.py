"""
ForensicsMainHand 2.0 - Photo Analyzer: Binwalk Analysis
"""
import subprocess
import shutil
import os
import tempfile
from typing import Dict, List, Any


class BinwalkAnalyzer:
    """Binwalk file analysis for embedded data"""

    def __init__(self, filepath: str):
        self.filepath = filepath

    @staticmethod
    def check_binwalk_available() -> bool:
        return shutil.which('binwalk') is not None

    def basic_scan(self) -> List[Dict[str, str]]:
        """Basic binwalk scan"""
        if not self.check_binwalk_available():
            return [{"error": "binwalk is not installed"}]
        try:
            result = subprocess.run(
                ['binwalk', self.filepath],
                capture_output=True, text=True, timeout=60
            )
            return self._parse_scan_output(result.stdout)
        except Exception as e:
            return [{"error": str(e)}]

    def deep_scan(self) -> List[Dict[str, str]]:
        """Deep/entropy scan"""
        if not self.check_binwalk_available():
            return [{"error": "binwalk is not installed"}]
        try:
            result = subprocess.run(
                ['binwalk', '-B', '-A', self.filepath],
                capture_output=True, text=True, timeout=120
            )
            return self._parse_scan_output(result.stdout)
        except Exception as e:
            return [{"error": str(e)}]

    def extract_files(self, output_dir: str = '') -> Dict[str, Any]:
        """Extract embedded files"""
        if not self.check_binwalk_available():
            return {"error": "binwalk is not installed"}
        try:
            if output_dir:
                output_dir = os.path.join(output_dir, os.path.basename(self.filepath) + '_binwalk_extract')
                os.makedirs(output_dir, exist_ok=True)
            else:
                output_dir = tempfile.mkdtemp(prefix='fmh_binwalk_')
            result = subprocess.run(
                ['binwalk', '-e', '-C', output_dir, self.filepath],
                capture_output=True, text=True, timeout=120
            )
            # List extracted files
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

    def signature_scan(self) -> List[Dict[str, str]]:
        """Signature-only scan"""
        if not self.check_binwalk_available():
            return [{"error": "binwalk is not installed"}]
        try:
            result = subprocess.run(
                ['binwalk', '-B', self.filepath],
                capture_output=True, text=True, timeout=60
            )
            return self._parse_scan_output(result.stdout)
        except Exception as e:
            return [{"error": str(e)}]

    def _parse_scan_output(self, output: str) -> List[Dict[str, str]]:
        """Parse binwalk output"""
        results = []
        for line in output.strip().split('\n'):
            line = line.strip()
            if not line or line.startswith('DECIMAL') or line.startswith('-'):
                continue
            parts = line.split(None, 2)
            if len(parts) >= 3:
                results.append({
                    "offset_decimal": parts[0],
                    "offset_hex": parts[1],
                    "description": parts[2]
                })
        return results

    def analyze_file(self) -> Dict[str, Any]:
        """Full binwalk analysis"""
        return {
            "basic_scan": self.basic_scan(),
            "signature_scan": self.signature_scan(),
        }
