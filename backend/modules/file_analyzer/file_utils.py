"""
ForensicsMainHand 2.0 - File Analyzer: Utilities
Full-featured file analysis: info, entropy (windowed), strings (modes),
hashes, archive operations (extract/compress/crack/recursive), file carving,
and steganography analysis suite.
"""
import os
import re
import math
import hashlib
import subprocess
import shutil
import magic


class FileUtils:
    """Utility class for file analysis operations"""

    # ── File Info ─────────────────────────────────────────────────

    @staticmethod
    def get_file_info(filepath: str) -> dict:
        """Get comprehensive file information"""
        if not os.path.exists(filepath):
            return {"error": "File not found"}

        stat_result = os.stat(filepath)
        mime = magic.from_file(filepath, mime=True)
        file_desc = magic.from_file(filepath)

        import stat as stat_mod
        mode = stat_result.st_mode
        perm_octal = oct(mode)[-3:]
        perm_rwx = stat_mod.filemode(mode)

        return {
            "name": os.path.basename(filepath),
            "path": filepath,
            "size": FileUtils.format_file_size(stat_result.st_size),
            "size_bytes": stat_result.st_size,
            "mime_type": mime,
            "file_type": file_desc,
            "permissions": f"{perm_octal} ({perm_rwx})",
            "hashes": FileUtils.compute_hashes(filepath),
        }

    @staticmethod
    def format_file_size(size_bytes: int) -> str:
        """Format bytes into human readable size"""
        for unit in ['B', 'KB', 'MB', 'GB']:
            if size_bytes < 1024:
                return f"{size_bytes:.2f} {unit}"
            size_bytes /= 1024
        return f"{size_bytes:.2f} TB"

    # ── Hashes ────────────────────────────────────────────────────

    @staticmethod
    def compute_hashes(filepath: str) -> dict:
        """Compute common file hashes"""
        hashes = {}
        algorithms = ['md5', 'sha1', 'sha256', 'sha512', 'sha3_256', 'blake2b']
        for algo in algorithms:
            try:
                h = hashlib.new(algo)
                with open(filepath, 'rb') as f:
                    for chunk in iter(lambda: f.read(8192), b''):
                        h.update(chunk)
                hashes[algo] = h.hexdigest()
            except Exception:
                pass
        return hashes

    # ── Entropy ───────────────────────────────────────────────────

    @staticmethod
    def _entropy_of(data: bytes) -> float:
        if not data:
            return 0.0
        counts = [0] * 256
        for b in data:
            counts[b] += 1
        total = len(data)
        ent = 0.0
        for c in counts:
            if c:
                p = c / total
                ent -= p * math.log2(p)
        return ent

    @staticmethod
    def calculate_entropy(filepath: str, window_size: int = 0) -> dict:
        """Calculate file entropy, optionally windowed."""
        with open(filepath, 'rb') as f:
            data = f.read()

        if not data:
            return {"entropy": 0.0, "interpretation": "Empty file"}

        overall = FileUtils._entropy_of(data)

        result = {
            "entropy": round(overall, 4),
            "max_entropy": 8.0,
            "file_size": len(data),
        }

        if overall > 7.5:
            result["interpretation"] = "Very high entropy - likely encrypted or compressed"
        elif overall > 6.0:
            result["interpretation"] = "High entropy - possibly compressed, image, or binary"
        elif overall > 4.0:
            result["interpretation"] = "Medium entropy - mixed content"
        elif overall > 2.0:
            result["interpretation"] = "Low entropy - mostly text or structured data"
        else:
            result["interpretation"] = "Very low entropy - repetitive content"

        if window_size and window_size > 0:
            entropies = []
            for i in range(0, len(data), window_size):
                chunk = data[i:i + window_size]
                entropies.append(round(FileUtils._entropy_of(chunk), 4))
            bars = '\u2581\u2582\u2583\u2584\u2585\u2586\u2587\u2588'
            bargraph = ''.join(bars[min(int((e / 8) * 7), 7)] for e in entropies)
            result["windows"] = len(entropies)
            result["window_size"] = window_size
            result["min_entropy"] = round(min(entropies), 4) if entropies else 0
            result["max_entropy_window"] = round(max(entropies), 4) if entropies else 0
            result["avg_entropy"] = round(sum(entropies) / len(entropies), 4) if entropies else 0
            result["bargraph"] = bargraph
            result["entropies"] = entropies[:2000]

        return result

    # ── String Extraction ─────────────────────────────────────────

    @staticmethod
    def extract_strings(filepath: str, min_length: int = 4,
                        mode: str = 'both', unique: bool = False,
                        filter_str: str = '') -> dict:
        """Extract printable strings with mode (ascii/unicode/both), unique, filter."""
        try:
            results = []
            with open(filepath, 'rb') as f:
                data = f.read()

            if mode in ('ascii', 'both'):
                pattern = rb'([\x20-\x7E]{' + str(min_length).encode() + rb',})'
                results += [m.decode('ascii', errors='ignore') for m in re.findall(pattern, data)]
            if mode in ('unicode', 'both'):
                pattern = rb'(?:[\x20-\x7E]\x00){' + str(min_length).encode() + rb',}'
                results += [m.decode('utf-16le', errors='ignore') for m in re.findall(pattern, data)]

            if unique:
                results = list(dict.fromkeys(results))

            if filter_str:
                results = [s for s in results if filter_str.lower() in s.lower()]

            return {
                "count": len(results),
                "strings": results[:2000],
                "truncated": len(results) > 2000,
                "mode": mode,
                "unique": unique,
                "filter": filter_str,
            }
        except Exception as e:
            return {"error": str(e)}

    # ── Archive Extraction ────────────────────────────────────────

    @staticmethod
    def extract_archive(filepath: str, password: str = '', output_dir: str = '') -> dict:
        """Extract archive with optional password. Supports zip/rar/7z/tar/gz/bz2/xz/lzma/zst/lz4."""
        if not output_dir:
            output_dir = filepath + '_extracted'
        else:
            output_dir = os.path.join(output_dir, os.path.basename(filepath) + '_extracted')
        os.makedirs(output_dir, exist_ok=True)
        filename = os.path.basename(filepath).lower()

        try:
            cmd = None

            if filename.endswith('.zip'):
                cmd = ['unzip', '-o']
                if password:
                    cmd += ['-P', password]
                cmd += [filepath, '-d', output_dir]
            elif filename.endswith(('.tar.gz', '.tgz')):
                cmd = ['tar', '-xzf', filepath, '-C', output_dir]
            elif filename.endswith(('.tar.bz2', '.tbz2')):
                cmd = ['tar', '-xjf', filepath, '-C', output_dir]
            elif filename.endswith(('.tar.xz', '.txz')):
                cmd = ['tar', '-xJf', filepath, '-C', output_dir]
            elif filename.endswith('.tar'):
                cmd = ['tar', '-xf', filepath, '-C', output_dir]
            elif filename.endswith('.rar'):
                cmd = ['unrar', 'x', '-y']
                if password:
                    cmd += ['-p' + password]
                cmd += [filepath, output_dir + '/']
            elif filename.endswith('.7z'):
                cmd = ['7z', 'x', '-y']
                if password:
                    cmd += ['-p' + password]
                cmd += [filepath, '-o' + output_dir]
            elif filename.endswith('.gz') and not filename.endswith('.tar.gz'):
                cmd = ['gunzip', '-k', '-f', filepath]
            elif filename.endswith('.bz2') and not filename.endswith('.tar.bz2'):
                cmd = ['bunzip2', '-k', '-f', filepath]
            elif filename.endswith('.xz') and not filename.endswith('.tar.xz'):
                cmd = ['unxz', '-k', '-f', filepath]
            elif filename.endswith('.lzma'):
                cmd = ['unlzma', '-k', '-f', filepath]
            elif filename.endswith('.zst'):
                out_name = os.path.basename(filepath).replace('.zst', '')
                cmd = ['unzstd', '-f', '-o', os.path.join(output_dir, out_name), filepath]
            elif filename.endswith('.lz4'):
                out_name = os.path.basename(filepath).replace('.lz4', '')
                cmd = ['lz4', '-d', '-f', filepath, os.path.join(output_dir, out_name)]
            else:
                # Try file command to detect archive type
                try:
                    file_type = subprocess.run(['file', filepath], capture_output=True, text=True, timeout=10).stdout.lower()
                    if 'zip' in file_type:
                        cmd = ['unzip', '-o', filepath, '-d', output_dir]
                    elif 'rar' in file_type:
                        cmd = ['unrar', 'x', '-y', filepath, output_dir + '/']
                    elif '7-zip' in file_type:
                        cmd = ['7z', 'x', '-y', filepath, '-o' + output_dir]
                    elif 'gzip' in file_type:
                        cmd = ['tar', '-xzf', filepath, '-C', output_dir]
                    elif 'tar' in file_type:
                        cmd = ['tar', '-xf', filepath, '-C', output_dir]
                except Exception:
                    pass
                if cmd is None:
                    return {"error": "Unsupported archive format"}

            result = subprocess.run(cmd, capture_output=True, text=True, timeout=120)

            extracted = []
            for root, dirs, files in os.walk(output_dir):
                for fn in files:
                    extracted.append(os.path.relpath(os.path.join(root, fn), output_dir))

            return {
                "output_dir": output_dir,
                "files": extracted,
                "count": len(extracted),
                "stdout": result.stdout[:2000] if result.stdout else "",
                "stderr": result.stderr[:2000] if result.stderr else "",
            }
        except subprocess.TimeoutExpired:
            return {"error": "Extraction timed out"}
        except Exception as e:
            return {"error": str(e)}

    # ── File Compression ──────────────────────────────────────────

    @staticmethod
    def compress_file(filepath: str, fmt: str = 'zip', password: str = '', output_dir: str = '') -> dict:
        """Compress a file. Supported: zip, 7z, tar, gz, bz2, xz, zst, lz4, rar."""
        basename = os.path.basename(filepath)
        dest = output_dir if output_dir else os.path.dirname(filepath)
        os.makedirs(dest, exist_ok=True)
        out_path = os.path.join(dest, basename + '.' + fmt)

        try:
            cmd = None
            if fmt == 'zip':
                cmd = ['zip', '-j']
                if password:
                    cmd += ['-P', password]
                cmd += [out_path, filepath]
            elif fmt == '7z':
                cmd = ['7z', 'a']
                if password:
                    cmd += ['-p' + password, '-mhe=on']
                cmd += [out_path, filepath]
            elif fmt == 'tar':
                cmd = ['tar', '-cf', out_path, '-C', os.path.dirname(filepath), basename]
            elif fmt == 'gz':
                out_path = os.path.join(dest, basename + '.tar.gz')
                cmd = ['tar', '-czf', out_path, '-C', os.path.dirname(filepath), basename]
            elif fmt == 'bz2':
                out_path = os.path.join(dest, basename + '.tar.bz2')
                cmd = ['tar', '-cjf', out_path, '-C', os.path.dirname(filepath), basename]
            elif fmt == 'xz':
                out_path = os.path.join(dest, basename + '.tar.xz')
                cmd = ['tar', '-cJf', out_path, '-C', os.path.dirname(filepath), basename]
            elif fmt == 'zst':
                cmd = ['zstd', '-f', '-o', out_path, filepath]
            elif fmt == 'lz4':
                cmd = ['lz4', '-f', filepath, out_path]
            elif fmt == 'rar':
                cmd = ['rar', 'a']
                if password:
                    cmd += ['-p' + password]
                cmd += [out_path, filepath]
            else:
                return {"error": "Unsupported compression format: " + fmt}

            result = subprocess.run(cmd, capture_output=True, text=True, timeout=120)
            if result.returncode != 0:
                return {"error": "Compression failed: " + (result.stderr[:500] if result.stderr else "unknown error")}

            return {
                "output_path": out_path,
                "output_name": os.path.basename(out_path),
                "output_size": FileUtils.format_file_size(os.path.getsize(out_path)),
                "format": fmt,
            }
        except subprocess.TimeoutExpired:
            return {"error": "Compression timed out"}
        except Exception as e:
            return {"error": str(e)}

    # ── Archive Password Cracking (John the Ripper) ───────────────

    @staticmethod
    def crack_archive_password(filepath: str, wordlist: str = '/usr/share/wordlists/rockyou.txt') -> dict:
        """Crack archive password using John the Ripper (zip/rar/7z)."""
        filename = os.path.basename(filepath).lower()
        hash_file = filepath + '.hash'

        if filename.endswith('.zip'):
            john_tool = 'zip2john'
        elif filename.endswith('.rar'):
            john_tool = 'rar2john'
        elif filename.endswith('.7z'):
            john_tool = '7z2john'
        else:
            try:
                file_info = subprocess.run(['file', filepath], capture_output=True, text=True, timeout=10).stdout.lower()
                if 'zip' in file_info:
                    john_tool = 'zip2john'
                elif 'rar' in file_info:
                    john_tool = 'rar2john'
                elif '7-zip' in file_info:
                    john_tool = '7z2john'
                else:
                    return {"error": "Unsupported file type for password cracking. Only zip, rar, 7z supported."}
            except Exception:
                return {"error": "Could not determine archive type for cracking."}

        if not shutil.which(john_tool) and not shutil.which('john'):
            return {"error": john_tool + " not found. Install john: sudo apt install john"}

        if not os.path.exists(wordlist):
            return {"error": "Wordlist not found: " + wordlist}

        try:
            hash_result = subprocess.run(
                [john_tool, filepath],
                capture_output=True, text=True, timeout=60
            )
            if hash_result.returncode != 0 and not hash_result.stdout:
                return {"error": john_tool + " failed: " + (hash_result.stderr[:500] if hash_result.stderr else "")}

            with open(hash_file, 'w') as f:
                f.write(hash_result.stdout)

            john_result = subprocess.run(
                ['john', '--wordlist=' + wordlist, hash_file],
                capture_output=True, text=True, timeout=300
            )

            show_result = subprocess.run(
                ['john', '--show', hash_file],
                capture_output=True, text=True, timeout=30
            )

            password = None
            if show_result.stdout:
                for line in show_result.stdout.strip().split('\n'):
                    if ':' in line and 'password hash' not in line.lower():
                        parts = line.split(':')
                        if len(parts) >= 2 and parts[1]:
                            password = parts[1]
                            break

            try:
                os.remove(hash_file)
            except Exception:
                pass

            return {
                "found": password is not None,
                "password": password,
                "john_output": john_result.stdout[:2000] if john_result.stdout else "",
                "show_output": show_result.stdout[:2000] if show_result.stdout else "",
                "tool_used": john_tool,
                "wordlist": wordlist,
            }
        except subprocess.TimeoutExpired:
            return {"error": "Password cracking timed out (5 min limit)"}
        except Exception as e:
            return {"error": str(e)}

    # ── Recursive Archive Extraction ──────────────────────────────

    @staticmethod
    def recursive_extract(filepath: str, max_depth: int = 5, output_dir: str = '') -> dict:
        """Recursively extract nested archives up to max_depth levels."""
        if not output_dir:
            output_dir = filepath + '_recursive'
        else:
            output_dir = os.path.join(output_dir, os.path.basename(filepath) + '_recursive')
        os.makedirs(output_dir, exist_ok=True)
        results = []
        seen = set()

        archive_extensions = (
            '.zip', '.rar', '.7z', '.tar', '.tar.gz', '.tgz',
            '.tar.bz2', '.tbz2', '.tar.xz', '.txz',
            '.gz', '.bz2', '.xz', '.lzma', '.zst', '.lz4'
        )

        def _is_archive(path):
            low = path.lower()
            return any(low.endswith(ext) for ext in archive_extensions)

        def _extract_recursive(fpath, depth, dest):
            if depth > max_depth:
                results.append({"file": fpath, "depth": depth, "status": "Max depth reached"})
                return
            real = os.path.realpath(fpath)
            if real in seen:
                results.append({"file": fpath, "depth": depth, "status": "Cycle detected, skipped"})
                return
            seen.add(real)

            sub_dir = os.path.join(dest, "depth_" + str(depth) + "_" + os.path.basename(fpath) + "_extracted")
            os.makedirs(sub_dir, exist_ok=True)

            res = FileUtils.extract_archive(fpath)
            if 'error' in res:
                results.append({"file": os.path.basename(fpath), "depth": depth, "status": "Failed: " + res['error']})
                return

            results.append({
                "file": os.path.basename(fpath),
                "depth": depth,
                "status": "Extracted " + str(res.get('count', 0)) + " files",
                "files": res.get('files', [])
            })

            src_dir = res.get('output_dir', '')
            if src_dir and os.path.isdir(src_dir):
                for root, dirs, files in os.walk(src_dir):
                    for fn in files:
                        src_file = os.path.join(root, fn)
                        dst_file = os.path.join(sub_dir, fn)
                        try:
                            shutil.copy2(src_file, dst_file)
                        except Exception:
                            pass
                        if _is_archive(fn):
                            _extract_recursive(dst_file, depth + 1, sub_dir)

        _extract_recursive(filepath, 1, output_dir)

        all_files = []
        for root, dirs, files in os.walk(output_dir):
            for fn in files:
                all_files.append(os.path.relpath(os.path.join(root, fn), output_dir))

        return {
            "output_dir": output_dir,
            "max_depth": max_depth,
            "steps": results,
            "total_files": len(all_files),
            "files": all_files[:500],
        }

    # ── File Carving ──────────────────────────────────────────────

    @staticmethod
    def file_carving(filepath: str, method: str = 'foremost', output_dir: str = '') -> dict:
        """Carve embedded files. method='foremost' or 'magic'."""
        if method == 'magic':
            return FileUtils._magic_byte_carving(filepath)
        return FileUtils._foremost_carving(filepath, output_dir=output_dir)

    @staticmethod
    def _foremost_carving(filepath: str, output_dir: str = '') -> dict:
        if not output_dir:
            output_dir = filepath + '_carved'
        else:
            output_dir = os.path.join(output_dir, os.path.basename(filepath) + '_carved')
        os.makedirs(output_dir, exist_ok=True)
        try:
            result = subprocess.run(
                ['foremost', '-i', filepath, '-o', output_dir, '-T'],
                capture_output=True, text=True, timeout=120
            )
            carved = []
            for root, dirs, files in os.walk(output_dir):
                for f in files:
                    fpath = os.path.join(root, f)
                    carved.append({
                        "name": f,
                        "path": os.path.relpath(fpath, output_dir),
                        "size": os.path.getsize(fpath),
                    })
            return {
                "method": "foremost",
                "output_dir": output_dir,
                "files": carved,
                "count": len(carved),
                "audit": result.stdout[:3000] if result.stdout else "",
            }
        except Exception as e:
            return {"error": str(e)}

    @staticmethod
    def _magic_byte_carving(filepath: str) -> dict:
        """Custom magic-byte based file carving."""
        try:
            with open(filepath, 'rb') as f:
                data = f.read()

            signatures = [
                (b'\x89PNG\r\n\x1a\n', b'IEND\xaeB`\x82', 'png'),
                (b'\xff\xd8\xff', b'\xff\xd9', 'jpg'),
                (b'GIF89a', b'\x00;', 'gif'),
                (b'GIF87a', b'\x00;', 'gif'),
                (b'%PDF-', b'%%EOF', 'pdf'),
                (b'PK\x03\x04', None, 'zip'),
                (b'Rar!\x1a\x07\x00', None, 'rar'),
                (b'7z\xBC\xAF\x27\x1C', None, '7z'),
                (b'\x1f\x8b', None, 'gz'),
                (b'BZh', None, 'bz2'),
                (b'\xfd7zXZ\x00', None, 'xz'),
                (b'\x7fELF', None, 'elf'),
            ]
            found = []
            for sig, end_marker, ftype in signatures:
                start = 0
                while True:
                    idx = data.find(sig, start)
                    if idx == -1:
                        break
                    if end_marker:
                        end_idx = data.find(end_marker, idx + len(sig))
                        if end_idx != -1:
                            end_idx += len(end_marker)
                            carved = data[idx:end_idx]
                        else:
                            carved = data[idx:idx + 4096]
                    else:
                        carved = data[idx:idx + 4096]

                    found.append({
                        "type": ftype,
                        "offset": idx,
                        "size": len(carved),
                        "hex_preview": carved[:64].hex(),
                    })
                    start = idx + len(sig)

            return {
                "method": "magic_bytes",
                "files": found,
                "count": len(found),
            }
        except Exception as e:
            return {"error": str(e)}

    # ── Steganography Analysis Suite ──────────────────────────────

    @staticmethod
    def analyze_steganography(filepath: str) -> dict:
        """Run multiple stego/metadata tools on a file."""
        results = []

        def _run_tool(name, cmd, timeout=30):
            try:
                r = subprocess.run(cmd, capture_output=True, text=True, timeout=timeout)
                output = (r.stdout + r.stderr).strip()
                return {"tool": name, "output": output[:3000] if output else "(no output)", "success": r.returncode == 0}
            except FileNotFoundError:
                return {"tool": name, "output": name + " not installed", "success": False}
            except subprocess.TimeoutExpired:
                return {"tool": name, "output": "Timed out", "success": False}
            except Exception as e:
                return {"tool": name, "output": str(e), "success": False}

        # 1. exiftool
        if shutil.which('exiftool'):
            results.append(_run_tool('exiftool', ['exiftool', filepath]))

        # 2. binwalk
        if shutil.which('binwalk'):
            results.append(_run_tool('binwalk', ['binwalk', filepath]))

        # 3. strings (interesting strings)
        if shutil.which('strings'):
            results.append(_run_tool('strings', ['strings', '-n', '8', filepath]))

        # 4. zsteg (PNG/BMP only)
        low = filepath.lower()
        if shutil.which('zsteg') and (low.endswith('.png') or low.endswith('.bmp')):
            results.append(_run_tool('zsteg', ['zsteg', filepath], timeout=60))

        # 5. steghide (JPEG/BMP/WAV/AU)
        if shutil.which('steghide') and any(low.endswith(ext) for ext in ('.jpg', '.jpeg', '.bmp', '.wav', '.au')):
            results.append(_run_tool('steghide', ['steghide', 'info', '-f', filepath], timeout=30))

        # 6. outguess (JPEG/PPM)
        if shutil.which('outguess') and any(low.endswith(ext) for ext in ('.jpg', '.jpeg', '.ppm')):
            tmp_out = filepath + '_outguess.txt'
            r = _run_tool('outguess', ['outguess', '-r', filepath, tmp_out], timeout=30)
            if os.path.exists(tmp_out):
                try:
                    with open(tmp_out, 'r', errors='ignore') as f:
                        r["extracted_text"] = f.read()[:2000]
                except Exception:
                    pass
            results.append(r)

        # 7. Appended data detection
        appended = FileUtils._detect_appended_data(filepath)
        if appended:
            results.append(appended)

        return {
            "tools_run": len(results),
            "results": results,
        }

    @staticmethod
    def _detect_appended_data(filepath: str):
        """Detect data appended after JPEG EOI or PNG IEND markers."""
        try:
            with open(filepath, 'rb') as f:
                data = f.read()

            low = filepath.lower()
            appended_size = 0

            if low.endswith(('.jpg', '.jpeg')):
                eoi = data.rfind(b'\xff\xd9')
                if eoi != -1 and eoi + 2 < len(data):
                    appended_size = len(data) - (eoi + 2)

            elif low.endswith('.png'):
                iend = data.rfind(b'IEND\xaeB\x60\x82')
                if iend != -1 and iend + 8 < len(data):
                    appended_size = len(data) - (iend + 8)

            if appended_size > 0:
                return {
                    "tool": "appended_data_detector",
                    "output": "Found " + str(appended_size) + " bytes of data appended after file end marker!",
                    "success": True,
                    "appended_bytes": appended_size,
                    "hex_preview": data[-min(appended_size, 128):].hex(),
                }
            return None
        except Exception:
            return None
