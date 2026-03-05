"""
ForensicsMainHand 2.0 - Photo Analyzer: Metadata Analysis (exiftool)
"""
import subprocess
import shutil
import re
from typing import Dict, List, Any, Optional


class MetadataAnalyzer:
    """Extract metadata using exiftool"""

    def __init__(self, filepath: str):
        self.filepath = filepath

    @staticmethod
    def check_exiftool_available() -> bool:
        return shutil.which('exiftool') is not None

    def extract_metadata(self) -> Dict[str, str]:
        """Extract all metadata using exiftool"""
        if not self.check_exiftool_available():
            return {"error": "exiftool is not installed"}
        try:
            result = subprocess.run(
                ['exiftool', self.filepath],
                capture_output=True, text=True, timeout=30
            )
            return self._parse_exiftool_output(result.stdout)
        except Exception as e:
            return {"error": str(e)}

    def _parse_exiftool_output(self, output: str) -> Dict[str, str]:
        """Parse exiftool output into dict"""
        metadata = {}
        for line in output.strip().split('\n'):
            if ':' in line:
                key, _, value = line.partition(':')
                metadata[key.strip()] = value.strip()
        return metadata

    def find_flags(self) -> List[str]:
        """Search metadata for CTF-style flags"""
        metadata = self.extract_metadata()
        if "error" in metadata:
            return []
        flag_patterns = [
            r'(?i)(flag\{[^}]+\})',
            r'(?i)(ctf\{[^}]+\})',
            r'(?i)(HTB\{[^}]+\})',
            r'(?i)(picoCTF\{[^}]+\})',
        ]
        flags = []
        combined = ' '.join(metadata.values())
        for pattern in flag_patterns:
            flags.extend(re.findall(pattern, combined))
        return flags

    def search_metadata(self, search_term: str) -> Dict[str, str]:
        """Search metadata for a specific term"""
        metadata = self.extract_metadata()
        if "error" in metadata:
            return metadata
        return {k: v for k, v in metadata.items() if search_term.lower() in k.lower() or search_term.lower() in v.lower()}

    def analyze_file(self) -> Dict[str, Any]:
        """Full metadata analysis"""
        metadata = self.extract_metadata()
        return {
            "metadata": metadata,
            "total_tags": len(metadata),
            "flags": self.find_flags(),
            "file_type": metadata.get("File Type", "Unknown"),
            "mime_type": metadata.get("MIME Type", "Unknown"),
        }

    # ── Deep Scan ──────────────────────────────────────────────
    def deep_scan(self) -> Dict[str, Any]:
        """Deep metadata scan using exiftool -v2 for verbose output"""
        if not self.check_exiftool_available():
            return {"error": "exiftool is not installed"}
        try:
            result = subprocess.run(
                ['exiftool', '-v2', self.filepath],
                capture_output=True, text=True, timeout=60
            )
            verbose = result.stdout
            # Also get normal metadata
            metadata = self.extract_metadata()
            # Group metadata by category
            groups: Dict[str, Dict[str, str]] = {}
            result2 = subprocess.run(
                ['exiftool', '-G', self.filepath],
                capture_output=True, text=True, timeout=30
            )
            for line in result2.stdout.strip().split('\n'):
                if ':' in line:
                    m = re.match(r'\[(\w+)\]\s+(.+?)\s*:\s*(.*)', line)
                    if m:
                        group, key, val = m.group(1), m.group(2).strip(), m.group(3).strip()
                        groups.setdefault(group, {})[key] = val
            return {
                "metadata": metadata,
                "total_tags": len(metadata),
                "grouped": groups,
                "verbose_output": verbose[:10000],  # limit size
                "flags": self.find_flags(),
                "file_type": metadata.get("File Type", "Unknown"),
                "mime_type": metadata.get("MIME Type", "Unknown"),
                "deep_scan": True,
            }
        except Exception as e:
            return {"error": str(e)}

    # ── Suspicious Lines ───────────────────────────────────────
    def find_suspicious(self) -> Dict[str, Any]:
        """Find suspicious metadata entries"""
        metadata = self.extract_metadata()
        if "error" in metadata:
            return metadata

        suspicious: list = []
        info: list = []

        # 1. Editing software
        for key in ['Creator Tool', 'Software', 'History Software Agent']:
            val = metadata.get(key, '')
            if val:
                edit_tools = ['photoshop', 'gimp', 'paint', 'lightroom', 'snapseed',
                              'picsart', 'canva', 'pixlr', 'ffmpeg', 'imagemagick']
                for tool in edit_tools:
                    if tool.lower() in val.lower():
                        suspicious.append({"tag": key, "value": val, "reason": f"Modified with {tool.title()}"})

        # 2. Multiple modification dates
        date_keys = [k for k in metadata if 'date' in k.lower() or 'time' in k.lower()]
        dates = {k: metadata[k] for k in date_keys if metadata[k]}
        unique_vals = set(dates.values())
        if len(unique_vals) > 2:
            suspicious.append({"tag": "Date Analysis", "value": dates, "reason": "Multiple different timestamps"})

        # 3. Hidden comments / descriptions
        comment_keys = ['Comment', 'User Comment', 'Description', 'Subject',
                        'Image Description', 'XP Comment', 'XP Subject', 'XP Keywords']
        for ck in comment_keys:
            val = metadata.get(ck, '')
            if val and len(val) > 2:
                if re.search(r'(?i)(flag|ctf|HTB|pico)\{', val):
                    suspicious.append({"tag": ck, "value": val, "reason": "CTF flag detected!"})
                elif re.search(r'(?i)(base64|secret|hidden|password|encoded)', val):
                    suspicious.append({"tag": ck, "value": val, "reason": "Suspicious keyword"})
                else:
                    info.append({"tag": ck, "value": val, "reason": "Comment/description field populated"})

        # 4. Embedded profiles or ICC
        for k, v in metadata.items():
            if 'profile' in k.lower() or 'icc' in k.lower():
                info.append({"tag": k, "value": v, "reason": "Color profile data"})

        # 5. GPS data
        gps = {k: v for k, v in metadata.items() if 'gps' in k.lower()}
        if gps:
            info.append({"tag": "GPS", "value": gps, "reason": "Location data present"})

        # 6. History / editing actions
        history = {k: v for k, v in metadata.items() if 'history' in k.lower()}
        if history:
            suspicious.append({"tag": "Edit History", "value": history, "reason": "File has editing history"})

        return {
            "suspicious": suspicious,
            "info": info,
            "total_suspicious": len(suspicious),
            "total_info": len(info),
        }
