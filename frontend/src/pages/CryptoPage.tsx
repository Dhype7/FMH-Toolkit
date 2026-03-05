import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  HiOutlineLockClosed,
  HiOutlineKey,
  HiOutlineSwitchHorizontal,
  HiOutlineFingerPrint,
  HiOutlineVolumeUp,
  HiOutlineCode,
  HiOutlineRefresh,
  HiOutlineClipboardCopy,
  HiOutlineUpload,
} from 'react-icons/hi';
import toast from 'react-hot-toast';
import api, { uploadFile } from '@/utils/api';
import ResultsPanel, { PageHeader, CyberTabs, SectionCard } from '@/components/ResultsPanel';

/* ════════════════════════════════════════════════════════
   TABS
   ════════════════════════════════════════════════════════ */
const tabs = [
  { id: 'classical', label: 'Classical', icon: HiOutlineLockClosed },
  { id: 'advanced', label: 'Advanced', icon: HiOutlineKey },
  { id: 'encoding', label: 'Encoding', icon: HiOutlineCode },
  { id: 'morse', label: 'Morse & Dots', icon: HiOutlineVolumeUp },
  { id: 'hash', label: 'Hash Tools', icon: HiOutlineFingerPrint },
  { id: 'bruteforce', label: 'Brute Force', icon: HiOutlineSwitchHorizontal },
];

const classicalCiphers = [
  { id: 'caesar', label: 'Caesar' },
  { id: 'rot13', label: 'ROT13' },
  { id: 'atbash', label: 'Atbash' },
  { id: 'vigenere', label: 'Vigenère' },
  { id: 'affine', label: 'Affine' },
  { id: 'playfair', label: 'Playfair' },
  { id: 'rail_fence', label: 'Rail Fence' },
  { id: 'substitution', label: 'Substitution' },
  { id: 'bacon', label: 'Bacon' },
  { id: 'scytale', label: 'Scytale' },
];

const advancedCiphers = [
  { id: 'aes', label: 'AES', hasIv: true, keySizes: [128, 192, 256] },
  { id: 'des', label: 'DES', hasIv: true, keySizes: [64] },
  { id: 'blowfish', label: 'Blowfish', hasIv: true, keySizes: [64, 128, 192, 256, 384, 448] },
  { id: 'rsa', label: 'RSA', hasIv: false, keySizes: [1024, 2048, 4096] },
  { id: 'rc4', label: 'RC4', hasIv: false, keySizes: [64, 128, 256] },
  { id: 'otp', label: 'OTP', hasIv: false, keySizes: [] },
];

const binaryOps = [
  { id: 'text_to_binary', label: 'Text → Binary' },
  { id: 'binary_to_text', label: 'Binary → Text' },
  { id: 'text_to_ascii', label: 'Text → ASCII' },
  { id: 'ascii_to_text', label: 'ASCII → Text' },
  { id: 'text_to_hex', label: 'Text → Hex' },
  { id: 'hex_to_text', label: 'Hex → Text' },
  { id: 'binary_to_hex', label: 'Binary → Hex' },
  { id: 'hex_to_binary', label: 'Hex → Binary' },
];

const hashAlgorithms = ['md5', 'sha1', 'sha224', 'sha256', 'sha384', 'sha512', 'sha3_256', 'sha3_512', 'blake2b', 'blake2s'];

const copyToClipboard = (text: string) => {
  navigator.clipboard.writeText(text);
  toast.success('Copied to clipboard');
};

export default function CryptoPage() {
  const [activeTab, setActiveTab] = useState('classical');
  const [result, setResult] = useState<unknown>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /* ─── Classical state ──────────────────────── */
  const [classicalCipher, setClassicalCipher] = useState('caesar');
  const [classicalText, setClassicalText] = useState('');
  const [classicalMode, setClassicalMode] = useState<'encrypt' | 'decrypt'>('encrypt');
  const [caesarShift, setCaesarShift] = useState(3);
  const [vigenereKey, setVigenereKey] = useState('');
  const [affineA, setAffineA] = useState(5);
  const [affineB, setAffineB] = useState(8);
  const [playfairKey, setPlayfairKey] = useState('');
  const [railFenceRails, setRailFenceRails] = useState(3);
  const [substitutionKey, setSubstitutionKey] = useState('');
  const [scytaleDiameter, setScytaleDiameter] = useState(4);

  /* ─── XOR state ────────────────────────────── */
  const [xorText, setXorText] = useState('');
  const [xorKey, setXorKey] = useState('');
  const [xorMode, setXorMode] = useState<'encrypt' | 'decrypt'>('encrypt');
  const [xorSingleChar, setXorSingleChar] = useState(false);

  /* ─── Binary state ─────────────────────────── */
  const [binaryOp, setBinaryOp] = useState('text_to_binary');
  const [binaryText, setBinaryText] = useState('');

  /* ─── Advanced state ───────────────────────── */
  const [advancedCipher, setAdvancedCipher] = useState('aes');
  const [advancedText, setAdvancedText] = useState('');
  const [advancedKey, setAdvancedKey] = useState('');
  const [advancedIv, setAdvancedIv] = useState('');
  const [advancedMode, setAdvancedMode] = useState<'encrypt' | 'decrypt'>('encrypt');
  const [advancedKeySize, setAdvancedKeySize] = useState(256);
  // RSA-specific state
  const [rsaPublicKey, setRsaPublicKey] = useState('');
  const [rsaPrivateKey, setRsaPrivateKey] = useState('');

  /* ─── Encoding state ───────────────────────── */
  const [baseType, setBaseType] = useState('base64');
  const [encText, setEncText] = useState('');
  const [encMode, setEncMode] = useState<'encode' | 'decode'>('encode');

  /* ─── Morse / Dots ─────────────────────────── */
  const [morseText, setMorseText] = useState('');
  const [morseMode, setMorseMode] = useState<'text_to_morse' | 'morse_to_text'>('text_to_morse');
  const [morseFreq, setMorseFreq] = useState(800);
  const [morseWpm, setMorseWpm] = useState(20);
  const [dotsText, setDotsText] = useState('');
  const [dotsMode, setDotsMode] = useState<'encode' | 'decode'>('encode');
  const audioRef = useRef<HTMLInputElement>(null);

  /* ─── Hash ─────────────────────────────────── */
  const [hashInput, setHashInput] = useState('');
  const [hashAlgo, setHashAlgo] = useState('sha256');
  const [hashIdentifyInput, setHashIdentifyInput] = useState('');
  const [hmacText, setHmacText] = useState('');
  const [hmacKey, setHmacKey] = useState('');
  const [hmacAlgo, setHmacAlgo] = useState('sha256');

  /* ─── Brute force ──────────────────────────── */
  const [bfType, setBfType] = useState<'caesar' | 'xor' | 'railfence' | 'playfair'>('caesar');
  const [bfText, setBfText] = useState('');
  const [bfMaxRails, setBfMaxRails] = useState(10);
  const [bfWordlist, setBfWordlist] = useState('');

  /* ─── API call helper ──────────────────────── */
  const call = useCallback(async (endpoint: string, body: Record<string, unknown>) => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.post(`/crypto${endpoint}`, body);
      setResult(data);
      toast.success('Operation completed');
    } catch (e: any) {
      const msg = e?.response?.data?.error || e.message;
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  /* ─── Classical cipher handler ─────────────── */
  const handleClassical = () => {
    const body: Record<string, unknown> = {
      cipher: classicalCipher,
      action: classicalMode,
      text: classicalText,
    };
    switch (classicalCipher) {
      case 'caesar': body.shift = caesarShift; break;
      case 'vigenere': body.key = vigenereKey; break;
      case 'affine': body.a = affineA; body.b = affineB; break;
      case 'playfair': body.key = playfairKey; break;
      case 'rail_fence': body.rails = railFenceRails; break;
      case 'substitution': body.key = substitutionKey; break;
      case 'scytale': body.diameter = scytaleDiameter; break;
    }
    call('/classical', body);
  };

  /* ─── Advanced cipher handler ──────────────── */
  const handleAdvanced = () => {
    const cipher = advancedCipher;
    if (cipher === 'rsa') {
      call('/rsa', {
        action: advancedMode,
        text: advancedText,
        public_key: rsaPublicKey,
        private_key: rsaPrivateKey,
      });
    } else if (cipher === 'otp') {
      call('/otp', {
        action: advancedMode,
        text: advancedText,
        key: advancedKey,
      });
    } else {
      const info = advancedCiphers.find(c => c.id === cipher);
      const body: Record<string, unknown> = {
        action: advancedMode,
        text: advancedText,
        key: advancedKey,
      };
      if (info?.hasIv) body.iv = advancedIv;
      call(`/${cipher}`, body);
    }
  };

  const handleAdvancedGenerateKey = async () => {
    setLoading(true);
    try {
      if (advancedCipher === 'rsa') {
        const { data } = await api.post('/crypto/rsa', { action: 'generate_keys', key_size: advancedKeySize });
        setRsaPublicKey(data.public_key);
        setRsaPrivateKey(data.private_key);
        setResult(data);
        toast.success('RSA key pair generated');
      } else if (advancedCipher === 'otp') {
        const length = advancedText.length || 32;
        const { data } = await api.post('/crypto/otp', { action: 'generate_key', length });
        setAdvancedKey(data.key);
        toast.success('OTP key generated');
      } else {
        const { data } = await api.post(`/crypto/${advancedCipher}`, {
          action: 'generate_key',
          key_size: advancedKeySize,
        });
        if (data.key) setAdvancedKey(data.key);
        if (data.iv) setAdvancedIv(data.iv);
        toast.success('Key generated');
      }
    } catch (e: any) {
      toast.error(e?.response?.data?.error || e.message);
    } finally {
      setLoading(false);
    }
  };

  /* ─── Key hint per classical cipher ────────── */
  const renderClassicalParams = () => {
    switch (classicalCipher) {
      case 'caesar':
        return (
          <div>
            <label className="block text-xs font-mono text-cyber-text-dim mb-1">SHIFT (1-25)</label>
            <input type="number" min={1} max={25} value={caesarShift}
              onChange={e => setCaesarShift(Number(e.target.value))} className="cyber-input w-32" />
          </div>
        );
      case 'vigenere':
        return (
          <div>
            <label className="block text-xs font-mono text-cyber-text-dim mb-1">KEYWORD</label>
            <div className="flex gap-2">
              <input value={vigenereKey} onChange={e => setVigenereKey(e.target.value)}
                className="cyber-input flex-1" placeholder="e.g. SECRET" />
              <button className="cyber-btn-sm cyber-btn-green" onClick={async () => {
                const { data } = await api.post('/crypto/generate-key', { type: 'vigenere', length: 8 });
                setVigenereKey(data.key); toast.success('Key generated');
              }}>🎲</button>
            </div>
          </div>
        );
      case 'affine':
        return (
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-mono text-cyber-text-dim mb-1">A (coprime 26)</label>
              <input type="number" value={affineA} onChange={e => setAffineA(Number(e.target.value))}
                className="cyber-input" />
            </div>
            <div>
              <label className="block text-xs font-mono text-cyber-text-dim mb-1">B (0-25)</label>
              <input type="number" value={affineB} onChange={e => setAffineB(Number(e.target.value))}
                className="cyber-input" />
            </div>
          </div>
        );
      case 'playfair':
        return (
          <div>
            <label className="block text-xs font-mono text-cyber-text-dim mb-1">KEYWORD</label>
            <div className="flex gap-2">
              <input value={playfairKey} onChange={e => setPlayfairKey(e.target.value)}
                className="cyber-input flex-1" placeholder="e.g. MONARCHY" />
              <button className="cyber-btn-sm cyber-btn-green" onClick={async () => {
                const { data } = await api.post('/crypto/generate-key', { type: 'playfair' });
                setPlayfairKey(data.key); toast.success('Key generated');
              }}>🎲</button>
            </div>
          </div>
        );
      case 'rail_fence':
        return (
          <div>
            <label className="block text-xs font-mono text-cyber-text-dim mb-1">RAILS (2-20)</label>
            <input type="number" min={2} max={20} value={railFenceRails}
              onChange={e => setRailFenceRails(Number(e.target.value))} className="cyber-input w-32" />
          </div>
        );
      case 'substitution':
        return (
          <div>
            <label className="block text-xs font-mono text-cyber-text-dim mb-1">SUBSTITUTION KEY (26 chars)</label>
            <div className="flex gap-2">
              <input value={substitutionKey} onChange={e => setSubstitutionKey(e.target.value)}
                className="cyber-input flex-1 font-mono text-sm" placeholder="26-letter alphabet..." />
              <button className="cyber-btn-sm cyber-btn-green" onClick={async () => {
                const { data } = await api.post('/crypto/generate-key', { type: 'substitution' });
                setSubstitutionKey(data.key); toast.success('Key generated');
              }}>🎲</button>
            </div>
          </div>
        );
      case 'scytale':
        return (
          <div>
            <label className="block text-xs font-mono text-cyber-text-dim mb-1">DIAMETER / COLUMNS</label>
            <input type="number" min={2} max={50} value={scytaleDiameter}
              onChange={e => setScytaleDiameter(Number(e.target.value))} className="cyber-input w-32" />
          </div>
        );
      default: // rot13, atbash, bacon - no params
        return null;
    }
  };

  /* ─── Advanced params render ───────────────── */
  const renderAdvancedParams = () => {
    const info = advancedCiphers.find(c => c.id === advancedCipher);
    if (!info) return null;

    if (advancedCipher === 'rsa') {
      return (
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-mono text-cyber-text-dim mb-1">KEY SIZE</label>
            <select value={advancedKeySize} onChange={e => setAdvancedKeySize(Number(e.target.value))} className="cyber-select w-40">
              {info.keySizes.map(s => <option key={s} value={s}>{s} bits</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-mono text-cyber-text-dim mb-1">PUBLIC KEY (PEM)</label>
            <textarea value={rsaPublicKey} onChange={e => setRsaPublicKey(e.target.value)}
              className="cyber-input min-h-[80px] resize-y font-mono text-xs" placeholder="-----BEGIN PUBLIC KEY-----" />
          </div>
          <div>
            <label className="block text-xs font-mono text-cyber-text-dim mb-1">PRIVATE KEY (PEM)</label>
            <textarea value={rsaPrivateKey} onChange={e => setRsaPrivateKey(e.target.value)}
              className="cyber-input min-h-[80px] resize-y font-mono text-xs" placeholder="-----BEGIN PRIVATE KEY-----" />
          </div>
        </div>
      );
    }

    if (advancedCipher === 'otp') {
      return (
        <div>
          <label className="block text-xs font-mono text-cyber-text-dim mb-1">OTP KEY (Base64) — must be ≥ message length</label>
          <textarea value={advancedKey} onChange={e => setAdvancedKey(e.target.value)}
            className="cyber-input min-h-[60px] resize-y font-mono text-sm" placeholder="Auto-generated Base64 key..." />
        </div>
      );
    }

    return (
      <div className="space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {info.keySizes.length > 0 && (
            <div>
              <label className="block text-xs font-mono text-cyber-text-dim mb-1">KEY SIZE</label>
              <select value={advancedKeySize} onChange={e => setAdvancedKeySize(Number(e.target.value))} className="cyber-select">
                {info.keySizes.map(s => <option key={s} value={s}>{s} bits</option>)}
              </select>
            </div>
          )}
        </div>
        <div>
          <label className="block text-xs font-mono text-cyber-text-dim mb-1">KEY (Base64)</label>
          <div className="flex gap-2">
            <input value={advancedKey} onChange={e => setAdvancedKey(e.target.value)}
              className="cyber-input flex-1 font-mono text-sm" placeholder="Base64 encoded key..." />
            <button onClick={() => copyToClipboard(advancedKey)} className="cyber-btn-sm cyber-btn" title="Copy">
              <HiOutlineClipboardCopy className="w-4 h-4"/>
            </button>
          </div>
        </div>
        {info.hasIv && (
          <div>
            <label className="block text-xs font-mono text-cyber-text-dim mb-1">IV (Base64)</label>
            <div className="flex gap-2">
              <input value={advancedIv} onChange={e => setAdvancedIv(e.target.value)}
                className="cyber-input flex-1 font-mono text-sm" placeholder="Base64 encoded IV..." />
              <button onClick={() => copyToClipboard(advancedIv)} className="cyber-btn-sm cyber-btn" title="Copy">
                <HiOutlineClipboardCopy className="w-4 h-4"/>
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="max-w-5xl mx-auto">
      <PageHeader
        title="CRYPTOGRAPHY"
        subtitle="Classical ciphers, modern encryption, encoding, morse code & hash tools"
        icon={HiOutlineLockClosed}
        accentColor="#7c3aed"
      />

      <CyberTabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

      <div className="mt-5 space-y-5">
        <AnimatePresence mode="wait">
          {/* ═══════════════════════════════════════════════
              CLASSICAL CIPHERS
             ═══════════════════════════════════════════════ */}
          {activeTab === 'classical' && (
            <motion.div key="classical" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-5">
              {/* Classical Cipher Section */}
              <SectionCard title="Classical Ciphers" icon={HiOutlineLockClosed} color="#7c3aed">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-xs font-mono text-cyber-text-dim mb-1">CIPHER</label>
                    <select value={classicalCipher} onChange={e => setClassicalCipher(e.target.value)} className="cyber-select">
                      {classicalCiphers.map(c => (
                        <option key={c.id} value={c.id}>{c.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-mono text-cyber-text-dim mb-1">MODE</label>
                    <div className="flex gap-2">
                      <button onClick={() => setClassicalMode('encrypt')}
                        className={classicalMode === 'encrypt' ? 'cyber-btn-primary flex-1' : 'cyber-btn flex-1'}>
                        🔒 Encrypt
                      </button>
                      <button onClick={() => setClassicalMode('decrypt')}
                        className={classicalMode === 'decrypt' ? 'cyber-btn-danger flex-1' : 'cyber-btn flex-1'}>
                        🔓 Decrypt
                      </button>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-mono text-cyber-text-dim mb-1">INPUT TEXT</label>
                    <textarea value={classicalText} onChange={e => setClassicalText(e.target.value)}
                      className="cyber-input min-h-[100px] resize-y" placeholder="Enter text to encrypt/decrypt..." />
                  </div>

                  {renderClassicalParams()}

                  <button onClick={handleClassical} className="cyber-btn-primary" disabled={!classicalText || loading}>
                    {loading ? 'Processing...' : classicalMode === 'encrypt' ? '🔒 Encrypt' : '🔓 Decrypt'}
                  </button>
                </div>
              </SectionCard>

              {/* XOR Cipher Section */}
              <SectionCard title="XOR Cipher" icon={HiOutlineSwitchHorizontal} color="#00d4ff">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-xs font-mono text-cyber-text-dim mb-1">MODE</label>
                    <div className="flex gap-2">
                      <button onClick={() => setXorMode('encrypt')}
                        className={xorMode === 'encrypt' ? 'cyber-btn-primary flex-1' : 'cyber-btn flex-1'}>
                        Encrypt
                      </button>
                      <button onClick={() => setXorMode('decrypt')}
                        className={xorMode === 'decrypt' ? 'cyber-btn-danger flex-1' : 'cyber-btn flex-1'}>
                        Decrypt
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-mono text-cyber-text-dim mb-1">TYPE</label>
                    <div className="flex gap-2">
                      <button onClick={() => setXorSingleChar(false)}
                        className={!xorSingleChar ? 'cyber-btn-primary flex-1' : 'cyber-btn flex-1'}>
                        Multi-byte
                      </button>
                      <button onClick={() => setXorSingleChar(true)}
                        className={xorSingleChar ? 'cyber-btn-primary flex-1' : 'cyber-btn flex-1'}>
                        Single Char
                      </button>
                    </div>
                  </div>
                </div>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-mono text-cyber-text-dim mb-1">
                      {xorMode === 'encrypt' ? 'PLAINTEXT' : 'HEX CIPHERTEXT'}
                    </label>
                    <textarea value={xorText} onChange={e => setXorText(e.target.value)}
                      className="cyber-input min-h-[80px] resize-y"
                      placeholder={xorMode === 'encrypt' ? 'Enter text...' : 'Enter hex (e.g. 4a 6f 68 6e)...'} />
                  </div>
                  <div>
                    <label className="block text-xs font-mono text-cyber-text-dim mb-1">
                      KEY {xorSingleChar ? '(single character)' : '(repeating key)'}
                    </label>
                    <div className="flex gap-2">
                      <input value={xorKey} onChange={e => setXorKey(e.target.value)}
                        className="cyber-input flex-1" placeholder={xorSingleChar ? 'Single char key' : 'XOR key'} />
                      <button className="cyber-btn-sm cyber-btn-green" onClick={async () => {
                        const { data } = await api.post('/crypto/generate-key', { type: 'xor', length: 8 });
                        setXorKey(data.key); toast.success('XOR key generated');
                      }}>🎲</button>
                    </div>
                  </div>
                  <button onClick={() => call('/xor', { text: xorText, key: xorKey, action: xorMode, single_char: xorSingleChar })}
                    className="cyber-btn-primary" disabled={!xorText || !xorKey || loading}>
                    {loading ? 'Processing...' : xorMode === 'encrypt' ? '🔒 XOR Encrypt' : '🔓 XOR Decrypt'}
                  </button>
                </div>
              </SectionCard>

              {/* Binary/Hex/ASCII Conversions */}
              <SectionCard title="Binary / Hex / ASCII" icon={HiOutlineCode} color="#00ff88">
                <div className="mb-3">
                  <label className="block text-xs font-mono text-cyber-text-dim mb-1">CONVERSION</label>
                  <select value={binaryOp} onChange={e => setBinaryOp(e.target.value)} className="cyber-select">
                    {binaryOps.map(op => (
                      <option key={op.id} value={op.id}>{op.label}</option>
                    ))}
                  </select>
                </div>
                <textarea value={binaryText} onChange={e => setBinaryText(e.target.value)}
                  className="cyber-input min-h-[80px] resize-y mb-3" placeholder="Enter input..." />
                <button onClick={() => call('/binary', { text: binaryText, operation: binaryOp })}
                  className="cyber-btn-primary" disabled={!binaryText || loading}>
                  {loading ? 'Converting...' : '⚡ Convert'}
                </button>
              </SectionCard>
            </motion.div>
          )}

          {/* ═══════════════════════════════════════════════
              ADVANCED ENCRYPTION
             ═══════════════════════════════════════════════ */}
          {activeTab === 'advanced' && (
            <motion.div key="advanced" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <SectionCard title="Advanced Encryption" icon={HiOutlineKey} color="#00d4ff">
                {/* Cipher selector grid */}
                <div className="grid grid-cols-3 md:grid-cols-6 gap-2 mb-5">
                  {advancedCiphers.map(c => (
                    <button key={c.id}
                      onClick={() => { setAdvancedCipher(c.id); setAdvancedKey(''); setAdvancedIv(''); setRsaPublicKey(''); setRsaPrivateKey(''); }}
                      className={`py-2 px-3 rounded-lg text-xs font-mono font-bold transition-all border ${
                        advancedCipher === c.id
                          ? 'border-cyber-primary bg-cyber-primary/20 text-cyber-primary shadow-lg shadow-cyber-primary/20'
                          : 'border-cyber-border bg-cyber-card text-cyber-text-dim hover:border-cyber-primary/50'
                      }`}>
                      {c.label}
                    </button>
                  ))}
                </div>

                {/* Mode buttons */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div>
                    <label className="block text-xs font-mono text-cyber-text-dim mb-1">MODE</label>
                    <div className="flex gap-2">
                      <button onClick={() => setAdvancedMode('encrypt')}
                        className={advancedMode === 'encrypt' ? 'cyber-btn-primary flex-1' : 'cyber-btn flex-1'}>
                        Encrypt
                      </button>
                      <button onClick={() => setAdvancedMode('decrypt')}
                        className={advancedMode === 'decrypt' ? 'cyber-btn-danger flex-1' : 'cyber-btn flex-1'}>
                        Decrypt
                      </button>
                    </div>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-xs font-mono text-cyber-text-dim mb-1">KEY GENERATION</label>
                    <button onClick={handleAdvancedGenerateKey} className="cyber-btn-green w-full" disabled={loading}>
                      <HiOutlineRefresh className="inline-block w-4 h-4 mr-1" />
                      {advancedCipher === 'rsa' ? 'Generate RSA Key Pair' : 'Generate Key' + (advancedCiphers.find(c=>c.id===advancedCipher)?.hasIv ? ' & IV' : '')}
                    </button>
                  </div>
                </div>

                {/* Per-cipher parameter fields */}
                {renderAdvancedParams()}

                {/* Input text */}
                <div className="mt-3">
                  <label className="block text-xs font-mono text-cyber-text-dim mb-1">
                    {advancedMode === 'encrypt' ? 'PLAINTEXT' : 'CIPHERTEXT (Base64)'}
                  </label>
                  <textarea value={advancedText} onChange={e => setAdvancedText(e.target.value)}
                    className="cyber-input min-h-[100px] resize-y"
                    placeholder={advancedMode === 'encrypt' ? 'Enter plaintext...' : 'Enter ciphertext (Base64)...'} />
                </div>

                <button onClick={handleAdvanced} className="cyber-btn-primary mt-3" disabled={!advancedText || loading}>
                  {loading ? 'Processing...' : advancedMode === 'encrypt' ? '🔒 Encrypt' : '🔓 Decrypt'}
                </button>
              </SectionCard>
            </motion.div>
          )}

          {/* ═══════════════════════════════════════════════
              ENCODING
             ═══════════════════════════════════════════════ */}
          {activeTab === 'encoding' && (
            <motion.div key="encoding" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <SectionCard title="Base Encoding / Decoding" icon={HiOutlineCode} color="#ffaa00">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-xs font-mono text-cyber-text-dim mb-1">FORMAT</label>
                    <select value={baseType} onChange={e => setBaseType(e.target.value)} className="cyber-select">
                      <option value="base64">BASE64</option>
                      <option value="base32">BASE32</option>
                      <option value="base16">BASE16</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-mono text-cyber-text-dim mb-1">MODE</label>
                    <div className="flex gap-2">
                      <button onClick={() => setEncMode('encode')}
                        className={encMode === 'encode' ? 'cyber-btn-primary flex-1' : 'cyber-btn flex-1'}>
                        Encode
                      </button>
                      <button onClick={() => setEncMode('decode')}
                        className={encMode === 'decode' ? 'cyber-btn-danger flex-1' : 'cyber-btn flex-1'}>
                        Decode
                      </button>
                    </div>
                  </div>
                </div>
                <textarea value={encText} onChange={e => setEncText(e.target.value)}
                  className="cyber-input min-h-[100px] resize-y mb-3" placeholder="Enter text..." />
                <button onClick={() => call('/base', { text: encText, mode: baseType, action: encMode })}
                  className="cyber-btn-primary" disabled={!encText || loading}>
                  {loading ? 'Processing...' : encMode === 'encode' ? '📦 Encode' : '📂 Decode'}
                </button>
              </SectionCard>
            </motion.div>
          )}

          {/* ═══════════════════════════════════════════════
              MORSE CODE & DOTS
             ═══════════════════════════════════════════════ */}
          {activeTab === 'morse' && (
            <motion.div key="morse" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-5">
              {/* Morse Code */}
              <SectionCard title="Morse Code" icon={HiOutlineVolumeUp} color="#00d4ff">
                <div className="flex gap-2 mb-3">
                  <button onClick={() => setMorseMode('text_to_morse')}
                    className={morseMode === 'text_to_morse' ? 'cyber-btn-primary flex-1' : 'cyber-btn flex-1'}>
                    Text → Morse
                  </button>
                  <button onClick={() => setMorseMode('morse_to_text')}
                    className={morseMode === 'morse_to_text' ? 'cyber-btn-danger flex-1' : 'cyber-btn flex-1'}>
                    Morse → Text
                  </button>
                </div>
                <textarea value={morseText} onChange={e => setMorseText(e.target.value)}
                  className="cyber-input min-h-[80px] resize-y mb-3"
                  placeholder={morseMode === 'text_to_morse' ? 'Enter text...' : 'Enter morse (.-  -... / .--  ---  .-. -..)'} />
                <div className="flex gap-2 flex-wrap">
                  <button onClick={() => call('/morse', { text: morseText, action: morseMode })}
                    className="cyber-btn-primary" disabled={!morseText || loading}>
                    ⚡ Convert
                  </button>
                  {morseMode === 'text_to_morse' && (
                    <button onClick={async () => {
                      setLoading(true);
                      try {
                        // First convert to morse
                        const { data: morseData } = await api.post('/crypto/morse', { text: morseText, action: 'text_to_morse' });
                        const morse = morseData.result;
                        // Then generate audio
                        const audioResp = await api.post('/crypto/morse/audio', { morse, frequency: morseFreq, wpm: morseWpm }, { responseType: 'blob' });
                        const url = URL.createObjectURL(audioResp.data);
                        const a = document.createElement('a');
                        a.href = url; a.download = 'morse.wav'; a.click();
                        URL.revokeObjectURL(url);
                        toast.success('Audio generated & downloaded');
                      } catch (e: any) { toast.error(e.message); }
                      finally { setLoading(false); }
                    }} className="cyber-btn-green" disabled={!morseText || loading}>
                      🔊 Generate Audio
                    </button>
                  )}
                </div>
                {/* Audio parameters */}
                <div className="grid grid-cols-2 gap-3 mt-3">
                  <div>
                    <label className="block text-xs font-mono text-cyber-text-dim mb-1">FREQUENCY (Hz)</label>
                    <input type="number" value={morseFreq} onChange={e => setMorseFreq(Number(e.target.value))}
                      className="cyber-input" min={200} max={2000} />
                  </div>
                  <div>
                    <label className="block text-xs font-mono text-cyber-text-dim mb-1">WPM</label>
                    <input type="number" value={morseWpm} onChange={e => setMorseWpm(Number(e.target.value))}
                      className="cyber-input" min={5} max={50} />
                  </div>
                </div>
              </SectionCard>

              {/* Morse Audio Decode */}
              <SectionCard title="Morse Audio Decoder" color="#ff3366">
                <p className="text-xs text-cyber-text-dim mb-3">
                  Upload a WAV or MP3 file containing morse code beeps to decode.
                </p>
                <input ref={audioRef} type="file" accept=".wav,.mp3" className="hidden" onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  setLoading(true);
                  try {
                    const { data } = await uploadFile('/crypto/morse/audio-decode', file);
                    setResult(data);
                    toast.success('Audio decoded');
                  } catch (err: any) { toast.error(err.message); }
                  finally { setLoading(false); }
                }} />
                <button onClick={() => audioRef.current?.click()} className="cyber-btn-primary" disabled={loading}>
                  <HiOutlineUpload className="inline-block w-4 h-4 mr-1" />
                  {loading ? 'Decoding...' : 'Upload Audio File'}
                </button>
              </SectionCard>

              {/* Dots Cipher */}
              <SectionCard title="Dots Cipher (ASCII Binary)" color="#00ff88">
                <div className="flex gap-2 mb-3">
                  <button onClick={() => setDotsMode('encode')}
                    className={dotsMode === 'encode' ? 'cyber-btn-primary flex-1' : 'cyber-btn flex-1'}>
                    Text → Dots
                  </button>
                  <button onClick={() => setDotsMode('decode')}
                    className={dotsMode === 'decode' ? 'cyber-btn-danger flex-1' : 'cyber-btn flex-1'}>
                    Dots → Text
                  </button>
                </div>
                <textarea value={dotsText} onChange={e => setDotsText(e.target.value)}
                  className="cyber-input min-h-[80px] resize-y mb-3"
                  placeholder={dotsMode === 'encode' ? 'Enter text...' : 'Enter binary dots (01001000 01101001)...'} />
                <button onClick={() => call('/dots', { text: dotsText, action: dotsMode })}
                  className="cyber-btn-primary" disabled={!dotsText || loading}>
                  ⚡ Convert
                </button>
              </SectionCard>
            </motion.div>
          )}

          {/* ═══════════════════════════════════════════════
              HASH TOOLS
             ═══════════════════════════════════════════════ */}
          {activeTab === 'hash' && (
            <motion.div key="hash" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-5">
              {/* Compute Hash */}
              <SectionCard title="Compute Hash" icon={HiOutlineFingerPrint} color="#7c3aed">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-3">
                  <div className="md:col-span-3">
                    <label className="block text-xs font-mono text-cyber-text-dim mb-1">INPUT TEXT</label>
                    <input value={hashInput} onChange={e => setHashInput(e.target.value)}
                      className="cyber-input" placeholder="Enter text to hash..." />
                  </div>
                  <div>
                    <label className="block text-xs font-mono text-cyber-text-dim mb-1">ALGORITHM</label>
                    <select value={hashAlgo} onChange={e => setHashAlgo(e.target.value)} className="cyber-select">
                      {hashAlgorithms.map(h => (
                        <option key={h} value={h}>{h.toUpperCase()}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <button onClick={() => call('/hash', { action: 'compute', text: hashInput, algorithm: hashAlgo })}
                  className="cyber-btn-primary" disabled={!hashInput || loading}>
                  {loading ? 'Hashing...' : '#️⃣ Compute Hash'}
                </button>
              </SectionCard>

              {/* Identify Hash */}
              <SectionCard title="Identify Hash Type" color="#ff3366">
                <label className="block text-xs font-mono text-cyber-text-dim mb-1">HASH VALUE</label>
                <input value={hashIdentifyInput} onChange={e => setHashIdentifyInput(e.target.value)}
                  className="cyber-input mb-3" placeholder="Paste a hash to identify its type..." />
                <button onClick={() => call('/hash', { action: 'identify', hash: hashIdentifyInput })}
                  className="cyber-btn-primary" disabled={!hashIdentifyInput || loading}>
                  {loading ? 'Identifying...' : '🔍 Identify Hash'}
                </button>
              </SectionCard>

              {/* HMAC */}
              <SectionCard title="HMAC (Keyed Hash)" color="#00d4ff">
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-mono text-cyber-text-dim mb-1">MESSAGE</label>
                    <textarea value={hmacText} onChange={e => setHmacText(e.target.value)}
                      className="cyber-input min-h-[60px] resize-y" placeholder="Enter message..." />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-mono text-cyber-text-dim mb-1">SECRET KEY</label>
                      <input value={hmacKey} onChange={e => setHmacKey(e.target.value)}
                        className="cyber-input" placeholder="HMAC secret key..." />
                    </div>
                    <div>
                      <label className="block text-xs font-mono text-cyber-text-dim mb-1">ALGORITHM</label>
                      <select value={hmacAlgo} onChange={e => setHmacAlgo(e.target.value)} className="cyber-select">
                        {['md5', 'sha1', 'sha256', 'sha512'].map(h => (
                          <option key={h} value={h}>{h.toUpperCase()}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <button onClick={() => call('/hash', { action: 'hmac', text: hmacText, key: hmacKey, algorithm: hmacAlgo })}
                    className="cyber-btn-green" disabled={!hmacText || !hmacKey || loading}>
                    {loading ? 'Computing...' : '✉️ Compute HMAC'}
                  </button>
                </div>
              </SectionCard>
            </motion.div>
          )}

          {/* ═══════════════════════════════════════════════
              BRUTE FORCE / ANALYSIS
             ═══════════════════════════════════════════════ */}
          {activeTab === 'bruteforce' && (
            <motion.div key="bruteforce" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-5">
              <SectionCard title="Brute Force Attacks" icon={HiOutlineSwitchHorizontal} color="#ff3366">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
                  {(['caesar', 'xor', 'railfence', 'playfair'] as const).map(t => (
                    <button key={t} onClick={() => setBfType(t)}
                      className={`py-2 px-3 rounded-lg text-xs font-mono font-bold transition-all border ${
                        bfType === t
                          ? 'border-red-500 bg-red-500/20 text-red-400 shadow-lg shadow-red-500/20'
                          : 'border-cyber-border bg-cyber-card text-cyber-text-dim hover:border-red-500/50'
                      }`}>
                      {t === 'railfence' ? 'Rail Fence' : t === 'playfair' ? 'Playfair Dict' : t.toUpperCase()}
                    </button>
                  ))}
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-mono text-cyber-text-dim mb-1">
                      CIPHERTEXT {bfType === 'xor' ? '(hex format, e.g. 4a 6f 68)' : ''}
                    </label>
                    <textarea value={bfText} onChange={e => setBfText(e.target.value)}
                      className="cyber-input min-h-[100px] resize-y"
                      placeholder={bfType === 'xor' ? 'Enter hex ciphertext (e.g. 4a 6f 68 6e)...' : 'Enter ciphertext...'} />
                  </div>

                  {bfType === 'railfence' && (
                    <div>
                      <label className="block text-xs font-mono text-cyber-text-dim mb-1">MAX RAILS</label>
                      <input type="number" value={bfMaxRails} onChange={e => setBfMaxRails(Number(e.target.value))}
                        className="cyber-input w-32" min={2} max={50} />
                    </div>
                  )}

                  {bfType === 'playfair' && (
                    <div>
                      <label className="block text-xs font-mono text-cyber-text-dim mb-1">
                        WORDLIST (one per line, leave blank for defaults)
                      </label>
                      <textarea value={bfWordlist} onChange={e => setBfWordlist(e.target.value)}
                        className="cyber-input min-h-[80px] resize-y"
                        placeholder={"SECRET\nCIPHER\nHIDDEN\n..."} />
                    </div>
                  )}

                  <div className="flex gap-2 flex-wrap">
                    <button onClick={() => {
                      if (bfType === 'caesar') {
                        call('/caesar/bruteforce', { text: bfText });
                      } else if (bfType === 'xor') {
                        call('/xor/bruteforce', { hex_text: bfText });
                      } else if (bfType === 'railfence') {
                        call('/railfence/bruteforce', { text: bfText, max_rails: bfMaxRails });
                      } else if (bfType === 'playfair') {
                        call('/playfair/bruteforce', { text: bfText, wordlist: bfWordlist });
                      }
                    }} className="cyber-btn-danger" disabled={!bfText || loading}>
                      {loading ? 'Cracking...' : '⚡ Brute Force'}
                    </button>
                    <button onClick={() => call('/frequency', { text: bfText })}
                      className="cyber-btn" disabled={!bfText || loading}>
                      📊 Frequency Analysis
                    </button>
                  </div>
                </div>
              </SectionCard>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ═══════ Results Panel ═══════ */}
        <ResultsPanel title="Crypto Output" data={result} loading={loading} error={error} />
      </div>
    </div>
  );
}
