/**
 * HexViewerPanel — ghex-style advanced hex viewer/editor component
 * Features: hex grid, ASCII column, data inspector, search, goto, entropy,
 * structure overlay, embedded files, string extraction, byte histogram,
 * hash computation, XOR brute-force, export, EDIT MODE (hex ↔ ascii sync),
 * range selection highlight, header recognition & auto-fix, save/download
 */
import { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  HiOutlineCode,
  HiOutlineSearch,
  HiOutlineInformationCircle,
  HiOutlineChartBar,
  HiOutlinePuzzle,
  HiOutlineDocumentText,
  HiOutlineHashtag,
  HiOutlineKey,
  HiOutlineDownload,
  HiOutlineChevronLeft,
  HiOutlineChevronRight,
  HiOutlineLightningBolt,
  HiOutlineFingerPrint,
  HiOutlinePencil,
  HiOutlineSave,
  HiOutlineShieldCheck,
} from 'react-icons/hi';
import toast from 'react-hot-toast';
import { uploadFile } from '@/utils/api';

/* ═══════════════════════ TYPES ═══════════════════════ */
interface HexRow {
  offset: number;
  offset_hex: string;
  hex_left: string;
  hex_right: string;
  hex: string;
  ascii: string;
  bytes: number[];
}

interface HexDump {
  offset: number;
  length: number;
  total_size: number;
  bytes_per_row: number;
  rows: HexRow[];
  file_type: { type: string; magic_bytes?: string };
}

interface InspectorData {
  [key: string]: number | string;
}

interface StructureRegion {
  offset: number;
  size: number;
  label: string;
  color: string;
}

interface SearchResult {
  offset: number;
  offset_hex: string;
  match_length: number;
  context_hex?: string;
  context_ascii?: string;
  match?: string;
  error?: string;
}

/* ═══════════════════════ SIDE PANEL DEFS ═══════════════════════ */
type SidePanel = 'inspector' | 'search' | 'structure' | 'entropy' | 'histogram' | 'strings' | 'embedded' | 'hashes' | 'xor' | 'export' | 'flags' | 'header' | null;

const sidePanelDefs: { id: SidePanel; label: string; icon: typeof HiOutlineCode; color: string }[] = [
  { id: 'inspector', label: 'Inspector', icon: HiOutlineInformationCircle, color: '#00d4ff' },
  { id: 'search', label: 'Search', icon: HiOutlineSearch, color: '#7c3aed' },
  { id: 'header', label: 'Header Fix', icon: HiOutlineShieldCheck, color: '#ff6b35' },
  { id: 'structure', label: 'Structure', icon: HiOutlinePuzzle, color: '#ffaa00' },
  { id: 'entropy', label: 'Entropy', icon: HiOutlineChartBar, color: '#ff3366' },
  { id: 'histogram', label: 'Histogram', icon: HiOutlineHashtag, color: '#00ff88' },
  { id: 'strings', label: 'Strings', icon: HiOutlineDocumentText, color: '#e040fb' },
  { id: 'embedded', label: 'Embedded', icon: HiOutlinePuzzle, color: '#40c4ff' },
  { id: 'hashes', label: 'Hashes', icon: HiOutlineFingerPrint, color: '#b2ff59' },
  { id: 'xor', label: 'XOR', icon: HiOutlineKey, color: '#ffd740' },
  { id: 'export', label: 'Export', icon: HiOutlineDownload, color: '#ff6b35' },
  { id: 'flags', label: 'CTF Flags', icon: HiOutlineLightningBolt, color: '#ff3366' },
];

/* ═══════════════════════ MAIN COMPONENT ═══════════════════════ */
export default function HexViewerPanel({ file }: { file: File | null }) {
  // Core state
  const [hexData, setHexData] = useState<HexDump | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedByte, setSelectedByte] = useState<number | null>(null);
  const [inspector, setInspector] = useState<InspectorData | null>(null);
  const [sidePanel, setSidePanel] = useState<SidePanel>(null);
  const [currentOffset, setCurrentOffset] = useState(0);
  const [pageSize] = useState(4096);

  // ──── SELECTION RANGE (multi-byte highlight) ────
  const [selStart, setSelStart] = useState<number | null>(null);
  const [selEnd, setSelEnd] = useState<number | null>(null);
  const isSelecting = useRef(false);

  // ──── EDIT MODE ────
  const [editMode, setEditMode] = useState(false);
  const [pendingEdits, setPendingEdits] = useState<Map<number, number>>(new Map());
  const [editingCell, setEditingCell] = useState<{ offset: number; side: 'hex' | 'ascii' } | null>(null);
  const [editBuffer, setEditBuffer] = useState('');
  const editRef = useRef<HTMLInputElement>(null);

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchType, setSearchType] = useState<'hex' | 'ascii' | 'regex'>('hex');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);

  // Goto
  const [gotoInput, setGotoInput] = useState('');

  // Side panel data
  const [structureData, setStructureData] = useState<{ file_type: string; regions: StructureRegion[] } | null>(null);
  const [entropyData, setEntropyData] = useState<any>(null);
  const [histogramData, setHistogramData] = useState<any>(null);
  const [stringsData, setStringsData] = useState<any[]>([]);
  const [embeddedData, setEmbeddedData] = useState<any[]>([]);
  const [hashData, setHashData] = useState<any>(null);
  const [xorData, setXorData] = useState<any[]>([]);
  const [exportData, setExportData] = useState<any>(null);
  const [flagsData, setFlagsData] = useState<any[]>([]);
  const [headerData, setHeaderData] = useState<any>(null);
  const [headerFixResult, setHeaderFixResult] = useState<any>(null);
  const [headerFixLoading, setHeaderFixLoading] = useState(false);

  // Highlighted ranges (from structure or search)
  const [highlightRanges, setHighlightRanges] = useState<StructureRegion[]>([]);

  const hexGridRef = useRef<HTMLDivElement>(null);

  /* ─── Helpers ────────────────────── */
  const isInSelection = useCallback((off: number) => {
    if (selStart === null || selEnd === null) return false;
    const lo = Math.min(selStart, selEnd);
    const hi = Math.max(selStart, selEnd);
    return off >= lo && off <= hi;
  }, [selStart, selEnd]);

  const selectionCount = selStart !== null && selEnd !== null
    ? Math.abs(selEnd - selStart) + 1 : 0;

  /* Get byte value (with pending edits overlay) */
  const getByteVal = useCallback((absOff: number, original: number) => {
    return pendingEdits.has(absOff) ? pendingEdits.get(absOff)! : original;
  }, [pendingEdits]);

  /* ─── API helpers ────────────────────── */
  const callApi = useCallback(async (endpoint: string, extra?: Record<string, string>) => {
    if (!file) { toast.error('Upload a file first'); return null; }
    const { data } = await uploadFile(`/photo/hex${endpoint}`, file, extra);
    return data;
  }, [file]);

  /* ─── Load hex dump ────────────────────── */
  const loadHex = useCallback(async (offset = 0) => {
    if (!file) return;
    setLoading(true);
    try {
      const data = await callApi('', { offset: String(offset), length: String(pageSize) });
      if (data) {
        setHexData(data);
        setCurrentOffset(offset);
      }
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  }, [file, callApi, pageSize]);

  /* Auto-load on file change */
  useEffect(() => {
    if (file) {
      setHexData(null);
      setSelectedByte(null);
      setInspector(null);
      setCurrentOffset(0);
      setPendingEdits(new Map());
      setSelStart(null);
      setSelEnd(null);
      (async () => {
        setLoading(true);
        try {
          const { data } = await uploadFile('/photo/hex', file, { offset: '0', length: String(pageSize) });
          if (data) {
            setHexData(data);
            setCurrentOffset(0);
          }
        } catch (e: any) {
          toast.error(e.message);
        } finally {
          setLoading(false);
        }
      })();
    }
  }, [file, pageSize]);

  /* ─── Selection handlers (mousedown/move on bytes) ────── */
  const onByteMouseDown = useCallback((absOff: number, e: React.MouseEvent) => {
    if (editMode && e.detail === 2) return; // double-click in edit mode → edit
    setSelStart(absOff);
    setSelEnd(absOff);
    setSelectedByte(absOff);
    isSelecting.current = true;
  }, [editMode]);

  const onByteMouseEnter = useCallback((absOff: number) => {
    if (isSelecting.current) {
      setSelEnd(absOff);
    }
  }, []);

  useEffect(() => {
    const onMouseUp = () => { isSelecting.current = false; };
    window.addEventListener('mouseup', onMouseUp);
    return () => window.removeEventListener('mouseup', onMouseUp);
  }, []);

  /* ─── Click byte → inspector (when not editing) ────── */
  const onByteClick = useCallback(async (absoluteOffset: number) => {
    setSelectedByte(absoluteOffset);
    if (!file) return;
    try {
      const data = await callApi('/inspect', { offset: String(absoluteOffset) });
      if (data) setInspector(data);
    } catch { /* ignore */ }
  }, [file, callApi]);

  /* ─── Edit mode: start editing a cell ────── */
  const startEdit = useCallback((absOff: number, side: 'hex' | 'ascii') => {
    if (!editMode) return;
    setEditingCell({ offset: absOff, side });
    if (side === 'hex') {
      const row = hexData?.rows.find(r => absOff >= r.offset && absOff < r.offset + r.bytes.length);
      const idx = row ? absOff - row.offset : 0;
      const val = row ? getByteVal(absOff, row.bytes[idx]) : 0;
      setEditBuffer(val.toString(16).toUpperCase().padStart(2, '0'));
    } else {
      const row = hexData?.rows.find(r => absOff >= r.offset && absOff < r.offset + r.bytes.length);
      const idx = row ? absOff - row.offset : 0;
      const val = row ? getByteVal(absOff, row.bytes[idx]) : 0;
      const ch = val >= 32 && val < 127 ? String.fromCharCode(val) : '.';
      setEditBuffer(ch);
    }
    setTimeout(() => editRef.current?.focus(), 10);
  }, [editMode, hexData, getByteVal]);

  const commitEdit = useCallback(() => {
    if (!editingCell) return;
    const { offset, side } = editingCell;
    let newVal: number;
    if (side === 'hex') {
      const parsed = parseInt(editBuffer, 16);
      if (isNaN(parsed) || parsed < 0 || parsed > 255) {
        toast.error('Invalid hex byte (00-FF)');
        setEditingCell(null);
        return;
      }
      newVal = parsed;
    } else {
      if (editBuffer.length !== 1) {
        toast.error('Enter exactly one ASCII character');
        setEditingCell(null);
        return;
      }
      newVal = editBuffer.charCodeAt(0) & 0xFF;
    }
    setPendingEdits(prev => {
      const next = new Map(prev);
      next.set(offset, newVal);
      return next;
    });
    // Also update the in-memory hexData for instant visual feedback
    if (hexData) {
      const newRows = hexData.rows.map(row => {
        if (offset >= row.offset && offset < row.offset + row.bytes.length) {
          const idx = offset - row.offset;
          const newBytes = [...row.bytes];
          newBytes[idx] = newVal;
          return { ...row, bytes: newBytes };
        }
        return row;
      });
      setHexData({ ...hexData, rows: newRows });
    }
    setEditingCell(null);
  }, [editingCell, editBuffer, hexData]);

  const onEditKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') commitEdit();
    else if (e.key === 'Escape') setEditingCell(null);
  }, [commitEdit]);

  /* ─── Save edited file ────── */
  const saveEdits = async () => {
    if (!file || pendingEdits.size === 0) {
      toast.error('No edits to save');
      return;
    }
    try {
      const patches = Array.from(pendingEdits.entries()).map(([offset, value]) => ({ offset, value }));
      const data = await callApi('/patch', { patches: JSON.stringify(patches) });
      if (data) {
        toast.success(`Saved ${data.patched} edits`);
        setPendingEdits(new Map());
      }
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const downloadFile = async () => {
    if (!file) return;
    try {
      const formData = new FormData();
      formData.append('file', file);
      const resp = await fetch('/api/photo/hex/download', { method: 'POST', body: formData });
      const blob = await resp.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.name;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('File downloaded');
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  /* ─── Pagination ────────────────────── */
  const goNext = () => { if (hexData && currentOffset + pageSize < hexData.total_size) loadHex(currentOffset + pageSize); };
  const goPrev = () => { if (currentOffset > 0) loadHex(Math.max(0, currentOffset - pageSize)); };
  const goFirst = () => loadHex(0);
  const goLast = () => { if (hexData) loadHex(Math.max(0, hexData.total_size - pageSize)); };

  const gotoOffset = async () => {
    if (!file) return;
    try {
      const data = await callApi('/goto', { offset: gotoInput });
      if (data && !data.error) {
        setHexData(data);
        setCurrentOffset(data.offset);
      } else if (data?.error) {
        toast.error(data.error);
      }
    } catch (e: any) { toast.error(e.message); }
  };

  /* ─── Search ────────────────────── */
  const runSearch = async () => {
    if (!searchQuery) return;
    try {
      const data = await callApi('/search', { type: searchType, query: searchQuery });
      if (data?.results) {
        setSearchResults(data.results);
        if (data.results.length === 0) toast('No results found');
        else toast.success(`Found ${data.results.length} matches`);
      }
    } catch (e: any) { toast.error(e.message); }
  };

  const jumpToResult = (offset: number) => {
    loadHex(Math.max(0, offset - 128));
    setSelectedByte(offset);
    setSelStart(offset);
    setSelEnd(offset);
  };

  /* ─── Side panel loaders ────────────── */
  const loadSidePanel = async (panel: SidePanel) => {
    if (sidePanel === panel) { setSidePanel(null); return; }
    setSidePanel(panel);
    if (!file) return;
    try {
      switch (panel) {
        case 'structure': {
          const d = await callApi('/structure');
          if (d) { setStructureData(d); setHighlightRanges(d.regions || []); }
          break;
        }
        case 'entropy': {
          const d = await callApi('/entropy', { block_size: '256' });
          if (d) setEntropyData(d);
          break;
        }
        case 'histogram': {
          const d = await callApi('/histogram');
          if (d) setHistogramData(d);
          break;
        }
        case 'strings': {
          const d = await callApi('/strings', { min_length: '4' });
          if (d?.strings) setStringsData(d.strings);
          break;
        }
        case 'embedded': {
          const d = await callApi('/embedded');
          if (d?.embedded) setEmbeddedData(d.embedded);
          break;
        }
        case 'hashes': {
          const d = await callApi('/hashes');
          if (d) setHashData(d);
          break;
        }
        case 'xor': {
          const d = await callApi('/xor', { offset: String(currentOffset), length: '256' });
          if (d?.results) setXorData(d.results);
          break;
        }
        case 'export': {
          const d = await callApi('/export', { offset: String(currentOffset), length: '256', format: 'all' });
          if (d) setExportData(d);
          break;
        }
        case 'flags': {
          const d = await callApi('/flags');
          if (d?.flags) setFlagsData(d.flags);
          break;
        }
        case 'header': {
          const d = await callApi('/detect-header');
          if (d) setHeaderData(d);
          setHeaderFixResult(null);
          break;
        }
        default:
          break;
      }
    } catch (e: any) { toast.error(e.message); }
  };

  /* ─── Header auto-fix ────── */
  const runHeaderFix = async (targetType?: string) => {
    if (!file) return;
    setHeaderFixLoading(true);
    try {
      const extra: Record<string, string> = {};
      if (targetType) extra.target_type = targetType;
      const d = await callApi('/fix-header', extra);
      if (d) {
        setHeaderFixResult(d);
        if (d.changes?.length > 0) {
          toast.success(d.message);
          // Reload hex to show the changes
          loadHex(0);
        } else {
          toast(d.message);
        }
      }
    } catch (e: any) { toast.error(e.message); }
    finally { setHeaderFixLoading(false); }
  };

  /* ─── Color for byte ────────────────── */
  const getByteColor = useCallback((absoluteOffset: number, byteVal: number): string | undefined => {
    // Pending edits highlight
    if (pendingEdits.has(absoluteOffset)) return '#ff3366';
    // Highlight from structure
    for (const r of highlightRanges) {
      if (absoluteOffset >= r.offset && absoluteOffset < r.offset + r.size) {
        return r.color;
      }
    }
    if (byteVal === 0) return '#334155';
    if (byteVal < 32 || byteVal === 127) return '#64748b';
    if (byteVal >= 128) return '#9333ea';
    return undefined;
  }, [highlightRanges, pendingEdits]);

  /* ─── Render ───────────────────────────── */
  if (!file) {
    return (
      <div className="text-center py-12">
        <HiOutlineCode className="text-4xl text-cyber-text-dim mx-auto mb-3" />
        <p className="text-cyber-text-dim font-mono text-sm">Upload a file above to open the hex viewer</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* ─── Toolbar ─── */}
      <div className="cyber-card p-3">
        <div className="flex flex-wrap items-center gap-2">
          {/* Navigation */}
          <div className="flex items-center gap-1 border-r border-cyber-border pr-2 mr-1">
            <button onClick={goFirst} className="cyber-btn-sm" title="First page">⏮</button>
            <button onClick={goPrev} className="cyber-btn-sm" title="Previous"><HiOutlineChevronLeft /></button>
            <button onClick={goNext} className="cyber-btn-sm" title="Next"><HiOutlineChevronRight /></button>
            <button onClick={goLast} className="cyber-btn-sm" title="Last page">⏭</button>
          </div>

          {/* Offset info */}
          {hexData && (
            <span className="text-[11px] font-mono text-cyber-text-dim border-r border-cyber-border pr-2 mr-1">
              0x{currentOffset.toString(16).toUpperCase().padStart(8, '0')} / {hexData.total_size.toLocaleString()}B
              {hexData.file_type && <span className="text-cyber-primary ml-1">[{hexData.file_type.type}]</span>}
            </span>
          )}

          {/* Goto */}
          <div className="flex items-center gap-1 border-r border-cyber-border pr-2 mr-1">
            <input
              value={gotoInput}
              onChange={(e) => setGotoInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && gotoOffset()}
              className="cyber-input text-xs w-28 py-1"
              placeholder="Goto: 0x..."
            />
            <button onClick={gotoOffset} className="cyber-btn-sm">Go</button>
          </div>

          {/* Refresh */}
          <button onClick={() => loadHex(currentOffset)} className="cyber-btn-sm" disabled={loading}>
            {loading ? '...' : '↻'}
          </button>

          {/* Separator */}
          <div className="border-l border-cyber-border h-5 mx-1" />

          {/* Edit mode toggle */}
          <button
            onClick={() => { setEditMode(!editMode); setEditingCell(null); }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-[11px] font-mono font-semibold transition-all border ${
              editMode
                ? 'bg-red-500/15 border-red-500/40 text-red-400'
                : 'border-cyber-border text-cyber-text-dim hover:border-cyan-500/30 hover:text-cyan-400'
            }`}
            title="Toggle hex/ascii edit mode"
          >
            <HiOutlinePencil className="text-xs" />
            {editMode ? 'EDIT ON' : 'EDIT'}
          </button>

          {/* Save & Download (visible when edit mode is on) */}
          {editMode && (
            <>
              <button
                onClick={saveEdits}
                disabled={pendingEdits.size === 0}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-[11px] font-mono font-semibold transition-all border ${
                  pendingEdits.size > 0
                    ? 'bg-green-500/15 border-green-500/40 text-green-400'
                    : 'border-cyber-border text-cyber-text-dim opacity-50'
                }`}
                title="Save edits to file"
              >
                <HiOutlineSave className="text-xs" />
                SAVE ({pendingEdits.size})
              </button>
              <button
                onClick={downloadFile}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded text-[11px] font-mono border border-cyber-border text-cyber-text-dim hover:border-cyan-500/30 hover:text-cyan-400 transition-all"
                title="Download file"
              >
                <HiOutlineDownload className="text-xs" />
                Download
              </button>
            </>
          )}
        </div>
      </div>

      {/* ─── Side panel buttons ─── */}
      <div className="flex flex-wrap gap-1">
        {sidePanelDefs.map(p => (
          <button
            key={p.id}
            onClick={() => loadSidePanel(p.id)}
            className={`flex items-center gap-1 px-2 py-1.5 rounded text-[11px] font-mono transition-all border ${
              sidePanel === p.id
                ? 'border-opacity-50 bg-opacity-10'
                : 'border-cyber-border bg-cyber-panel hover:border-opacity-30 hover:bg-opacity-5'
            }`}
            style={sidePanel === p.id ? {
              borderColor: p.color,
              backgroundColor: p.color + '15',
              color: p.color,
            } : { color: '#94a3b8' }}
          >
            <p.icon className="text-xs" />
            {p.label}
          </button>
        ))}
      </div>

      {/* ─── Main content: hex grid + side panel ─── */}
      <div className="flex gap-3">
        {/* Hex grid */}
        <div className="flex-1 min-w-0">
          <div
            ref={hexGridRef}
            className="cyber-card p-0 overflow-auto font-mono text-xs select-none"
            style={{ maxHeight: '600px' }}
          >
            {/* Header row */}
            <div className="sticky top-0 z-10 bg-cyber-panel border-b border-cyber-border px-3 py-1.5 flex text-[10px] text-cyber-text-dim">
              <span className="w-[72px] shrink-0">OFFSET</span>
              <span className="flex-1">
                {Array.from({ length: 16 }, (_, i) => (
                  <span key={i} className={`inline-block w-[22px] text-center ${i === 8 ? 'ml-2' : ''}`}>
                    {i.toString(16).toUpperCase()}
                  </span>
                ))}
              </span>
              <span className="w-[140px] pl-3 shrink-0">ASCII</span>
            </div>

            {/* Data rows */}
            {hexData?.rows.map((row) => (
              <div
                key={row.offset}
                className="flex px-3 py-[1px] hover:bg-white/[0.02] border-b border-white/[0.02]"
              >
                {/* Offset column */}
                <span className="w-[72px] shrink-0 text-cyan-500/70">
                  {row.offset_hex}
                </span>

                {/* ═══ HEX BYTES ═══ */}
                <span className="flex-1">
                  {row.bytes.map((origB, i) => {
                    const absOff = row.offset + i;
                    const b = getByteVal(absOff, origB);
                    const selected = selectedByte === absOff;
                    const inSel = isInSelection(absOff);
                    const color = getByteColor(absOff, b);
                    const isEditing = editingCell?.offset === absOff && editingCell?.side === 'hex';

                    if (isEditing) {
                      return (
                        <input
                          key={i}
                          ref={editRef}
                          value={editBuffer}
                          onChange={(e) => setEditBuffer(e.target.value.toUpperCase().slice(0, 2))}
                          onKeyDown={onEditKeyDown}
                          onBlur={commitEdit}
                          className={`inline-block w-[22px] text-center bg-red-500/20 border-b border-red-400 text-red-300 outline-none font-mono text-xs ${i === 8 ? 'ml-2' : ''}`}
                          maxLength={2}
                        />
                      );
                    }

                    return (
                      <span
                        key={i}
                        onMouseDown={(e) => onByteMouseDown(absOff, e)}
                        onMouseEnter={() => onByteMouseEnter(absOff)}
                        onClick={() => onByteClick(absOff)}
                        onDoubleClick={() => startEdit(absOff, 'hex')}
                        className={`inline-block w-[22px] text-center cursor-pointer rounded-sm transition-colors ${
                          i === 8 ? 'ml-2' : ''
                        } ${selected ? 'ring-1 ring-cyan-400 bg-cyan-400/20' : ''} ${
                          inSel && !selected ? 'bg-purple-500/25 text-purple-200' : ''
                        } ${!selected && !inSel ? 'hover:bg-white/[0.05]' : ''} ${
                          pendingEdits.has(absOff) ? 'font-bold' : ''
                        }`}
                        style={color && !selected && !inSel ? { color } : undefined}
                        title={`0x${absOff.toString(16).toUpperCase()} = 0x${b.toString(16).toUpperCase().padStart(2, '0')} (${b})${editMode ? ' [dbl-click to edit]' : ''}`}
                      >
                        {b.toString(16).toUpperCase().padStart(2, '0')}
                      </span>
                    );
                  })}
                </span>

                {/* ═══ ASCII COLUMN ═══ */}
                <span className="w-[140px] pl-3 shrink-0 text-green-400/70 tracking-wide">
                  {row.bytes.map((origB, i) => {
                    const absOff = row.offset + i;
                    const b = getByteVal(absOff, origB);
                    const selected = selectedByte === absOff;
                    const inSel = isInSelection(absOff);
                    const ch = b >= 32 && b < 127 ? String.fromCharCode(b) : '.';
                    const isEditing = editingCell?.offset === absOff && editingCell?.side === 'ascii';

                    if (isEditing) {
                      return (
                        <input
                          key={i}
                          ref={editRef}
                          value={editBuffer}
                          onChange={(e) => setEditBuffer(e.target.value.slice(0, 1))}
                          onKeyDown={onEditKeyDown}
                          onBlur={commitEdit}
                          className="inline-block w-[9px] text-center bg-red-500/20 border-b border-red-400 text-red-300 outline-none font-mono text-xs"
                          maxLength={1}
                        />
                      );
                    }

                    return (
                      <span
                        key={i}
                        onMouseDown={(e) => onByteMouseDown(absOff, e)}
                        onMouseEnter={() => onByteMouseEnter(absOff)}
                        onClick={() => onByteClick(absOff)}
                        onDoubleClick={() => startEdit(absOff, 'ascii')}
                        className={`cursor-pointer ${
                          selected ? 'bg-cyan-400/20 text-cyan-300' : ''
                        } ${inSel && !selected ? 'bg-purple-500/25 text-purple-200' : ''} ${
                          b < 32 || b >= 127 ? 'text-gray-600' : ''
                        } ${pendingEdits.has(absOff) ? 'text-red-400 font-bold' : ''}`}
                      >
                        {ch}
                      </span>
                    );
                  })}
                </span>
              </div>
            ))}

            {!hexData && !loading && (
              <div className="text-center py-8 text-cyber-text-dim">
                Click ↻ to load hex data
              </div>
            )}
            {loading && (
              <div className="text-center py-8 text-cyber-primary">
                <div className="cyber-spinner mx-auto mb-2" />
                Loading...
              </div>
            )}
          </div>
        </div>

        {/* ─── Side panel content ─── */}
        <AnimatePresence>
          {sidePanel && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 320, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="shrink-0 overflow-hidden"
            >
              <div className="cyber-card p-3 h-[600px] overflow-y-auto w-[320px]">
                {/* ═══ Inspector ═══ */}
                {sidePanel === 'inspector' && (
                  <div>
                    <h3 className="text-xs font-mono text-cyber-primary mb-3 uppercase tracking-wider">Data Inspector</h3>
                    {selectedByte !== null && inspector ? (
                      <div className="space-y-1">
                        <div className="text-[10px] text-cyber-text-dim mb-2">
                          Offset: <span className="text-cyan-400">0x{selectedByte.toString(16).toUpperCase()}</span> ({selectedByte})
                        </div>
                        {Object.entries(inspector)
                          .filter(([k]) => !['offset', 'offset_hex', 'raw_hex'].includes(k))
                          .map(([k, v]) => (
                            <div key={k} className="flex justify-between text-[11px] font-mono py-0.5 border-b border-white/[0.03]">
                              <span className="text-cyber-text-dim">{k}</span>
                              <span className="text-cyber-text">{String(v)}</span>
                            </div>
                          ))
                        }
                      </div>
                    ) : (
                      <p className="text-xs text-cyber-text-dim">Click a byte in the hex grid to inspect it</p>
                    )}
                  </div>
                )}

                {/* ═══ Search ═══ */}
                {sidePanel === 'search' && (
                  <div>
                    <h3 className="text-xs font-mono text-cyber-primary mb-3 uppercase tracking-wider">Search</h3>
                    <div className="flex gap-1 mb-2">
                      {(['hex', 'ascii', 'regex'] as const).map(t => (
                        <button
                          key={t}
                          onClick={() => setSearchType(t)}
                          className={`px-2 py-1 text-[10px] font-mono rounded ${searchType === t ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30' : 'text-cyber-text-dim border border-cyber-border'}`}
                        >
                          {t.toUpperCase()}
                        </button>
                      ))}
                    </div>
                    <div className="flex gap-1 mb-3">
                      <input
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && runSearch()}
                        className="cyber-input text-xs flex-1 py-1"
                        placeholder={searchType === 'hex' ? 'FF D8 FF ...' : searchType === 'ascii' ? 'flag{...' : 'regex pattern...'}
                      />
                      <button onClick={runSearch} className="cyber-btn-sm">🔍</button>
                    </div>
                    {searchResults.length > 0 && (
                      <div className="space-y-1 max-h-[460px] overflow-y-auto">
                        <div className="text-[10px] text-cyber-text-dim mb-1">{searchResults.length} results</div>
                        {searchResults.map((r, i) => (
                          <div
                            key={i}
                            onClick={() => jumpToResult(r.offset)}
                            className="p-1.5 rounded border border-cyber-border hover:border-purple-500/30 hover:bg-purple-500/5 cursor-pointer transition-all"
                          >
                            <span className="text-[10px] font-mono text-cyan-400">0x{r.offset_hex}</span>
                            {r.context_ascii && <span className="text-[10px] font-mono text-cyber-text-dim ml-2 truncate block">{r.context_ascii}</span>}
                            {r.match && <span className="text-[10px] font-mono text-green-400 ml-2">{r.match}</span>}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* ═══ Header Recognition & Auto-Fix ═══ */}
                {sidePanel === 'header' && (
                  <div>
                    <h3 className="text-xs font-mono text-cyber-primary mb-3 uppercase tracking-wider">Header Recognition</h3>
                    {headerData ? (
                      <div className="space-y-3">
                        {/* File info */}
                        <div className="text-[10px] font-mono text-cyber-text-dim space-y-0.5">
                          <div>File: <span className="text-cyber-text">{headerData.filename}</span></div>
                          <div>Extension: <span className="text-cyan-400">{headerData.extension || 'none'}</span></div>
                          <div>Header hex: <span className="text-yellow-400">{headerData.current_header_hex}</span></div>
                          <div>Entropy: <span className="text-green-400">{headerData.entropy}</span></div>
                        </div>

                        {/* Candidates */}
                        <div className="space-y-2 max-h-[350px] overflow-y-auto">
                          {headerData.candidates?.map((c: any, i: number) => (
                            <div key={i} className={`p-2.5 rounded border text-[10px] font-mono ${
                              i === 0 ? 'border-green-500/30 bg-green-500/5' : 'border-cyber-border'
                            }`}>
                              <div className="flex items-center justify-between mb-1.5">
                                <span className={`font-bold ${i === 0 ? 'text-green-400' : 'text-cyber-text'}`}>
                                  {c.type}
                                </span>
                                <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                                  c.confidence >= 70 ? 'bg-green-500/20 text-green-400' :
                                  c.confidence >= 40 ? 'bg-yellow-500/20 text-yellow-400' :
                                  'bg-red-500/20 text-red-400'
                                }`}>
                                  {c.confidence}%
                                </span>
                              </div>
                              {/* Confidence bar */}
                              <div className="w-full h-1.5 bg-cyber-bg rounded-full mb-2">
                                <div
                                  className="h-full rounded-full transition-all"
                                  style={{
                                    width: `${c.confidence}%`,
                                    backgroundColor: c.confidence >= 70 ? '#00ff88' : c.confidence >= 40 ? '#ffaa00' : '#ff3366',
                                  }}
                                />
                              </div>
                              {/* Details */}
                              <div className="space-y-0.5 text-cyber-text-dim">
                                {c.details?.map((d: string, j: number) => (
                                  <div key={j}>{d}</div>
                                ))}
                              </div>
                              {/* Header comparison */}
                              {c.header_corrupted && (
                                <div className="mt-1.5 p-1.5 rounded bg-black/30 space-y-0.5">
                                  <div>Current: <span className="text-red-400">{c.current_header_hex}</span></div>
                                  <div>Correct: <span className="text-green-400">{c.correct_header_hex}</span></div>
                                </div>
                              )}
                              {/* Auto-fix button */}
                              {c.header_corrupted && (
                                <button
                                  onClick={() => runHeaderFix(c.type)}
                                  disabled={headerFixLoading}
                                  className="mt-2 w-full px-2 py-1.5 rounded text-[10px] font-mono font-semibold transition-all border border-green-500/30 bg-green-500/10 text-green-400 hover:bg-green-500/20"
                                >
                                  {headerFixLoading ? 'Fixing...' : `🔧 Auto-Fix as ${c.type}`}
                                </button>
                              )}
                            </div>
                          ))}
                        </div>

                        {/* Fix result */}
                        {headerFixResult && (
                          <div className="p-2.5 rounded border border-cyan-500/30 bg-cyan-500/5">
                            <h4 className="text-[10px] font-mono text-cyan-400 font-bold mb-1.5">Fix Result</h4>
                            <div className="text-[10px] font-mono text-cyber-text-dim mb-1">{headerFixResult.message}</div>
                            {headerFixResult.changes?.length > 0 && (
                              <div className="space-y-0.5 mt-1.5">
                                {headerFixResult.changes.map((ch: any, k: number) => (
                                  <div key={k} className="flex items-center gap-2 text-[10px] font-mono">
                                    <span className="text-cyan-400">0x{ch.offset_hex}</span>
                                    <span className="text-red-400">{ch.old_byte}</span>
                                    <span className="text-cyber-text-dim">→</span>
                                    <span className="text-green-400">{ch.new_byte}</span>
                                    <span className="text-cyber-text-dim truncate">{ch.description}</span>
                                  </div>
                                ))}
                              </div>
                            )}
                            {headerFixResult.filename && (
                              <div className="mt-1.5 text-[10px] font-mono text-green-400">
                                Saved as: {headerFixResult.filename}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="text-xs text-cyber-text-dim">Loading header analysis...</p>
                    )}
                  </div>
                )}

                {/* ═══ Structure ═══ */}
                {sidePanel === 'structure' && (
                  <div>
                    <h3 className="text-xs font-mono text-cyber-primary mb-3 uppercase tracking-wider">File Structure</h3>
                    {structureData ? (
                      <div>
                        <div className="text-[10px] text-cyber-text-dim mb-2">Type: <span className="text-yellow-400">{structureData.file_type}</span></div>
                        <div className="space-y-1 max-h-[500px] overflow-y-auto">
                          {structureData.regions.map((r, i) => (
                            <div
                              key={i}
                              onClick={() => jumpToResult(r.offset)}
                              className="flex items-center gap-2 p-1.5 rounded border border-cyber-border hover:bg-white/[0.02] cursor-pointer text-[10px] font-mono"
                            >
                              <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: r.color }} />
                              <div className="flex-1 truncate">
                                <span className="text-cyan-400">0x{r.offset.toString(16).toUpperCase().padStart(8, '0')}</span>
                                <span className="text-cyber-text-dim ml-1">({r.size}B)</span>
                              </div>
                              <span className="text-cyber-text truncate max-w-[120px]">{r.label}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <p className="text-xs text-cyber-text-dim">Loading structure...</p>
                    )}
                  </div>
                )}

                {/* ═══ Entropy ═══ */}
                {sidePanel === 'entropy' && (
                  <div>
                    <h3 className="text-xs font-mono text-cyber-primary mb-3 uppercase tracking-wider">Entropy Analysis</h3>
                    {entropyData ? (
                      <div>
                        <div className="text-[10px] text-cyber-text-dim mb-2">
                          Overall: <span className="text-green-400">{entropyData.overall_entropy}</span> / {entropyData.max_entropy}
                          <span className="ml-2">
                            {entropyData.overall_entropy > 7.5 ? '🔒 Likely encrypted/compressed' :
                             entropyData.overall_entropy > 6 ? '📊 Medium entropy' : '📝 Low entropy (text-like)'}
                          </span>
                        </div>
                        <div className="border border-cyber-border rounded p-2 bg-black/20">
                          <div className="flex items-end gap-[1px] h-32">
                            {entropyData.blocks.slice(0, 200).map((b: any, i: number) => {
                              const h = (b.entropy / 8) * 100;
                              const color = b.entropy > 7.5 ? '#ff3366' : b.entropy > 6 ? '#ffaa00' : b.entropy > 4 ? '#00ff88' : '#00d4ff';
                              return (
                                <div
                                  key={i}
                                  className="flex-1 min-w-[1px] cursor-pointer rounded-t-sm transition-all hover:opacity-80"
                                  style={{ height: `${h}%`, backgroundColor: color }}
                                  title={`Offset: 0x${b.offset.toString(16).toUpperCase()} | Entropy: ${b.entropy}`}
                                  onClick={() => jumpToResult(b.offset)}
                                />
                              );
                            })}
                          </div>
                          <div className="flex justify-between text-[9px] text-cyber-text-dim mt-1">
                            <span>Start</span><span>End</span>
                          </div>
                        </div>
                        <div className="flex gap-2 mt-2 text-[9px] font-mono text-cyber-text-dim">
                          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-[#00d4ff]" /> &lt;4</span>
                          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-[#00ff88]" /> 4-6</span>
                          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-[#ffaa00]" /> 6-7.5</span>
                          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-[#ff3366]" /> &gt;7.5</span>
                        </div>
                      </div>
                    ) : (
                      <p className="text-xs text-cyber-text-dim">Loading entropy data...</p>
                    )}
                  </div>
                )}

                {/* ═══ Histogram ═══ */}
                {sidePanel === 'histogram' && (
                  <div>
                    <h3 className="text-xs font-mono text-cyber-primary mb-3 uppercase tracking-wider">Byte Histogram</h3>
                    {histogramData ? (
                      <div>
                        <div className="text-[10px] text-cyber-text-dim mb-2">
                          Total: {histogramData.total_bytes.toLocaleString()} bytes | Unique: {histogramData.unique_bytes}/256
                        </div>
                        <div className="border border-cyber-border rounded p-2 bg-black/20 mb-3">
                          <div className="flex items-end gap-0 h-24">
                            {histogramData.histogram.map((count: number, i: number) => {
                              const maxC = Math.max(...histogramData.histogram);
                              const h = maxC > 0 ? (count / maxC) * 100 : 0;
                              return (
                                <div
                                  key={i}
                                  className="flex-1 min-w-0"
                                  style={{ height: `${h}%`, backgroundColor: count > 0 ? '#00d4ff40' : 'transparent' }}
                                  title={`0x${i.toString(16).toUpperCase().padStart(2, '0')} (${i}): ${count}`}
                                />
                              );
                            })}
                          </div>
                          <div className="flex justify-between text-[9px] text-cyber-text-dim mt-1">
                            <span>0x00</span><span>0xFF</span>
                          </div>
                        </div>
                        <h4 className="text-[10px] font-mono text-cyber-text-dim mb-1">Top Bytes:</h4>
                        <div className="space-y-0.5 max-h-[300px] overflow-y-auto">
                          {histogramData.top_bytes.map((t: any) => (
                            <div key={t.byte} className="flex items-center gap-2 text-[10px] font-mono">
                              <span className="text-cyan-400 w-8">0x{t.hex}</span>
                              <div className="flex-1 h-2 bg-cyber-bg rounded-full overflow-hidden">
                                <div className="h-full bg-cyan-500/40 rounded-full" style={{ width: `${t.percent}%` }} />
                              </div>
                              <span className="text-cyber-text-dim w-16 text-right">{t.count} ({t.percent}%)</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <p className="text-xs text-cyber-text-dim">Loading histogram...</p>
                    )}
                  </div>
                )}

                {/* ═══ Strings ═══ */}
                {sidePanel === 'strings' && (
                  <div>
                    <h3 className="text-xs font-mono text-cyber-primary mb-3 uppercase tracking-wider">Extracted Strings</h3>
                    <div className="space-y-0.5 max-h-[520px] overflow-y-auto">
                      {stringsData.length > 0 ? stringsData.map((s, i) => (
                        <div key={i} onClick={() => jumpToResult(s.offset)} className="flex gap-2 text-[10px] font-mono p-1 rounded hover:bg-white/[0.02] cursor-pointer">
                          <span className="text-cyan-400 shrink-0 w-[72px]">0x{s.offset_hex}</span>
                          <span className="text-green-400 truncate">{s.string}</span>
                        </div>
                      )) : <p className="text-xs text-cyber-text-dim">No strings found or loading...</p>}
                    </div>
                  </div>
                )}

                {/* ═══ Embedded Files ═══ */}
                {sidePanel === 'embedded' && (
                  <div>
                    <h3 className="text-xs font-mono text-cyber-primary mb-3 uppercase tracking-wider">Embedded Files</h3>
                    <div className="space-y-1 max-h-[520px] overflow-y-auto">
                      {embeddedData.length > 0 ? embeddedData.map((e, i) => (
                        <div key={i} onClick={() => jumpToResult(e.offset)} className="flex items-center gap-2 p-1.5 rounded border border-cyber-border hover:border-cyan-500/30 cursor-pointer text-[10px] font-mono">
                          <span className="text-cyan-400">0x{e.offset_hex}</span>
                          <span className="cyber-badge text-[9px]">{e.type}</span>
                          <span className="text-cyber-text-dim">{e.signature}</span>
                        </div>
                      )) : <p className="text-xs text-cyber-text-dim">No embedded files or loading...</p>}
                    </div>
                  </div>
                )}

                {/* ═══ Hashes ═══ */}
                {sidePanel === 'hashes' && (
                  <div>
                    <h3 className="text-xs font-mono text-cyber-primary mb-3 uppercase tracking-wider">File Hashes</h3>
                    {hashData ? (
                      <div className="space-y-2">
                        {Object.entries(hashData).map(([algo, hash]) => (
                          <div key={algo}>
                            <label className="text-[10px] font-mono text-cyber-text-dim uppercase">{algo}</label>
                            <div
                              className="text-[10px] font-mono text-green-400 bg-black/20 p-1.5 rounded border border-cyber-border cursor-pointer hover:bg-white/[0.02] break-all"
                              onClick={() => { navigator.clipboard.writeText(String(hash)); toast.success(`${algo} copied!`); }}
                              title="Click to copy"
                            >{String(hash)}</div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-cyber-text-dim">Loading hashes...</p>
                    )}
                  </div>
                )}

                {/* ═══ XOR ═══ */}
                {sidePanel === 'xor' && (
                  <div>
                    <h3 className="text-xs font-mono text-cyber-primary mb-3 uppercase tracking-wider">XOR Brute Force</h3>
                    <p className="text-[10px] text-cyber-text-dim mb-2">Single-byte XOR keys with high printable ratio:</p>
                    <div className="space-y-1 max-h-[500px] overflow-y-auto">
                      {xorData.length > 0 ? xorData.map((x, i) => (
                        <div key={i} className="p-2 rounded border border-cyber-border text-[10px] font-mono">
                          <div className="flex justify-between mb-1">
                            <span className="text-yellow-400">Key: 0x{x.key_hex} ({x.key})</span>
                            <span className="text-green-400">{x.printable_ratio}% printable</span>
                          </div>
                          <div className="text-cyber-text-dim bg-black/20 p-1 rounded truncate">{x.preview}</div>
                        </div>
                      )) : <p className="text-xs text-cyber-text-dim">No results with &gt;70% printable chars</p>}
                    </div>
                  </div>
                )}

                {/* ═══ Export ═══ */}
                {sidePanel === 'export' && (
                  <div>
                    <h3 className="text-xs font-mono text-cyber-primary mb-3 uppercase tracking-wider">Export Selection</h3>
                    {exportData?.exports ? (
                      <div className="space-y-2">
                        {Object.entries(exportData.exports).map(([fmt, val]) => (
                          <div key={fmt}>
                            <label className="text-[10px] font-mono text-cyber-text-dim uppercase">{fmt}</label>
                            <div
                              className="text-[10px] font-mono text-cyber-text bg-black/20 p-1.5 rounded border border-cyber-border cursor-pointer hover:bg-white/[0.02] break-all max-h-20 overflow-y-auto"
                              onClick={() => { navigator.clipboard.writeText(String(val)); toast.success(`${fmt} copied!`); }}
                              title="Click to copy"
                            >{String(val).slice(0, 1000)}</div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-cyber-text-dim">Loading export data...</p>
                    )}
                  </div>
                )}

                {/* ═══ CTF Flags ═══ */}
                {sidePanel === 'flags' && (
                  <div>
                    <h3 className="text-xs font-mono text-cyber-primary mb-3 uppercase tracking-wider">CTF Flags</h3>
                    <div className="space-y-1 max-h-[520px] overflow-y-auto">
                      {flagsData.length > 0 ? flagsData.map((f, i) => (
                        <div key={i} onClick={() => jumpToResult(f.offset)} className="p-2 rounded border border-green-500/20 bg-green-500/5 cursor-pointer hover:bg-green-500/10 text-[10px] font-mono">
                          <div className="text-green-400 break-all">{f.flag}</div>
                          <div className="text-cyber-text-dim mt-0.5">0x{f.offset_hex}</div>
                        </div>
                      )) : <p className="text-xs text-cyber-text-dim">No flags found</p>}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ─── Bottom status bar ─── */}
      {hexData && (
        <div className="cyber-card px-3 py-1.5 flex items-center justify-between text-[10px] font-mono text-cyber-text-dim">
          <span>
            {hexData.total_size.toLocaleString()}B | {hexData.file_type?.type || '?'}
            {pendingEdits.size > 0 && <span className="text-red-400 ml-2">[{pendingEdits.size} edits]</span>}
          </span>
          <span>
            {selectionCount > 1
              ? <>{selectionCount} bytes selected (0x{Math.min(selStart!, selEnd!).toString(16).toUpperCase()} — 0x{Math.max(selStart!, selEnd!).toString(16).toUpperCase()})</>
              : selectedByte !== null
                ? <>Offset: 0x{selectedByte.toString(16).toUpperCase().padStart(8, '0')} ({selectedByte})</>
                : null
            }
          </span>
          <span>
            Page {Math.floor(currentOffset / pageSize) + 1}/{Math.ceil((hexData.total_size || 1) / pageSize)}
            {editMode && <span className="text-red-400 ml-2">● EDIT</span>}
          </span>
        </div>
      )}
    </div>
  );
}
