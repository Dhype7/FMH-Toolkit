"""
ForensicsMainHand 2.0 - Photo Analyzer: String Analysis
"""
import subprocess
import shutil
import re
from typing import Dict, List, Any, Optional
from config.settings import Settings


class StringAnalyzer:
    """Extract and analyze strings from files"""

    def __init__(self, filepath: str):
        self.filepath = filepath

    @staticmethod
    def check_strings_available() -> bool:
        return shutil.which('strings') is not None

    def extract_strings(self, min_length: int = 4, encoding: str = 's') -> List[str]:
        """Extract strings from file using the strings command"""
        if not self.check_strings_available():
            return ["Error: 'strings' command not found"]
        try:
            result = subprocess.run(
                ['strings', f'-n{min_length}', f'-e{encoding}', self.filepath],
                capture_output=True, text=True, timeout=60
            )
            return result.stdout.strip().split('\n') if result.stdout.strip() else []
        except Exception as e:
            return [f"Error: {str(e)}"]

    def search_strings(self, search_term: str, min_length: int = 4) -> List[str]:
        """Search extracted strings for a pattern"""
        strings = self.extract_strings(min_length)
        return [s for s in strings if search_term.lower() in s.lower()]

    def search_with_grep(self, pattern: str) -> List[str]:
        """Search file strings using grep-style regex"""
        strings = self.extract_strings()
        try:
            regex = re.compile(pattern, re.IGNORECASE)
            return [s for s in strings if regex.search(s)]
        except re.error:
            return [f"Invalid regex pattern: {pattern}"]

    def find_patterns(self) -> Dict[str, List[str]]:
        """Find common CTF patterns in strings"""
        strings = self.extract_strings()
        combined = '\n'.join(strings)
        results = {}
        for name, pattern in Settings.CTF_PATTERNS.items():
            matches = re.findall(pattern, combined)
            if matches:
                results[name] = matches
        return results

    def categorize_strings(self) -> Dict[str, List[str]]:
        """Categorize strings by type"""
        strings = self.extract_strings()
        categories = {
            "urls": [], "emails": [], "ip_addresses": [],
            "flags": [], "base64": [], "hashes": [],
            "paths": [], "interesting": []
        }
        for s in strings:
            if re.match(r'https?://', s):
                categories["urls"].append(s)
            elif re.match(r'[^@]+@[^@]+\.[^@]+', s):
                categories["emails"].append(s)
            elif re.match(r'\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b', s):
                categories["ip_addresses"].append(s)
            elif re.search(r'(?i)(flag|ctf|HTB|pico)\{', s):
                categories["flags"].append(s)
            elif re.match(r'^[A-Za-z0-9+/]{20,}={0,2}$', s):
                categories["base64"].append(s)
            elif re.match(r'^[a-fA-F0-9]{32,64}$', s):
                categories["hashes"].append(s)
            elif '/' in s and len(s) > 5:
                categories["paths"].append(s)

        return {k: v for k, v in categories.items() if v}

    def analyze(self) -> Dict[str, Any]:
        """Full string analysis"""
        strings = self.extract_strings()
        return {
            "total_strings": len(strings),
            "strings": strings[:500],  # Limit for response size
            "patterns": self.find_patterns(),
            "categories": self.categorize_strings(),
        }
