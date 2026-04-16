import { useState, useEffect } from 'react';
import { Wifi, Users, Copy, Check, Link2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePeerSync } from '@/lib/peer-sync';

export default function ConnectionStatus() {
  const { peerId, roomId, connections, peerCount, isConnected, joinRoom } = usePeerSync();
  const [showPanel, setShowPanel] = useState(false);
  const [copied, setCopied] = useState(false);
  const [joinId, setJoinId] = useState('');

  const copyPeerId = () => {
    if (peerId) {
      navigator.clipboard.writeText(peerId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleJoin = () => {
    if (joinId.trim()) {
      joinRoom(joinId.trim());
      setJoinId('');
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setShowPanel(!showPanel)}
        className="flex items-center gap-2 border-[3px] border-[#0f1736] bg-[#273f6c] px-3 py-1.5 text-[#fef3a2] shadow-[3px_3px_0_#0f1736] transition-all hover:-translate-x-[1px] hover:-translate-y-[1px]"
      >
        <div className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-neon shadow-[0_0_6px_var(--color-neon)]' : 'bg-destructive'}`} />
        <span className="text-xs text-[#fef3a2]">
          {isConnected ? 'P2P Ready' : 'Connecting...'}
        </span>
        <Users size={14} className="text-[#fef3a2]" />
        <span className="text-xs font-mono text-neon">{peerCount}</span>
      </button>

      <AnimatePresence>
        {showPanel && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="pixel-window absolute right-0 top-full z-50 mt-2 w-80 p-4"
          >
            <div className="flex items-center gap-2 mb-3">
              <Wifi size={16} className="text-neon" />
              <span className="text-sm font-medium">P2P Network</span>
              <span className={`ml-auto text-[10px] px-1.5 py-0.5 rounded-full ${isConnected ? 'bg-neon-muted text-neon' : 'bg-destructive/20 text-destructive'}`}>
                {isConnected ? 'Online' : 'Offline'}
              </span>
            </div>

            {/* My Peer ID */}
            <div className="glass-input mb-3 rounded-2xl px-3 py-2.5">
              <p className="text-[10px] text-muted-foreground mb-1">My Peer ID (share this):</p>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-mono text-neon flex-1 truncate">{peerId || '...'}</span>
                <button onClick={copyPeerId} className="text-muted-foreground hover:text-neon transition-colors shrink-0">
                  {copied ? <Check size={14} /> : <Copy size={14} />}
                </button>
              </div>
            </div>

            {/* Join a Peer */}
            <div className="glass-input mb-3 rounded-2xl px-3 py-2.5">
              <p className="text-[10px] text-muted-foreground mb-1">Connect to teammate:</p>
              <div className="flex items-center gap-2">
                <input
                  value={joinId}
                  onChange={e => setJoinId(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleJoin()}
                  placeholder="Paste peer ID..."
                  className="flex-1 rounded-xl border border-white/8 bg-white/6 px-2 py-1.5 text-[11px] font-mono text-foreground placeholder:text-muted-foreground outline-none"
                />
                <button
                  onClick={handleJoin}
                  disabled={!joinId.trim()}
                  className="text-neon disabled:text-muted-foreground hover:scale-110 transition-all"
                >
                  <Link2 size={14} />
                </button>
              </div>
            </div>

            {/* Connected Peers */}
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2">
              Connected Peers ({connections.size})
            </p>
            <div className="space-y-1.5 max-h-32 overflow-y-auto">
              {Array.from(connections.entries()).map(([id, { name, color }]) => (
                <div key={id} className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-accent/30 transition-colors">
                  <div
                    className="w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold shrink-0"
                    style={{ backgroundColor: color, color: 'var(--background)' }}
                  >
                    {name[0]}
                  </div>
                  <span className="text-xs truncate">{name}</span>
                  <div className="status-dot ml-auto" />
                </div>
              ))}
              {connections.size === 0 && (
                <p className="text-[10px] text-muted-foreground text-center py-2">
                  No peers yet. Share your Peer ID!
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
