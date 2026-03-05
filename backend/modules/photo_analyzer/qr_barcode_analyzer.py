"""
ForensicsMainHand 2.0 - Photo Analyzer: QR/Barcode Scanner
"""
from typing import Dict, List, Any


class QRBarcodeAnalyzer:
    """Detect and decode QR codes and barcodes"""

    def __init__(self, filepath: str):
        self.filepath = filepath

    @staticmethod
    def check_zbar_available() -> bool:
        try:
            import pyzbar
            return True
        except ImportError:
            return False

    def detect_codes(self) -> Dict[str, Any]:
        """Detect QR codes and barcodes in image"""
        try:
            from pyzbar.pyzbar import decode
            from PIL import Image

            img = Image.open(self.filepath)
            codes = decode(img)

            results = []
            for code in codes:
                results.append({
                    "type": code.type,
                    "data": code.data.decode('utf-8', errors='replace'),
                    "rect": {
                        "left": code.rect.left,
                        "top": code.rect.top,
                        "width": code.rect.width,
                        "height": code.rect.height
                    }
                })
            return {"codes": results, "total": len(results)}
        except Exception as e:
            return {"error": str(e)}

    def detect_codes_with_preprocessing(self) -> Dict[str, Any]:
        """Detect codes with preprocessing for better results"""
        try:
            from pyzbar.pyzbar import decode
            from PIL import Image, ImageFilter, ImageEnhance
            import numpy as np

            img = Image.open(self.filepath)
            results = []

            # Try original
            codes = decode(img)
            for code in codes:
                results.append({
                    "type": code.type,
                    "data": code.data.decode('utf-8', errors='replace'),
                    "method": "original"
                })

            # Try grayscale + enhanced
            gray = img.convert('L')
            enhanced = ImageEnhance.Contrast(gray).enhance(2.0)
            codes = decode(enhanced)
            for code in codes:
                data = code.data.decode('utf-8', errors='replace')
                if not any(r['data'] == data for r in results):
                    results.append({
                        "type": code.type,
                        "data": data,
                        "method": "enhanced"
                    })

            return {"codes": results, "total": len(results)}
        except Exception as e:
            return {"error": str(e)}

    def analyze_code_content(self) -> Dict[str, Any]:
        """Analyze content of detected codes"""
        import re
        result = self.detect_codes()
        if "error" in result:
            return result

        analysis = []
        for code in result.get("codes", []):
            data = code["data"]
            content_type = "text"
            if re.match(r'https?://', data):
                content_type = "url"
            elif re.match(r'[^@]+@[^@]+\.[^@]+', data):
                content_type = "email"
            elif re.search(r'(?i)(flag|ctf)\{', data):
                content_type = "flag"
            elif data.startswith('BEGIN:VCARD'):
                content_type = "vcard"

            analysis.append({
                **code,
                "content_type": content_type
            })

        return {"codes": analysis, "total": len(analysis)}
