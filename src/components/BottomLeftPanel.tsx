import { useState } from 'react';
import { Bot, FolderOpen, MessageCircle } from 'lucide-react';
import Chat from './Chat';
import FileShare from './FileShare';
import AIAssistant from './AIAssistant';

export default function BottomLeftPanel() {
  const [tab, setTab] = useState<'chat' | 'assistant' | 'files'>('chat');

  return (
    <div className="panel-card h-full">
      <div className="panel-header">
        <button
          onClick={() => setTab('chat')}
          className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-all ${
            tab === 'chat'
              ? 'bg-neon-muted text-[#1d1d1d] border border-neon/20 shadow-[0_0_24px_rgba(31,211,198,0.14)]'
              : 'border border-transparent text-[#1d1d1d] hover:border-black/10 hover:text-black'
          }`}
        >
          <MessageCircle size={13} />
          Chat
        </button>
        <button
          onClick={() => setTab('assistant')}
          className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-all ${
            tab === 'assistant'
              ? 'bg-neon-muted text-[#1d1d1d] border border-neon/20 shadow-[0_0_24px_rgba(31,211,198,0.14)]'
              : 'border border-transparent text-[#1d1d1d] hover:border-black/10 hover:text-black'
          }`}
        >
          <Bot size={13} />
          AI
        </button>
        <button
          onClick={() => setTab('files')}
          className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-all ${
            tab === 'files'
              ? 'bg-neon-muted text-[#1d1d1d] border border-neon/20 shadow-[0_0_24px_rgba(31,211,198,0.14)]'
              : 'border border-transparent text-[#1d1d1d] hover:border-black/10 hover:text-black'
          }`}
        >
          <FolderOpen size={13} />
          Files
        </button>
        <span className="ml-auto section-label">
          {tab === 'chat' ? 'Team Chat' : tab === 'assistant' ? 'Offline Copilot' : 'Shared Assets'}
        </span>
      </div>
      <div className="panel-body">
        {tab === 'chat' ? <Chat /> : tab === 'assistant' ? <AIAssistant /> : <FileShare />}
      </div>
    </div>
  );
}
