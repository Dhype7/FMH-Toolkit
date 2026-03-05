import { motion } from 'framer-motion';
import { HiOutlineTerminal, HiOutlineClipboardCopy, HiOutlineTrash } from 'react-icons/hi';
import { useState, useRef, useEffect } from 'react';
import toast from 'react-hot-toast';

interface ResultsPanelProps {
  title?: string;
  data: unknown;
  loading?: boolean;
  error?: string | null;
}

export default function ResultsPanel({ title = 'Output', data, loading = false, error }: ResultsPanelProps) {
  const [expanded, setExpanded] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [data]);

  const formatOutput = (value: unknown): string => {
    if (value === null || value === undefined) return '';
    if (typeof value === 'string') return value;
    try {
      return JSON.stringify(value, null, 2);
    } catch {
      return String(value);
    }
  };

  const copyToClipboard = () => {
    const text = formatOutput(data);
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  const output = formatOutput(data);

  if (!data && !loading && !error) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="cyber-card"
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-2 border-b border-cyber-border cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-2">
          <HiOutlineTerminal className="text-cyber-accent text-sm" />
          <span className="font-mono text-xs text-cyber-text-dim uppercase tracking-wider">{title}</span>
          {loading && <div className="cyber-spinner ml-2" />}
        </div>
        <div className="flex items-center gap-1">
          {output && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                copyToClipboard();
              }}
              className="p-1 hover:text-cyber-primary text-cyber-text-dim transition-colors"
              title="Copy"
            >
              <HiOutlineClipboardCopy className="text-sm" />
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      {expanded && (
        <div ref={scrollRef} className="cyber-terminal max-h-[500px] overflow-auto rounded-none border-0">
          {error ? (
            <pre className="text-red-400">[ERROR] {error}</pre>
          ) : loading ? (
            <div className="flex items-center gap-2 text-cyber-primary">
              <div className="cyber-spinner" />
              <span className="animate-pulse">Processing...</span>
            </div>
          ) : (
            <pre className="whitespace-pre-wrap break-all">{output}</pre>
          )}
        </div>
      )}
    </motion.div>
  );
}


/* ── Reusable Section Wrapper ────────────────────── */
export function SectionCard({
  title,
  icon: Icon,
  color = '#00d4ff',
  children,
  className = '',
}: {
  title: string;
  icon?: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  color?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`cyber-card p-5 ${className}`}
    >
      <div className="flex items-center gap-2 mb-4">
        {Icon && <Icon className="text-lg" style={{ color }} />}
        <h3 className="font-cyber text-sm font-bold tracking-wider uppercase" style={{ color }}>
          {title}
        </h3>
      </div>
      {children}
    </motion.div>
  );
}


/* ── Page Header ─────────────────────────────────── */
export function PageHeader({
  title,
  subtitle,
  icon: Icon,
  accentColor = '#00d4ff',
}: {
  title: string;
  subtitle?: string;
  icon?: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  accentColor?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-6"
    >
      <div className="flex items-center gap-3">
        {Icon && (
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center"
            style={{
              backgroundColor: `${accentColor}15`,
              boxShadow: `0 0 20px ${accentColor}20`,
            }}
          >
            <Icon className="text-xl" style={{ color: accentColor }} />
          </div>
        )}
        <div>
          <h1
            className="font-cyber text-2xl font-bold tracking-wider"
            style={{ color: accentColor, textShadow: `0 0 20px ${accentColor}40` }}
          >
            {title}
          </h1>
          {subtitle && (
            <p className="text-cyber-text-dim text-sm font-mono mt-0.5">{subtitle}</p>
          )}
        </div>
      </div>
      <div className="mt-3 h-px bg-gradient-to-r from-transparent via-cyber-border to-transparent" />
    </motion.div>
  );
}


/* ── Tabs Component ──────────────────────────────── */
export function CyberTabs({
  tabs,
  activeTab,
  onChange,
}: {
  tabs: { id: string; label: string; icon?: React.ComponentType<{ className?: string }> }[];
  activeTab: string;
  onChange: (id: string) => void;
}) {
  return (
    <div className="flex gap-1 p-1 bg-cyber-bg/50 rounded-lg border border-cyber-border overflow-x-auto">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-mono whitespace-nowrap transition-all duration-200 ${
            activeTab === tab.id
              ? 'bg-cyber-card text-cyber-primary border border-cyan-500/20 shadow-cyber'
              : 'text-cyber-text-dim hover:text-cyber-text hover:bg-white/[0.02]'
          }`}
        >
          {tab.icon && <tab.icon className="text-sm" />}
          {tab.label}
        </button>
      ))}
    </div>
  );
}


/* ── Loading overlay ─────────────────────────────── */
export function LoadingOverlay({ message = 'Processing...' }: { message?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 bg-cyber-bg/80 backdrop-blur-sm flex items-center justify-center z-50 rounded-lg"
    >
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 border-2 border-cyber-primary border-t-transparent rounded-full animate-spin" />
        <span className="font-mono text-sm text-cyber-primary animate-pulse">{message}</span>
      </div>
    </motion.div>
  );
}
