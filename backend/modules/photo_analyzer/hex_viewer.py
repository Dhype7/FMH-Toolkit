"""
ForensicsMainHand 2.0 - Photo Analyzer: Advanced Hex Viewer (ghex-style)
"""
import os
import re
import struct
import hashlib
from collections import Counter
from typing import Dict, List, Any, Optional, Tuple


class HexViewer:
    """Advanced hex viewer / editor for forensic file analysis (ghex-inspired)"""

    BYTES_PER_ROW = 16

    # ── Common file magic numbers ────────────────────────
    MAGIC_NUMBERS = {
        'JPEG':  {'start': b'\xFF\xD8\xFF', 'markers': {
            b'\xFF\xE0': 'APP0 (JFIF)', b'\xFF\xE1': 'APP1 (EXIF)',
            b'\xFF\xDB': 'DQT', b'\xFF\xC0': 'SOF0', b'\xFF\xC4': 'DHT',
            b'\xFF\xDA': 'SOS', b'\xFF\xD9': 'EOI', b'\xFF\xFE': 'COM (Comment)',
        }},
        'PNG':   {'start': b'\x89\x50\x4E\x47\x0D\x0A\x1A\x0A'},
        'GIF87': {'start': b'\x47\x49\x46\x38\x37\x61'},
        'GIF89': {'start': b'\x47\x49\x46\x38\x39\x61'},
        'BMP':   {'start': b'\x42\x4D'},
        'TIFF_LE': {'start': b'\x49\x49\x2A\x00'},
        'TIFF_BE': {'start': b'\x4D\x4D\x00\x2A'},
        'PDF':   {'start': b'\x25\x50\x44\x46'},
        'ZIP':   {'start': b'\x50\x4B\x03\x04'},
        'RAR':   {'start': b'\x52\x61\x72\x21'},
        'ELF':   {'start': b'\x7F\x45\x4C\x46'},
        '7z':    {'start': b'\x37\x7A\xBC\xAF\x27\x1C'},
        'GZIP':  {'start': b'\x1F\x8B'},
        'TAR':   {'start': b'\x75\x73\x74\x61\x72'},
        'WEBP':  {'start': b'\x52\x49\x46\x46'},
        'MP4':   {'start': b'\x00\x00\x00'},
        'OGG':   {'start': b'\x4F\x67\x67\x53'},
        'FLAC':  {'start': b'\x66\x4C\x61\x43'},
        'PE':    {'start': b'\x4D\x5A'},
    }

    # ── Known data structures for overlay ────────────────
    STRUCTURE_DEFS: Dict[str, List[Dict]] = {
        'PNG': [
            {'offset': 0, 'size': 8, 'label': 'PNG Signature', 'color': '#ff3366'},
            {'offset': 8, 'size': 4, 'label': 'IHDR Length', 'color': '#00d4ff'},
            {'offset': 12, 'size': 4, 'label': 'IHDR Tag', 'color': '#7c3aed'},
            {'offset': 16, 'size': 4, 'label': 'Width', 'color': '#00ff88'},
            {'offset': 20, 'size': 4, 'label': 'Height', 'color': '#ffaa00'},
            {'offset': 24, 'size': 1, 'label': 'Bit Depth', 'color': '#ff6b35'},
            {'offset': 25, 'size': 1, 'label': 'Color Type', 'color': '#e040fb'},
            {'offset': 26, 'size': 1, 'label': 'Compression', 'color': '#40c4ff'},
            {'offset': 27, 'size': 1, 'label': 'Filter', 'color': '#b2ff59'},
            {'offset': 28, 'size': 1, 'label': 'Interlace', 'color': '#ffd740'},
        ],
        'JPEG': [
            {'offset': 0, 'size': 2, 'label': 'SOI Marker', 'color': '#ff3366'},
        ],
        'PE': [
            {'offset': 0, 'size': 2, 'label': 'MZ Signature', 'color': '#ff3366'},
            {'offset': 2, 'size': 58, 'label': 'DOS Header', 'color': '#00d4ff'},
            {'offset': 60, 'size': 4, 'label': 'PE Offset', 'color': '#7c3aed'},
        ],
        'ELF': [
            {'offset': 0, 'size': 4, 'label': 'ELF Magic', 'color': '#ff3366'},
            {'offset': 4, 'size': 1, 'label': 'Class', 'color': '#00d4ff'},
            {'offset': 5, 'size': 1, 'label': 'Endianness', 'color': '#7c3aed'},
            {'offset': 6, 'size': 1, 'label': 'Version', 'color': '#00ff88'},
            {'offset': 7, 'size': 1, 'label': 'OS/ABI', 'color': '#ffaa00'},
        ],
        'PDF': [
            {'offset': 0, 'size': 5, 'label': 'PDF Header', 'color': '#ff3366'},
        ],
    }

    def __init__(self, filepath: str):
        self.filepath = filepath
        self._data: Optional[bytes] = None
        self._file_size: Optional[int] = None

    @property
    def file_size(self) -> int:
        if self._file_size is None:
            self._file_size = os.path.getsize(self.filepath)
        return self._file_size

    def _read_range(self, offset: int, length: int) -> bytes:
        """Read a specific range from file (memory-efficient for large files)"""
        with open(self.filepath, 'rb') as f:
            f.seek(offset)
            return f.read(length)

    @property
    def data(self) -> bytes:
        """Full file data (lazy, cached). Use _read_range for large files."""
        if self._data is None:
            with open(self.filepath, 'rb') as f:
                self._data = f.read()
        return self._data

    # ─── Core hex dump ───────────────────────────────────
    def get_hex_dump(self, offset: int = 0, length: int = 4096) -> Dict[str, Any]:
        """Get hex dump with rich metadata for ghex-style display"""
        # Align offset to row boundary
        aligned_offset = (offset // self.BYTES_PER_ROW) * self.BYTES_PER_ROW
        chunk = self._read_range(aligned_offset, length)

        rows = []
        for i in range(0, len(chunk), self.BYTES_PER_ROW):
            row_bytes = chunk[i:i + self.BYTES_PER_ROW]
            byte_values = list(row_bytes)

            # Separate into two 8-byte groups for ghex-style display
            hex_left = ' '.join(f'{b:02X}' for b in row_bytes[:8])
            hex_right = ' '.join(f'{b:02X}' for b in row_bytes[8:])
            ascii_str = ''.join(chr(b) if 32 <= b < 127 else '.' for b in row_bytes)

            rows.append({
                'offset': aligned_offset + i,
                'offset_hex': f'{aligned_offset + i:08X}',
                'hex_left': hex_left,
                'hex_right': hex_right,
                'hex': f'{hex_left}  {hex_right}',
                'ascii': ascii_str,
                'bytes': byte_values,
            })

        return {
            'offset': aligned_offset,
            'length': len(chunk),
            'total_size': self.file_size,
            'bytes_per_row': self.BYTES_PER_ROW,
            'rows': rows,
            'file_type': self.identify_file_type(),
        }

    # ─── Data Inspector (interpret selected byte(s)) ────
    def inspect_bytes(self, offset: int) -> Dict[str, Any]:
        """Interpret bytes at offset in multiple formats — like ghex data inspector panel"""
        chunk = self._read_range(offset, 8)
        if len(chunk) == 0:
            return {'error': 'Offset beyond file size'}

        result: Dict[str, Any] = {
            'offset': offset,
            'offset_hex': f'{offset:08X}',
            'raw_hex': chunk[:8].hex(),
        }

        # 1-byte interpretations
        if len(chunk) >= 1:
            b = chunk[0]
            result['uint8'] = b
            result['int8'] = struct.unpack('b', chunk[:1])[0]
            result['binary'] = f'{b:08b}'
            result['octal'] = f'{b:03o}'
            result['char'] = chr(b) if 32 <= b < 127 else '.'

        # 2-byte interpretations
        if len(chunk) >= 2:
            result['uint16_le'] = struct.unpack('<H', chunk[:2])[0]
            result['uint16_be'] = struct.unpack('>H', chunk[:2])[0]
            result['int16_le'] = struct.unpack('<h', chunk[:2])[0]
            result['int16_be'] = struct.unpack('>h', chunk[:2])[0]

        # 4-byte interpretations
        if len(chunk) >= 4:
            result['uint32_le'] = struct.unpack('<I', chunk[:4])[0]
            result['uint32_be'] = struct.unpack('>I', chunk[:4])[0]
            result['int32_le'] = struct.unpack('<i', chunk[:4])[0]
            result['int32_be'] = struct.unpack('>i', chunk[:4])[0]
            result['float32_le'] = round(struct.unpack('<f', chunk[:4])[0], 6)
            result['float32_be'] = round(struct.unpack('>f', chunk[:4])[0], 6)

        # 8-byte interpretations
        if len(chunk) >= 8:
            result['uint64_le'] = struct.unpack('<Q', chunk[:8])[0]
            result['uint64_be'] = struct.unpack('>Q', chunk[:8])[0]
            result['int64_le'] = struct.unpack('<q', chunk[:8])[0]
            result['int64_be'] = struct.unpack('>q', chunk[:8])[0]
            result['float64_le'] = round(struct.unpack('<d', chunk[:8])[0], 10)
            result['float64_be'] = round(struct.unpack('>d', chunk[:8])[0], 10)

        # UTF-8 string preview (up to 64 bytes)
        preview = self._read_range(offset, 64)
        null_idx = preview.find(b'\x00')
        if null_idx > 0:
            preview = preview[:null_idx]
        result['utf8_preview'] = preview.decode('utf-8', errors='replace')[:64]

        return result

    # ─── Search ──────────────────────────────────────────
    def search_hex(self, search_hex: str, max_results: int = 200) -> List[Dict[str, Any]]:
        """Search for hex pattern in file"""
        try:
            search_bytes = bytes.fromhex(search_hex.replace(' ', '').replace('0x', ''))
        except ValueError as e:
            return [{'error': f'Invalid hex: {e}'}]

        results = []
        offset = 0
        while len(results) < max_results:
            idx = self.data.find(search_bytes, offset)
            if idx == -1:
                break
            ctx_start = max(0, idx - 16)
            ctx_end = min(len(self.data), idx + len(search_bytes) + 16)
            results.append({
                'offset': idx,
                'offset_hex': f'{idx:08X}',
                'match_length': len(search_bytes),
                'context_hex': self.data[ctx_start:ctx_end].hex(),
                'context_ascii': self.data[ctx_start:ctx_end].decode('utf-8', errors='replace'),
            })
            offset = idx + 1
        return results

    def search_ascii(self, search_text: str, max_results: int = 200) -> List[Dict[str, Any]]:
        """Search for ASCII string in file"""
        search_bytes = search_text.encode('utf-8')
        results = []
        offset = 0
        while len(results) < max_results:
            idx = self.data.find(search_bytes, offset)
            if idx == -1:
                break
            ctx_start = max(0, idx - 16)
            ctx_end = min(len(self.data), idx + len(search_bytes) + 16)
            results.append({
                'offset': idx,
                'offset_hex': f'{idx:08X}',
                'match_length': len(search_bytes),
                'context_hex': self.data[ctx_start:ctx_end].hex(),
                'context_ascii': self.data[ctx_start:ctx_end].decode('utf-8', errors='replace'),
            })
            offset = idx + 1
        return results

    def search_regex(self, pattern: str, max_results: int = 100) -> List[Dict[str, Any]]:
        """Search for regex pattern in the decoded text representation"""
        text = self.data.decode('utf-8', errors='replace')
        results = []
        try:
            for m in re.finditer(pattern, text, re.IGNORECASE):
                if len(results) >= max_results:
                    break
                results.append({
                    'offset': m.start(),
                    'offset_hex': f'{m.start():08X}',
                    'match': m.group()[:128],
                    'match_length': len(m.group()),
                })
        except re.error as e:
            return [{'error': f'Invalid regex: {e}'}]
        return results

    # ─── Goto offset ─────────────────────────────────────
    def goto_offset(self, offset_str: str) -> Dict[str, Any]:
        """Parse various offset formats and return hex dump at that location"""
        offset_str = offset_str.strip()
        try:
            if offset_str.startswith('0x') or offset_str.startswith('0X'):
                off = int(offset_str, 16)
            elif offset_str.startswith('0b'):
                off = int(offset_str, 2)
            elif offset_str.startswith('0o'):
                off = int(offset_str, 8)
            else:
                off = int(offset_str)
        except ValueError:
            return {'error': f'Cannot parse offset: {offset_str}'}

        if off < 0 or off >= self.file_size:
            return {'error': f'Offset {off} out of range (file size: {self.file_size})'}

        return self.get_hex_dump(off, 4096)

    # ─── File identification ─────────────────────────────
    def identify_file_type(self) -> Dict[str, Any]:
        """Identify file type from magic bytes"""
        header = self._read_range(0, 32)
        for name, info in self.MAGIC_NUMBERS.items():
            start = info['start']
            if header[:len(start)] == start:
                return {'type': name, 'magic_bytes': start.hex(), 'magic_ascii': start.decode('ascii', errors='replace')}
        return {'type': 'Unknown', 'first_bytes': header[:16].hex()}

    # ─── Structure overlay ───────────────────────────────
    def get_structure_overlay(self) -> Dict[str, Any]:
        """Return known structure regions for colour overlay"""
        ftype = self.identify_file_type()['type']

        # Merge static definitions with dynamic chunk scanning
        regions = list(self.STRUCTURE_DEFS.get(ftype, []))

        # Dynamic PNG chunk scanning
        if ftype == 'PNG' and self.file_size > 8:
            regions.extend(self._scan_png_chunks())

        # Dynamic JPEG marker scanning
        if ftype == 'JPEG':
            regions.extend(self._scan_jpeg_markers())

        return {
            'file_type': ftype,
            'regions': regions,
        }

    def _scan_png_chunks(self) -> List[Dict]:
        """Scan PNG chunks for structure overlay"""
        chunks = []
        colors = ['#00d4ff', '#7c3aed', '#00ff88', '#ffaa00', '#ff3366', '#e040fb', '#40c4ff']
        pos = 8  # after signature
        idx = 0
        while pos + 8 <= self.file_size:
            header = self._read_range(pos, 8)
            if len(header) < 8:
                break
            length = struct.unpack('>I', header[:4])[0]
            tag = header[4:8].decode('ascii', errors='?')
            color = colors[idx % len(colors)]
            chunks.append({
                'offset': pos,
                'size': min(length + 12, self.file_size - pos),  # length + tag(4) + length(4) + crc(4)
                'label': f'Chunk: {tag} ({length}B)',
                'color': color,
            })
            pos += length + 12
            idx += 1
            if idx > 100:
                break
        return chunks

    def _scan_jpeg_markers(self) -> List[Dict]:
        """Scan JPEG markers for structure overlay"""
        markers_map = self.MAGIC_NUMBERS['JPEG']['markers']
        found = []
        colors = ['#00d4ff', '#7c3aed', '#00ff88', '#ffaa00', '#ff3366']
        i = 0
        idx = 0
        while i < min(self.file_size - 1, 65536):  # scan first 64KB
            pair = self._read_range(i, 2)
            if len(pair) < 2:
                break
            if pair[0] == 0xFF and pair[1] != 0x00:
                marker = bytes(pair)
                name = markers_map.get(marker, f'0x{marker.hex().upper()}')
                # determine marker segment size
                seg_size = 2
                if pair[1] not in (0xD8, 0xD9, 0x00) and i + 4 <= self.file_size:
                    seg_header = self._read_range(i + 2, 2)
                    if len(seg_header) == 2:
                        seg_size = 2 + struct.unpack('>H', seg_header)[0]
                found.append({
                    'offset': i,
                    'size': min(seg_size, self.file_size - i),
                    'label': f'JPEG: {name}',
                    'color': colors[idx % len(colors)],
                })
                idx += 1
                i += seg_size
            else:
                i += 1
            if idx > 100:
                break
        return found

    # ─── Entropy analysis ────────────────────────────────
    def entropy_analysis(self, block_size: int = 256) -> Dict[str, Any]:
        """Calculate Shannon entropy per block (detect encrypted/compressed regions)"""
        import math
        blocks = []
        total_size = self.file_size
        for bstart in range(0, total_size, block_size):
            chunk = self._read_range(bstart, block_size)
            if not chunk:
                break
            freq = Counter(chunk)
            ent = 0.0
            for count in freq.values():
                p = count / len(chunk)
                if p > 0:
                    ent -= p * math.log2(p)
            blocks.append({
                'offset': bstart,
                'entropy': round(ent, 4),
            })

        # Overall entropy
        freq = Counter(self.data)
        overall = 0.0
        for count in freq.values():
            p = count / len(self.data)
            if p > 0:
                overall -= p * math.log2(p)

        return {
            'block_size': block_size,
            'total_size': total_size,
            'overall_entropy': round(overall, 4),
            'max_entropy': 8.0,
            'blocks': blocks,
        }

    # ─── Byte frequency / histogram ──────────────────────
    def byte_histogram(self) -> Dict[str, Any]:
        """Return byte value frequency distribution"""
        freq = Counter(self.data)
        histogram = [freq.get(b, 0) for b in range(256)]
        top = sorted(freq.items(), key=lambda x: -x[1])[:20]

        return {
            'total_bytes': len(self.data),
            'unique_bytes': len(freq),
            'histogram': histogram,
            'top_bytes': [{'byte': b, 'hex': f'{b:02X}', 'count': c, 'percent': round(c / len(self.data) * 100, 2)} for b, c in top],
        }

    # ─── Hash computation ────────────────────────────────
    def compute_hashes(self, offset: int = 0, length: int = 0) -> Dict[str, str]:
        """Compute hashes of full file or a selection"""
        if length > 0:
            chunk = self._read_range(offset, length)
        else:
            chunk = self.data
        return {
            'md5': hashlib.md5(chunk).hexdigest(),
            'sha1': hashlib.sha1(chunk).hexdigest(),
            'sha256': hashlib.sha256(chunk).hexdigest(),
            'crc32': f'{__import__("zlib").crc32(chunk) & 0xFFFFFFFF:08X}',
            'size': len(chunk),
        }

    # ─── String extraction (configurable min length) ─────
    def extract_strings(self, min_length: int = 4, max_results: int = 500) -> List[Dict[str, Any]]:
        """Extract printable strings from binary"""
        results = []
        current = []
        start_offset = 0
        for i, b in enumerate(self.data):
            if 32 <= b < 127:
                if not current:
                    start_offset = i
                current.append(chr(b))
            else:
                if len(current) >= min_length:
                    results.append({
                        'offset': start_offset,
                        'offset_hex': f'{start_offset:08X}',
                        'string': ''.join(current)[:512],
                        'length': len(current),
                    })
                    if len(results) >= max_results:
                        break
                current = []
        # trailing
        if len(current) >= min_length and len(results) < max_results:
            results.append({
                'offset': start_offset,
                'offset_hex': f'{start_offset:08X}',
                'string': ''.join(current)[:512],
                'length': len(current),
            })
        return results

    # ─── Embedded file detection ─────────────────────────
    def find_embedded_files(self) -> List[Dict[str, Any]]:
        """Scan for embedded file signatures inside the file"""
        results = []
        for name, info in self.MAGIC_NUMBERS.items():
            sig = info['start']
            offset = 0
            while True:
                idx = self.data.find(sig, offset)
                if idx == -1:
                    break
                results.append({
                    'type': name,
                    'offset': idx,
                    'offset_hex': f'{idx:08X}',
                    'signature': sig.hex(),
                })
                offset = idx + 1
        results.sort(key=lambda x: x['offset'])
        return results

    # ─── Diff / compare two regions ──────────────────────
    def compare_regions(self, offset_a: int, offset_b: int, length: int = 256) -> Dict[str, Any]:
        """Compare two regions of the file byte-by-byte"""
        a = self._read_range(offset_a, length)
        b = self._read_range(offset_b, length)
        diffs = []
        for i in range(min(len(a), len(b))):
            if a[i] != b[i]:
                diffs.append({
                    'relative_offset': i,
                    'offset_a': offset_a + i,
                    'offset_b': offset_b + i,
                    'byte_a': f'{a[i]:02X}',
                    'byte_b': f'{b[i]:02X}',
                })
        return {
            'offset_a': offset_a,
            'offset_b': offset_b,
            'length': min(len(a), len(b)),
            'diff_count': len(diffs),
            'diffs': diffs[:500],
        }

    # ─── CTF flag search ─────────────────────────────────
    def ctf_highlight_flags(self) -> List[Dict[str, Any]]:
        """Search for CTF flag patterns in file"""
        text = self.data.decode('utf-8', errors='replace')
        patterns = [
            r'flag\{[^}]+\}',
            r'ctf\{[^}]+\}',
            r'HTB\{[^}]+\}',
            r'picoCTF\{[^}]+\}',
            r'DUCTF\{[^}]+\}',
            r'pwn\{[^}]+\}',
            r'KEY\{[^}]+\}',
            r'[A-Za-z0-9+/]{20,}={0,2}',  # base64 blobs
        ]
        results = []
        for pattern in patterns:
            for m in re.finditer(pattern, text, re.IGNORECASE):
                results.append({
                    'flag': m.group()[:256],
                    'offset': m.start(),
                    'offset_hex': f'{m.start():08X}',
                    'pattern': pattern,
                })
        return results

    # ─── Export selection ─────────────────────────────────
    def export_selection(self, offset: int, length: int, fmt: str = 'hex') -> Dict[str, Any]:
        """Export a byte range in various formats"""
        chunk = self._read_range(offset, length)
        exports: Dict[str, str] = {}

        if fmt in ('hex', 'all'):
            exports['hex'] = chunk.hex()
            exports['hex_spaced'] = ' '.join(f'{b:02X}' for b in chunk)
        if fmt in ('c_array', 'all'):
            exports['c_array'] = '{ ' + ', '.join(f'0x{b:02X}' for b in chunk) + ' }'
        if fmt in ('python', 'all'):
            exports['python'] = repr(chunk)
        if fmt in ('base64', 'all'):
            import base64
            exports['base64'] = base64.b64encode(chunk).decode()
        if fmt in ('binary', 'all'):
            exports['binary'] = ' '.join(f'{b:08b}' for b in chunk[:64])  # limit

        return {
            'offset': offset,
            'length': len(chunk),
            'format': fmt,
            'exports': exports,
        }

    # ─── XOR brute-force (single-byte) ───────────────────
    def xor_bruteforce(self, offset: int = 0, length: int = 256) -> List[Dict[str, Any]]:
        """Try all single-byte XOR keys on a region and return printable results"""
        chunk = self._read_range(offset, length)
        results = []
        for key in range(1, 256):
            decoded = bytes([b ^ key for b in chunk])
            printable_ratio = sum(1 for b in decoded if 32 <= b < 127) / len(decoded)
            if printable_ratio >= 0.7:
                results.append({
                    'key': key,
                    'key_hex': f'{key:02X}',
                    'printable_ratio': round(printable_ratio * 100, 1),
                    'preview': decoded.decode('ascii', errors='replace')[:128],
                })
        results.sort(key=lambda x: -x['printable_ratio'])
        return results[:20]

    # ─── File info summary ───────────────────────────────
    def file_info(self) -> Dict[str, Any]:
        """Get comprehensive file information"""
        stat = os.stat(self.filepath)
        import time
        return {
            'filename': os.path.basename(self.filepath),
            'file_size': self.file_size,
            'file_size_human': self._human_size(self.file_size),
            'file_type': self.identify_file_type(),
            'hashes': self.compute_hashes(),
            'created': time.ctime(stat.st_ctime),
            'modified': time.ctime(stat.st_mtime),
            'unique_bytes': len(set(self.data)),
        }

    @staticmethod
    def _human_size(size: int) -> str:
        for unit in ['B', 'KB', 'MB', 'GB']:
            if size < 1024:
                return f'{size:.1f} {unit}'
            size /= 1024
        return f'{size:.1f} TB'

    # ─── Advanced file-type recognition (CTF corrupted headers) ──
    # Uses: magic bytes, internal markers, extension, entropy, structure patterns
    HEADER_DB: Dict[str, Dict[str, Any]] = {
        'JPEG': {
            'magic': b'\xFF\xD8\xFF',
            'correct_header': b'\xFF\xD8\xFF\xE0',
            'header_len': 4,
            'markers': [b'\xFF\xE0', b'\xFF\xE1', b'\xFF\xDB', b'\xFF\xC0', b'\xFF\xDA', b'\xFF\xD9'],
            'extensions': ['.jpg', '.jpeg', '.jfif'],
            'trailer': b'\xFF\xD9',
            'entropy_range': (6.5, 8.0),
            'strings_hint': ['JFIF', 'Exif', 'Adobe', 'ICC_PROFILE'],
        },
        'PNG': {
            'magic': b'\x89\x50\x4E\x47\x0D\x0A\x1A\x0A',
            'correct_header': b'\x89\x50\x4E\x47\x0D\x0A\x1A\x0A',
            'header_len': 8,
            'markers': [b'IHDR', b'IDAT', b'IEND', b'tEXt', b'pHYs', b'sRGB', b'gAMA'],
            'extensions': ['.png'],
            'trailer': b'\x49\x45\x4E\x44\xAE\x42\x60\x82',  # IEND + CRC
            'entropy_range': (5.0, 8.0),
            'strings_hint': ['IHDR', 'IDAT', 'IEND', 'PNG'],
        },
        'GIF': {
            'magic': b'\x47\x49\x46\x38',
            'correct_header': b'\x47\x49\x46\x38\x39\x61',
            'header_len': 6,
            'markers': [b'\x21\xF9\x04', b'\x2C', b'\x3B'],
            'extensions': ['.gif'],
            'trailer': b'\x3B',
            'entropy_range': (4.0, 7.5),
            'strings_hint': ['GIF89a', 'GIF87a', 'NETSCAPE'],
        },
        'BMP': {
            'magic': b'\x42\x4D',
            'correct_header': b'\x42\x4D',
            'header_len': 2,
            'markers': [],
            'extensions': ['.bmp'],
            'trailer': None,
            'entropy_range': (3.0, 7.0),
            'strings_hint': [],
        },
        'PDF': {
            'magic': b'\x25\x50\x44\x46\x2D',
            'correct_header': b'\x25\x50\x44\x46\x2D',
            'header_len': 5,
            'markers': [b'obj', b'endobj', b'stream', b'endstream', b'xref', b'%%EOF'],
            'extensions': ['.pdf'],
            'trailer': b'%%EOF',
            'entropy_range': (5.0, 8.0),
            'strings_hint': ['%PDF', '%%EOF', 'endobj', 'stream'],
        },
        'ZIP': {
            'magic': b'\x50\x4B\x03\x04',
            'correct_header': b'\x50\x4B\x03\x04',
            'header_len': 4,
            'markers': [b'\x50\x4B\x01\x02', b'\x50\x4B\x05\x06'],
            'extensions': ['.zip', '.docx', '.xlsx', '.pptx', '.jar', '.apk'],
            'trailer': None,
            'entropy_range': (6.0, 8.0),
            'strings_hint': ['PK'],
        },
        'RAR': {
            'magic': b'\x52\x61\x72\x21\x1A\x07',
            'correct_header': b'\x52\x61\x72\x21\x1A\x07\x00',
            'header_len': 7,
            'markers': [],
            'extensions': ['.rar'],
            'trailer': None,
            'entropy_range': (7.0, 8.0),
            'strings_hint': ['Rar!'],
        },
        'ELF': {
            'magic': b'\x7F\x45\x4C\x46',
            'correct_header': b'\x7F\x45\x4C\x46',
            'header_len': 4,
            'markers': [],
            'extensions': ['.elf', '.so', '.o', ''],
            'trailer': None,
            'entropy_range': (4.0, 7.5),
            'strings_hint': ['.text', '.data', '.rodata', '.symtab'],
        },
        'PE': {
            'magic': b'\x4D\x5A',
            'correct_header': b'\x4D\x5A',
            'header_len': 2,
            'markers': [b'PE\x00\x00', b'.text', b'.rdata', b'.data'],
            'extensions': ['.exe', '.dll', '.sys'],
            'trailer': None,
            'entropy_range': (5.0, 7.5),
            'strings_hint': ['MZ', 'PE', '.text', '.rdata', 'kernel32', 'ntdll'],
        },
        'TIFF': {
            'magic': b'\x49\x49\x2A\x00',
            'correct_header': b'\x49\x49\x2A\x00',
            'header_len': 4,
            'markers': [],
            'extensions': ['.tiff', '.tif'],
            'trailer': None,
            'entropy_range': (5.0, 8.0),
            'strings_hint': [],
        },
        'WEBP': {
            'magic': b'\x52\x49\x46\x46',
            'correct_header': b'\x52\x49\x46\x46',
            'header_len': 4,
            'markers': [b'WEBP'],
            'extensions': ['.webp'],
            'trailer': None,
            'entropy_range': (6.0, 8.0),
            'strings_hint': ['RIFF', 'WEBP'],
        },
    }

    def detect_file_type_advanced(self) -> Dict[str, Any]:
        """
        Detect the real file type even when the header is corrupted.
        Uses multiple heuristics: markers, extension, strings, trailer, entropy.
        Returns confidence scores and diagnosis.
        """
        import math

        data = self.data
        header = data[:32]
        ext = os.path.splitext(self.filepath)[1].lower()

        # Calculate overall entropy
        freq = Counter(data)
        entropy = 0.0
        for c in freq.values():
            p = c / len(data)
            if p > 0:
                entropy -= p * math.log2(p)

        # Decode for string matching
        text_repr = data.decode('utf-8', errors='replace')

        scores: Dict[str, Dict[str, Any]] = {}

        for fmt, info in self.HEADER_DB.items():
            score = 0.0
            total_checks = 0
            details = []

            # 1. Magic bytes match (partial / fuzzy)
            magic = info['magic']
            hlen = info['header_len']
            total_checks += 30
            matching_bytes = sum(1 for a, b in zip(header[:hlen], magic) if a == b)
            magic_pct = matching_bytes / len(magic) if magic else 0
            magic_score = magic_pct * 30
            score += magic_score
            if magic_pct == 1.0:
                details.append(f'✅ Magic bytes match perfectly')
            elif magic_pct > 0.5:
                details.append(f'⚠️ Magic bytes {int(magic_pct*100)}% match ({matching_bytes}/{len(magic)} bytes)')
            elif magic_pct > 0:
                details.append(f'❌ Magic bytes only {int(magic_pct*100)}% match')
            else:
                details.append(f'❌ Magic bytes do not match')

            # 2. Internal markers found
            markers = info.get('markers', [])
            if markers:
                total_checks += 25
                found_markers = sum(1 for m in markers if m in data[:min(len(data), 65536)])
                marker_pct = found_markers / len(markers) if markers else 0
                score += marker_pct * 25
                if found_markers > 0:
                    details.append(f'✅ Found {found_markers}/{len(markers)} internal markers')
                else:
                    details.append(f'❌ No internal markers found')
            else:
                total_checks += 5
                score += 2.5  # neutral for types without markers

            # 3. File extension match
            total_checks += 10
            if ext in info.get('extensions', []):
                score += 10
                details.append(f'✅ Extension "{ext}" matches')
            elif ext:
                details.append(f'⚠️ Extension "{ext}" doesn\'t match expected {info.get("extensions", [])}')  

            # 4. Trailer / footer match
            trailer = info.get('trailer')
            if trailer:
                total_checks += 15
                # Search in last 1024 bytes
                if trailer in data[-1024:]:
                    score += 15
                    details.append(f'✅ File trailer/footer found')
                else:
                    details.append(f'❌ File trailer/footer NOT found')
            else:
                total_checks += 5
                score += 2.5

            # 5. String hints
            hints = info.get('strings_hint', [])
            if hints:
                total_checks += 10
                found_hints = sum(1 for h in hints if h in text_repr[:65536])
                hint_pct = found_hints / len(hints) if hints else 0
                score += hint_pct * 10
                if found_hints > 0:
                    details.append(f'✅ Found {found_hints}/{len(hints)} string hints')
                else:
                    details.append(f'❌ No string hints found')
            else:
                total_checks += 5
                score += 2.5

            # 6. Entropy range
            total_checks += 10
            ent_low, ent_high = info.get('entropy_range', (0, 8))
            if ent_low <= entropy <= ent_high:
                score += 10
                details.append(f'✅ Entropy {entropy:.2f} within expected range [{ent_low}-{ent_high}]')
            else:
                details.append(f'⚠️ Entropy {entropy:.2f} outside expected range [{ent_low}-{ent_high}]')

            confidence = round((score / total_checks) * 100, 1) if total_checks > 0 else 0
            scores[fmt] = {
                'confidence': confidence,
                'details': details,
                'correct_header_hex': info['correct_header'].hex(),
                'current_header_hex': header[:info['header_len']].hex(),
                'header_corrupted': header[:len(info['magic'])] != info['magic'],
            }

        # Sort by confidence
        ranked = sorted(scores.items(), key=lambda x: -x[1]['confidence'])

        return {
            'filename': os.path.basename(self.filepath),
            'file_size': self.file_size,
            'current_header_hex': header[:16].hex(),
            'entropy': round(entropy, 4),
            'extension': ext,
            'candidates': [{'type': name, **info} for name, info in ranked],
        }

    def auto_correct_header(self, target_type: Optional[str] = None) -> Dict[str, Any]:
        """
        Auto-correct a corrupted file header.
        If target_type is None, uses detect_file_type_advanced() to pick the best candidate.
        Returns: corrected bytes, what changed, and a new filepath.
        """
        detection = self.detect_file_type_advanced()
        candidates = detection['candidates']

        if not candidates:
            return {'error': 'No file type candidates detected'}

        # Pick target type
        if target_type:
            chosen = None
            for c in candidates:
                if c['type'].upper() == target_type.upper():
                    chosen = c
                    break
            if not chosen:
                return {'error': f'Type "{target_type}" not in candidates'}
        else:
            chosen = candidates[0]  # highest confidence

        fmt_name = chosen['type']
        info = self.HEADER_DB.get(fmt_name)
        if not info:
            return {'error': f'No header DB entry for {fmt_name}'}

        correct_header = info['correct_header']
        header_len = len(correct_header)
        current_header = self.data[:header_len]

        changes = []
        corrected = bytearray(self.data)

        # Fix header bytes
        for i in range(header_len):
            if i < len(self.data) and corrected[i] != correct_header[i]:
                changes.append({
                    'offset': i,
                    'offset_hex': f'{i:08X}',
                    'old_byte': f'{corrected[i]:02X}',
                    'new_byte': f'{correct_header[i]:02X}',
                    'description': f'Header byte {i}: 0x{corrected[i]:02X} → 0x{correct_header[i]:02X}',
                })
                corrected[i] = correct_header[i]

        # For JPEG: ensure proper APP0/APP1 marker after SOI
        if fmt_name == 'JPEG' and len(corrected) > 4:
            # SOI should be FFD8, next should be a valid APP marker (FFE0 or FFE1)
            if corrected[2] != 0xFF:
                changes.append({
                    'offset': 2,
                    'offset_hex': '00000002',
                    'old_byte': f'{corrected[2]:02X}',
                    'new_byte': 'FF',
                    'description': 'Fixed: byte 2 should be 0xFF for JPEG marker',
                })
                corrected[2] = 0xFF
            if corrected[3] not in (0xE0, 0xE1, 0xDB, 0xFE, 0xE2):
                old = corrected[3]
                corrected[3] = 0xE0  # default to JFIF
                changes.append({
                    'offset': 3,
                    'offset_hex': '00000003',
                    'old_byte': f'{old:02X}',
                    'new_byte': 'E0',
                    'description': 'Fixed: byte 3 should be a valid JPEG marker (set to APP0/JFIF)',
                })

        # For PNG: check IHDR chunk tag at offset 12
        if fmt_name == 'PNG' and len(corrected) > 16:
            ihdr_tag = b'IHDR'
            for j, expected in enumerate(ihdr_tag):
                pos = 12 + j
                if pos < len(corrected) and corrected[pos] != expected:
                    changes.append({
                        'offset': pos,
                        'offset_hex': f'{pos:08X}',
                        'old_byte': f'{corrected[pos]:02X}',
                        'new_byte': f'{expected:02X}',
                        'description': f'Fixed: IHDR chunk tag byte {j}: 0x{corrected[pos]:02X} → 0x{expected:02X}',
                    })
                    corrected[pos] = expected

        if not changes:
            return {
                'type': fmt_name,
                'confidence': chosen['confidence'],
                'message': 'No corrections needed — header appears valid',
                'changes': [],
                'filepath': self.filepath,
            }

        # Save corrected file
        base, ext = os.path.splitext(self.filepath)
        corrected_path = f'{base}_corrected{ext}'
        counter = 1
        while os.path.exists(corrected_path):
            corrected_path = f'{base}_corrected_{counter}{ext}'
            counter += 1
        with open(corrected_path, 'wb') as f:
            f.write(bytes(corrected))

        return {
            'type': fmt_name,
            'confidence': chosen['confidence'],
            'message': f'Corrected {len(changes)} byte(s) and saved as {os.path.basename(corrected_path)}',
            'changes': changes,
            'original_header': current_header.hex(),
            'corrected_header': bytes(corrected[:header_len]).hex(),
            'filepath': corrected_path,
            'filename': os.path.basename(corrected_path),
        }

    # ─── Patch bytes (edit mode) ─────────────────────────
    def patch_bytes(self, patches: List[Dict[str, int]]) -> Dict[str, Any]:
        """
        Apply byte patches to the file.
        patches: list of {offset: int, value: int}
        Returns the updated hex dump around the patched area.
        """
        data = bytearray(self.data)
        applied = []
        for p in patches:
            off = p['offset']
            val = p['value'] & 0xFF
            if 0 <= off < len(data):
                old = data[off]
                data[off] = val
                applied.append({
                    'offset': off,
                    'offset_hex': f'{off:08X}',
                    'old': f'{old:02X}',
                    'new': f'{val:02X}',
                })
        # Write back
        with open(self.filepath, 'wb') as f:
            f.write(bytes(data))
        self._data = bytes(data)  # refresh cache

        return {
            'patched': len(applied),
            'changes': applied,
        }

    # ─── Save-as (export full modified file) ─────────────
    def save_as(self, new_data_hex: Optional[str] = None) -> Dict[str, Any]:
        """Save current (potentially patched) file and return download path"""
        return {
            'filepath': self.filepath,
            'filename': os.path.basename(self.filepath),
            'size': self.file_size,
        }
