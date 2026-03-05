"""
ForensicsMainHand 2.0 - Photo Analyzer: OCR
"""
import re
import shutil
from typing import Dict, Any, List, Optional


class OCRAnalyzer:
    """OCR text extraction using Tesseract"""

    def __init__(self, filepath: str):
        self.filepath = filepath

    @staticmethod
    def check_tesseract_available() -> bool:
        return shutil.which('tesseract') is not None

    def extract_text(self, lang: str = 'eng') -> Dict[str, Any]:
        """Extract text from image via OCR (basic)"""
        if not self.check_tesseract_available():
            return {"error": "tesseract is not installed"}
        try:
            import pytesseract
            from PIL import Image
            img = Image.open(self.filepath)
            text = pytesseract.image_to_string(img, lang=lang)
            return {
                "text": text,
                "language": lang,
                "method": "basic",
                "char_count": len(text),
                "word_count": len(text.split()),
                "line_count": len(text.strip().split('\n')) if text.strip() else 0,
            }
        except Exception as e:
            return {"error": str(e)}

    def extract_text_with_preprocessing(self, lang: str = 'eng') -> Dict[str, Any]:
        """Extract text with image preprocessing (advanced)"""
        if not self.check_tesseract_available():
            return {"error": "tesseract is not installed"}
        try:
            import pytesseract
            from PIL import Image, ImageFilter, ImageEnhance
            import numpy as np

            img = Image.open(self.filepath)
            # Convert to grayscale
            gray = img.convert('L')
            # Enhance contrast
            enhancer = ImageEnhance.Contrast(gray)
            enhanced = enhancer.enhance(2.0)
            # Sharpen
            sharpened = enhanced.filter(ImageFilter.SHARPEN)
            # Threshold for better OCR
            threshold = sharpened.point(lambda x: 0 if x < 128 else 255, '1')

            text = pytesseract.image_to_string(threshold, lang=lang)
            return {
                "text": text,
                "language": lang,
                "method": "advanced",
                "preprocessed": True,
                "char_count": len(text),
                "word_count": len(text.split()),
                "line_count": len(text.strip().split('\n')) if text.strip() else 0,
            }
        except Exception as e:
            return {"error": str(e)}

    def find_flags(self, lang: str = 'eng') -> Dict[str, Any]:
        """OCR + search for CTF flags and interesting patterns"""
        result = self.extract_text(lang)
        if "error" in result:
            return result
        text = result["text"]

        flag_patterns = [
            (r'(?i)(flag\{[^}]+\})', 'flag{}'),
            (r'(?i)(ctf\{[^}]+\})', 'CTF{}'),
            (r'(?i)(HTB\{[^}]+\})', 'HTB{}'),
            (r'(?i)(picoCTF\{[^}]+\})', 'picoCTF{}'),
            (r'(?i)(THM\{[^}]+\})', 'THM{}'),
            (r'(?i)(DUCTF\{[^}]+\})', 'DUCTF{}'),
        ]

        found_flags: List[Dict[str, str]] = []
        for pattern, ptype in flag_patterns:
            for m in re.finditer(pattern, text):
                found_flags.append({"flag": m.group(1), "type": ptype, "position": m.start()})

        # Also check for base64, hex, URLs
        interesting: List[Dict[str, str]] = []
        for m in re.finditer(r'https?://\S+', text):
            interesting.append({"type": "URL", "value": m.group(), "position": m.start()})
        for m in re.finditer(r'[A-Za-z0-9+/]{20,}={0,2}', text):
            interesting.append({"type": "Possible Base64", "value": m.group(), "position": m.start()})
        for m in re.finditer(r'\b[a-fA-F0-9]{32,64}\b', text):
            interesting.append({"type": "Possible Hash", "value": m.group(), "position": m.start()})

        result["flags"] = found_flags
        result["interesting"] = interesting
        result["total_flags"] = len(found_flags)
        return result

    def search_text(self, search_term: str, lang: str = 'eng') -> Dict[str, Any]:
        """Search OCR text for specific terms"""
        result = self.extract_text(lang)
        if "error" in result:
            return result
        text = result["text"]
        lines = text.split('\n')
        matches = [line for line in lines if search_term.lower() in line.lower()]
        return {"matches": matches, "total": len(matches), "search_term": search_term}
