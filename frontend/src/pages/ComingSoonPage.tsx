import { motion } from 'framer-motion';
import { HiOutlineDatabase, HiOutlineWifi } from 'react-icons/hi';

const pages: Record<string, { title: string; desc: string; icon: typeof HiOutlineDatabase; color: string }> = {
  drive: {
    title: 'Drive Analyzer',
    desc: 'Full disk forensic imaging, partition analysis, deleted file recovery, and filesystem timeline reconstruction.',
    icon: HiOutlineDatabase,
    color: '#f97316',
  },
  pcap: {
    title: 'PCAP & PCAPNG Analyzer',
    desc: 'Network packet capture analysis, protocol dissection, stream reassembly, and traffic anomaly detection.',
    icon: HiOutlineWifi,
    color: '#06b6d4',
  },
};

export default function ComingSoonPage({ type }: { type: 'drive' | 'pcap' }) {
  const page = pages[type];

  return (
    <div className="h-full flex items-center justify-center p-8">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center max-w-md"
      >
        {/* Icon */}
        <div
          className="w-20 h-20 rounded-2xl mx-auto mb-6 flex items-center justify-center border"
          style={{
            backgroundColor: `${page.color}10`,
            borderColor: `${page.color}30`,
          }}
        >
          <page.icon className="text-4xl" style={{ color: page.color }} />
        </div>

        {/* Title */}
        <h1
          className="font-cyber text-2xl font-bold tracking-wider mb-3"
          style={{ color: page.color }}
        >
          {page.title}
        </h1>

        {/* Coming Soon badge */}
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border mb-5"
          style={{
            borderColor: `${page.color}40`,
            backgroundColor: `${page.color}08`,
          }}
        >
          <div
            className="w-2 h-2 rounded-full animate-pulse"
            style={{ backgroundColor: page.color }}
          />
          <span className="font-mono text-sm font-semibold" style={{ color: page.color }}>
            COMING SOON
          </span>
        </div>

        {/* Description */}
        <p className="text-sm text-cyber-text-dim font-mono leading-relaxed mb-6">
          {page.desc}
        </p>

        {/* Decorative bar */}
        <div className="w-32 h-1 mx-auto rounded-full overflow-hidden bg-cyber-border">
          <motion.div
            className="h-full rounded-full"
            style={{ backgroundColor: page.color }}
            animate={{ x: ['-100%', '200%'] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          />
        </div>

        <p className="mt-6 text-[11px] text-cyber-text-dim font-mono">
          This module is under development. Stay tuned for updates.
        </p>
      </motion.div>
    </div>
  );
}
