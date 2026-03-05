"""
ForensicsMainHand 2.0 - Photo Analyzer: Crypto Analysis (encoding detection)
"""
import base64
import re
from typing import Dict, List, Any


class CryptoAnalyzer:
    """Analyze files/text for encoded content"""

    def __init__(self, filepath: str = None):
        self.filepath = filepath

    def decode_base64(self, text: str) -> Dict[str, Any]:
        try:
            decoded = base64.b64decode(text).decode('utf-8', errors='replace')
            return {"success": True, "decoded": decoded, "encoding": "base64"}
        except Exception as e:
            return {"error": str(e)}

    def decode_base32(self, text: str) -> Dict[str, Any]:
        try:
            decoded = base64.b32decode(text).decode('utf-8', errors='replace')
            return {"success": True, "decoded": decoded, "encoding": "base32"}
        except Exception as e:
            return {"error": str(e)}

    def decode_hex(self, text: str) -> Dict[str, Any]:
        try:
            cleaned = text.replace(' ', '').replace('\n', '')
            decoded = bytes.fromhex(cleaned).decode('utf-8', errors='replace')
            return {"success": True, "decoded": decoded, "encoding": "hex"}
        except Exception as e:
            return {"error": str(e)}

    def decode_rot13(self, text: str) -> Dict[str, Any]:
        import codecs
        decoded = codecs.decode(text, 'rot_13')
        return {"success": True, "decoded": decoded, "encoding": "rot13"}

    def decode_caesar(self, text: str) -> Dict[str, Any]:
        """Try all Caesar cipher shifts"""
        results = []
        for shift in range(1, 26):
            decrypted = ''
            for char in text:
                if char.isupper():
                    decrypted += chr((ord(char) - 65 - shift) % 26 + 65)
                elif char.islower():
                    decrypted += chr((ord(char) - 97 - shift) % 26 + 97)
                else:
                    decrypted += char

            # Score by printable ASCII ratio
            score = sum(c.isalpha() or c.isspace() for c in decrypted) / max(len(decrypted), 1)
            results.append({"shift": shift, "text": decrypted, "score": round(score, 3)})

        results.sort(key=lambda x: -x["score"])
        return {"results": results}

    def decode_binary(self, text: str) -> Dict[str, Any]:
        try:
            binary = text.replace(' ', '').replace('\n', '')
            decoded = ''.join(chr(int(binary[i:i+8], 2)) for i in range(0, len(binary), 8))
            return {"success": True, "decoded": decoded, "encoding": "binary"}
        except Exception as e:
            return {"error": str(e)}

    def decode_morse(self, text: str) -> Dict[str, Any]:
        morse_dict = {
            '.-': 'A', '-...': 'B', '-.-.': 'C', '-..': 'D', '.': 'E',
            '..-.': 'F', '--.': 'G', '....': 'H', '..': 'I', '.---': 'J',
            '-.-': 'K', '.-..': 'L', '--': 'M', '-.': 'N', '---': 'O',
            '.--.': 'P', '--.-': 'Q', '.-.': 'R', '...': 'S', '-': 'T',
            '..-': 'U', '...-': 'V', '.--': 'W', '-..-': 'X', '-.--': 'Y',
            '--..': 'Z', '-----': '0', '.----': '1', '..---': '2', '...--': '3',
            '....-': '4', '.....': '5', '-....': '6', '--...': '7', '---..': '8',
            '----.': '9',
        }
        try:
            words = text.strip().split(' / ')
            decoded = ' '.join(
                ''.join(morse_dict.get(c, '?') for c in word.split())
                for word in words
            )
            return {"success": True, "decoded": decoded, "encoding": "morse"}
        except Exception as e:
            return {"error": str(e)}

    def auto_decode(self, text: str) -> Dict[str, Any]:
        """Auto-detect and decode encoding"""
        results = []

        # Try Base64
        try:
            decoded = base64.b64decode(text).decode('utf-8')
            if decoded.isprintable():
                results.append({"encoding": "base64", "decoded": decoded, "confidence": 0.8})
        except Exception:
            pass

        # Try Base32
        try:
            decoded = base64.b32decode(text).decode('utf-8')
            if decoded.isprintable():
                results.append({"encoding": "base32", "decoded": decoded, "confidence": 0.7})
        except Exception:
            pass

        # Try Hex
        try:
            cleaned = text.replace(' ', '').replace('\n', '')
            if all(c in '0123456789abcdefABCDEF' for c in cleaned) and len(cleaned) % 2 == 0:
                decoded = bytes.fromhex(cleaned).decode('utf-8')
                if decoded.isprintable():
                    results.append({"encoding": "hex", "decoded": decoded, "confidence": 0.7})
        except Exception:
            pass

        # Try ROT13
        import codecs
        rot13 = codecs.decode(text, 'rot_13')
        if any(word in rot13.lower() for word in ['the', 'flag', 'ctf', 'and', 'is']):
            results.append({"encoding": "rot13", "decoded": rot13, "confidence": 0.6})

        # Try Binary
        cleaned = text.replace(' ', '').replace('\n', '')
        if all(c in '01' for c in cleaned) and len(cleaned) % 8 == 0:
            try:
                decoded = ''.join(chr(int(cleaned[i:i+8], 2)) for i in range(0, len(cleaned), 8))
                if decoded.isprintable():
                    results.append({"encoding": "binary", "decoded": decoded, "confidence": 0.8})
            except Exception:
                pass

        # Try Morse
        if set(text.strip()) <= {'.', '-', ' ', '/'}:
            result = self.decode_morse(text)
            if "decoded" in result:
                results.append({"encoding": "morse", "decoded": result["decoded"], "confidence": 0.7})

        results.sort(key=lambda x: -x["confidence"])
        return {"results": results}

    def search_for_flags(self, text: str = None) -> List[str]:
        """Search for CTF flags in text"""
        if text is None and self.filepath:
            with open(self.filepath, 'rb') as f:
                text = f.read().decode('utf-8', errors='replace')
        if not text:
            return []
        patterns = [
            r'(?i)flag\{[^}]+\}',
            r'(?i)ctf\{[^}]+\}',
            r'(?i)HTB\{[^}]+\}',
            r'(?i)picoCTF\{[^}]+\}',
            r'(?i)THM\{[^}]+\}',
        ]
        flags = []
        for pattern in patterns:
            flags.extend(re.findall(pattern, text))
        return flags
