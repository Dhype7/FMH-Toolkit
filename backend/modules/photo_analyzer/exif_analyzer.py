"""
ForensicsMainHand 2.0 - Photo Analyzer: EXIF Analysis
"""
import os
from typing import Dict, Optional, Any


class EXIFAnalyzer:
    """Extract and analyze EXIF metadata from images"""

    def __init__(self, filepath: str):
        self.filepath = filepath
        self.exif_data = {}

    def extract_exif(self) -> Dict[str, Any]:
        """Extract EXIF data from image"""
        try:
            import exifread
            with open(self.filepath, 'rb') as f:
                tags = exifread.process_file(f, details=True)
            self.exif_data = {str(k): str(v) for k, v in tags.items()}
            return self.exif_data
        except Exception as e:
            return {"error": str(e)}

    def get_device_info(self) -> Dict[str, str]:
        """Get camera/device information"""
        if not self.exif_data:
            self.extract_exif()
        keys = ['Image Make', 'Image Model', 'Image Software', 'EXIF LensModel']
        return {k: self.exif_data.get(k, 'N/A') for k in keys}

    def get_date_time_info(self) -> Dict[str, str]:
        """Get date/time information"""
        if not self.exif_data:
            self.extract_exif()
        keys = ['EXIF DateTimeOriginal', 'EXIF DateTimeDigitized', 'Image DateTime']
        return {k: self.exif_data.get(k, 'N/A') for k in keys}

    def get_image_properties(self) -> Dict[str, str]:
        """Get image dimension/resolution info"""
        if not self.exif_data:
            self.extract_exif()
        keys = ['EXIF ExifImageWidth', 'EXIF ExifImageLength', 'EXIF XResolution', 'EXIF YResolution']
        return {k: self.exif_data.get(k, 'N/A') for k in keys}

    def get_camera_settings(self) -> Dict[str, str]:
        """Get camera exposure settings"""
        if not self.exif_data:
            self.extract_exif()
        keys = ['EXIF ExposureTime', 'EXIF FNumber', 'EXIF ISOSpeedRatings',
                'EXIF FocalLength', 'EXIF Flash', 'EXIF WhiteBalance']
        return {k: self.exif_data.get(k, 'N/A') for k in keys}

    def has_gps_data(self) -> bool:
        """Check if GPS data exists"""
        if not self.exif_data:
            self.extract_exif()
        return any('GPS' in k for k in self.exif_data)

    def get_gps_data(self) -> Dict[str, str]:
        """Get raw GPS EXIF tags"""
        if not self.exif_data:
            self.extract_exif()
        return {k: v for k, v in self.exif_data.items() if 'GPS' in k}

    def get_summary(self) -> Dict[str, Any]:
        """Full EXIF summary"""
        if not self.exif_data:
            self.extract_exif()
        return {
            "total_tags": len(self.exif_data),
            "device": self.get_device_info(),
            "datetime": self.get_date_time_info(),
            "properties": self.get_image_properties(),
            "camera": self.get_camera_settings(),
            "has_gps": self.has_gps_data(),
            "gps": self.get_gps_data(),
            "all_tags": self.exif_data,
        }

    # ── Deep Scan ──────────────────────────────────────────────
    def deep_scan(self) -> Dict[str, Any]:
        """Deep EXIF scan — extracts maker notes, thumbnail info, all IFDs"""
        if not self.exif_data:
            self.extract_exif()
        result = self.get_summary()

        # Thumbnail info
        thumb_keys = {k: v for k, v in self.exif_data.items() if 'thumbnail' in k.lower() or 'thumb' in k.lower()}
        result["thumbnail"] = thumb_keys if thumb_keys else {"status": "No thumbnail data found"}

        # Maker notes
        maker = {k: v for k, v in self.exif_data.items() if 'makernote' in k.lower() or 'maker' in k.lower()}
        result["maker_notes"] = maker if maker else {"status": "No maker notes found"}

        # Interop / IFD details
        interop = {k: v for k, v in self.exif_data.items() if 'interop' in k.lower()}
        result["interop"] = interop if interop else {}

        # File-level info (software, unique ID, etc.)
        misc_keys = ['Image Software', 'Image ImageDescription', 'Image Artist',
                      'Image Copyright', 'EXIF UserComment', 'Image HostComputer',
                      'EXIF ImageUniqueID', 'Image ProcessingSoftware']
        result["file_info"] = {k: self.exif_data.get(k, 'N/A') for k in misc_keys}

        result["deep_scan"] = True
        return result

    # ── Suspicious EXIF Lines ──────────────────────────────────
    def find_suspicious(self) -> Dict[str, Any]:
        """Find suspicious or forensically-interesting EXIF entries"""
        import re
        if not self.exif_data:
            self.extract_exif()

        suspicious: list = []
        info: list = []

        # 1. Software modifications
        software = self.exif_data.get('Image Software', '')
        edit_tools = ['photoshop', 'gimp', 'paint', 'lightroom', 'snapseed',
                      'picsart', 'canva', 'pixlr', 'affinity', 'capture one']
        for tool in edit_tools:
            if tool.lower() in software.lower():
                suspicious.append({
                    "tag": "Image Software",
                    "value": software,
                    "reason": f"Image was edited with {tool.title()}"
                })

        # 2. Date inconsistencies
        dates: Dict[str, str] = {}
        for k in ['EXIF DateTimeOriginal', 'EXIF DateTimeDigitized', 'Image DateTime']:
            v = self.exif_data.get(k, '')
            if v and v != 'N/A':
                dates[k] = v
        unique_dates = set(dates.values())
        if len(unique_dates) > 1:
            suspicious.append({
                "tag": "Date Mismatch",
                "value": dates,
                "reason": "Multiple different timestamps found — possible editing"
            })

        # 3. GPS data present (privacy concern)
        if self.has_gps_data():
            info.append({
                "tag": "GPS Data",
                "value": "Present",
                "reason": "Image contains GPS location data — privacy risk"
            })

        # 4. Unusual comments or descriptions
        for k in ['EXIF UserComment', 'Image ImageDescription', 'Image Artist', 'Image Copyright']:
            v = self.exif_data.get(k, '')
            if v and v != 'N/A' and len(v) > 3:
                # Check for flags or hidden text
                if re.search(r'(?i)(flag|ctf|HTB|pico)\{', v):
                    suspicious.append({"tag": k, "value": v, "reason": "Possible CTF flag in EXIF field"})
                elif re.search(r'(?i)(base64|hex|hidden|secret|password)', v):
                    suspicious.append({"tag": k, "value": v, "reason": "Suspicious keyword in metadata"})
                else:
                    info.append({"tag": k, "value": v, "reason": "Contains text data"})

        # 5. Thumbnail mismatch detection hint
        thumb = {k: v for k, v in self.exif_data.items() if 'thumbnail' in k.lower()}
        if thumb:
            info.append({"tag": "Thumbnail", "value": "Present", "reason": "Thumbnail exists — may differ from main image"})

        # 6. Stripped/minimal metadata
        if len(self.exif_data) < 5:
            suspicious.append({
                "tag": "Low Tag Count",
                "value": str(len(self.exif_data)),
                "reason": "Very few EXIF tags — metadata may have been stripped"
            })

        return {
            "suspicious": suspicious,
            "info": info,
            "total_suspicious": len(suspicious),
            "total_info": len(info),
        }
