import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  HiOutlineGlobeAlt,
  HiOutlineServer,
  HiOutlineWifi,
  HiOutlineSearch,
  HiOutlineShieldCheck,
  HiOutlineExclamationCircle,
  HiOutlineLockClosed,
  HiOutlineKey,
  HiOutlineExternalLink,
  HiOutlineStar,
} from 'react-icons/hi';
import toast from 'react-hot-toast';
import api from '@/utils/api';
import ResultsPanel, { PageHeader, CyberTabs, SectionCard } from '@/components/ResultsPanel';

const tabs = [
  { id: 'headers', label: 'HTTP Headers', icon: HiOutlineServer },
  { id: 'dns', label: 'DNS Resolve', icon: HiOutlineWifi },
  { id: 'whois', label: 'WHOIS', icon: HiOutlineSearch },
  { id: 'ports', label: 'Port Scan', icon: HiOutlineGlobeAlt },
  { id: 'security', label: 'Security Headers', icon: HiOutlineShieldCheck },
  { id: 'xss', label: 'XSS Detect', icon: HiOutlineExclamationCircle },
  { id: 'login', label: 'Login Discovery', icon: HiOutlineLockClosed },
  { id: 'brute', label: 'Brute Force', icon: HiOutlineKey },
];

export default function WebAnalyzerPage() {
  const [activeTab, setActiveTab] = useState('headers');
  const [result, setResult] = useState<unknown>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /* Input state */
  const [url, setUrl] = useState('');
  const [domain, setDomain] = useState('');
  const [portRange, setPortRange] = useState('1-1024');
  const [xssUrl, setXssUrl] = useState('');
  const [xssParam, setXssParam] = useState('');
  const [loginUrl, setLoginUrl] = useState('');
  const [bruteUrl, setBruteUrl] = useState('');
  const [bruteUser, setBruteUser] = useState('');
  const [brutePasswords, setBrutePasswords] = useState('');
  const [bruteUserField, setBruteUserField] = useState('username');
  const [brutePassField, setBrutePassField] = useState('password');

  const call = async (endpoint: string, body: Record<string, unknown>) => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.post(`/web${endpoint}`, body);
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
        title="WEB ANALYZER"
        subtitle="HTTP headers, DNS, WHOIS, port scanning, security audit & XSS detection"
        icon={HiOutlineGlobeAlt}
        accentColor="#ff3366"
      />

      <CyberTabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

      {/* ═══════ WebRocker Promo Banner ═══════ */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mt-5 relative overflow-hidden rounded-xl border border-cyan-500/30 bg-gradient-to-r from-[#0a1628]/90 via-[#0d1f3c]/90 to-[#0a1628]/90 p-5"
      >
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(0,212,255,0.08),transparent_70%)]" />
        <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-cyan-400/60 to-transparent" />
        <div className="absolute bottom-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-purple-400/40 to-transparent" />
        <div className="relative flex flex-col sm:flex-row items-center gap-4">
          <div className="flex-shrink-0 w-14 h-14 rounded-xl bg-gradient-to-br from-cyan-500/20 to-purple-500/20 border border-cyan-500/30 flex items-center justify-center">
            <HiOutlineStar className="text-2xl text-cyan-400" />
          </div>
          <div className="flex-1 text-center sm:text-left">
            <div className="flex items-center gap-2 justify-center sm:justify-start mb-1">
              <span className="font-cyber text-sm font-bold tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400">
                RECOMMENDED
              </span>
              <span className="px-2 py-0.5 text-[10px] font-mono font-bold rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
                WEB TOOL
              </span>
            </div>
            <p className="text-sm text-cyber-text font-mono mb-1">
              Try <span className="text-cyan-400 font-bold">WebRocker</span> — a powerful web analysis &amp; reconnaissance platform for advanced web security testing.
            </p>
            <p className="text-xs text-cyber-text-dim font-mono">
              Created by <span className="text-purple-400">Nurunim-Co</span> · Developed by <span className="text-green-400">sa05e60</span>
            </p>
          </div>
          <a
            href="https://webrocker.onrender.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex-shrink-0 flex items-center gap-2 px-5 py-2.5 rounded-lg font-cyber text-sm font-bold tracking-wider bg-gradient-to-r from-cyan-500/20 to-purple-500/20 border border-cyan-500/40 text-cyan-400 hover:from-cyan-500/30 hover:to-purple-500/30 hover:border-cyan-400/60 hover:text-white transition-all duration-300 hover:shadow-[0_0_20px_rgba(0,212,255,0.2)]"
          >
            <HiOutlineExternalLink className="text-lg" />
            Visit WebRocker
          </a>
        </div>
      </motion.div>

      <div className="mt-5 space-y-5">
        <AnimatePresence mode="wait">
          {/* ═══════ HTTP HEADERS ═══════ */}
          {activeTab === 'headers' && (
            <motion.div key="headers" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <SectionCard title="HTTP Headers" icon={HiOutlineServer} color="#00d4ff">
                <div className="flex gap-2 mb-3">
                  <input
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    className="cyber-input flex-1"
                    placeholder="https://example.com"
                  />
                  <button
                    onClick={() => call('/headers', { url })}
                    className="cyber-btn-primary"
                    disabled={!url || loading}
                  >
                    {loading ? 'Fetching...' : '📡 Get Headers'}
                  </button>
                </div>
              </SectionCard>
            </motion.div>
          )}

          {/* ═══════ DNS RESOLVE ═══════ */}
          {activeTab === 'dns' && (
            <motion.div key="dns" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <SectionCard title="DNS Resolution" icon={HiOutlineWifi} color="#00ff88">
                <p className="text-sm text-cyber-text-dim mb-3">Resolve A, AAAA, CNAME, MX, TXT, and NS records.</p>
                <div className="flex gap-2 mb-3">
                  <input
                    value={domain}
                    onChange={(e) => setDomain(e.target.value)}
                    className="cyber-input flex-1"
                    placeholder="example.com"
                  />
                  <button
                    onClick={() => call('/resolve', { domain })}
                    className="cyber-btn-primary"
                    disabled={!domain || loading}
                  >
                    {loading ? 'Resolving...' : '🌐 Resolve DNS'}
                  </button>
                </div>
              </SectionCard>
            </motion.div>
          )}

          {/* ═══════ WHOIS ═══════ */}
          {activeTab === 'whois' && (
            <motion.div key="whois" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <SectionCard title="WHOIS Lookup" icon={HiOutlineSearch} color="#ffaa00">
                <div className="flex gap-2">
                  <input
                    value={domain}
                    onChange={(e) => setDomain(e.target.value)}
                    className="cyber-input flex-1"
                    placeholder="example.com"
                  />
                  <button
                    onClick={() => call('/whois', { domain })}
                    className="cyber-btn-primary"
                    disabled={!domain || loading}
                  >
                    {loading ? 'Looking up...' : '🔍 WHOIS'}
                  </button>
                </div>
              </SectionCard>
            </motion.div>
          )}

          {/* ═══════ PORT SCAN ═══════ */}
          {activeTab === 'ports' && (
            <motion.div key="ports" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <SectionCard title="Port Scanner" icon={HiOutlineGlobeAlt} color="#ff3366">
                <p className="text-sm text-cyber-text-dim mb-3">Scan for open ports on a target host (TCP connect scan).</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
                  <div className="md:col-span-2">
                    <input
                      value={domain}
                      onChange={(e) => setDomain(e.target.value)}
                      className="cyber-input"
                      placeholder="Target host (e.g. example.com)"
                    />
                  </div>
                  <div>
                    <input
                      value={portRange}
                      onChange={(e) => setPortRange(e.target.value)}
                      className="cyber-input"
                      placeholder="Port range (e.g. 1-1024)"
                    />
                  </div>
                </div>
                <button
                  onClick={() => {
                    const [start, end] = portRange.split('-').map(Number);
                    call('/ports', {
                      host: domain,
                      start_port: start || 1,
                      end_port: end || 1024,
                    });
                  }}
                  className="cyber-btn-danger"
                  disabled={!domain || loading}
                >
                  {loading ? 'Scanning...' : '🔫 Scan Ports'}
                </button>
              </SectionCard>
            </motion.div>
          )}

          {/* ═══════ SECURITY HEADERS ═══════ */}
          {activeTab === 'security' && (
            <motion.div key="security" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <SectionCard title="Security Headers Audit" icon={HiOutlineShieldCheck} color="#00ff88">
                <p className="text-sm text-cyber-text-dim mb-3">
                  Audit HTTP security headers and get a security grade (A+ to F).
                </p>
                <div className="flex gap-2">
                  <input
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    className="cyber-input flex-1"
                    placeholder="https://example.com"
                  />
                  <button
                    onClick={() => call('/security-headers', { url })}
                    className="cyber-btn-primary"
                    disabled={!url || loading}
                  >
                    {loading ? 'Auditing...' : '🛡️ Audit Headers'}
                  </button>
                </div>
              </SectionCard>
            </motion.div>
          )}

          {/* ═══════ XSS DETECT ═══════ */}
          {activeTab === 'xss' && (
            <motion.div key="xss" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <SectionCard title="XSS Detection" icon={HiOutlineExclamationCircle} color="#ff3366">
                <p className="text-sm text-cyber-text-dim mb-3">
                  Test a URL parameter for reflected XSS vulnerabilities using common payloads.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                  <div>
                    <label className="block text-xs font-mono text-cyber-text-dim mb-1">TARGET URL</label>
                    <input
                      value={xssUrl}
                      onChange={(e) => setXssUrl(e.target.value)}
                      className="cyber-input"
                      placeholder="https://example.com/search"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-mono text-cyber-text-dim mb-1">PARAMETER NAME</label>
                    <input
                      value={xssParam}
                      onChange={(e) => setXssParam(e.target.value)}
                      className="cyber-input"
                      placeholder="q"
                    />
                  </div>
                </div>
                <button
                  onClick={() => call('/xss', { url: xssUrl, parameter: xssParam })}
                  className="cyber-btn-danger"
                  disabled={!xssUrl || !xssParam || loading}
                >
                  {loading ? 'Testing...' : '💉 Test XSS'}
                </button>
              </SectionCard>
            </motion.div>
          )}

          {/* ═══════ LOGIN DISCOVERY ═══════ */}
          {activeTab === 'login' && (
            <motion.div key="login" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <SectionCard title="Login Page Discovery" icon={HiOutlineLockClosed} color="#7c3aed">
                <p className="text-sm text-cyber-text-dim mb-3">
                  Discover login/admin pages by checking common paths.
                </p>
                <div className="flex gap-2">
                  <input
                    value={loginUrl}
                    onChange={(e) => setLoginUrl(e.target.value)}
                    className="cyber-input flex-1"
                    placeholder="https://example.com"
                  />
                  <button
                    onClick={() => call('/discover-login', { url: loginUrl })}
                    className="cyber-btn-primary"
                    disabled={!loginUrl || loading}
                  >
                    {loading ? 'Discovering...' : '🔓 Find Logins'}
                  </button>
                </div>
              </SectionCard>
            </motion.div>
          )}

          {/* ═══════ BRUTE FORCE ═══════ */}
          {activeTab === 'brute' && (
            <motion.div key="brute" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <SectionCard title="Login Brute Force" icon={HiOutlineKey} color="#ff3366">
                <p className="text-sm text-cyber-text-dim mb-3">
                  Brute force a login form with a list of passwords. For authorized testing only!
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                  <div>
                    <label className="block text-xs font-mono text-cyber-text-dim mb-1">LOGIN URL</label>
                    <input
                      value={bruteUrl}
                      onChange={(e) => setBruteUrl(e.target.value)}
                      className="cyber-input"
                      placeholder="https://example.com/login"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-mono text-cyber-text-dim mb-1">USERNAME</label>
                    <input
                      value={bruteUser}
                      onChange={(e) => setBruteUser(e.target.value)}
                      className="cyber-input"
                      placeholder="admin"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-mono text-cyber-text-dim mb-1">USERNAME FIELD</label>
                    <input
                      value={bruteUserField}
                      onChange={(e) => setBruteUserField(e.target.value)}
                      className="cyber-input"
                      placeholder="username"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-mono text-cyber-text-dim mb-1">PASSWORD FIELD</label>
                    <input
                      value={brutePassField}
                      onChange={(e) => setBrutePassField(e.target.value)}
                      className="cyber-input"
                      placeholder="password"
                    />
                  </div>
                </div>
                <div className="mb-3">
                  <label className="block text-xs font-mono text-cyber-text-dim mb-1">PASSWORD LIST (one per line)</label>
                  <textarea
                    value={brutePasswords}
                    onChange={(e) => setBrutePasswords(e.target.value)}
                    className="cyber-input min-h-[120px] resize-y"
                    placeholder={"admin\npassword\n123456\nletmein\nqwerty"}
                  />
                </div>
                <button
                  onClick={() =>
                    call('/brute-force', {
                      url: bruteUrl,
                      username: bruteUser,
                      passwords: brutePasswords.split('\n').filter(Boolean),
                      username_field: bruteUserField,
                      password_field: brutePassField,
                    })
                  }
                  className="cyber-btn-danger"
                  disabled={!bruteUrl || !bruteUser || !brutePasswords || loading}
                >
                  {loading ? 'Attacking...' : '⚡ Start Brute Force'}
                </button>
              </SectionCard>
            </motion.div>
          )}
        </AnimatePresence>

        <ResultsPanel title="Web Analysis Output" data={result} loading={loading} error={error} />
      </div>
    </div>
  );
}
