import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  HiOutlineDocumentSearch,
  HiOutlineInformationCircle,
  HiOutlineChartBar,
  HiOutlineSearch,
  HiOutlineArchive,
  HiOutlineScissors,
  HiOutlineFingerPrint,
  HiOutlineLockClosed,
  HiOutlineRefresh,
  HiOutlineEye,
  HiOutlinePhotograph,
} from 'react-icons/hi';
import toast from 'react-hot-toast';
import { uploadFile } from '@/utils/api';
import FileUpload from '@/components/FileUpload';
import ResultsPanel, { PageHeader, CyberTabs, SectionCard } from '@/components/ResultsPanel';

/* ════════════════════════════════════════════════════════
   TABS
   ════════════════════════════════════════════════════════ */
const tabs = [
  { id: 'info',       label: 'File Info',        icon: HiOutlineInformationCircle },
  { id: 'entropy',    label: 'Entropy',           icon: HiOutlineChartBar },
  { id: 'strings',    label: 'Strings',           icon: HiOutlineSearch },
  { id: 'hashes',     label: 'Hashes',            icon: HiOutlineFingerPrint },
  { id: 'extract',    label: 'Extract Archive',   icon: HiOutlineArchive },
  { id: 'compress',   label: 'Compress',          icon: HiOutlineArchive },
  { id: 'carve',      label: 'File Carving',      icon: HiOutlineScissors },
  { id: 'stego',      label: 'Stego Analysis',    icon: HiOutlinePhotograph },
  { id: 'breaker',    label: 'File Breaker',      icon: HiOutlineLockClosed },
  { id: 'recursive',  label: 'Recursive Extract', icon: HiOutlineRefresh },
];

/* ════════════════════════════════════════════════════════
   COMPONENT
   ════════════════════════════════════════════════════════ */
export default function FileAnalyzerPage() {
  const [activeTab, setActiveTab] = useState('info');
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<unknown>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /* ── Strings params ── */
  const [minLen, setMinLen] = useState(4);
  const [strMode, setStrMode] = useState('both');
  const [strUnique, setStrUnique] = useState(false);
  const [strFilter, setStrFilter] = useState('');

  /* ── Entropy params ── */
  const [windowSize, setWindowSize] = useState(256);
  const [useWindowed, setUseWindowed] = useState(false);

  /* ── Extract params ── */
  const [extractPw, setExtractPw] = useState('');

  /* ── Compress params ── */
  const [compressFmt, setCompressFmt] = useState('zip');
  const [compressPw, setCompressPw] = useState('');

  /* ── Carving params ── */
  const [carveMethod, setCarveMethod] = useState('foremost');

  /* ── Breaker params ── */
  const [wordlistPath, setWordlistPath] = useState('/usr/share/wordlists/rockyou.txt');

  /* ── Recursive params ── */
  const [maxDepth, setMaxDepth] = useState(5);

  const onFileSelect = useCallback((f: File) => {
    setFile(f);
    setResult(null);
    setError(null);
  }, []);

  const analyze = async (endpoint: string, extraData?: Record<string, string>) => {
    if (!file) {
      toast.error('Please select a file first');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const { data } = await uploadFile(`/file${endpoint}`, file, extraData);
      setResult(data);
    } catch (e: any) {
      setError(e.message);
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto">
      <PageHeader
        title="FILE ANALYZER"
        subtitle="File info, entropy, strings, hashes, extraction, compression, carving, stego, breaker & recursive extract"
        icon={HiOutlineDocumentSearch}
        accentColor="#ffaa00"
      />

      <div className="mb-5">
        <FileUpload onFileSelect={onFileSelect} label="Drop any file for analysis" />
      </div>

      <CyberTabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

      <div className="mt-5 space-y-5">
        <AnimatePresence mode="wait">

          {/* ════════════ FILE INFO ════════════ */}
          {activeTab === 'info' && (
            <motion.div key="info" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <SectionCard title="File Information" icon={HiOutlineInformationCircle} color="#ffaa00">
                <p className="text-sm text-cyber-text-dim mb-3">
                  Detect file type, MIME type, size, permissions, timestamps, and magic bytes.
                  Computes all common hashes automatically.
                </p>
                <button onClick={() => analyze('/info')} className="cyber-btn-primary" disabled={!file || loading}>
                  {loading ? 'Analyzing...' : '📄 Get File Info'}
                </button>
              </SectionCard>
            </motion.div>
          )}

          {/* ════════════ ENTROPY ════════════ */}
          {activeTab === 'entropy' && (
            <motion.div key="entropy" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <SectionCard title="Entropy Analysis" icon={HiOutlineChartBar} color="#7c3aed">
                <p className="text-sm text-cyber-text-dim mb-3">
                  Calculate file entropy. Values close to 8.0 indicate encryption or compression.
                  Enable windowed analysis for a per-block entropy bar graph.
                </p>
                <div className="flex flex-wrap items-center gap-3 mb-3">
                  <label className="flex items-center gap-2 text-xs font-mono text-cyber-text-dim cursor-pointer">
                    <input
                      type="checkbox"
                      checked={useWindowed}
                      onChange={(e) => setUseWindowed(e.target.checked)}
                      className="accent-purple-500"
                    />
                    WINDOWED ANALYSIS
                  </label>
                  {useWindowed && (
                    <>
                      <label className="text-xs font-mono text-cyber-text-dim">WINDOW SIZE (bytes):</label>
                      <input
                        type="number"
                        value={windowSize}
                        onChange={(e) => setWindowSize(Number(e.target.value))}
                        className="cyber-input w-24"
                        min={16}
                        max={65536}
                        step={16}
                      />
                    </>
                  )}
                </div>
                <button
                  onClick={() =>
                    analyze('/entropy', useWindowed ? { window_size: String(windowSize) } : {})
                  }
                  className="cyber-btn-primary"
                  disabled={!file || loading}
                >
                  {loading ? 'Calculating...' : '📊 Calculate Entropy'}
                </button>
              </SectionCard>
            </motion.div>
          )}

          {/* ════════════ STRINGS ════════════ */}
          {activeTab === 'strings' && (
            <motion.div key="strings" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <SectionCard title="String Extraction" icon={HiOutlineSearch} color="#00ff88">
                <p className="text-sm text-cyber-text-dim mb-3">
                  Extract printable strings with configurable mode, minimum length, uniqueness, and filter.
                </p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
                  <div>
                    <label className="text-xs font-mono text-cyber-text-dim block mb-1">MIN LENGTH</label>
                    <input
                      type="number"
                      value={minLen}
                      onChange={(e) => setMinLen(Number(e.target.value))}
                      className="cyber-input w-full"
                      min={1}
                      max={100}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-mono text-cyber-text-dim block mb-1">MODE</label>
                    <select
                      value={strMode}
                      onChange={(e) => setStrMode(e.target.value)}
                      className="cyber-select w-full"
                    >
                      <option value="both">Both (ASCII + Unicode)</option>
                      <option value="ascii">ASCII Only</option>
                      <option value="unicode">Unicode Only</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-mono text-cyber-text-dim block mb-1">FILTER</label>
                    <input
                      type="text"
                      value={strFilter}
                      onChange={(e) => setStrFilter(e.target.value)}
                      className="cyber-input w-full"
                      placeholder="keyword..."
                    />
                  </div>
                  <div className="flex items-end pb-1">
                    <label className="flex items-center gap-2 text-xs font-mono text-cyber-text-dim cursor-pointer">
                      <input
                        type="checkbox"
                        checked={strUnique}
                        onChange={(e) => setStrUnique(e.target.checked)}
                        className="accent-green-500"
                      />
                      UNIQUE ONLY
                    </label>
                  </div>
                </div>
                <button
                  onClick={() =>
                    analyze('/strings', {
                      min_length: String(minLen),
                      mode: strMode,
                      unique: String(strUnique),
                      filter: strFilter,
                    })
                  }
                  className="cyber-btn-primary"
                  disabled={!file || loading}
                >
                  {loading ? 'Extracting...' : '🔎 Extract Strings'}
                </button>
              </SectionCard>
            </motion.div>
          )}

          {/* ════════════ HASHES ════════════ */}
          {activeTab === 'hashes' && (
            <motion.div key="hashes" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <SectionCard title="File Hashes" icon={HiOutlineFingerPrint} color="#00d4ff">
                <p className="text-sm text-cyber-text-dim mb-3">
                  Compute MD5, SHA-1, SHA-256, SHA-512, SHA3-256, and BLAKE2b hashes for integrity verification and lookup.
                </p>
                <button onClick={() => analyze('/hashes')} className="cyber-btn-primary" disabled={!file || loading}>
                  {loading ? 'Hashing...' : '#️⃣ Compute Hashes'}
                </button>
              </SectionCard>
            </motion.div>
          )}

          {/* ════════════ EXTRACT ARCHIVE ════════════ */}
          {activeTab === 'extract' && (
            <motion.div key="extract" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <SectionCard title="Archive Extraction" icon={HiOutlineArchive} color="#ff3366">
                <p className="text-sm text-cyber-text-dim mb-3">
                  Extract ZIP, TAR, RAR, 7z, GZ, BZ2, XZ, LZMA, ZST, and LZ4 archives.
                  Provide a password for protected archives.
                </p>
                <div className="flex items-center gap-3 mb-3">
                  <label className="text-xs font-mono text-cyber-text-dim">PASSWORD (optional):</label>
                  <input
                    type="password"
                    value={extractPw}
                    onChange={(e) => setExtractPw(e.target.value)}
                    className="cyber-input w-48"
                    placeholder="leave empty if none"
                  />
                </div>
                <button
                  onClick={() =>
                    analyze('/extract', extractPw ? { password: extractPw } : {})
                  }
                  className="cyber-btn-primary"
                  disabled={!file || loading}
                >
                  {loading ? 'Extracting...' : '📦 Extract Archive'}
                </button>
              </SectionCard>
            </motion.div>
          )}

          {/* ════════════ COMPRESS ════════════ */}
          {activeTab === 'compress' && (
            <motion.div key="compress" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <SectionCard title="File Compression" icon={HiOutlineArchive} color="#f59e0b">
                <p className="text-sm text-cyber-text-dim mb-3">
                  Compress the uploaded file into one of many archive formats.
                  Password protection is available for ZIP, 7z, and RAR.
                </p>
                <div className="flex flex-wrap items-center gap-3 mb-3">
                  <div>
                    <label className="text-xs font-mono text-cyber-text-dim block mb-1">FORMAT</label>
                    <select
                      value={compressFmt}
                      onChange={(e) => setCompressFmt(e.target.value)}
                      className="cyber-select w-32"
                    >
                      <option value="zip">ZIP</option>
                      <option value="7z">7z</option>
                      <option value="tar">TAR</option>
                      <option value="gz">GZ (tar.gz)</option>
                      <option value="bz2">BZ2 (tar.bz2)</option>
                      <option value="xz">XZ (tar.xz)</option>
                      <option value="zst">ZST</option>
                      <option value="lz4">LZ4</option>
                      <option value="rar">RAR</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-mono text-cyber-text-dim block mb-1">PASSWORD (optional)</label>
                    <input
                      type="password"
                      value={compressPw}
                      onChange={(e) => setCompressPw(e.target.value)}
                      className="cyber-input w-44"
                      placeholder="zip/7z/rar only"
                    />
                  </div>
                </div>
                <button
                  onClick={() =>
                    analyze('/compress', {
                      format: compressFmt,
                      ...(compressPw ? { password: compressPw } : {}),
                    })
                  }
                  className="cyber-btn-primary"
                  disabled={!file || loading}
                >
                  {loading ? 'Compressing...' : '🗜️ Compress File'}
                </button>
              </SectionCard>
            </motion.div>
          )}

          {/* ════════════ FILE CARVING ════════════ */}
          {activeTab === 'carve' && (
            <motion.div key="carve" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <SectionCard title="File Carving" icon={HiOutlineScissors} color="#ffaa00">
                <p className="text-sm text-cyber-text-dim mb-3">
                  Carve embedded files from a binary blob. Use <strong>foremost</strong> for full extraction or{' '}
                  <strong>magic bytes</strong> for a quick scan of known file signatures (JPEG, PNG, PDF, ZIP, etc.).
                </p>
                <div className="flex items-center gap-3 mb-3">
                  <label className="text-xs font-mono text-cyber-text-dim">METHOD:</label>
                  <select
                    value={carveMethod}
                    onChange={(e) => setCarveMethod(e.target.value)}
                    className="cyber-select w-40"
                  >
                    <option value="foremost">Foremost</option>
                    <option value="magic">Magic Bytes</option>
                  </select>
                </div>
                <button
                  onClick={() => analyze('/carve', { method: carveMethod })}
                  className="cyber-btn-primary"
                  disabled={!file || loading}
                >
                  {loading ? 'Carving...' : '🔪 Carve Files'}
                </button>
              </SectionCard>
            </motion.div>
          )}

          {/* ════════════ STEGO ANALYSIS ════════════ */}
          {activeTab === 'stego' && (
            <motion.div key="stego" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <SectionCard title="Steganography Analysis" icon={HiOutlineEye} color="#ec4899">
                <p className="text-sm text-cyber-text-dim mb-3">
                  Run a suite of steganography and metadata tools: <strong>exiftool</strong>,{' '}
                  <strong>binwalk</strong>, <strong>strings</strong>, <strong>zsteg</strong> (PNG/BMP),{' '}
                  <strong>steghide</strong> (JPEG/BMP/WAV), <strong>outguess</strong> (JPEG), and{' '}
                  <strong>appended data detection</strong> (JPEG/PNG end-of-file checks).
                </p>
                <button
                  onClick={() => analyze('/stego')}
                  className="cyber-btn-primary"
                  disabled={!file || loading}
                >
                  {loading ? 'Analyzing...' : '🕵️ Run Stego Suite'}
                </button>
              </SectionCard>
            </motion.div>
          )}

          {/* ════════════ FILE BREAKER ════════════ */}
          {activeTab === 'breaker' && (
            <motion.div key="breaker" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <SectionCard title="File Breaker (Password Cracker)" icon={HiOutlineLockClosed} color="#ef4444">
                <p className="text-sm text-cyber-text-dim mb-3">
                  Crack password-protected archives using <strong>John the Ripper</strong> with a wordlist.
                  Supports ZIP, RAR, and 7z via{' '}
                  <code className="text-cyber-primary">zip2john</code> /{' '}
                  <code className="text-cyber-primary">rar2john</code> /{' '}
                  <code className="text-cyber-primary">7z2john</code>.
                </p>
                <div className="flex items-center gap-3 mb-3">
                  <label className="text-xs font-mono text-cyber-text-dim">WORDLIST PATH:</label>
                  <input
                    type="text"
                    value={wordlistPath}
                    onChange={(e) => setWordlistPath(e.target.value)}
                    className="cyber-input flex-1"
                    placeholder="/usr/share/wordlists/rockyou.txt"
                  />
                </div>
                <button
                  onClick={() => analyze('/crack-password', { wordlist: wordlistPath })}
                  className="cyber-btn-primary"
                  disabled={!file || loading}
                >
                  {loading ? 'Cracking...' : '🔐 Crack Password'}
                </button>
              </SectionCard>
            </motion.div>
          )}

          {/* ════════════ RECURSIVE EXTRACTION ════════════ */}
          {activeTab === 'recursive' && (
            <motion.div key="recursive" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <SectionCard title="Recursive Archive Extraction" icon={HiOutlineRefresh} color="#06b6d4">
                <p className="text-sm text-cyber-text-dim mb-3">
                  Recursively extract nested archives (archives within archives) up to a configurable depth.
                  Detects cycles and password-protected inner archives.
                </p>
                <div className="flex items-center gap-3 mb-3">
                  <label className="text-xs font-mono text-cyber-text-dim">MAX DEPTH:</label>
                  <input
                    type="number"
                    value={maxDepth}
                    onChange={(e) => setMaxDepth(Number(e.target.value))}
                    className="cyber-input w-20"
                    min={1}
                    max={20}
                  />
                </div>
                <button
                  onClick={() => analyze('/recursive-extract', { max_depth: String(maxDepth) })}
                  className="cyber-btn-primary"
                  disabled={!file || loading}
                >
                  {loading ? 'Extracting...' : '🔄 Recursive Extract'}
                </button>
              </SectionCard>
            </motion.div>
          )}

        </AnimatePresence>

        <ResultsPanel title="File Analysis Output" data={result} loading={loading} error={error} />
      </div>
    </div>
  );
}
