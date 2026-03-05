import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import {
  HiOutlineLockClosed,
  HiOutlinePhotograph,
  HiOutlineDocumentSearch,
  HiOutlineGlobeAlt,
  HiOutlineShieldCheck,
  HiOutlineChip,
  HiOutlineLightningBolt,
} from 'react-icons/hi';
import api from '@/utils/api';

interface ToolStatus {
  available_tools: string[];
  missing_tools: string[];
  version: string;
}

const modules = [
  {
    path: '/crypto',
    title: 'Cryptography',
    description: 'Classical & modern ciphers, encoding, hashing, Morse code, brute force',
    icon: HiOutlineLockClosed,
    color: '#7c3aed',
    features: ['AES/DES/RSA/Blowfish', 'Caesar, Vigenere, Playfair', 'Base64/32/16', 'Morse Code Audio', 'Hash Identifier'],
  },
  {
    path: '/photo',
    title: 'Photo Analyzer',
    description: 'EXIF, steganography, OCR, QR codes, hex analysis, CTF auto-solve',
    icon: HiOutlinePhotograph,
    color: '#00ff88',
    features: ['EXIF & Metadata', 'Steganography (LSB/steghide)', 'Binwalk & Zsteg', 'OCR & QR/Barcode', 'CTF Auto-Analyzer'],
  },
  {
    path: '/file',
    title: 'File Analyzer',
    description: 'File info, entropy, strings, hashes, archive extraction, carving',
    icon: HiOutlineDocumentSearch,
    color: '#ffaa00',
    features: ['File Type Detection', 'Entropy Analysis', 'String Extraction', 'Archive Extraction', 'File Carving'],
  },
  {
    path: '/web',
    title: 'Web Analyzer',
    description: 'HTTP headers, DNS, WHOIS, port scanning, XSS detection, security audit',
    icon: HiOutlineGlobeAlt,
    color: '#ff3366',
    features: ['HTTP Headers', 'DNS Resolution', 'WHOIS Lookup', 'Port Scanning', 'Security Headers Grade'],
  },
];

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

export default function Dashboard() {
  const navigate = useNavigate();
  const [status, setStatus] = useState<ToolStatus | null>(null);

  useEffect(() => {
    api.get('/tools').then((r) => {
      const d = r.data;
      // Handle both formats: {available_tools:[]} or {tool: bool}
      if (d.available_tools) {
        setStatus(d);
      } else {
        const available = Object.keys(d).filter((k) => d[k] && k !== 'version');
        const missing = Object.keys(d).filter((k) => !d[k] && k !== 'version');
        setStatus({ available_tools: available, missing_tools: missing, version: d.version || '2.0' });
      }
    }).catch(() => {});
  }, []);

  return (
    <div className="max-w-6xl mx-auto">
      {/* Hero */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-10"
      >
        <motion.div
          className="inline-flex items-center gap-2 mb-4 px-3 py-1 rounded-full border border-cyan-500/20 bg-cyan-500/5"
          animate={{ boxShadow: ['0 0 10px rgba(0,212,255,0.1)', '0 0 20px rgba(0,212,255,0.2)', '0 0 10px rgba(0,212,255,0.1)'] }}
          transition={{ duration: 3, repeat: Infinity }}
        >
          <HiOutlineShieldCheck className="text-cyber-primary text-sm" />
          <span className="text-xs font-mono text-cyber-primary tracking-wider">SYSTEM ACTIVE</span>
        </motion.div>

        <h1 className="font-cyber text-4xl md:text-5xl font-black tracking-wider mb-3">
          <span className="neon-text-blue">FORENSICS</span>
          <span className="text-cyber-text-bright"> MAIN </span>
          <span className="neon-text-green">HAND</span>
        </h1>
        <p className="text-cyber-text-dim font-mono text-sm max-w-xl mx-auto">
          Advanced cyber forensics & cryptanalysis toolkit , steganography,
          cryptography, file analysis, and web reconnaissance in one platform.
        </p>

        {/* Version & tool status */}
        {status && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-4 flex items-center justify-center gap-4 text-xs font-mono"
          >
            <span className="cyber-badge">v{status.version}</span>
            <span className="cyber-badge-green">
              <HiOutlineChip className="mr-1" />
              {status.available_tools.length} tools ready
            </span>
            {status.missing_tools.length > 0 && (
              <span className="cyber-badge-danger">
                {status.missing_tools.length} missing
              </span>
            )}
          </motion.div>
        )}
      </motion.div>

      {/* Module Cards */}
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 md:grid-cols-2 gap-5"
      >
        {modules.map((mod) => (
          <motion.div
            key={mod.path}
            variants={item}
            whileHover={{ y: -4, transition: { duration: 0.2 } }}
            onClick={() => navigate(mod.path)}
            className="cyber-card p-6 cursor-pointer group"
          >
            <div className="flex items-start gap-4">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 transition-all duration-300 group-hover:scale-110"
                style={{
                  backgroundColor: `${mod.color}15`,
                  boxShadow: `0 0 20px ${mod.color}10`,
                }}
              >
                <mod.icon className="text-2xl" style={{ color: mod.color }} />
              </div>
              <div className="flex-1 min-w-0">
                <h2
                  className="font-cyber text-lg font-bold tracking-wider mb-1"
                  style={{ color: mod.color }}
                >
                  {mod.title}
                </h2>
                <p className="text-cyber-text-dim text-sm mb-3">{mod.description}</p>
                <div className="flex flex-wrap gap-1.5">
                  {mod.features.map((f) => (
                    <span
                      key={f}
                      className="text-[10px] font-mono px-1.5 py-0.5 rounded border"
                      style={{
                        color: mod.color,
                        borderColor: `${mod.color}30`,
                        backgroundColor: `${mod.color}08`,
                      }}
                    >
                      {f}
                    </span>
                  ))}
                </div>
              </div>
              <HiOutlineLightningBolt
                className="text-lg shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                style={{ color: mod.color }}
              />
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* Quick Stats */}
      {status && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="mt-8 cyber-card p-4"
        >
          <h3 className="font-cyber text-xs font-bold tracking-widest text-cyber-text-dim uppercase mb-3">
            System Tools Status
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
            {[...status.available_tools, ...status.missing_tools].sort().map((tool) => {
              const available = status.available_tools.includes(tool);
              return (
                <div
                  key={tool}
                  className={`flex items-center gap-2 px-2 py-1.5 rounded text-xs font-mono ${
                    available
                      ? 'text-green-400 bg-green-500/5 border border-green-500/20'
                      : 'text-red-400 bg-red-500/5 border border-red-500/20'
                  }`}
                >
                  <div
                    className={`w-1.5 h-1.5 rounded-full ${
                      available ? 'bg-green-400' : 'bg-red-400'
                    }`}
                  />
                  {tool}
                </div>
              );
            })}
          </div>
        </motion.div>
      )}
    </div>
  );
}
