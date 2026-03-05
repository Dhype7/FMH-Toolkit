import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  HiOutlinePhotograph,
  HiOutlineLocationMarker,
  HiOutlineDocumentText,
  HiOutlineSearch,
  HiOutlineEye,
  HiOutlineCamera,
  HiOutlineQrcode,
  HiOutlineCode,
  HiOutlineScissors,
  HiOutlinePuzzle,
  HiOutlineDesktopComputer,
  HiOutlineLightningBolt,
  HiOutlineExclamation,
  HiOutlineExternalLink,
  HiOutlineFilter,
} from 'react-icons/hi';
import toast from 'react-hot-toast';
import { uploadFile } from '@/utils/api';
import FileUpload from '@/components/FileUpload';
import ResultsPanel, { PageHeader, CyberTabs, SectionCard } from '@/components/ResultsPanel';
import HexViewerPanel from '@/components/HexViewerPanel';

const tabs = [
  { id: 'exif', label: 'EXIF', icon: HiOutlineCamera },
  { id: 'metadata', label: 'Metadata', icon: HiOutlineDocumentText },
  { id: 'location', label: 'Location', icon: HiOutlineLocationMarker },
  { id: 'strings', label: 'Strings', icon: HiOutlineSearch },
  { id: 'steg', label: 'Steganography', icon: HiOutlineEye },
  { id: 'binwalk', label: 'Binwalk', icon: HiOutlinePuzzle },
  { id: 'zsteg', label: 'Zsteg', icon: HiOutlineCode },
  { id: 'ocr', label: 'OCR', icon: HiOutlineDesktopComputer },
  { id: 'qr', label: 'QR/Barcode', icon: HiOutlineQrcode },
  { id: 'hex', label: 'Hex Viewer', icon: HiOutlineCode },
  { id: 'carving', label: 'File Carving', icon: HiOutlineScissors },
  { id: 'ctf', label: 'CTF Auto', icon: HiOutlineLightningBolt },
];

export default function PhotoAnalyzerPage() {
  const [activeTab, setActiveTab] = useState('exif');
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<unknown>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /* Steg extras */
  const [stegMode, setStegMode] = useState<'extract' | 'embed' | 'lsb_extract' | 'lsb_embed'>('extract');
  const [stegPassword, setStegPassword] = useState('');
  const [stegMessage, setStegMessage] = useState('');

  /* Strings extras */
  const [minLen, setMinLen] = useState(4);
  const [grepPattern, setGrepPattern] = useState('');

  /* Zsteg extras */
  const [zstegChannel, setZstegChannel] = useState('1b,rgb,lsb');
  const [zstegExtractChannel, setZstegExtractChannel] = useState('b1,rgb,lsb');

  /* OCR extras */
  const [ocrMethod, setOcrMethod] = useState<'basic' | 'advanced'>('basic');
  const [ocrLang, setOcrLang] = useState('eng');

  /* Carving extras */
  const [carvingTool, setCarvingTool] = useState<'auto' | 'foremost' | 'binwalk' | 'signatures'>('auto');

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
      const { data } = await uploadFile(`/photo${endpoint}`, file, extraData);
      setResult(data);
      /* If location result has a maps URL, store it for the "Open Map" button */
      if (data?.maps_url || data?.gps_data?.google_maps_url) {
        setLocationUrl(data.maps_url || data.gps_data.google_maps_url);
      }
    } catch (e: any) {
      setError(e.message);
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  /* Location map URL */
  const [locationUrl, setLocationUrl] = useState<string | null>(null);

  return (
    <div className="max-w-5xl mx-auto">
      <PageHeader
        title="PHOTO ANALYZER"
        subtitle="EXIF, steganography, metadata, OCR, QR, hex analysis & CTF auto-solve"
        icon={HiOutlinePhotograph}
        accentColor="#00ff88"
      />

      {/* File Upload */}
      <div className="mb-5">
        <FileUpload
          onFileSelect={onFileSelect}
          label="Drop an image or file for analysis"
        />
      </div>

      <CyberTabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

      <div className="mt-5 space-y-5">
        <AnimatePresence mode="wait">
          {/* ═══════ EXIF ═══════ */}
          {activeTab === 'exif' && (
            <motion.div key="exif" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <SectionCard title="EXIF Data Extraction" icon={HiOutlineCamera} color="#00ff88">
                <p className="text-sm text-cyber-text-dim mb-3">Extract camera info, GPS coordinates, timestamps and more from images.</p>
                <div className="flex flex-wrap gap-2">
                  <button onClick={() => analyze('/exif')} className="cyber-btn-primary" disabled={!file || loading}>
                    {loading ? 'Analyzing...' : '📷 Extract EXIF'}
                  </button>
                  <button onClick={() => analyze('/exif/deep')} className="cyber-btn-green" disabled={!file || loading}>
                    {loading ? 'Scanning...' : '🔬 Deep Scan'}
                  </button>
                  <button onClick={() => analyze('/exif/suspicious')} className="cyber-btn-danger" disabled={!file || loading}>
                    {loading ? 'Checking...' : '⚠️ Suspicious Lines'}
                  </button>
                </div>
                <p className="text-xs text-cyber-text-dim mt-2 opacity-60">
                  Deep Scan: maker notes, thumbnails, all IFDs. Suspicious: detects editing software, date mismatches, hidden text, stripped metadata.
                </p>
              </SectionCard>
            </motion.div>
          )}

          {/* ═══════ METADATA ═══════ */}
          {activeTab === 'metadata' && (
            <motion.div key="metadata" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <SectionCard title="Full Metadata (exiftool)" icon={HiOutlineDocumentText} color="#00d4ff">
                <p className="text-sm text-cyber-text-dim mb-3">Deep metadata extraction using exiftool — all tags and hidden data.</p>
                <div className="flex flex-wrap gap-2">
                  <button onClick={() => analyze('/metadata')} className="cyber-btn-primary" disabled={!file || loading}>
                    {loading ? 'Analyzing...' : '🔍 Extract Metadata'}
                  </button>
                  <button onClick={() => analyze('/metadata/deep')} className="cyber-btn-green" disabled={!file || loading}>
                    {loading ? 'Scanning...' : '🔬 Deep Scan'}
                  </button>
                  <button onClick={() => analyze('/metadata/suspicious')} className="cyber-btn-danger" disabled={!file || loading}>
                    {loading ? 'Checking...' : '⚠️ Suspicious Fields'}
                  </button>
                </div>
                <p className="text-xs text-cyber-text-dim mt-2 opacity-60">
                  Deep Scan: verbose exiftool with grouped tags. Suspicious: editing software, date anomalies, hidden comments, edit history.
                </p>
              </SectionCard>
            </motion.div>
          )}

          {/* ═══════ LOCATION ═══════ */}
          {activeTab === 'location' && (
            <motion.div key="location" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <SectionCard title="GPS Location" icon={HiOutlineLocationMarker} color="#ff3366">
                <p className="text-sm text-cyber-text-dim mb-3">Extract GPS coordinates from EXIF and reverse geocode to an address.</p>
                <div className="flex flex-wrap gap-2">
                  <button onClick={() => analyze('/location')} className="cyber-btn-primary" disabled={!file || loading}>
                    {loading ? 'Locating...' : '📍 Find Location'}
                  </button>
                  {locationUrl && (
                    <button
                      onClick={() => window.open(locationUrl, '_blank')}
                      className="cyber-btn-green flex items-center gap-1"
                    >
                      <HiOutlineExternalLink className="text-sm" />
                      🗺️ Open in Google Maps
                    </button>
                  )}
                </div>
                {locationUrl && (
                  <div className="mt-3 p-3 bg-black/30 rounded border border-cyber-border">
                    <p className="text-xs font-mono text-cyber-text-dim mb-2">MAP PREVIEW:</p>
                    <iframe
                      src={`https://maps.google.com/maps?q=${locationUrl.split('q=')[1]}&z=14&output=embed`}
                      width="100%"
                      height="300"
                      className="rounded border border-cyber-border"
                      allowFullScreen
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                    />
                    <a
                      href={locationUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-mono text-cyber-primary hover:underline mt-2 block"
                    >
                      {locationUrl}
                    </a>
                  </div>
                )}
              </SectionCard>
            </motion.div>
          )}

          {/* ═══════ STRINGS ═══════ */}
          {activeTab === 'strings' && (
            <motion.div key="strings" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <SectionCard title="String Extraction" icon={HiOutlineSearch} color="#ffaa00">
                <div className="flex items-center gap-3 mb-3">
                  <label className="text-xs font-mono text-cyber-text-dim">MIN LENGTH:</label>
                  <input
                    type="number"
                    value={minLen}
                    onChange={(e) => setMinLen(Number(e.target.value))}
                    className="cyber-input w-20"
                    min={1}
                    max={100}
                  />
                </div>
                <div className="flex flex-wrap gap-2 mb-3">
                  <button onClick={() => analyze('/strings', { min_length: String(minLen) })} className="cyber-btn-primary" disabled={!file || loading}>
                    {loading ? 'Extracting...' : '🔎 Extract Strings'}
                  </button>
                </div>
                {/* Grep section */}
                <div className="mt-4 pt-4 border-t border-cyber-border">
                  <p className="text-xs font-mono text-cyber-text-dim mb-2 flex items-center gap-1">
                    <HiOutlineFilter className="text-sm" /> GREP (REGEX SEARCH):
                  </p>
                  <div className="flex gap-2">
                    <input
                      value={grepPattern}
                      onChange={(e) => setGrepPattern(e.target.value)}
                      className="cyber-input flex-1"
                      placeholder="Regex pattern... e.g. flag\{.*\} or https?://"
                    />
                    <button
                      onClick={() => {
                        if (!grepPattern.trim()) {
                          toast.error('Enter a grep pattern first');
                          return;
                        }
                        analyze('/strings/grep', { pattern: grepPattern });
                      }}
                      className="cyber-btn-green whitespace-nowrap"
                      disabled={!file || loading}
                    >
                      {loading ? 'Searching...' : '🔍 Grep'}
                    </button>
                  </div>
                  <p className="text-xs text-cyber-text-dim mt-1 opacity-60">
                    Searches extracted strings using regex. Useful for finding flags, URLs, base64, hashes, etc.
                  </p>
                </div>
              </SectionCard>
            </motion.div>
          )}

          {/* ═══════ STEGANOGRAPHY ═══════ */}
          {activeTab === 'steg' && (
            <motion.div key="steg" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <SectionCard title="Steganography" icon={HiOutlineEye} color="#7c3aed">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
                  {[
                    { id: 'extract', label: 'Steghide Extract' },
                    { id: 'embed', label: 'Steghide Embed' },
                    { id: 'lsb_extract', label: 'LSB Extract' },
                    { id: 'lsb_embed', label: 'LSB Embed' },
                  ].map((m) => (
                    <button
                      key={m.id}
                      onClick={() => setStegMode(m.id as typeof stegMode)}
                      className={stegMode === m.id ? 'cyber-btn-primary text-xs' : 'cyber-btn text-xs'}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>

                {(stegMode === 'extract' || stegMode === 'embed') && (
                  <div className="mb-3">
                    <label className="block text-xs font-mono text-cyber-text-dim mb-1">PASSPHRASE (optional)</label>
                    <input
                      value={stegPassword}
                      onChange={(e) => setStegPassword(e.target.value)}
                      className="cyber-input"
                      placeholder="Steghide passphrase..."
                    />
                  </div>
                )}

                {(stegMode === 'embed' || stegMode === 'lsb_embed') && (
                  <div className="mb-3">
                    <label className="block text-xs font-mono text-cyber-text-dim mb-1">MESSAGE TO HIDE</label>
                    <textarea
                      value={stegMessage}
                      onChange={(e) => setStegMessage(e.target.value)}
                      className="cyber-input min-h-[80px] resize-y"
                      placeholder="Secret message..."
                    />
                  </div>
                )}

                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => {
                      const extra: Record<string, string> = { mode: stegMode };
                      if (stegPassword) extra.password = stegPassword;
                      if (stegMessage) extra.message = stegMessage;
                      const endpoint = stegMode.startsWith('lsb') ? '/steganography/lsb' : '/steganography/steghide';
                      analyze(endpoint, extra);
                    }}
                    className="cyber-btn-primary"
                    disabled={!file || loading}
                  >
                    {loading ? 'Processing...' : '🕵️ Run Steganography'}
                  </button>
                  <button onClick={() => analyze('/steganography/detect')} className="cyber-btn-green" disabled={!file || loading}>
                    🔍 Auto-Detect
                  </button>
                </div>
              </SectionCard>
            </motion.div>
          )}

          {/* ═══════ BINWALK ═══════ */}
          {activeTab === 'binwalk' && (
            <motion.div key="binwalk" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <SectionCard title="Binwalk Analysis" icon={HiOutlinePuzzle} color="#00d4ff">
                <p className="text-sm text-cyber-text-dim mb-3">Scan for embedded files, compressed archives, and firmware headers.</p>
                <div className="flex flex-wrap gap-2">
                  <button onClick={() => analyze('/binwalk')} className="cyber-btn-primary" disabled={!file || loading}>
                    {loading ? 'Scanning...' : '🔍 Basic Scan'}
                  </button>
                  <button onClick={() => analyze('/binwalk/deep')} className="cyber-btn-green" disabled={!file || loading}>
                    {loading ? 'Scanning...' : '🔬 Deep / Entropy Scan'}
                  </button>
                  <button onClick={() => analyze('/binwalk/file-types')} className="cyber-btn" disabled={!file || loading}>
                    {loading ? 'Scanning...' : '📋 File Type Signatures'}
                  </button>
                  <button onClick={() => analyze('/binwalk', { action: 'extract' })} className="cyber-btn-danger" disabled={!file || loading}>
                    {loading ? 'Extracting...' : '📦 Extract Embedded Files'}
                  </button>
                </div>
                <p className="text-xs text-cyber-text-dim mt-2 opacity-60">
                  Deep Scan: entropy + opcode analysis. File Types: signature-only scan. Extract: pull out embedded files.
                </p>
              </SectionCard>
            </motion.div>
          )}

          {/* ═══════ ZSTEG ═══════ */}
          {activeTab === 'zsteg' && (
            <motion.div key="zsteg" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <SectionCard title="Zsteg Analysis (PNG/BMP)" icon={HiOutlineCode} color="#00ff88">
                <p className="text-sm text-cyber-text-dim mb-3">Full LSB/MSB steganography analysis for PNG and BMP files.</p>

                {/* Main scan buttons */}
                <div className="flex flex-wrap gap-2 mb-4">
                  <button onClick={() => analyze('/zsteg')} className="cyber-btn-primary" disabled={!file || loading}>
                    {loading ? 'Analyzing...' : '🔬 Basic Scan'}
                  </button>
                  <button onClick={() => analyze('/zsteg/lsb')} className="cyber-btn-green" disabled={!file || loading}>
                    {loading ? 'Scanning...' : '⬇️ LSB Analysis'}
                  </button>
                  <button onClick={() => analyze('/zsteg/msb')} className="cyber-btn" disabled={!file || loading}>
                    {loading ? 'Scanning...' : '⬆️ MSB Analysis'}
                  </button>
                  <button onClick={() => analyze('/zsteg/all-channels')} className="cyber-btn-danger" disabled={!file || loading}>
                    {loading ? 'Scanning...' : '📡 All Channels (-a)'}
                  </button>
                </div>

                {/* Specific channel scan */}
                <div className="pt-4 border-t border-cyber-border mb-4">
                  <p className="text-xs font-mono text-cyber-text-dim mb-2">SPECIFIC CHANNEL SCAN:</p>
                  <div className="flex gap-2">
                    <select
                      value={zstegChannel}
                      onChange={(e) => setZstegChannel(e.target.value)}
                      className="cyber-select flex-1"
                    >
                      <option value="1b,rgb,lsb">1b,rgb,lsb</option>
                      <option value="1b,bgr,lsb">1b,bgr,lsb</option>
                      <option value="2b,rgb,lsb">2b,rgb,lsb</option>
                      <option value="1b,r,lsb">1b,r,lsb (Red only)</option>
                      <option value="1b,g,lsb">1b,g,lsb (Green only)</option>
                      <option value="1b,b,lsb">1b,b,lsb (Blue only)</option>
                      <option value="1b,a,lsb">1b,a,lsb (Alpha only)</option>
                      <option value="1b,rgb,msb">1b,rgb,msb</option>
                      <option value="2b,rgb,msb">2b,rgb,msb</option>
                    </select>
                    <input
                      value={zstegChannel}
                      onChange={(e) => setZstegChannel(e.target.value)}
                      className="cyber-input flex-1"
                      placeholder="Or type custom: e.g. 3b,bgr,lsb"
                    />
                    <button
                      onClick={() => analyze('/zsteg/channel', { channel: zstegChannel })}
                      className="cyber-btn-primary whitespace-nowrap"
                      disabled={!file || loading}
                    >
                      🎯 Scan Channel
                    </button>
                  </div>
                </div>

                {/* Extract data */}
                <div className="pt-4 border-t border-cyber-border">
                  <p className="text-xs font-mono text-cyber-text-dim mb-2">EXTRACT DATA FROM CHANNEL:</p>
                  <div className="flex gap-2">
                    <select
                      value={zstegExtractChannel}
                      onChange={(e) => setZstegExtractChannel(e.target.value)}
                      className="cyber-select flex-1"
                    >
                      <option value="b1,rgb,lsb">b1,rgb,lsb</option>
                      <option value="b1,bgr,lsb">b1,bgr,lsb</option>
                      <option value="b2,rgb,lsb">b2,rgb,lsb</option>
                      <option value="b1,r,lsb">b1,r,lsb (Red)</option>
                      <option value="b1,g,lsb">b1,g,lsb (Green)</option>
                      <option value="b1,b,lsb">b1,b,lsb (Blue)</option>
                      <option value="b1,a,lsb">b1,a,lsb (Alpha)</option>
                      <option value="b1,rgb,msb">b1,rgb,msb</option>
                    </select>
                    <input
                      value={zstegExtractChannel}
                      onChange={(e) => setZstegExtractChannel(e.target.value)}
                      className="cyber-input flex-1"
                      placeholder="Or type custom: e.g. b3,bgr,lsb"
                    />
                    <button
                      onClick={() => analyze('/zsteg/extract', { channel: zstegExtractChannel })}
                      className="cyber-btn-green whitespace-nowrap"
                      disabled={!file || loading}
                    >
                      📤 Extract Data
                    </button>
                  </div>
                  <p className="text-xs text-cyber-text-dim mt-1 opacity-60">
                    Uses zsteg -E to extract raw data from the specified channel combination.
                  </p>
                </div>
              </SectionCard>
            </motion.div>
          )}

          {/* ═══════ OCR ═══════ */}
          {activeTab === 'ocr' && (
            <motion.div key="ocr" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <SectionCard title="OCR — Text Recognition" icon={HiOutlineDesktopComputer} color="#ffaa00">
                <p className="text-sm text-cyber-text-dim mb-3">Extract text from images using Tesseract OCR.</p>

                {/* Method selection */}
                <div className="flex items-center gap-4 mb-3">
                  <label className="text-xs font-mono text-cyber-text-dim">METHOD:</label>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setOcrMethod('basic')}
                      className={ocrMethod === 'basic' ? 'cyber-btn-primary text-xs' : 'cyber-btn text-xs'}
                    >
                      Basic
                    </button>
                    <button
                      onClick={() => setOcrMethod('advanced')}
                      className={ocrMethod === 'advanced' ? 'cyber-btn-primary text-xs' : 'cyber-btn text-xs'}
                    >
                      Advanced (Preprocessed)
                    </button>
                  </div>
                </div>

                {/* Language */}
                <div className="flex items-center gap-3 mb-3">
                  <label className="text-xs font-mono text-cyber-text-dim">LANGUAGE:</label>
                  <select
                    value={ocrLang}
                    onChange={(e) => setOcrLang(e.target.value)}
                    className="cyber-select w-40"
                  >
                    <option value="eng">English</option>
                    <option value="ara">Arabic</option>
                    <option value="fra">French</option>
                    <option value="deu">German</option>
                    <option value="spa">Spanish</option>
                    <option value="chi_sim">Chinese (Simplified)</option>
                    <option value="jpn">Japanese</option>
                    <option value="rus">Russian</option>
                  </select>
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => analyze('/ocr', {
                      preprocess: ocrMethod === 'advanced' ? 'true' : 'false',
                      lang: ocrLang,
                    })}
                    className="cyber-btn-primary"
                    disabled={!file || loading}
                  >
                    {loading ? 'Reading...' : '📝 Extract Text'}
                  </button>
                  <button
                    onClick={() => analyze('/ocr/flags', { lang: ocrLang })}
                    className="cyber-btn-danger"
                    disabled={!file || loading}
                  >
                    {loading ? 'Searching...' : '🚩 Find Flags & Patterns'}
                  </button>
                </div>

                <p className="text-xs text-cyber-text-dim mt-2 opacity-60">
                  Basic: raw Tesseract. Advanced: grayscale + contrast + sharpen + threshold preprocessing for better results.
                  Flags: auto-detects CTF flags, base64, hashes, URLs in OCR text. Shows character/word/line count.
                </p>
              </SectionCard>
            </motion.div>
          )}

          {/* ═══════ QR / BARCODE ═══════ */}
          {activeTab === 'qr' && (
            <motion.div key="qr" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <SectionCard title="QR Code & Barcode" icon={HiOutlineQrcode} color="#7c3aed">
                <p className="text-sm text-cyber-text-dim mb-3">Detect and decode QR codes and barcodes in images.</p>
                <button onClick={() => analyze('/qrcode')} className="cyber-btn-primary" disabled={!file || loading}>
                  {loading ? 'Scanning...' : '📱 Scan Codes'}
                </button>
              </SectionCard>
            </motion.div>
          )}

          {/* ═══════ HEX VIEWER (Advanced ghex-style) ═══════ */}
          {activeTab === 'hex' && (
            <motion.div key="hex" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <HexViewerPanel file={file} />
            </motion.div>
          )}

          {/* ═══════ FILE CARVING ═══════ */}
          {activeTab === 'carving' && (
            <motion.div key="carving" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <SectionCard title="File Carving" icon={HiOutlineScissors} color="#ff3366">
                <p className="text-sm text-cyber-text-dim mb-3">Carve embedded files using multiple tools and signature scanning.</p>

                {/* Tool selection */}
                <div className="flex items-center gap-3 mb-4">
                  <label className="text-xs font-mono text-cyber-text-dim">TOOL:</label>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { id: 'auto', label: 'Auto (Best Available)' },
                      { id: 'foremost', label: 'Foremost' },
                      { id: 'binwalk', label: 'Binwalk' },
                      { id: 'signatures', label: 'Signature Scan' },
                    ].map((t) => (
                      <button
                        key={t.id}
                        onClick={() => setCarvingTool(t.id as typeof carvingTool)}
                        className={carvingTool === t.id ? 'cyber-btn-primary text-xs' : 'cyber-btn text-xs'}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => {
                      const endpointMap: Record<string, string> = {
                        auto: '/carving',
                        foremost: '/carving/foremost',
                        binwalk: '/carving/binwalk',
                        signatures: '/carving/signatures',
                      };
                      const extra = carvingTool === 'auto' ? { action: 'extract' } : undefined;
                      analyze(endpointMap[carvingTool], extra);
                    }}
                    className="cyber-btn-primary"
                    disabled={!file || loading}
                  >
                    {loading ? 'Carving...' : '🔪 Carve / Extract Files'}
                  </button>
                  <button onClick={() => analyze('/carving/signatures')} className="cyber-btn" disabled={!file || loading}>
                    {loading ? 'Scanning...' : '📋 Scan Signatures Only'}
                  </button>
                </div>
                <p className="text-xs text-cyber-text-dim mt-2 opacity-60">
                  Auto: uses foremost if available, falls back to binwalk. Signature Scan: finds JPEG, PNG, ZIP, PDF, RAR, ELF, EXE and more embedded in the file without extracting.
                </p>
              </SectionCard>
            </motion.div>
          )}

          {/* ═══════ CTF AUTO ═══════ */}
          {activeTab === 'ctf' && (
            <motion.div key="ctf" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <SectionCard title="CTF Auto-Analyzer" icon={HiOutlineLightningBolt} color="#ffaa00">
                <p className="text-sm text-cyber-text-dim mb-3">
                  Automatically run all analysis tools on the file and search for flags, hidden data, and embedded secrets.
                  Ideal for CTF challenges.
                </p>
                <button onClick={() => analyze('/ctf-auto')} className="cyber-btn-primary" disabled={!file || loading}>
                  {loading ? '⚡ Running all tools...' : '⚡ Auto-Analyze (CTF)'}
                </button>
              </SectionCard>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Results */}
        <ResultsPanel title="Analysis Output" data={result} loading={loading} error={error} />
      </div>
    </div>
  );
}
