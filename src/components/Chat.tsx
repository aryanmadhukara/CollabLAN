import { useState, useEffect, useRef } from 'react';
import { MessageCircle, Send } from 'lucide-react';
import { v4 as uuid } from 'uuid';
import { saveMessage, getMessages } from '@/lib/indexeddb';
import { motion, AnimatePresence } from 'framer-motion';
import { usePeerSync, type SyncMessage } from '@/lib/peer-sync';

interface Message {
  id: string;
  sender: string;
  text: string;
  timestamp: number;
  color: string;
}

export default function Chat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);
  const { broadcast, subscribe, currentUser } = usePeerSync();

  useEffect(() => {
    getMessages().then(msgs => setMessages(msgs));
  }, []);

  // Listen for remote chat messages
  useEffect(() => {
    return subscribe((msg: SyncMessage) => {
      if (msg.type === 'chat-message') {
        const chatMsg = msg.payload as Message;
        setMessages(prev => {
          if (prev.some(m => m.id === chatMsg.id)) return prev;
          return [...prev, chatMsg];
        });
        saveMessage(chatMsg);
      }
    });
  }, [subscribe]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const send = async () => {
    if (!input.trim()) return;
    const msg: Message = {
      id: uuid(),
      sender: currentUser.name,
      text: input.trim(),
      timestamp: Date.now(),
      color: currentUser.color,
    };
    setMessages(prev => [...prev, msg]);
    setInput('');
    await saveMessage(msg);
    broadcast({ type: 'chat-message', payload: msg });
  };

  const formatTime = (ts: number) => {
    const d = new Date(ts);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {messages.length === 0 && (
          <div className="glass-input rounded-2xl p-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-2 text-foreground">
              <MessageCircle size={15} className="text-neon" />
              Team chat is ready
            </div>
            <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
              Send quick updates, blockers, or handoff notes to everyone connected on the LAN session.
            </p>
          </div>
        )}
        <AnimatePresence initial={false}>
          {messages.map(msg => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className="group"
            >
              <div className="flex items-start gap-2">
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-semibold shrink-0 mt-0.5"
                  style={{ backgroundColor: msg.color, color: 'var(--background)' }}
                >
                  {msg.sender[0]}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline gap-2">
                    <span className="text-xs font-medium" style={{ color: msg.color }}>
                      {msg.sender}
                    </span>
                    <span className="text-[10px] text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                      {formatTime(msg.timestamp)}
                    </span>
                  </div>
                  <div className="mt-1 rounded-2xl border border-white/6 bg-white/4 px-3 py-2.5">
                    <p className="text-sm text-foreground/90 leading-relaxed break-words">
                      {msg.text}
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        <div ref={bottomRef} />
      </div>
      <div className="border-t border-white/8 p-3">
        <div className="glass-input flex items-center gap-2 rounded-2xl px-3 py-2.5">
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && send()}
            placeholder="Type a message..."
            className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
          />
          <button
            onClick={send}
            disabled={!input.trim()}
            className="text-neon disabled:text-muted-foreground transition-colors hover:scale-110 active:scale-95"
          >
            <Send size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
