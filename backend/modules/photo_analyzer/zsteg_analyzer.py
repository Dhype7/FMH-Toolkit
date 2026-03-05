"""
ForensicsMainHand 2.0 - Photo Analyzer: Zsteg Analysis
"""
import subprocess
import shutil
from typing import Dict, List, Any


class ZstegAnalyzer:
    """Zsteg analysis for PNG/BMP steganography"""

    def __init__(self, filepath: str):
        self.filepath = filepath

    @staticmethod
    def check_zsteg_available() -> bool:
        return shutil.which('zsteg') is not None

    def basic_scan(self) -> Dict[str, Any]:
        """Basic zsteg scan"""
        if not self.check_zsteg_available():
            return {"error": "zsteg is not installed"}
        try:
            result = subprocess.run(
                ['zsteg', self.filepath],
                capture_output=True, text=True, timeout=60
            )
            return {
                "output": result.stdout,
                "results": self._parse_output(result.stdout),
                "errors": result.stderr if result.stderr else None
            }
        except Exception as e:
            return {"error": str(e)}

    def all_channels(self) -> Dict[str, Any]:
        """Scan all channels"""
        if not self.check_zsteg_available():
            return {"error": "zsteg is not installed"}
        try:
            result = subprocess.run(
                ['zsteg', '-a', self.filepath],
                capture_output=True, text=True, timeout=120
            )
            return {
                "output": result.stdout,
                "results": self._parse_output(result.stdout),
            }
        except Exception as e:
            return {"error": str(e)}

    def lsb_scan(self) -> Dict[str, Any]:
        """LSB-specific scan"""
        if not self.check_zsteg_available():
            return {"error": "zsteg is not installed"}
        try:
            result = subprocess.run(
                ['zsteg', self.filepath, '--lsb'],
                capture_output=True, text=True, timeout=60
            )
            return {
                "mode": "LSB",
                "output": result.stdout,
                "results": self._parse_output(result.stdout),
                "errors": result.stderr if result.stderr else None,
            }
        except Exception as e:
            return {"error": str(e)}

    def msb_scan(self) -> Dict[str, Any]:
        """MSB-specific scan"""
        if not self.check_zsteg_available():
            return {"error": "zsteg is not installed"}
        try:
            result = subprocess.run(
                ['zsteg', self.filepath, '--msb'],
                capture_output=True, text=True, timeout=60
            )
            return {
                "mode": "MSB",
                "output": result.stdout,
                "results": self._parse_output(result.stdout),
                "errors": result.stderr if result.stderr else None,
            }
        except Exception as e:
            return {"error": str(e)}

    def specific_channel(self, channel: str) -> Dict[str, Any]:
        """Scan a specific channel like 'r', 'g', 'b', 'a', 'rgb', etc."""
        if not self.check_zsteg_available():
            return {"error": "zsteg is not installed"}
        try:
            # Use -b for specific bit-channel combos
            result = subprocess.run(
                ['zsteg', self.filepath, '-b', channel],
                capture_output=True, text=True, timeout=60
            )
            return {
                "channel": channel,
                "output": result.stdout,
                "results": self._parse_output(result.stdout),
                "errors": result.stderr if result.stderr else None,
            }
        except Exception as e:
            return {"error": str(e)}

    def extract_data(self, channel: str = 'b1,rgb,lsb') -> Dict[str, Any]:
        """Extract data from specific channel"""
        if not self.check_zsteg_available():
            return {"error": "zsteg is not installed"}
        try:
            result = subprocess.run(
                ['zsteg', '-E', channel, self.filepath],
                capture_output=True, text=True, timeout=60
            )
            data = result.stdout
            # Try to detect if it's printable text
            printable = sum(1 for c in data[:200] if c.isprintable() or c in '\n\r\t')
            is_text = printable > len(data[:200]) * 0.7 if data else False
            return {
                "channel": channel,
                "data": data[:5000] if is_text else data[:500],
                "data_length": len(data),
                "is_text": is_text,
                "errors": result.stderr if result.stderr else None
            }
        except Exception as e:
            return {"error": str(e)}

    def _parse_output(self, output: str) -> List[Dict[str, str]]:
        """Parse zsteg output"""
        results = []
        for line in output.strip().split('\n'):
            line = line.strip()
            if not line:
                continue
            if ':' in line:
                channel, _, data = line.partition(':')
                results.append({
                    "channel": channel.strip(),
                    "data": data.strip()
                })
        return results

    def analyze(self) -> Dict[str, Any]:
        """Full zsteg analysis"""
        return {
            "basic": self.basic_scan(),
            "all_channels": self.all_channels(),
        }
