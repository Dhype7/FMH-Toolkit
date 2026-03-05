"""
ForensicsMainHand 2.0 - Advanced Cryptography (AES, DES, RSA, Blowfish, RC4, OTP)
Pure logic, no GUI dependencies.
"""
import base64
import os
from typing import Tuple, Optional


def aes_generate_key(key_size: int = 256) -> Tuple[str, str]:
    """Generate AES key and IV, return as base64 strings"""
    from cryptography.hazmat.primitives.ciphers import algorithms
    key = os.urandom(key_size // 8)
    iv = os.urandom(16)  # AES block size is always 16
    return base64.b64encode(key).decode(), base64.b64encode(iv).decode()


def aes_encrypt(plaintext: str, key_b64: str, iv_b64: str) -> str:
    """AES-CBC encrypt with PKCS7 padding"""
    from cryptography.hazmat.primitives.ciphers import Cipher, algorithms, modes
    from cryptography.hazmat.primitives import padding
    from cryptography.hazmat.backends import default_backend

    key = base64.b64decode(key_b64)
    iv = base64.b64decode(iv_b64)
    padder = padding.PKCS7(128).padder()
    padded = padder.update(plaintext.encode()) + padder.finalize()
    cipher = Cipher(algorithms.AES(key), modes.CBC(iv), backend=default_backend())
    enc = cipher.encryptor()
    ct = enc.update(padded) + enc.finalize()
    return base64.b64encode(ct).decode()


def aes_decrypt(ciphertext_b64: str, key_b64: str, iv_b64: str) -> str:
    """AES-CBC decrypt with PKCS7 unpadding"""
    from cryptography.hazmat.primitives.ciphers import Cipher, algorithms, modes
    from cryptography.hazmat.primitives import padding
    from cryptography.hazmat.backends import default_backend

    key = base64.b64decode(key_b64)
    iv = base64.b64decode(iv_b64)
    ct = base64.b64decode(ciphertext_b64)
    cipher = Cipher(algorithms.AES(key), modes.CBC(iv), backend=default_backend())
    dec = cipher.decryptor()
    padded = dec.update(ct) + dec.finalize()
    unpadder = padding.PKCS7(128).unpadder()
    data = unpadder.update(padded) + unpadder.finalize()
    return data.decode()


def blowfish_generate_key(key_size: int = 128) -> Tuple[str, str]:
    """Generate Blowfish key and IV"""
    key = os.urandom(key_size // 8)
    iv = os.urandom(8)  # Blowfish block size is 8
    return base64.b64encode(key).decode(), base64.b64encode(iv).decode()


def blowfish_encrypt(plaintext: str, key_b64: str, iv_b64: str) -> str:
    """Blowfish-CBC encrypt"""
    from cryptography.hazmat.primitives.ciphers import Cipher, algorithms, modes
    from cryptography.hazmat.primitives import padding
    from cryptography.hazmat.backends import default_backend

    key = base64.b64decode(key_b64)
    iv = base64.b64decode(iv_b64)
    padder = padding.PKCS7(64).padder()
    padded = padder.update(plaintext.encode()) + padder.finalize()
    cipher = Cipher(algorithms.Blowfish(key), modes.CBC(iv), backend=default_backend())
    enc = cipher.encryptor()
    ct = enc.update(padded) + enc.finalize()
    return base64.b64encode(ct).decode()


def blowfish_decrypt(ciphertext_b64: str, key_b64: str, iv_b64: str) -> str:
    """Blowfish-CBC decrypt"""
    from cryptography.hazmat.primitives.ciphers import Cipher, algorithms, modes
    from cryptography.hazmat.primitives import padding
    from cryptography.hazmat.backends import default_backend

    key = base64.b64decode(key_b64)
    iv = base64.b64decode(iv_b64)
    ct = base64.b64decode(ciphertext_b64)
    cipher = Cipher(algorithms.Blowfish(key), modes.CBC(iv), backend=default_backend())
    dec = cipher.decryptor()
    padded = dec.update(ct) + dec.finalize()
    unpadder = padding.PKCS7(64).unpadder()
    data = unpadder.update(padded) + unpadder.finalize()
    return data.decode()


def des_generate_key() -> Tuple[str, str]:
    """Generate DES key (8 bytes) and IV (8 bytes)"""
    key = os.urandom(8)
    iv = os.urandom(8)
    return base64.b64encode(key).decode(), base64.b64encode(iv).decode()


def des_encrypt(plaintext: str, key_b64: str, iv_b64: str) -> str:
    """DES-CBC encrypt"""
    from Crypto.Cipher import DES
    from Crypto.Util.Padding import pad

    key = base64.b64decode(key_b64)
    iv = base64.b64decode(iv_b64)
    cipher = DES.new(key, DES.MODE_CBC, iv)
    ct = cipher.encrypt(pad(plaintext.encode(), 8))
    return base64.b64encode(ct).decode()


def des_decrypt(ciphertext_b64: str, key_b64: str, iv_b64: str) -> str:
    """DES-CBC decrypt"""
    from Crypto.Cipher import DES
    from Crypto.Util.Padding import unpad

    key = base64.b64decode(key_b64)
    iv = base64.b64decode(iv_b64)
    ct = base64.b64decode(ciphertext_b64)
    cipher = DES.new(key, DES.MODE_CBC, iv)
    data = unpad(cipher.decrypt(ct), 8)
    return data.decode()


def rsa_generate_keys(key_size: int = 2048) -> Tuple[str, str]:
    """Generate RSA key pair, return (private_pem, public_pem) as strings"""
    from cryptography.hazmat.primitives.asymmetric import rsa
    from cryptography.hazmat.primitives import serialization
    from cryptography.hazmat.backends import default_backend

    private_key = rsa.generate_private_key(
        public_exponent=65537,
        key_size=key_size,
        backend=default_backend()
    )
    private_pem = private_key.private_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PrivateFormat.PKCS8,
        encryption_algorithm=serialization.NoEncryption()
    ).decode()
    public_pem = private_key.public_key().public_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PublicFormat.SubjectPublicKeyInfo
    ).decode()
    return private_pem, public_pem


def rsa_encrypt(plaintext: str, public_pem: str) -> str:
    """RSA-OAEP encrypt"""
    from cryptography.hazmat.primitives.asymmetric import padding as asym_padding
    from cryptography.hazmat.primitives import hashes, serialization
    from cryptography.hazmat.backends import default_backend

    public_key = serialization.load_pem_public_key(public_pem.encode(), backend=default_backend())
    encrypted = public_key.encrypt(
        plaintext.encode(),
        asym_padding.OAEP(
            mgf=asym_padding.MGF1(algorithm=hashes.SHA256()),
            algorithm=hashes.SHA256(),
            label=None
        )
    )
    return base64.b64encode(encrypted).decode()


def rsa_decrypt(ciphertext_b64: str, private_pem: str) -> str:
    """RSA-OAEP decrypt"""
    from cryptography.hazmat.primitives.asymmetric import padding as asym_padding
    from cryptography.hazmat.primitives import hashes, serialization
    from cryptography.hazmat.backends import default_backend

    private_key = serialization.load_pem_private_key(private_pem.encode(), password=None, backend=default_backend())
    encrypted = base64.b64decode(ciphertext_b64)
    decrypted = private_key.decrypt(
        encrypted,
        asym_padding.OAEP(
            mgf=asym_padding.MGF1(algorithm=hashes.SHA256()),
            algorithm=hashes.SHA256(),
            label=None
        )
    )
    return decrypted.decode()


def rc4_encrypt(plaintext: str, key_b64: str) -> str:
    """RC4 encrypt (manual implementation)"""
    key = base64.b64decode(key_b64)
    msg = plaintext.encode()
    S = list(range(256))
    j = 0
    for i in range(256):
        j = (j + S[i] + key[i % len(key)]) % 256
        S[i], S[j] = S[j], S[i]
    i = j = 0
    out = []
    for byte in msg:
        i = (i + 1) % 256
        j = (j + S[i]) % 256
        S[i], S[j] = S[j], S[i]
        out.append(byte ^ S[(S[i] + S[j]) % 256])
    return base64.b64encode(bytes(out)).decode()


def rc4_decrypt(ciphertext_b64: str, key_b64: str) -> str:
    """RC4 decrypt (symmetric with encrypt)"""
    key = base64.b64decode(key_b64)
    ct = base64.b64decode(ciphertext_b64)
    S = list(range(256))
    j = 0
    for i in range(256):
        j = (j + S[i] + key[i % len(key)]) % 256
        S[i], S[j] = S[j], S[i]
    i = j = 0
    out = []
    for byte in ct:
        i = (i + 1) % 256
        j = (j + S[i]) % 256
        S[i], S[j] = S[j], S[i]
        out.append(byte ^ S[(S[i] + S[j]) % 256])
    return bytes(out).decode()


def rc4_generate_key(key_size: int = 16) -> str:
    """Generate RC4 key"""
    return base64.b64encode(os.urandom(key_size)).decode()


def otp_generate_key(length: int) -> str:
    """Generate OTP key matching message length"""
    return base64.b64encode(os.urandom(length)).decode()


def otp_encrypt(plaintext: str, key_b64: str) -> str:
    """One-Time Pad encrypt"""
    msg = plaintext.encode()
    key = base64.b64decode(key_b64)
    if len(key) < len(msg):
        raise ValueError("OTP key must be at least as long as the message")
    ct = bytes(m ^ k for m, k in zip(msg, key))
    return base64.b64encode(ct).decode()


def otp_decrypt(ciphertext_b64: str, key_b64: str) -> str:
    """One-Time Pad decrypt"""
    ct = base64.b64decode(ciphertext_b64)
    key = base64.b64decode(key_b64)
    if len(key) < len(ct):
        raise ValueError("OTP key must be at least as long as the ciphertext")
    pt = bytes(c ^ k for c, k in zip(ct, key))
    return pt.decode()


def base_encode(data: str, mode: str = 'base64') -> str:
    """Base64/32/16 encode"""
    msg = data.encode()
    if mode == 'base64':
        return base64.b64encode(msg).decode()
    elif mode == 'base32':
        return base64.b32encode(msg).decode()
    elif mode == 'base16':
        return base64.b16encode(msg).decode()
    else:
        raise ValueError(f"Unsupported mode: {mode}")


def base_decode(data: str, mode: str = 'base64') -> str:
    """Base64/32/16 decode"""
    if mode == 'base64':
        return base64.b64decode(data).decode('utf-8')
    elif mode == 'base32':
        return base64.b32decode(data).decode('utf-8')
    elif mode == 'base16':
        return base64.b16decode(data).decode('utf-8')
    else:
        raise ValueError(f"Unsupported mode: {mode}")
