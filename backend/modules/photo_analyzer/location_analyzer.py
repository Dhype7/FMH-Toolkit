"""
ForensicsMainHand 2.0 - Photo Analyzer: Location Analysis
"""
import os
import re
from typing import Dict, Optional, Tuple, Any


class LocationAnalyzer:
    """Extract and analyze GPS/location data from images"""

    def __init__(self, filepath: str):
        self.filepath = filepath

    def extract_gps_data(self) -> Dict[str, Any]:
        """Extract GPS data using exifread"""
        try:
            import exifread
            with open(self.filepath, 'rb') as f:
                tags = exifread.process_file(f, details=True)

            gps_tags = {str(k): str(v) for k, v in tags.items() if 'GPS' in str(k)}
            if not gps_tags:
                return {"error": "No GPS data found"}

            coords = self.get_coordinates(tags)
            if coords:
                gps_tags['latitude'] = coords[0]
                gps_tags['longitude'] = coords[1]
                gps_tags['google_maps_url'] = f"https://maps.google.com/?q={coords[0]},{coords[1]}"

                location = self.reverse_geocode(coords[0], coords[1])
                if location:
                    gps_tags['address'] = location

            return gps_tags
        except Exception as e:
            return {"error": str(e)}

    def get_coordinates(self, tags) -> Optional[Tuple[float, float]]:
        """Convert GPS EXIF tags to decimal coordinates"""
        try:
            lat_ref = str(tags.get('GPS GPSLatitudeRef', 'N'))
            lon_ref = str(tags.get('GPS GPSLongitudeRef', 'E'))
            lat_tag = tags.get('GPS GPSLatitude')
            lon_tag = tags.get('GPS GPSLongitude')

            if not lat_tag or not lon_tag:
                return None

            lat = self._convert_to_degrees(lat_tag)
            lon = self._convert_to_degrees(lon_tag)

            if lat_ref == 'S':
                lat = -lat
            if lon_ref == 'W':
                lon = -lon

            return (lat, lon)
        except Exception:
            return None

    @staticmethod
    def _convert_to_degrees(value) -> float:
        """Convert GPS coordinates to degrees"""
        values = value.values
        d = float(values[0].num) / float(values[0].den) if values[0].den else 0
        m = float(values[1].num) / float(values[1].den) if values[1].den else 0
        s = float(values[2].num) / float(values[2].den) if values[2].den else 0
        return d + (m / 60.0) + (s / 3600.0)

    @staticmethod
    def reverse_geocode(lat: float, lon: float) -> Optional[str]:
        """Reverse geocode coordinates to address"""
        try:
            from geopy.geocoders import Nominatim
            geolocator = Nominatim(user_agent="forensics_toolkit_2.0")
            location = geolocator.reverse(f"{lat}, {lon}", timeout=10)
            return location.address if location else None
        except Exception:
            return None

    def analyze_location(self) -> Dict[str, Any]:
        """Full location analysis"""
        gps_data = self.extract_gps_data()
        result = {"gps_data": gps_data}

        if 'latitude' in gps_data and 'longitude' in gps_data:
            result['coordinates'] = {
                'latitude': gps_data['latitude'],
                'longitude': gps_data['longitude']
            }
            result['maps_url'] = gps_data.get('google_maps_url', '')
            result['address'] = gps_data.get('address', 'Could not resolve address')

        return result
