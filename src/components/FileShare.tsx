import { useState, useCallback, useEffect } from 'react';
import { Upload, FileText, Image, FileCode, Download } from 'lucide-react';
import { v4 as uuid } from 'uuid';
import { motion, AnimatePresence } from 'framer-motion';
import { usePeerSync, type SyncMessage } from '@/lib/peer-sync';

interface SharedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  url: string;
  sender: string;
  timestamp: number;
}

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getFileIcon(type: string) {
  if (type.startsWith('image/')) return Image;
  if (type.includes('javascript') || type.includes('python') || type.includes('html') || type.includes('css')) return FileCode;
  return FileText;
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function base64ToBlob(b64: string, type: string): Blob {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new Blob([bytes], { type });
}

export default function FileShare() {
  const [files, setFiles] = useState<SharedFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const { broadcast, subscribe, currentUser } = usePeerSync();

  // Listen for remote file shares
  useEffect(() => {
    return subscribe((msg: SyncMessage) => {
      if (msg.type === 'file-share') {
        const { id, name, size, type, data, sender, timestamp } = msg.payload;
        // Convert base64 back to blob URL
        const blob = base64ToBlob(data, type);
        const url = URL.createObjectURL(blob);
        setFiles(prev => {
          if (prev.some(f => f.id === id)) return prev;
          return [...prev, { id, name, size, type, url, sender, timestamp }];
        });
      }
    });
  }, [subscribe]);

  const addFiles = useCallback((fileList: FileList) => {
    Array.from(fileList).forEach(async file => {
      const url = URL.createObjectURL(file);
      const id = uuid();
      const fileEntry: SharedFile = {
        id,
        name: file.name,
        size: file.size,
        type: file.type,
        url,
        sender: currentUser.name,
        timestamp: Date.now(),
      };
      setFiles(prev => [...prev, fileEntry]);

      // Send file data via P2P (convert to base64 for transport)
      try {
        const buffer = await file.arrayBuffer();
        const b64 = arrayBufferToBase64(buffer);
        broadcast({
          type: 'file-share',
          payload: {
            id,
            name: file.name,
            size: file.size,
            type: file.type,
            data: b64,
            sender: currentUser.name,
            timestamp: Date.now(),
          },
        });
      } catch (err) {
        console.warn('Failed to broadcast file:', err);
      }
    });
  }, [broadcast, currentUser.name]);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files.length) addFiles(e.dataTransfer.files);
  };

  return (
    <div className="flex flex-col h-full">
      <div
        className={`glass-input mx-3 mt-3 mb-2 cursor-pointer rounded-[1.35rem] border-2 border-dashed p-5 text-center transition-all duration-200 ${
          isDragging ? 'border-neon bg-neon-muted shadow-[0_0_32px_rgba(31,211,198,0.16)]' : 'border-white/10 hover:border-white/20'
        }`}
        onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => {
          const input = document.createElement('input');
          input.type = 'file';
          input.multiple = true;
          input.onchange = () => input.files && addFiles(input.files);
          input.click();
        }}
      >
        <Upload size={20} className="mx-auto mb-2 text-neon" />
        <p className="text-sm text-foreground">Drop files here or click to browse</p>
        <p className="mt-1 text-xs text-muted-foreground">Images, docs, snippets, and assets sync directly to connected peers.</p>
      </div>

      <div className="flex-1 overflow-y-auto px-3 pb-3 space-y-1.5">
        <AnimatePresence>
          {files.map(file => {
            const Icon = getFileIcon(file.type);
            return (
              <motion.div
                key={file.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="glass-input flex items-center gap-2 rounded-2xl px-3 py-2.5 group"
              >
                <Icon size={16} className="text-neon shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium truncate">{file.name}</p>
                  <p className="text-[10px] text-muted-foreground">
                    {formatSize(file.size)}
                    {file.sender && ` · from ${file.sender}`}
                  </p>
                </div>
                <a
                  href={file.url}
                  download={file.name}
                  className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-neon transition-all"
                >
                  <Download size={14} />
                </a>
              </motion.div>
            );
          })}
        </AnimatePresence>
        {files.length === 0 && (
          <p className="text-xs text-muted-foreground text-center py-4">No files shared yet</p>
        )}
      </div>
    </div>
  );
}
