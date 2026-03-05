"""
ForensicsMainHand 2.0 - Photo Analyzer: Steganography
"""
import subprocess
import shutil
import os
import tempfile
from typing import Dict, Any, Optional


class SteganographyAnalyzer:
    """Steganography analysis using steghide and stegano"""

    def __init__(self, filepath: str):
        self.filepath = filepath

    @staticmethod
    def check_steghide_available() -> bool:
        return shutil.which('steghide') is not None

    def inject_text(self, text: str, password: str = '', output_path: Optional[str] = None, output_dir: str = '') -> Dict[str, Any]:
        """Inject text into image using steghide"""
        if not self.check_steghide_available():
            return {"error": "steghide is not installed"}
        try:
            # Write text to temp file
            tmp_text = tempfile.NamedTemporaryFile(mode='w', suffix='.txt', delete=False)
            tmp_text.write(text)
            tmp_text.close()

            if not output_path:
                base, ext = os.path.splitext(self.filepath)
                fname = os.path.basename(base)
                if output_dir:
                    os.makedirs(output_dir, exist_ok=True)
                    output_path = os.path.join(output_dir, f"{fname}_steg{ext}")
                else:
                    output_path = f"{base}_steg{ext}"

            # Copy original to output
            import shutil as sh
            sh.copy2(self.filepath, output_path)

            cmd = ['steghide', 'embed', '-cf', output_path, '-ef', tmp_text.name, '-f']
            if password:
                cmd.extend(['-p', password])
            else:
                cmd.extend(['-p', ''])

            result = subprocess.run(cmd, capture_output=True, text=True, timeout=30)
            os.unlink(tmp_text.name)

            if result.returncode == 0:
                return {"success": True, "output_path": output_path, "message": "Text embedded successfully"}
            else:
                return {"error": result.stderr}
        except Exception as e:
            return {"error": str(e)}

    def inject_file(self, embed_filepath: str, password: str = '', output_path: Optional[str] = None, output_dir: str = '') -> Dict[str, Any]:
        """Inject a file into image using steghide"""
        if not self.check_steghide_available():
            return {"error": "steghide is not installed"}
        try:
            if not output_path:
                base, ext = os.path.splitext(self.filepath)
                fname = os.path.basename(base)
                if output_dir:
                    os.makedirs(output_dir, exist_ok=True)
                    output_path = os.path.join(output_dir, f"{fname}_steg{ext}")
                else:
                    output_path = f"{base}_steg{ext}"

            import shutil as sh
            sh.copy2(self.filepath, output_path)

            cmd = ['steghide', 'embed', '-cf', output_path, '-ef', embed_filepath, '-f']
            if password:
                cmd.extend(['-p', password])
            else:
                cmd.extend(['-p', ''])

            result = subprocess.run(cmd, capture_output=True, text=True, timeout=30)

            if result.returncode == 0:
                return {"success": True, "output_path": output_path}
            else:
                return {"error": result.stderr}
        except Exception as e:
            return {"error": str(e)}

    def extract_data(self, password: str = '') -> Dict[str, Any]:
        """Extract hidden data from image"""
        if not self.check_steghide_available():
            return {"error": "steghide is not installed"}
        try:
            output_file = tempfile.NamedTemporaryFile(suffix='.bin', delete=False)
            output_file.close()

            cmd = ['steghide', 'extract', '-sf', self.filepath, '-xf', output_file.name, '-f']
            if password:
                cmd.extend(['-p', password])
            else:
                cmd.extend(['-p', ''])

            result = subprocess.run(cmd, capture_output=True, text=True, timeout=30)

            if result.returncode == 0:
                with open(output_file.name, 'rb') as f:
                    data = f.read()
                os.unlink(output_file.name)
                try:
                    text = data.decode('utf-8')
                    return {"success": True, "data": text, "is_text": True}
                except UnicodeDecodeError:
                    import base64
                    return {"success": True, "data": base64.b64encode(data).decode(), "is_text": False, "size": len(data)}
            else:
                os.unlink(output_file.name)
                return {"error": result.stderr}
        except Exception as e:
            return {"error": str(e)}

    def detect_steganography(self) -> Dict[str, Any]:
        """Detect if steganography might be present"""
        if not self.check_steghide_available():
            return {"error": "steghide is not installed"}
        try:
            result = subprocess.run(
                ['steghide', 'info', self.filepath, '-p', ''],
                capture_output=True, text=True, timeout=30
            )
            return {
                "output": result.stdout + result.stderr,
                "has_embedded": 'embedded' in result.stdout.lower()
            }
        except Exception as e:
            return {"error": str(e)}

    def lsb_detect(self) -> Dict[str, Any]:
        """LSB steganography detection using stegano"""
        try:
            from stegano import lsb
            message = lsb.reveal(self.filepath)
            if message:
                return {"detected": True, "message": message}
            else:
                return {"detected": False, "message": "No LSB steganography detected"}
        except Exception as e:
            return {"error": str(e)}
