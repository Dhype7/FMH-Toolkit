"""
ForensicsMainHand 2.0 - Classical Ciphers (Pure Logic, No GUI)
Ported from the original project with enhancements.
"""
import math
import re
import string
import random
import secrets
import hashlib
import hmac as hmac_module
import base64
import os
import struct
import wave
import numpy as np
from collections import Counter
from typing import List, Tuple, Optional


# ─── Morse Code Dictionary ───────────────────────────────────────
MORSE_CODE_DICT = {
    'A': '.-', 'B': '-...', 'C': '-.-.', 'D': '-..', 'E': '.', 'F': '..-.',
    'G': '--.', 'H': '....', 'I': '..', 'J': '.---', 'K': '-.-', 'L': '.-..',
    'M': '--', 'N': '-.', 'O': '---', 'P': '.--.', 'Q': '--.-', 'R': '.-.',
    'S': '...', 'T': '-', 'U': '..-', 'V': '...-', 'W': '.--', 'X': '-..-',
    'Y': '-.--', 'Z': '--..',
    '0': '-----', '1': '.----', '2': '..---', '3': '...--', '4': '....-',
    '5': '.....', '6': '-....', '7': '--...', '8': '---..', '9': '----.',
    '.': '.-.-.-', ',': '--..--', '?': '..--..', "'": '.----.', '!': '-.-.--',
    '/': '-..-.', '(': '-.--.', ')': '-.--.-', '&': '.-...', ':': '---...',
    ';': '-.-.-.', '=': '-...-', '+': '.-.-.', '-': '-....-', '_': '..--.-',
    '"': '.-..-.', '$': '...-..-', '@': '.--.-.', ' ': '/'
}
MORSE_CODE_DICT_REVERSE = {v: k for k, v in MORSE_CODE_DICT.items()}


# ─── Binary/Hex/ASCII Cipher ─────────────────────────────────────
class BinaryCipher:
    """Binary cipher for text/binary/ASCII/hex conversions"""

    @staticmethod
    def text_to_binary(text: str) -> str:
        return ' '.join(format(ord(c), '08b') for c in text)

    @staticmethod
    def binary_to_text(binary: str) -> str:
        binary = binary.replace(" ", "").replace("\n", "")
        if not binary:
            return "Error: Empty binary input"
        if not all(b in '01' for b in binary):
            return "Error: Invalid binary input (must contain only 0s and 1s)"
        if len(binary) % 8 != 0:
            return f"Error: Binary length ({len(binary)}) is not a multiple of 8"
        return ''.join(chr(int(binary[i:i+8], 2)) for i in range(0, len(binary), 8))

    @staticmethod
    def text_to_ascii(text: str) -> str:
        return ' '.join(str(ord(c)) for c in text)

    @staticmethod
    def ascii_to_text(ascii_str: str) -> str:
        try:
            return ''.join(chr(int(v)) if 0 <= int(v) <= 255 else '?' for v in ascii_str.split())
        except (ValueError, TypeError):
            return "Invalid ASCII input"

    @staticmethod
    def text_to_hex(text: str) -> str:
        return ' '.join(format(ord(c), '02x') for c in text)

    @staticmethod
    def hex_to_text(hex_str: str) -> str:
        try:
            hex_values = hex_str.replace(" ", "").replace("\n", "")
            return ''.join(chr(int(hex_values[i:i+2], 16)) for i in range(0, len(hex_values), 2))
        except (UnicodeDecodeError, ValueError):
            return "Invalid hex input"

    @staticmethod
    def binary_to_hex(binary: str) -> str:
        return BinaryCipher.text_to_hex(BinaryCipher.binary_to_text(binary))

    @staticmethod
    def hex_to_binary(hex_str: str) -> str:
        return BinaryCipher.text_to_binary(BinaryCipher.hex_to_text(hex_str))

    @staticmethod
    def ascii_to_binary(ascii_str: str) -> str:
        return BinaryCipher.text_to_binary(BinaryCipher.ascii_to_text(ascii_str))

    @staticmethod
    def binary_to_ascii(binary: str) -> str:
        return BinaryCipher.text_to_ascii(BinaryCipher.binary_to_text(binary))


# ─── XOR Cipher ──────────────────────────────────────────────────
class XORCipher:
    """XOR cipher for text encryption/decryption"""

    @staticmethod
    def xor_encrypt(text: str, key: str) -> str:
        if not key:
            raise ValueError("Key cannot be empty")
        text_bytes = text.encode('utf-8')
        key_bytes = key.encode('utf-8')
        encrypted = bytearray(b ^ key_bytes[i % len(key_bytes)] for i, b in enumerate(text_bytes))
        return ' '.join(f'{b:02x}' for b in encrypted)

    @staticmethod
    def xor_decrypt(hex_text: str, key: str) -> str:
        if not key:
            raise ValueError("Key cannot be empty")
        try:
            encrypted = bytes.fromhex(hex_text.replace(" ", "").replace("\n", ""))
            key_bytes = key.encode('utf-8')
            decrypted = bytearray(b ^ key_bytes[i % len(key_bytes)] for i, b in enumerate(encrypted))
            return decrypted.decode('utf-8')
        except (UnicodeDecodeError, ValueError) as e:
            return f"Decryption failed: {str(e)}"

    @staticmethod
    def xor_single_char_encrypt(text: str, key_char: str) -> str:
        if not key_char:
            raise ValueError("Key character cannot be empty")
        key_byte = ord(key_char[0])
        return ' '.join(f'{ord(c) ^ key_byte:02x}' for c in text)

    @staticmethod
    def xor_single_char_decrypt(hex_text: str, key_char: str) -> str:
        if not key_char:
            raise ValueError("Key character cannot be empty")
        try:
            encrypted = bytes.fromhex(hex_text.replace(" ", "").replace("\n", ""))
            key_byte = ord(key_char[0])
            return ''.join(chr(b ^ key_byte) for b in encrypted)
        except (UnicodeDecodeError, ValueError):
            return "Decryption failed"


# ─── Classical Ciphers ───────────────────────────────────────────
class ClassicalCiphers:
    """All classical cipher implementations"""

    # Caesar
    @staticmethod
    def caesar_encrypt(text: str, shift: int) -> str:
        result = ""
        for char in text:
            if char.isupper():
                result += chr((ord(char) - 65 + shift) % 26 + 65)
            elif char.islower():
                result += chr((ord(char) - 97 + shift) % 26 + 97)
            else:
                result += char
        return result

    @staticmethod
    def caesar_decrypt(text: str, shift: int) -> str:
        return ClassicalCiphers.caesar_encrypt(text, -shift)

    # ROT13
    @staticmethod
    def rot13_encrypt(text: str) -> str:
        return ClassicalCiphers.caesar_encrypt(text, 13)

    @staticmethod
    def rot13_decrypt(text: str) -> str:
        return ClassicalCiphers.rot13_encrypt(text)

    # Atbash
    @staticmethod
    def atbash_encrypt(text: str) -> str:
        result = ""
        for char in text:
            if char.isupper():
                result += chr(90 - (ord(char) - 65))
            elif char.islower():
                result += chr(122 - (ord(char) - 97))
            else:
                result += char
        return result

    @staticmethod
    def atbash_decrypt(text: str) -> str:
        return ClassicalCiphers.atbash_encrypt(text)

    # Vigenere
    @staticmethod
    def vigenere_encrypt(text: str, key: str) -> str:
        key = key.upper()
        result, ki = "", 0
        for char in text:
            if char.isalpha():
                shift = ord(key[ki % len(key)]) - ord('A')
                base = 65 if char.isupper() else 97
                result += chr((ord(char) - base + shift) % 26 + base)
                ki += 1
            else:
                result += char
        return result

    @staticmethod
    def vigenere_decrypt(text: str, key: str) -> str:
        key = key.upper()
        result, ki = "", 0
        for char in text:
            if char.isalpha():
                shift = ord(key[ki % len(key)]) - ord('A')
                base = 65 if char.isupper() else 97
                result += chr((ord(char) - base - shift) % 26 + base)
                ki += 1
            else:
                result += char
        return result

    # Affine
    @staticmethod
    def affine_encrypt(text: str, a: int, b: int) -> str:
        if math.gcd(a, 26) != 1:
            raise ValueError("'a' must be coprime with 26")
        result = ""
        for char in text.upper():
            if char.isalpha():
                result += chr((a * (ord(char) - 65) + b) % 26 + 65)
            else:
                result += char
        return result

    @staticmethod
    def affine_decrypt(text: str, a: int, b: int) -> str:
        if math.gcd(a, 26) != 1:
            raise ValueError("'a' must be coprime with 26")
        a_inv = pow(a, -1, 26)
        result = ""
        for char in text.upper():
            if char.isalpha():
                result += chr((a_inv * (ord(char) - 65 - b)) % 26 + 65)
            else:
                result += char
        return result

    # Playfair
    @staticmethod
    def playfair_encrypt(text: str, key: str) -> str:
        matrix = ClassicalCiphers._create_playfair_matrix(key)
        text = re.sub(r'[^A-Za-z]', '', text.upper()).replace('J', 'I')
        if len(text) % 2 == 1:
            text += 'X'
        result = ""
        for i in range(0, len(text), 2):
            result += ClassicalCiphers._playfair_process_pair(text[i:i+2], matrix, encrypt=True)
        return result

    @staticmethod
    def playfair_decrypt(text: str, key: str) -> str:
        matrix = ClassicalCiphers._create_playfair_matrix(key)
        result = ""
        for i in range(0, len(text), 2):
            result += ClassicalCiphers._playfair_process_pair(text[i:i+2], matrix, encrypt=False)
        return result

    @staticmethod
    def _create_playfair_matrix(key: str) -> List[List[str]]:
        key = re.sub(r'[^A-Za-z]', '', key.upper()).replace('J', 'I')
        seen, matrix_chars = set(), []
        for char in key + "ABCDEFGHIKLMNOPQRSTUVWXYZ":
            if char not in seen:
                matrix_chars.append(char)
                seen.add(char)
        return [matrix_chars[i:i+5] for i in range(0, 25, 5)]

    @staticmethod
    def _find_in_matrix(char: str, matrix: List[List[str]]) -> Tuple[int, int]:
        for i, row in enumerate(matrix):
            for j, cell in enumerate(row):
                if cell == char:
                    return i, j
        return 0, 0

    @staticmethod
    def _playfair_process_pair(pair: str, matrix: List[List[str]], encrypt: bool) -> str:
        a, b = pair[0].replace('J', 'I'), pair[1].replace('J', 'I')
        r1, c1 = ClassicalCiphers._find_in_matrix(a, matrix)
        r2, c2 = ClassicalCiphers._find_in_matrix(b, matrix)
        d = 1 if encrypt else -1
        if r1 == r2:
            return matrix[r1][(c1 + d) % 5] + matrix[r2][(c2 + d) % 5]
        elif c1 == c2:
            return matrix[(r1 + d) % 5][c1] + matrix[(r2 + d) % 5][c2]
        else:
            return matrix[r1][c2] + matrix[r2][c1]

    # Rail Fence
    @staticmethod
    def rail_fence_encrypt(text: str, rails: int) -> str:
        if rails <= 1:
            return text
        fence = [[''] * len(text) for _ in range(rails)]
        rail, direction = 0, 1
        for i, char in enumerate(text):
            fence[rail][i] = char
            rail += direction
            if rail == rails - 1:
                direction = -1
            elif rail == 0:
                direction = 1
        return ''.join(''.join(row) for row in fence)

    @staticmethod
    def rail_fence_decrypt(text: str, rails: int) -> str:
        if rails <= 1:
            return text
        n = len(text)
        fence = [[''] * n for _ in range(rails)]
        rail, direction = 0, 1
        for i in range(n):
            fence[rail][i] = '*'
            rail += direction
            if rail == rails - 1:
                direction = -1
            elif rail == 0:
                direction = 1
        idx = 0
        for r in range(rails):
            for j in range(n):
                if fence[r][j] == '*':
                    fence[r][j] = text[idx]
                    idx += 1
        result, rail, direction = "", 0, 1
        for i in range(n):
            result += fence[rail][i]
            rail += direction
            if rail == rails - 1:
                direction = -1
            elif rail == 0:
                direction = 1
        return result

    # Substitution
    @staticmethod
    def substitution_encrypt(text: str, key: str) -> str:
        if len(key) != 26:
            raise ValueError("Key must be exactly 26 characters")
        mapping = {chr(65 + i): c for i, c in enumerate(key.upper())}
        result = ""
        for char in text:
            if char.isupper():
                result += mapping.get(char, char)
            elif char.islower():
                result += mapping.get(char.upper(), char).lower()
            else:
                result += char
        return result

    @staticmethod
    def substitution_decrypt(text: str, key: str) -> str:
        if len(key) != 26:
            raise ValueError("Key must be exactly 26 characters")
        mapping = {c: chr(65 + i) for i, c in enumerate(key.upper())}
        result = ""
        for char in text:
            if char.isupper():
                result += mapping.get(char, char)
            elif char.islower():
                result += mapping.get(char.upper(), char).lower()
            else:
                result += char
        return result

    # Bacon
    @staticmethod
    def bacon_encrypt(text: str) -> str:
        bacon_dict = {
            'A': 'aaaaa', 'B': 'aaaab', 'C': 'aaaba', 'D': 'aaabb', 'E': 'aabaa',
            'F': 'aabab', 'G': 'aabba', 'H': 'aabbb', 'I': 'abaaa', 'J': 'abaab',
            'K': 'ababa', 'L': 'ababb', 'M': 'abbaa', 'N': 'abbab', 'O': 'abbba',
            'P': 'abbbb', 'Q': 'baaaa', 'R': 'baaab', 'S': 'baaba', 'T': 'baabb',
            'U': 'babaa', 'V': 'babab', 'W': 'babba', 'X': 'babbb', 'Y': 'bbaaa',
            'Z': 'bbaab'
        }
        return ''.join(bacon_dict.get(c, c) for c in text.upper())

    @staticmethod
    def bacon_decrypt(text: str) -> str:
        bacon_dict = {
            'aaaaa': 'A', 'aaaab': 'B', 'aaaba': 'C', 'aaabb': 'D', 'aabaa': 'E',
            'aabab': 'F', 'aabba': 'G', 'aabbb': 'H', 'abaaa': 'I', 'abaab': 'J',
            'ababa': 'K', 'ababb': 'L', 'abbaa': 'M', 'abbab': 'N', 'abbba': 'O',
            'abbbb': 'P', 'baaaa': 'Q', 'baaab': 'R', 'baaba': 'S', 'baabb': 'T',
            'babaa': 'U', 'babab': 'V', 'babba': 'W', 'babbb': 'X', 'bbaaa': 'Y',
            'bbaab': 'Z'
        }
        clean = re.sub(r'[^abAB]', '', text.lower())
        return ''.join(bacon_dict.get(clean[i:i+5], '?') for i in range(0, len(clean) - 4, 5))

    # Scytale
    @staticmethod
    def scytale_encrypt(text: str, diameter: int) -> str:
        if diameter <= 1:
            return text
        text = re.sub(r'\s', '', text)
        while len(text) % diameter != 0:
            text += 'X'
        rows = len(text) // diameter
        matrix = [['' for _ in range(diameter)] for _ in range(rows)]
        for i, char in enumerate(text):
            matrix[i // diameter][i % diameter] = char
        return ''.join(matrix[r][c] for c in range(diameter) for r in range(rows))

    @staticmethod
    def scytale_decrypt(text: str, diameter: int) -> str:
        if diameter <= 1:
            return text
        rows = len(text) // diameter + (1 if len(text) % diameter else 0)
        matrix = [['' for _ in range(diameter)] for _ in range(rows)]
        idx = 0
        for c in range(diameter):
            for r in range(rows):
                if idx < len(text):
                    matrix[r][c] = text[idx]
                    idx += 1
        return ''.join(''.join(row) for row in matrix).rstrip('X')


# ─── Analysis & Attack Functions ─────────────────────────────────
def frequency_analysis(text: str) -> List[Tuple[str, int, float]]:
    text = ''.join(filter(str.isalpha, text.upper()))
    freq = Counter(text)
    total = sum(freq.values()) or 1
    return sorted([(char, count, count/total) for char, count in freq.items()], key=lambda x: -x[1])


def caesar_brute_force(ciphertext: str) -> List[Tuple[int, str]]:
    return [(shift, ClassicalCiphers.caesar_decrypt(ciphertext, shift)) for shift in range(1, 26)]


def rail_fence_brute_force(ciphertext: str, max_rails: int = 10) -> List[Tuple[int, str]]:
    results = []
    for rails in range(2, max_rails + 1):
        try:
            results.append((rails, ClassicalCiphers.rail_fence_decrypt(ciphertext, rails)))
        except Exception:
            continue
    return results


def xor_brute_force_single_byte(ciphertext_bytes: bytes) -> List[Tuple[int, str, int]]:
    results = []
    for key in range(256):
        pt = bytes([b ^ key for b in ciphertext_bytes])
        try:
            text = pt.decode('utf-8')
        except Exception:
            text = pt.decode('latin1', errors='replace')
        score = sum(32 <= c <= 126 for c in pt)
        results.append((key, text, score))
    results.sort(key=lambda x: -x[2])
    return results[:10]


def playfair_dictionary_attack(ciphertext: str, wordlist: List[str]) -> List[Tuple[str, str, int]]:
    results = []
    for key in wordlist:
        try:
            pt = ClassicalCiphers.playfair_decrypt(ciphertext, key)
            score = sum(c in string.ascii_letters + ' ' for c in pt)
            results.append((key, pt, score))
        except Exception:
            continue
    results.sort(key=lambda x: -x[2])
    return results[:10]


# ─── Random Generators ───────────────────────────────────────────
def random_bytes(length: int) -> bytes:
    return os.urandom(length)


def random_ascii(length: int) -> str:
    return ''.join(random.choices(string.ascii_letters + string.digits, k=length))


def random_alpha(length: int) -> str:
    return ''.join(random.choices(string.ascii_uppercase, k=length))


def random_substitution_key() -> str:
    alpha = list(string.ascii_uppercase)
    random.shuffle(alpha)
    return ''.join(alpha)


# ─── Dots Cipher ─────────────────────────────────────────────────
def text_to_ascii_binary(text: str) -> str:
    return ' '.join(f'{ord(ch):08b}' for ch in text)


def ascii_binary_to_text(binary: str) -> str:
    bits = ''.join(b for b in binary if b in '01')
    return ''.join(chr(int(bits[i:i+8], 2)) for i in range(0, len(bits) - 7, 8))


# ─── Morse Code Functions ────────────────────────────────────────
def text_to_morse(text: str) -> str:
    if not text:
        return ""
    result = []
    for char in text.upper():
        if char in MORSE_CODE_DICT:
            result.append(MORSE_CODE_DICT[char])
        elif char == ' ':
            result.append('/')
        else:
            result.append('?')
    return ' '.join(result)


def morse_to_text(morse: str) -> str:
    if not morse:
        return ""
    try:
        words = morse.strip().split(' / ')
        decoded_words = []
        for word in words:
            if not word.strip():
                continue
            chars = word.strip().split()
            decoded_chars = [MORSE_CODE_DICT_REVERSE.get(c, '?') for c in chars]
            decoded_words.append(''.join(decoded_chars))
        return ' '.join(decoded_words)
    except Exception as e:
        return f"Error decoding Morse: {str(e)}"


def morse_to_audio(morse_code: str, frequency: int = 800, sample_rate: int = 44100, wpm: int = 20) -> bytes:
    """Generate WAV audio bytes from morse code"""
    dot_duration = 1.2 / wpm
    dash_duration = 3 * dot_duration
    element_gap = dot_duration
    char_gap = 3 * dot_duration
    word_gap = 7 * dot_duration

    def tone(duration):
        t = np.linspace(0, duration, int(sample_rate * duration), False)
        return np.sin(2 * np.pi * frequency * t)

    def silence(duration):
        return np.zeros(int(sample_rate * duration))

    samples = []
    for char in morse_code:
        if char == '.':
            samples.append(tone(dot_duration))
            samples.append(silence(element_gap))
        elif char == '-':
            samples.append(tone(dash_duration))
            samples.append(silence(element_gap))
        elif char == ' ':
            samples.append(silence(char_gap - element_gap))
        elif char == '/':
            samples.append(silence(word_gap - element_gap))

    if not samples:
        samples.append(silence(0.1))

    final = np.concatenate(samples)
    max_val = np.max(np.abs(final)) or 1
    audio_int16 = (final / max_val * 32767).astype(np.int16)

    # Write to WAV bytes
    import io
    buf = io.BytesIO()
    with wave.open(buf, 'wb') as wf:
        wf.setnchannels(1)
        wf.setsampwidth(2)
        wf.setframerate(sample_rate)
        wf.writeframes(audio_int16.tobytes())
    return buf.getvalue()


def audio_to_morse(filepath: str) -> Tuple[str, Optional[str]]:
    """Detect morse code from audio file"""
    ext = os.path.splitext(filepath)[1].lower()
    try:
        if ext == '.wav':
            return _process_wav_audio(filepath)
        elif ext == '.mp3':
            return _process_mp3_audio(filepath)
        else:
            return "", f"Unsupported audio format: {ext}"
    except Exception as e:
        return "", str(e)


def _process_wav_audio(filepath: str) -> Tuple[str, Optional[str]]:
    with wave.open(filepath, 'rb') as wf:
        n_channels = wf.getnchannels()
        sample_width = wf.getsampwidth()
        sample_rate = wf.getframerate()
        n_frames = wf.getnframes()
        raw = wf.readframes(n_frames)

    if sample_width == 2:
        samples = np.frombuffer(raw, dtype=np.int16).astype(np.float32)
    elif sample_width == 1:
        samples = np.frombuffer(raw, dtype=np.uint8).astype(np.float32) - 128
    else:
        return "", f"Unsupported sample width: {sample_width}"

    if n_channels == 2:
        samples = samples[::2]

    return _detect_morse_from_samples(samples, sample_rate)


def _process_mp3_audio(filepath: str) -> Tuple[str, Optional[str]]:
    try:
        from pydub import AudioSegment
        audio = AudioSegment.from_mp3(filepath)
        audio = audio.set_channels(1)
        samples = np.array(audio.get_array_of_samples(), dtype=np.float32)
        return _detect_morse_from_samples(samples, audio.frame_rate)
    except ImportError:
        return "", "pydub is required for MP3 processing"


def _detect_morse_from_samples(samples: np.ndarray, sample_rate: int) -> Tuple[str, Optional[str]]:
    """Detect morse from audio samples using envelope detection"""
    abs_samples = np.abs(samples)
    window = int(sample_rate * 0.01)
    if window < 1:
        window = 1
    envelope = np.convolve(abs_samples, np.ones(window) / window, mode='same')

    threshold = np.mean(envelope) + 0.3 * np.std(envelope)
    is_on = envelope > threshold

    # Find transitions
    changes = np.diff(is_on.astype(int))
    on_starts = np.where(changes == 1)[0]
    off_starts = np.where(changes == -1)[0]

    if len(on_starts) == 0 or len(off_starts) == 0:
        return "", "No morse code detected in audio"

    if off_starts[0] < on_starts[0]:
        off_starts = off_starts[1:]
    min_len = min(len(on_starts), len(off_starts))
    on_starts = on_starts[:min_len]
    off_starts = off_starts[:min_len]

    durations = (off_starts - on_starts) / sample_rate
    if len(durations) == 0:
        return "", "No morse tones detected"

    median_dur = np.median(durations)
    dot_threshold = median_dur * 2

    gaps = []
    for i in range(1, len(on_starts)):
        gaps.append((on_starts[i] - off_starts[i-1]) / sample_rate)

    morse = ""
    for i, dur in enumerate(durations):
        morse += '.' if dur < dot_threshold else '-'
        if i < len(gaps):
            if gaps[i] > median_dur * 5:
                morse += ' / '
            elif gaps[i] > median_dur * 2:
                morse += ' '

    return morse, None


# ─── Hash Identification ─────────────────────────────────────────
def identify_hash_type(hash_str: str) -> Tuple[str, Optional[str]]:
    """Identify hash type and return (type_name, hashcat_mode)"""
    hash_str = hash_str.strip()
    length = len(hash_str)

    if hash_str.startswith('$2a$') or hash_str.startswith('$2b$') or hash_str.startswith('$2y$'):
        return ("bcrypt", "3200")
    elif hash_str.startswith('$1$'):
        return ("MD5 Crypt", "500")
    elif hash_str.startswith('$5$'):
        return ("SHA-256 Crypt", "7400")
    elif hash_str.startswith('$6$'):
        return ("SHA-512 Crypt", "1800")
    elif hash_str.startswith('$pbkdf2$'):
        return ("PBKDF2", None)
    elif length == 32 and all(c in '0123456789abcdefABCDEF' for c in hash_str):
        return ("MD5", "0")
    elif length == 40 and all(c in '0123456789abcdefABCDEF' for c in hash_str):
        return ("SHA-1", "100")
    elif length == 64 and all(c in '0123456789abcdefABCDEF' for c in hash_str):
        return ("SHA-256", "1400")
    elif length == 128 and all(c in '0123456789abcdefABCDEF' for c in hash_str):
        return ("SHA-512", "1700")
    elif length == 13:
        return ("DES Crypt", "1500")
    elif length == 34 and hash_str.startswith('$P$'):
        return ("PHPass", "400")
    else:
        return ("Unknown/Unsupported", None)


def compute_hash(data: bytes, algorithm: str) -> str:
    """Compute hash of data"""
    algo = algorithm.lower()
    algo_map = {
        'md5': hashlib.md5,
        'sha1': hashlib.sha1,
        'sha224': hashlib.sha224,
        'sha256': hashlib.sha256,
        'sha384': hashlib.sha384,
        'sha512': hashlib.sha512,
        'sha3_256': hashlib.sha3_256,
        'sha3_512': hashlib.sha3_512,
        'blake2b': lambda d=b'': hashlib.blake2b(d),
        'blake2s': lambda d=b'': hashlib.blake2s(d),
    }
    if algo in ('blake2b', 'blake2s'):
        return hashlib.new(algo.replace('_', ''), data).hexdigest() if hasattr(hashlib, algo) else hashlib.new(algo, data).hexdigest()
    func = algo_map.get(algo)
    if not func:
        return f"Unsupported algorithm: {algorithm}"
    return func(data).hexdigest()


def compute_hmac(data: bytes, key: bytes, algorithm: str = 'sha256') -> str:
    """Compute HMAC"""
    algo_map = {
        'md5': hashlib.md5,
        'sha1': hashlib.sha1,
        'sha256': hashlib.sha256,
        'sha512': hashlib.sha512,
    }
    func = algo_map.get(algorithm.lower(), hashlib.sha256)
    return hmac_module.new(key, data, func).hexdigest()
