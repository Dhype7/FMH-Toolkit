import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion, AnimatePresence } from 'framer-motion';
import { HiOutlineCloudUpload, HiOutlineX, HiOutlineDocument } from 'react-icons/hi';

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  accept?: Record<string, string[]>;
  label?: string;
  maxSize?: number;
}

export default function FileUpload({ onFileSelect, accept, label, maxSize = 100 * 1024 * 1024 }: FileUploadProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles.length > 0) {
        setSelectedFile(acceptedFiles[0]);
        onFileSelect(acceptedFiles[0]);
      }
    },
    [onFileSelect]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept,
    maxSize,
    multiple: false,
  });

  const clearFile = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedFile(null);
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div
      {...getRootProps()}
      className={`cyber-dropzone group ${isDragActive ? 'active' : ''}`}
    >
      <input {...getInputProps()} />
      <AnimatePresence mode="wait">
        {selectedFile ? (
          <motion.div
            key="file"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="flex flex-col items-center gap-2"
          >
            <div className="relative">
              <HiOutlineDocument className="text-4xl text-cyber-accent" />
              <button
                onClick={clearFile}
                className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-cyber-danger flex items-center justify-center hover:scale-110 transition-transform"
              >
                <HiOutlineX className="text-xs text-white" />
              </button>
            </div>
            <p className="font-mono text-sm text-cyber-text">{selectedFile.name}</p>
            <span className="cyber-badge-green">{formatSize(selectedFile.size)}</span>
          </motion.div>
        ) : (
          <motion.div
            key="empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center gap-3"
          >
            <motion.div
              animate={{
                y: isDragActive ? -5 : 0,
                scale: isDragActive ? 1.1 : 1,
              }}
              transition={{ type: 'spring', stiffness: 300 }}
            >
              <HiOutlineCloudUpload
                className={`text-4xl transition-colors duration-300 ${
                  isDragActive ? 'text-cyber-primary' : 'text-cyber-text-dim group-hover:text-cyber-primary'
                }`}
              />
            </motion.div>
            <div>
              <p className="font-mono text-sm text-cyber-text-dim">
                {isDragActive ? (
                  <span className="text-cyber-primary">Drop file here...</span>
                ) : (
                  label || 'Drag & drop a file or click to browse'
                )}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
