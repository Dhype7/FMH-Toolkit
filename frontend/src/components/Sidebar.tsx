import { NavLink, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import {
  HiOutlineHome,
  HiOutlineLockClosed,
  HiOutlinePhotograph,
  HiOutlineDocumentSearch,
  HiOutlineGlobeAlt,
  HiOutlineChevronLeft,
  HiOutlineChevronRight,
  HiOutlineInformationCircle,
  HiOutlineCheckCircle,
  HiOutlineX,
  HiOutlineUserGroup,
  HiOutlineDatabase,
  HiOutlineWifi,
  HiOutlineColorSwatch,
  HiOutlineFolderOpen,
} from 'react-icons/hi';
import { SiHackaday } from 'react-icons/si';
import api from '@/utils/api';

const navItems = [
  { path: '/', label: 'Dashboard', icon: HiOutlineHome, color: '#00d4ff' },
  { path: '/crypto', label: 'Cryptography', icon: HiOutlineLockClosed, color: '#7c3aed' },
  { path: '/photo', label: 'Photo Analyzer', icon: HiOutlinePhotograph, color: '#00ff88' },
  { path: '/file', label: 'File Analyzer', icon: HiOutlineDocumentSearch, color: '#ffaa00' },
  { path: '/web', label: 'Web Analyzer', icon: HiOutlineGlobeAlt, color: '#ff3366' },
  { path: '/drive', label: 'Drive Analyzer', icon: HiOutlineDatabase, color: '#f97316' },
  { path: '/pcap', label: 'PCAP Analyzer', icon: HiOutlineWifi, color: '#06b6d4' },
];

/* ─── Theme definitions ──────────────── */
const themes = [
  { id: 'blue',   label: 'Blue',   primary: '#00d4ff', swatch: '#00d4ff' },
  { id: 'red',    label: 'Red',    primary: '#ff3366', swatch: '#ff3366' },
  { id: 'green',  label: 'Green',  primary: '#00ff88', swatch: '#00ff88' },
  { id: 'yellow', label: 'Yellow', primary: '#ffd740', swatch: '#ffd740' },
  { id: 'white',  label: 'White',  primary: '#e2e8f0', swatch: '#e2e8f0' },
] as const;

function applyTheme(id: string) {
  document.documentElement.setAttribute('data-theme', id);
  localStorage.setItem('fmh-theme', id);
}

/* ─── Modal Overlay ──────────────────── */
function Modal({ open, onClose, children, size = 'md' }: { open: boolean; onClose: () => void; children: React.ReactNode; size?: 'md' | 'lg' }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.92, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.92, y: 20 }}
        className={`relative z-10 w-full mx-4 cyber-card p-0 overflow-hidden ${size === 'lg' ? 'max-w-2xl' : 'max-w-lg'}`}
      >
        <button
          onClick={onClose}
          className="absolute top-3 right-3 w-7 h-7 rounded-full flex items-center justify-center text-cyber-text-dim hover:text-cyber-primary hover:bg-white/5 transition-all z-10"
        >
          <HiOutlineX className="text-sm" />
        </button>
        {children}
      </motion.div>
    </div>
  );
}

/* ─── License Modal Content ─────────── */
function LicenseContent() {
  return (
    <div className="p-6">
      <h2 className="font-cyber text-lg font-bold tracking-wider text-cyber-primary mb-1 text-center">
        LICENSE
      </h2>
      <p className="text-center text-xs font-mono text-cyan-400 mb-4">GNU Affero General Public License v3.0</p>
      <div className="overflow-y-auto max-h-[60vh] pr-1 space-y-3 text-xs font-mono text-cyber-text-dim">
        <div className="cyber-card p-3">
          <p className="text-cyber-primary font-bold mb-1">Copyright</p>
          <p>© 2026 Nurunim-Co (dhype7)<br />ForensicsMainHand — github.com/Dhype7/FMH-Toolkit</p>
        </div>
        <div className="cyber-card p-3">
          <p className="text-green-400 font-bold mb-2">✅ You ARE allowed to:</p>
          <ul className="space-y-1 text-cyber-text">
            <li>• Use freely for personal, educational &amp; research purposes</li>
            <li>• Fork it, study it, and contribute back</li>
            <li>• Distribute copies with this license intact</li>
            <li>• Modify it — but your fork must stay open source (AGPL copyleft)</li>
          </ul>
        </div>
        <div className="cyber-card p-3">
          <p className="text-red-400 font-bold mb-2">❌ You are NOT allowed to:</p>
          <ul className="space-y-1 text-cyber-text">
            <li>• Sell this software or offer it as a paid product/service</li>
            <li>• Rebrand it and claim it as your own tool</li>
            <li>• Close-source a fork — forks must remain open source</li>
            <li>• Remove or alter copyright notices</li>
          </ul>
        </div>
        <div className="cyber-card p-3">
          <p className="text-yellow-400 font-bold mb-1">⚠ Modifications</p>
          <p>If you distribute a modified version — including running it as a network service — you MUST release your modified source code under this same AGPL-3.0 license. Commercial use requires explicit written permission from Nurunim-Co.</p>
        </div>
        <div className="cyber-card p-3">
          <p className="text-cyber-primary font-bold mb-1">Disclaimer</p>
          <p>THIS SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND. THE AUTHORS ARE NOT LIABLE FOR ANY DAMAGES ARISING FROM USE OF THIS SOFTWARE.</p>
        </div>
        <div className="text-center pt-1">
          <a
            href="https://www.gnu.org/licenses/agpl-3.0.html"
            target="_blank"
            rel="noopener noreferrer"
            className="text-cyan-400 hover:text-cyan-300 transition-colors underline underline-offset-2"
          >
            Full AGPL-3.0 Text ↗
          </a>
        </div>
      </div>
    </div>
  );
}

/* ─── About Modal Content ────────────── */
function AboutContent({ onLicenseClick }: { onLicenseClick: () => void }) {
  return (
    <div className="p-6">
      <div className="text-center mb-5">
        <div className="w-16 h-16 mx-auto mb-3 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-blue-600/20 border border-cyan-500/30 flex items-center justify-center">
          <SiHackaday className="text-cyber-primary text-3xl" />
        </div>
        <h2 className="font-cyber text-xl font-bold tracking-wider neon-text-blue">
          ForensicsMainHand
        </h2>
        <span className="cyber-badge mt-2">v2.0</span>
      </div>
      <div className="space-y-3 text-sm text-cyber-text-dim font-mono">
        <p>
          A powerful, all-in-one cyber forensics &amp; security toolkit built for
          CTF players, penetration testers, security researchers, and digital forensics analysts.
          Offensive &amp; defensive — easy, practical, and built for real-world investigations.
        </p>
        <div className="cyber-divider" />
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="cyber-card p-2">
            <span className="text-cyber-primary">Modules</span>
            <p className="text-cyber-text mt-1">5 core modules</p>
          </div>
          <div className="cyber-card p-2">
            <span className="text-cyber-primary">Tools</span>
            <p className="text-cyber-text mt-1">50+ analysis tools</p>
          </div>
          <div className="cyber-card p-2">
            <span className="text-cyber-primary">Stack</span>
            <p className="text-cyber-text mt-1">Flask + React/TS</p>
          </div>
          <button
            onClick={onLicenseClick}
            className="cyber-card p-2 text-left w-full hover:border-cyber-primary/50 transition-all group"
          >
            <span className="text-cyber-primary">License</span>
            <p className="text-cyber-text mt-1 group-hover:text-cyan-400 transition-colors">AGPL-3.0 ↗</p>
          </button>
        </div>
        <div className="cyber-divider" />
        <p className="text-center text-[11px] text-cyber-text-dim">
          Crypto · Steg · EXIF · Binwalk · OCR · Hex · Carving · Web Recon · File Analysis
        </p>
        <div className="text-center mt-2">
          <a
            href="https://github.com/Dhype7/FMH-Toolkit"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-[11px] text-cyan-400 hover:text-cyan-300 transition-colors"
          >
            ⭐ Star us on GitHub — Dhype7/FMH-Toolkit
          </a>
        </div>
      </div>
    </div>
  );
}

/* ─── Creators Modal Content ─────────── */
function CreatorsContent() {
  return (
    <div className="p-6">
      <h2 className="font-cyber text-lg font-bold tracking-wider text-cyber-primary mb-4 text-center">
        CREATORS
      </h2>
      <div className="text-center mb-4">
        <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-purple-500/20 to-cyan-500/20 border-2 border-purple-500/40 flex items-center justify-center mb-3">
          <span className="font-cyber text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400">N</span>
        </div>
        <h3 className="font-cyber text-base font-bold tracking-wider">
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400">Nurunim-Co</span>
        </h3>
        <p className="text-cyber-text-dim text-xs font-mono mt-1">Cybersecurity Research & Development / AI</p>
      </div>
      <div className="cyber-divider" />
      <div className="cyber-card p-4 text-center">
        <p className="text-sm text-cyber-text font-mono mb-2">Lead Developer</p>
        <h4 className="font-cyber text-lg font-bold neon-text-green">dhype7</h4>
        <p className="text-xs text-cyber-text-dim font-mono mt-2">
          Security researcher · CTF player · Tool builder
        </p>
      </div>
      <div className="cyber-divider" />
      <div className="space-y-2 text-xs font-mono text-cyber-text-dim">
        <p className="text-center">
          <span className="text-cyber-primary">Mission:</span> Building powerful, easy-to-use security tools
          — open-source &amp; closed-source, offensive &amp; defensive — practical for beginners
          and professionals alike.
        </p>
        <p className="text-center">
          <span className="text-cyan-400">ForensicsMainHand</span> — your all-in-one forensics &amp; security
          toolkit featuring advanced file analysis, steganography, cryptography, photo forensics,
          hex editing, web reconnaissance, CTF solving, and more. Fast, modern, and built for
          real-world investigations.
        </p>
      </div>
      <div className="mt-4 text-center">
        <span className="text-[10px] font-mono text-cyber-text-dim">
          © {new Date().getFullYear()} Nurunim-Co · All rights reserved
        </span>
      </div>
    </div>
  );
}

/* ─── System Check Modal Content ─────── */
function SystemCheckContent() {
  const [checking, setChecking] = useState(false);
  const [results, setResults] = useState<null | {
    tools: Record<string, boolean>;
    python_packages: Record<string, boolean>;
    system: Record<string, string>;
  }>(null);

  const runCheck = async () => {
    setChecking(true);
    try {
      const { data } = await api.get('/system-check');
      setResults(data);
    } catch {
      setResults(null);
    } finally {
      setChecking(false);
    }
  };

  const total = results
    ? Object.values(results.tools).length + Object.values(results.python_packages).length
    : 0;
  const passed = results
    ? Object.values(results.tools).filter(Boolean).length +
      Object.values(results.python_packages).filter(Boolean).length
    : 0;

  return (
    <div className="p-6">
      <h2 className="font-cyber text-lg font-bold tracking-wider text-cyber-primary mb-4 text-center">
        SYSTEM CHECK
      </h2>
      {!results ? (
        <div className="text-center py-8">
          <p className="text-sm text-cyber-text-dim font-mono mb-4">
            Run a full diagnostic check to verify all dependencies, system tools, and Python packages
            are properly installed and working.
          </p>
          <button onClick={runCheck} className="cyber-btn-primary" disabled={checking}>
            {checking ? (
              <span className="flex items-center gap-2">
                <div className="cyber-spinner" /> Checking...
              </span>
            ) : (
              '⚡ Run System Check'
            )}
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Score bar */}
          <div className="text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border"
              style={{
                borderColor: passed === total ? '#00ff8840' : '#ffaa0040',
                background: passed === total ? '#00ff8810' : '#ffaa0010',
              }}
            >
              <span className="font-mono text-sm" style={{ color: passed === total ? '#00ff88' : '#ffaa00' }}>
                {passed}/{total} checks passed
              </span>
            </div>
          </div>

          {/* System info */}
          {results.system && (
            <div>
              <h4 className="text-xs font-mono text-cyber-text-dim uppercase tracking-wider mb-2">System Info</h4>
              <div className="grid grid-cols-2 gap-1">
                {Object.entries(results.system).map(([k, v]) => (
                  <div key={k} className="flex items-center gap-2 text-xs font-mono px-2 py-1 rounded bg-cyber-bg/50">
                    <span className="text-cyber-text-dim">{k}:</span>
                    <span className="text-cyber-text truncate">{v}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* System tools */}
          <div>
            <h4 className="text-xs font-mono text-cyber-text-dim uppercase tracking-wider mb-2">System Tools</h4>
            <div className="grid grid-cols-2 gap-1">
              {Object.entries(results.tools).map(([name, ok]) => (
                <div
                  key={name}
                  className={`flex items-center gap-2 text-xs font-mono px-2 py-1.5 rounded border ${
                    ok
                      ? 'text-green-400 bg-green-500/5 border-green-500/20'
                      : 'text-red-400 bg-red-500/5 border-red-500/20'
                  }`}
                >
                  <div className={`w-1.5 h-1.5 rounded-full ${ok ? 'bg-green-400' : 'bg-red-400'}`} />
                  {name}
                </div>
              ))}
            </div>
          </div>

          {/* Python packages */}
          <div>
            <h4 className="text-xs font-mono text-cyber-text-dim uppercase tracking-wider mb-2">Python Packages</h4>
            <div className="grid grid-cols-2 gap-1 max-h-40 overflow-y-auto">
              {Object.entries(results.python_packages).map(([name, ok]) => (
                <div
                  key={name}
                  className={`flex items-center gap-2 text-xs font-mono px-2 py-1.5 rounded border ${
                    ok
                      ? 'text-green-400 bg-green-500/5 border-green-500/20'
                      : 'text-red-400 bg-red-500/5 border-red-500/20'
                  }`}
                >
                  <div className={`w-1.5 h-1.5 rounded-full ${ok ? 'bg-green-400' : 'bg-red-400'}`} />
                  {name}
                </div>
              ))}
            </div>
          </div>

          <button onClick={runCheck} className="cyber-btn w-full" disabled={checking}>
            {checking ? 'Re-checking...' : '🔄 Re-run Check'}
          </button>
        </div>
      )}
    </div>
  );
}

/* ─── Output Directory Modal Content ──── */
function OutputDirContent({ onClose }: { onClose: () => void }) {
  const [path, setPath] = useState('');
  const [currentDir, setCurrentDir] = useState<string | null>(null);
  const [defaultDir, setDefaultDir] = useState('');
  const [saving, setSaving] = useState(false);
  const [loadingDir, setLoadingDir] = useState(true);

  useEffect(() => {
    api.get('/settings/output-dir').then(({ data }) => {
      setCurrentDir(data.output_dir);
      setDefaultDir(data.default_output || '');
      setPath(data.output_dir || '');
    }).catch(() => {}).finally(() => setLoadingDir(false));
  }, []);

  const save = async () => {
    setSaving(true);
    try {
      const { data } = await api.post('/settings/output-dir', { output_dir: path.trim() });
      setCurrentDir(data.output_dir);
    } catch {
      // error silently handled
    } finally {
      setSaving(false);
    }
  };

  const reset = async () => {
    setSaving(true);
    try {
      const { data } = await api.post('/settings/output-dir', { output_dir: '' });
      setCurrentDir(data.output_dir);
      setPath('');
    } catch {
      // error silently handled
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6">
      <h2 className="font-cyber text-lg font-bold tracking-wider text-cyber-primary mb-4 text-center">
        OUTPUT DIRECTORY
      </h2>
      <p className="text-xs text-cyber-text-dim font-mono text-center mb-4">
        Set a custom directory where all extracted files, carved data, compressed outputs,
        and recursive extractions will be saved.
      </p>

      {loadingDir ? (
        <div className="flex items-center justify-center py-6 gap-2 text-cyber-primary">
          <div className="cyber-spinner" />
          <span className="text-xs font-mono animate-pulse">Loading...</span>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Current status */}
          <div className="cyber-card p-3">
            <div className="text-[10px] font-mono text-cyber-text-dim uppercase tracking-wider mb-1">Current Output</div>
            <div className="text-sm font-mono text-cyber-text break-all">
              {currentDir ? (
                <span className="text-orange-400">{currentDir}</span>
              ) : (
                <span className="text-cyber-text-dim">Default (per-file location)</span>
              )}
            </div>
          </div>

          {/* Path input */}
          <div>
            <label className="text-xs font-mono text-cyber-text-dim block mb-1.5">
              DIRECTORY PATH
            </label>
            <input
              type="text"
              value={path}
              onChange={(e) => setPath(e.target.value)}
              className="cyber-input w-full font-mono text-sm"
              placeholder={defaultDir || '/home/user/forensics-output'}
            />
            <p className="text-[10px] font-mono text-cyber-text-dim mt-1">
              Leave empty to use default per-file paths. Supports ~ for home directory.
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex gap-2">
            <button
              onClick={save}
              disabled={saving}
              className="cyber-btn-primary flex-1"
            >
              {saving ? 'Saving...' : '💾 Save Path'}
            </button>
            <button
              onClick={reset}
              disabled={saving}
              className="cyber-btn flex-1"
            >
              ↩ Reset Default
            </button>
          </div>

          {/* Info tip */}
          <div className="rounded-lg border border-cyan-500/20 bg-cyan-500/5 p-3">
            <p className="text-[11px] font-mono text-cyan-400/80">
              <strong>Tip:</strong> This affects File Analyzer and Photo Analyzer extractions, hex editor saves, 
              and any tool that outputs files. 
              You can set it to a dedicated folder for better organization of your forensic artifacts.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const [showAbout, setShowAbout] = useState(false);
  const [showCreators, setShowCreators] = useState(false);
  const [showCheck, setShowCheck] = useState(false);
  const [showTheme, setShowTheme] = useState(false);
  const [showOutputDir, setShowOutputDir] = useState(false);
  const [showLicense, setShowLicense] = useState(false);
  const [activeTheme, setActiveTheme] = useState(() => localStorage.getItem('fmh-theme') || 'blue');
  const location = useLocation();

  // Apply saved theme on mount
  useEffect(() => {
    const saved = localStorage.getItem('fmh-theme');
    if (saved) {
      document.documentElement.setAttribute('data-theme', saved);
      setActiveTheme(saved);
    }
  }, []);

  const changeTheme = (id: string) => {
    applyTheme(id);
    setActiveTheme(id);
  };

  return (
    <motion.aside
      initial={false}
      animate={{ width: collapsed ? 72 : 260 }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
      className="h-screen flex flex-col bg-cyber-panel border-r border-cyber-border relative z-20 overflow-hidden"
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 h-16 border-b border-cyber-border shrink-0">
        <div className="relative w-9 h-9 flex items-center justify-center shrink-0">
          <div className="absolute inset-0 rounded-lg bg-gradient-to-br from-cyan-500/20 to-blue-600/20 border border-cyan-500/30" />
          <SiHackaday className="text-cyber-primary text-lg relative z-10" />
          <div className="absolute inset-0 rounded-lg animate-glow" />
        </div>
        <AnimatePresence>
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden whitespace-nowrap"
            >
              <h1 className="font-cyber text-sm font-bold tracking-wider text-cyber-primary leading-tight">
                FMH
              </h1>
              <p className="text-[10px] text-cyber-text-dim font-mono tracking-widest">
                v2.0 FORENSICS
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className="block relative group"
            >
              <motion.div
                className={`
                  flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200
                  ${isActive
                    ? 'bg-gradient-to-r from-cyan-500/10 to-transparent'
                    : 'hover:bg-white/[0.03]'
                  }
                `}
                whileHover={{ x: 2 }}
                whileTap={{ scale: 0.98 }}
              >
                {/* Active indicator bar */}
                {isActive && (
                  <motion.div
                    layoutId="activeIndicator"
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-6 rounded-r-full"
                    style={{ backgroundColor: item.color }}
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  />
                )}

                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-all duration-300 ${
                    isActive
                      ? 'shadow-lg'
                      : 'bg-transparent group-hover:bg-white/[0.03]'
                  }`}
                  style={isActive ? {
                    backgroundColor: `${item.color}15`,
                    boxShadow: `0 0 15px ${item.color}20`,
                  } : {}}
                >
                  <item.icon
                    className="text-lg transition-colors duration-300"
                    style={{ color: isActive ? item.color : '#64748b' }}
                  />
                </div>

                <AnimatePresence>
                  {!collapsed && (
                    <motion.span
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      transition={{ duration: 0.2 }}
                      className={`text-sm font-medium whitespace-nowrap transition-colors duration-300 ${
                        isActive ? 'text-cyber-text-bright' : 'text-cyber-text-dim group-hover:text-cyber-text'
                      }`}
                    >
                      {item.label}
                    </motion.span>
                  )}
                </AnimatePresence>
              </motion.div>
            </NavLink>
          );
        })}
      </nav>

      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute top-16 -right-3 w-6 h-6 rounded-full bg-cyber-panel border border-cyber-border flex items-center justify-center text-cyber-text-dim hover:text-cyber-primary hover:border-cyber-primary transition-all duration-300 z-30"
      >
        {collapsed ? (
          <HiOutlineChevronRight className="text-xs" />
        ) : (
          <HiOutlineChevronLeft className="text-xs" />
        )}
      </button>

      {/* Bottom actions */}
      <div className="px-2 py-2 border-t border-cyber-border shrink-0 space-y-1">
        {/* About */}
        <button
          onClick={() => setShowAbout(true)}
          className="flex items-center gap-2.5 w-full px-3 py-2 rounded-lg text-cyber-text-dim hover:text-cyber-primary hover:bg-white/[0.03] transition-all"
        >
          <HiOutlineInformationCircle className="text-lg shrink-0" />
          <AnimatePresence>
            {!collapsed && (
              <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-xs font-mono">
                About
              </motion.span>
            )}
          </AnimatePresence>
        </button>

        {/* Creators */}
        <button
          onClick={() => setShowCreators(true)}
          className="flex items-center gap-2.5 w-full px-3 py-2 rounded-lg text-cyber-text-dim hover:text-purple-400 hover:bg-white/[0.03] transition-all"
        >
          <HiOutlineUserGroup className="text-lg shrink-0" />
          <AnimatePresence>
            {!collapsed && (
              <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-xs font-mono">
                Creators
              </motion.span>
            )}
          </AnimatePresence>
        </button>

        {/* System Check */}
        <button
          onClick={() => setShowCheck(true)}
          className="flex items-center gap-2.5 w-full px-3 py-2 rounded-lg text-cyber-text-dim hover:text-green-400 hover:bg-white/[0.03] transition-all"
        >
          <HiOutlineCheckCircle className="text-lg shrink-0" />
          <AnimatePresence>
            {!collapsed && (
              <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-xs font-mono">
                System Check
              </motion.span>
            )}
          </AnimatePresence>
        </button>

        {/* Theme Changer */}
        <button
          onClick={() => setShowTheme(true)}
          className="flex items-center gap-2.5 w-full px-3 py-2 rounded-lg text-cyber-text-dim hover:text-yellow-400 hover:bg-white/[0.03] transition-all"
        >
          <HiOutlineColorSwatch className="text-lg shrink-0" />
          <AnimatePresence>
            {!collapsed && (
              <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-xs font-mono">
                Theme
              </motion.span>
            )}
          </AnimatePresence>
        </button>

        {/* Output Directory */}
        <button
          onClick={() => setShowOutputDir(true)}
          className="flex items-center gap-2.5 w-full px-3 py-2 rounded-lg text-cyber-text-dim hover:text-orange-400 hover:bg-white/[0.03] transition-all"
        >
          <HiOutlineFolderOpen className="text-lg shrink-0" />
          <AnimatePresence>
            {!collapsed && (
              <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-xs font-mono">
                Output Dir
              </motion.span>
            )}
          </AnimatePresence>
        </button>
      </div>

      {/* Status indicator */}
      <div className="px-3 py-2 border-t border-cyber-border shrink-0">
        <AnimatePresence>
          {!collapsed ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-2"
            >
              <div className="w-2 h-2 rounded-full bg-green-400 shadow-neon-green animate-pulse" />
              <span className="text-[11px] text-cyber-text-dim font-mono">SYSTEM ONLINE</span>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex justify-center"
            >
              <div className="w-2 h-2 rounded-full bg-green-400 shadow-neon-green animate-pulse" />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Modals */}
      <Modal open={showLicense} onClose={() => setShowLicense(false)} size="lg">
        <LicenseContent />
      </Modal>
      <Modal open={showAbout} onClose={() => setShowAbout(false)}>
        <AboutContent onLicenseClick={() => { setShowAbout(false); setShowLicense(true); }} />
      </Modal>
      <Modal open={showCreators} onClose={() => setShowCreators(false)}>
        <CreatorsContent />
      </Modal>
      <Modal open={showCheck} onClose={() => setShowCheck(false)}>
        <SystemCheckContent />
      </Modal>

      <Modal open={showOutputDir} onClose={() => setShowOutputDir(false)}>
        <OutputDirContent onClose={() => setShowOutputDir(false)} />
      </Modal>

      {/* Theme Picker Modal */}
      <Modal open={showTheme} onClose={() => setShowTheme(false)}>
        <div className="p-6">
          <h2 className="font-cyber text-lg font-bold tracking-wider text-cyber-primary mb-4 text-center">
            THEME
          </h2>
          <p className="text-xs text-cyber-text-dim font-mono text-center mb-5">
            Choose your accent color. All themes use a dark background.
          </p>
          <div className="grid grid-cols-5 gap-3">
            {themes.map((t) => (
              <button
                key={t.id}
                onClick={() => changeTheme(t.id)}
                className={`flex flex-col items-center gap-2 p-3 rounded-lg border transition-all ${
                  activeTheme === t.id
                    ? 'border-opacity-60 scale-105'
                    : 'border-cyber-border hover:border-opacity-40'
                }`}
                style={{
                  borderColor: activeTheme === t.id ? t.swatch : undefined,
                  backgroundColor: activeTheme === t.id ? `${t.swatch}10` : undefined,
                }}
              >
                <div
                  className="w-8 h-8 rounded-full border-2 shadow-lg transition-transform"
                  style={{
                    backgroundColor: t.swatch,
                    borderColor: activeTheme === t.id ? '#fff' : `${t.swatch}60`,
                    boxShadow: activeTheme === t.id ? `0 0 12px ${t.swatch}60` : 'none',
                  }}
                />
                <span className="text-[10px] font-mono" style={{ color: activeTheme === t.id ? t.swatch : '#64748b' }}>
                  {t.label}
                </span>
              </button>
            ))}
          </div>
          <div className="mt-5 text-center">
            <span className="text-[10px] font-mono text-cyber-text-dim">Current: </span>
            <span className="text-[10px] font-mono font-bold" style={{ color: themes.find(t => t.id === activeTheme)?.swatch }}>
              {themes.find(t => t.id === activeTheme)?.label}
            </span>
          </div>
        </div>
      </Modal>
    </motion.aside>
  );
}
