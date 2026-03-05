"""
ForensicsMainHand 2.0 - Crypto API Routes
"""
import os
import base64
import tempfile
from flask import Blueprint, request, jsonify, send_file

from .classical_ciphers import (
    BinaryCipher, XORCipher, ClassicalCiphers,
    frequency_analysis, caesar_brute_force, rail_fence_brute_force,
    xor_brute_force_single_byte, playfair_dictionary_attack,
    random_substitution_key, random_bytes, random_ascii,
    text_to_morse, morse_to_text, morse_to_audio, audio_to_morse,
    text_to_ascii_binary, ascii_binary_to_text,
    identify_hash_type, compute_hash, compute_hmac,
    MORSE_CODE_DICT
)
from .advanced_crypto import (
    aes_generate_key, aes_encrypt, aes_decrypt,
    blowfish_generate_key, blowfish_encrypt, blowfish_decrypt,
    des_generate_key, des_encrypt, des_decrypt,
    rsa_generate_keys, rsa_encrypt, rsa_decrypt,
    rc4_generate_key, rc4_encrypt, rc4_decrypt,
    otp_generate_key, otp_encrypt, otp_decrypt,
    base_encode, base_decode,
)

crypto_bp = Blueprint('crypto', __name__)


# ─── Classical Ciphers ───────────────────────────────────────────
@crypto_bp.route('/classical', methods=['POST'])
def classical_cipher():
    """Handle all classical cipher operations"""
    data = request.get_json()
    cipher = data.get('cipher', '')
    action = data.get('action', data.get('mode', 'encrypt'))
    text = data.get('text', '')
    key = data.get('key', '')

    try:
        if cipher == 'caesar':
            shift = int(data.get('shift', 3))
            result = ClassicalCiphers.caesar_encrypt(text, shift) if action == 'encrypt' else ClassicalCiphers.caesar_decrypt(text, shift)
        elif cipher == 'rot13':
            result = ClassicalCiphers.rot13_encrypt(text)
        elif cipher == 'atbash':
            result = ClassicalCiphers.atbash_encrypt(text)
        elif cipher == 'vigenere':
            result = ClassicalCiphers.vigenere_encrypt(text, key) if action == 'encrypt' else ClassicalCiphers.vigenere_decrypt(text, key)
        elif cipher == 'affine':
            a = int(data.get('a', 5))
            b = int(data.get('b', 8))
            result = ClassicalCiphers.affine_encrypt(text, a, b) if action == 'encrypt' else ClassicalCiphers.affine_decrypt(text, a, b)
        elif cipher == 'playfair':
            result = ClassicalCiphers.playfair_encrypt(text, key) if action == 'encrypt' else ClassicalCiphers.playfair_decrypt(text, key)
        elif cipher == 'rail_fence':
            rails = int(data.get('rails', 3))
            result = ClassicalCiphers.rail_fence_encrypt(text, rails) if action == 'encrypt' else ClassicalCiphers.rail_fence_decrypt(text, rails)
        elif cipher == 'substitution':
            result = ClassicalCiphers.substitution_encrypt(text, key) if action == 'encrypt' else ClassicalCiphers.substitution_decrypt(text, key)
        elif cipher == 'bacon':
            result = ClassicalCiphers.bacon_encrypt(text) if action == 'encrypt' else ClassicalCiphers.bacon_decrypt(text)
        elif cipher == 'scytale':
            diameter = int(data.get('diameter', 4))
            result = ClassicalCiphers.scytale_encrypt(text, diameter) if action == 'encrypt' else ClassicalCiphers.scytale_decrypt(text, diameter)
        else:
            return jsonify({"error": f"Unknown cipher: {cipher}"}), 400

        return jsonify({"result": result, "cipher": cipher, "action": action})
    except Exception as e:
        return jsonify({"error": str(e)}), 400


# ─── Binary/Hex/ASCII Conversions ────────────────────────────────
@crypto_bp.route('/binary', methods=['POST'])
def binary_operations():
    data = request.get_json()
    operation = data.get('operation', '')
    text = data.get('text', '')

    ops = {
        'text_to_binary': BinaryCipher.text_to_binary,
        'binary_to_text': BinaryCipher.binary_to_text,
        'text_to_ascii': BinaryCipher.text_to_ascii,
        'ascii_to_text': BinaryCipher.ascii_to_text,
        'text_to_hex': BinaryCipher.text_to_hex,
        'hex_to_text': BinaryCipher.hex_to_text,
        'binary_to_hex': BinaryCipher.binary_to_hex,
        'hex_to_binary': BinaryCipher.hex_to_binary,
    }

    func = ops.get(operation)
    if not func:
        return jsonify({"error": f"Unknown operation: {operation}"}), 400

    try:
        return jsonify({"result": func(text), "operation": operation})
    except Exception as e:
        return jsonify({"error": str(e)}), 400


# ─── XOR Cipher ──────────────────────────────────────────────────
@crypto_bp.route('/xor', methods=['POST'])
def xor_cipher():
    data = request.get_json()
    action = data.get('action', 'encrypt')
    text = data.get('text', '')
    key = data.get('key', '')
    single_char = data.get('single_char', False)

    try:
        if single_char:
            result = XORCipher.xor_single_char_encrypt(text, key) if action == 'encrypt' else XORCipher.xor_single_char_decrypt(text, key)
        else:
            result = XORCipher.xor_encrypt(text, key) if action == 'encrypt' else XORCipher.xor_decrypt(text, key)
        return jsonify({"result": result})
    except Exception as e:
        return jsonify({"error": str(e)}), 400


# ─── XOR Brute Force ─────────────────────────────────────────────
@crypto_bp.route('/xor/bruteforce', methods=['POST'])
def xor_bruteforce():
    data = request.get_json()
    hex_text = data.get('hex_text', '')
    try:
        ct_bytes = bytes.fromhex(hex_text.replace(" ", "").replace("\n", ""))
        results = xor_brute_force_single_byte(ct_bytes)
        return jsonify({"results": [{"key": k, "text": t, "score": s} for k, t, s in results]})
    except Exception as e:
        return jsonify({"error": str(e)}), 400


# ─── Caesar Brute Force ──────────────────────────────────────────
@crypto_bp.route('/caesar/bruteforce', methods=['POST'])
def caesar_bruteforce():
    data = request.get_json()
    text = data.get('text', '')
    results = caesar_brute_force(text)
    return jsonify({"results": [{"shift": s, "text": t} for s, t in results]})


# ─── Rail Fence Brute Force ──────────────────────────────────────
@crypto_bp.route('/railfence/bruteforce', methods=['POST'])
def railfence_bruteforce():
    data = request.get_json()
    text = data.get('text', '')
    max_rails = int(data.get('max_rails', 10))
    results = rail_fence_brute_force(text, max_rails)
    return jsonify({"results": [{"rails": r, "text": t} for r, t in results]})


# ─── Frequency Analysis ──────────────────────────────────────────
@crypto_bp.route('/frequency', methods=['POST'])
def freq_analysis():
    data = request.get_json()
    text = data.get('text', '')
    results = frequency_analysis(text)
    return jsonify({"results": [{"char": c, "count": n, "frequency": round(f, 4)} for c, n, f in results]})


# ─── Random Key Generation ───────────────────────────────────────
@crypto_bp.route('/generate-key', methods=['POST'])
def generate_key():
    data = request.get_json()
    key_type = data.get('type', data.get('cipher', 'substitution'))

    if key_type == 'substitution':
        return jsonify({"key": random_substitution_key()})
    elif key_type == 'random_ascii':
        length = int(data.get('length', 16))
        return jsonify({"key": random_ascii(length)})
    elif key_type == 'random_bytes':
        length = int(data.get('length', 16))
        return jsonify({"key": base64.b64encode(random_bytes(length)).decode()})
    elif key_type == 'vigenere':
        length = int(data.get('length', 8))
        from .classical_ciphers import random_alpha
        return jsonify({"key": random_alpha(length)})
    elif key_type == 'affine':
        coprimes = [1, 3, 5, 7, 9, 11, 15, 17, 19, 21, 23, 25]
        import random
        a = random.choice(coprimes)
        b = random.randint(0, 25)
        return jsonify({"key": f"{a},{b}", "a": a, "b": b})
    elif key_type == 'playfair':
        return jsonify({"key": random_ascii(8).upper()})
    elif key_type == 'xor':
        length = int(data.get('length', 8))
        return jsonify({"key": random_ascii(length)})
    else:
        return jsonify({"error": "Unknown key type"}), 400


# ─── Advanced Crypto ─────────────────────────────────────────────
@crypto_bp.route('/aes', methods=['POST'])
def aes_operations():
    data = request.get_json()
    action = data.get('action', 'encrypt')
    try:
        if action == 'generate_key':
            key_size = int(data.get('key_size', 256))
            key, iv = aes_generate_key(key_size)
            return jsonify({"key": key, "iv": iv})
        elif action == 'encrypt':
            result = aes_encrypt(data['text'], data['key'], data['iv'])
            return jsonify({"result": result})
        elif action == 'decrypt':
            result = aes_decrypt(data['text'], data['key'], data['iv'])
            return jsonify({"result": result})
    except Exception as e:
        return jsonify({"error": str(e)}), 400


@crypto_bp.route('/blowfish', methods=['POST'])
def blowfish_operations():
    data = request.get_json()
    action = data.get('action', 'encrypt')
    try:
        if action == 'generate_key':
            key_size = int(data.get('key_size', 128))
            key, iv = blowfish_generate_key(key_size)
            return jsonify({"key": key, "iv": iv})
        elif action == 'encrypt':
            result = blowfish_encrypt(data['text'], data['key'], data['iv'])
            return jsonify({"result": result})
        elif action == 'decrypt':
            result = blowfish_decrypt(data['text'], data['key'], data['iv'])
            return jsonify({"result": result})
    except Exception as e:
        return jsonify({"error": str(e)}), 400


@crypto_bp.route('/des', methods=['POST'])
def des_operations():
    data = request.get_json()
    action = data.get('action', 'encrypt')
    try:
        if action == 'generate_key':
            key, iv = des_generate_key()
            return jsonify({"key": key, "iv": iv})
        elif action == 'encrypt':
            result = des_encrypt(data['text'], data['key'], data['iv'])
            return jsonify({"result": result})
        elif action == 'decrypt':
            result = des_decrypt(data['text'], data['key'], data['iv'])
            return jsonify({"result": result})
    except Exception as e:
        return jsonify({"error": str(e)}), 400


@crypto_bp.route('/rsa', methods=['POST'])
def rsa_operations():
    data = request.get_json()
    action = data.get('action', 'generate_keys')
    try:
        if action == 'generate_keys':
            key_size = int(data.get('key_size', 2048))
            private_pem, public_pem = rsa_generate_keys(key_size)
            return jsonify({"private_key": private_pem, "public_key": public_pem})
        elif action == 'encrypt':
            result = rsa_encrypt(data['text'], data['public_key'])
            return jsonify({"result": result})
        elif action == 'decrypt':
            result = rsa_decrypt(data['text'], data['private_key'])
            return jsonify({"result": result})
    except Exception as e:
        return jsonify({"error": str(e)}), 400


@crypto_bp.route('/rc4', methods=['POST'])
def rc4_operations():
    data = request.get_json()
    action = data.get('action', 'encrypt')
    try:
        if action == 'generate_key':
            key_size = int(data.get('key_size', 16))
            return jsonify({"key": rc4_generate_key(key_size)})
        elif action == 'encrypt':
            result = rc4_encrypt(data['text'], data['key'])
            return jsonify({"result": result})
        elif action == 'decrypt':
            result = rc4_decrypt(data['text'], data['key'])
            return jsonify({"result": result})
    except Exception as e:
        return jsonify({"error": str(e)}), 400


@crypto_bp.route('/otp', methods=['POST'])
def otp_operations():
    data = request.get_json()
    action = data.get('action', 'encrypt')
    try:
        if action == 'generate_key':
            length = int(data.get('length', 32))
            return jsonify({"key": otp_generate_key(length)})
        elif action == 'encrypt':
            result = otp_encrypt(data['text'], data['key'])
            return jsonify({"result": result})
        elif action == 'decrypt':
            result = otp_decrypt(data['text'], data['key'])
            return jsonify({"result": result})
    except Exception as e:
        return jsonify({"error": str(e)}), 400


@crypto_bp.route('/base', methods=['POST'])
def base_operations():
    data = request.get_json()
    action = data.get('action', 'encode')
    mode = data.get('mode', 'base64')
    text = data.get('text', '')
    try:
        result = base_encode(text, mode) if action == 'encode' else base_decode(text, mode)
        return jsonify({"result": result})
    except Exception as e:
        return jsonify({"error": str(e)}), 400


# ─── Morse Code ──────────────────────────────────────────────────
@crypto_bp.route('/morse', methods=['POST'])
def morse_operations():
    data = request.get_json()
    action = data.get('action', 'text_to_morse')
    text = data.get('text', '')

    try:
        if action == 'text_to_morse':
            return jsonify({"result": text_to_morse(text)})
        elif action == 'morse_to_text':
            return jsonify({"result": morse_to_text(text)})
        else:
            return jsonify({"error": f"Unknown action: {action}"}), 400
    except Exception as e:
        return jsonify({"error": str(e)}), 400


@crypto_bp.route('/morse/audio', methods=['POST'])
def morse_audio():
    """Generate morse code audio"""
    data = request.get_json()
    morse = data.get('morse', '')
    freq = int(data.get('frequency', 800))
    wpm = int(data.get('wpm', 20))

    try:
        wav_bytes = morse_to_audio(morse, frequency=freq, wpm=wpm)
        tmp = tempfile.NamedTemporaryFile(suffix='.wav', delete=False)
        tmp.write(wav_bytes)
        tmp.close()
        return send_file(tmp.name, mimetype='audio/wav', as_attachment=True, download_name='morse.wav')
    except Exception as e:
        return jsonify({"error": str(e)}), 400


@crypto_bp.route('/morse/audio-decode', methods=['POST'])
def morse_audio_decode():
    """Decode morse from uploaded audio file"""
    if 'file' not in request.files:
        return jsonify({"error": "No file uploaded"}), 400

    file = request.files['file']
    tmp = tempfile.NamedTemporaryFile(suffix=os.path.splitext(file.filename)[1], delete=False)
    file.save(tmp.name)
    tmp.close()

    try:
        morse, error = audio_to_morse(tmp.name)
        if error:
            return jsonify({"error": error}), 400
        text = morse_to_text(morse)
        return jsonify({"morse": morse, "text": text})
    finally:
        os.unlink(tmp.name)


# ─── Dots Cipher ─────────────────────────────────────────────────
@crypto_bp.route('/dots', methods=['POST'])
def dots_cipher():
    data = request.get_json()
    action = data.get('action', 'encode')
    text = data.get('text', '')
    try:
        if action == 'encode':
            return jsonify({"result": text_to_ascii_binary(text)})
        elif action == 'decode':
            return jsonify({"result": ascii_binary_to_text(text)})
    except Exception as e:
        return jsonify({"error": str(e)}), 400


# ─── Playfair Dictionary Attack ──────────────────────────────────
@crypto_bp.route('/playfair/bruteforce', methods=['POST'])
def playfair_bruteforce():
    data = request.get_json()
    text = data.get('text', '')
    wordlist = data.get('wordlist', '')
    words = [w.strip() for w in wordlist.split('\n') if w.strip()] if wordlist else [
        'SECRET', 'CIPHER', 'HIDDEN', 'CRYPTO', 'PLAYFAIR', 'KEYWORD',
        'MONARCH', 'WHISPER', 'SHADOW', 'DRAGON', 'CASTLE', 'KNIGHT',
        'FALCON', 'PYTHON', 'ENIGMA', 'MATRIX', 'ALPHA', 'BRAVO',
        'CHARLIE', 'DELTA', 'ECHO', 'FOXTROT', 'HOTEL', 'INDIA',
    ]
    try:
        results = playfair_dictionary_attack(text, words)
        return jsonify({"results": [{"key": k, "text": t, "score": s} for k, t, s in results]})
    except Exception as e:
        return jsonify({"error": str(e)}), 400


# ─── Hash Operations ─────────────────────────────────────────────
@crypto_bp.route('/hash', methods=['POST'])
def hash_operations():
    data = request.get_json()
    action = data.get('action', 'compute')
    try:
        if action == 'compute':
            text = data.get('text', '')
            algorithm = data.get('algorithm', 'sha256')
            result = compute_hash(text.encode(), algorithm)
            return jsonify({"result": result, "algorithm": algorithm})
        elif action == 'identify':
            hash_str = data.get('hash', '')
            hash_type, hashcat_mode = identify_hash_type(hash_str)
            return jsonify({"type": hash_type, "hashcat_mode": hashcat_mode})
        elif action == 'hmac':
            text = data.get('text', '')
            key = data.get('key', '')
            algorithm = data.get('algorithm', 'sha256')
            result = compute_hmac(text.encode(), key.encode(), algorithm)
            return jsonify({"result": result})
    except Exception as e:
        return jsonify({"error": str(e)}), 400
