import { createContext, useContext, useState, useEffect, useCallback, useRef, type ReactNode } from 'react';
import Peer, { type DataConnection } from 'peerjs';
import { v4 as uuid } from 'uuid';

// Message types for P2P sync
export type SyncMessage =
  | { type: 'whiteboard-action'; payload: unknown }
  | { type: 'whiteboard-clear' }
  | { type: 'whiteboard-undo' }
  | { type: 'code-update'; payload: { language: string; code: string } }
  | { type: 'chat-message'; payload: unknown }
  | { type: 'task-update'; payload: unknown }
  | { type: 'task-delete'; payload: { id: string } }
  | { type: 'file-share'; payload: { id: string; name: string; size: number; type: string; data: string; sender: string; timestamp: number } }
  | { type: 'cursor-move'; payload: { user: string; x: number; y: number; panel: string } }
  | { type: 'peer-info'; payload: { name: string; color: string } }
  | { type: 'sync-request'; payload: { requestType: string } }
  | { type: 'full-sync'; payload: unknown };

type MessageHandler = (msg: SyncMessage, peerId: string) => void;

interface PeerContextType {
  peerId: string | null;
  roomId: string;
  connections: Map<string, { conn: DataConnection; name: string; color: string }>;
  peerCount: number;
  isConnected: boolean;
  broadcast: (msg: SyncMessage) => void;
  joinRoom: (targetPeerId: string) => void;
  subscribe: (handler: MessageHandler) => () => void;
  currentUser: { name: string; color: string };
}

const PeerContext = createContext<PeerContextType | null>(null);

const TEAMMATES = [
  { name: 'Aryan M', color: 'var(--teammate-aryan)', initials: 'AM' },
  { name: 'Krishitha CS', color: 'var(--teammate-krishitha)', initials: 'KC' },
  { name: 'Devika Mourya', color: 'var(--teammate-devika)', initials: 'DM' },
];

export function PeerProvider({ children }: { children: ReactNode }) {
  const [peerId, setPeerId] = useState<string | null>(null);
  const [roomId] = useState(() => {
    const stored = sessionStorage.getItem('collablan-room');
    if (stored) return stored;
    const id = 'COLLAB-' + uuid().slice(0, 4).toUpperCase();
    sessionStorage.setItem('collablan-room', id);
    return id;
  });
  const [connections, setConnections] = useState<Map<string, { conn: DataConnection; name: string; color: string }>>(new Map());
  const [isConnected, setIsConnected] = useState(false);

  const peerRef = useRef<Peer | null>(null);
  const handlersRef = useRef<Set<MessageHandler>>(new Set());
  const connectionsRef = useRef(connections);
  connectionsRef.current = connections;

  // Pick a random user identity for this session
  const [currentUser] = useState(() => {
    const idx = Math.floor(Math.random() * TEAMMATES.length);
    return TEAMMATES[idx];
  });

  const handleMessage = useCallback((msg: SyncMessage, fromPeerId: string) => {
    handlersRef.current.forEach(handler => handler(msg, fromPeerId));
  }, []);

  const setupConnection = useCallback((conn: DataConnection) => {
    conn.on('open', () => {
      // Send our identity
      conn.send({ type: 'peer-info', payload: { name: currentUser.name, color: currentUser.color } });

      setConnections(prev => {
        const next = new Map(prev);
        next.set(conn.peer, { conn, name: 'Unknown', color: '#888' });
        return next;
      });
    });

    conn.on('data', (data) => {
      const msg = data as SyncMessage;
      if (msg.type === 'peer-info') {
        setConnections(prev => {
          const next = new Map(prev);
          const existing = next.get(conn.peer);
          if (existing) {
            next.set(conn.peer, { ...existing, name: msg.payload.name, color: msg.payload.color });
          }
          return next;
        });
        return;
      }
      handleMessage(msg, conn.peer);
    });

    conn.on('close', () => {
      setConnections(prev => {
        const next = new Map(prev);
        next.delete(conn.peer);
        return next;
      });
    });

    conn.on('error', (err) => {
      console.warn('[PeerSync] Connection error:', err);
    });
  }, [currentUser, handleMessage]);

  // Initialize PeerJS
  useEffect(() => {
    const peerIdLocal = `collablan-${uuid().slice(0, 8)}`;
    const peer = new Peer(peerIdLocal, {
      // Use PeerJS default cloud server for signaling
      // Data flows directly P2P after connection is established
      debug: 1,
    });

    peer.on('open', (id) => {
      setPeerId(id);
      setIsConnected(true);
      console.log('[PeerSync] My peer ID:', id);
    });

    peer.on('connection', (conn) => {
      console.log('[PeerSync] Incoming connection from:', conn.peer);
      setupConnection(conn);
    });

    peer.on('error', (err) => {
      console.error('[PeerSync] Peer error:', err);
      if (err.type === 'unavailable-id') {
        // Retry with new ID
        console.log('[PeerSync] Retrying with new ID...');
      }
    });

    peer.on('disconnected', () => {
      setIsConnected(false);
      // Try to reconnect
      if (!peer.destroyed) {
        peer.reconnect();
      }
    });

    peerRef.current = peer;

    return () => {
      peer.destroy();
    };
  }, [setupConnection]);

  const broadcast = useCallback((msg: SyncMessage) => {
    connectionsRef.current.forEach(({ conn }) => {
      if (conn.open) {
        try {
          conn.send(msg);
        } catch (e) {
          console.warn('[PeerSync] Failed to send:', e);
        }
      }
    });
  }, []);

  const joinRoom = useCallback((targetPeerId: string) => {
    const peer = peerRef.current;
    if (!peer || !peer.open) {
      console.warn('[PeerSync] Peer not ready');
      return;
    }
    if (connectionsRef.current.has(targetPeerId)) {
      console.warn('[PeerSync] Already connected to', targetPeerId);
      return;
    }
    console.log('[PeerSync] Connecting to:', targetPeerId);
    const conn = peer.connect(targetPeerId, { reliable: true });
    setupConnection(conn);
  }, [setupConnection]);

  const subscribe = useCallback((handler: MessageHandler) => {
    handlersRef.current.add(handler);
    return () => { handlersRef.current.delete(handler); };
  }, []);

  return (
    <PeerContext.Provider value={{
      peerId,
      roomId,
      connections,
      peerCount: connections.size + 1,
      isConnected,
      broadcast,
      joinRoom,
      subscribe,
      currentUser,
    }}>
      {children}
    </PeerContext.Provider>
  );
}

export function usePeerSync() {
  const ctx = useContext(PeerContext);
  if (!ctx) throw new Error('usePeerSync must be used within PeerProvider');
  return ctx;
}
