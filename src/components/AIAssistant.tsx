import { useEffect, useMemo, useRef, useState } from 'react';
import { Bot, Loader2, Send, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getMessages, getTasks } from '@/lib/indexeddb';
import { chatWithWorkspaceAssistant, ensureWebLLMReady, isModelLoaded } from '@/lib/webllm';
import { usePeerSync } from '@/lib/peer-sync';

type AssistantMessage = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
};

type PromptSuggestion = {
  id: string;
  label: string;
  prompt: string;
};

const SUGGESTIONS: PromptSuggestion[] = [
  {
    id: 'standup',
    label: 'Daily standup',
    prompt: 'Give me a short standup update based on the current tasks and recent team messages.',
  },
  {
    id: 'next-step',
    label: 'Next steps',
    prompt: 'What should this team work on next based on the current task board?',
  },
  {
    id: 'handoff',
    label: 'Handoff notes',
    prompt: 'Create a clean handoff note for the next teammate taking over this workspace.',
  },
];

export default function AIAssistant() {
  const { currentUser, peerCount } = usePeerSync();
  const [prompt, setPrompt] = useState('');
  const [messages, setMessages] = useState<AssistantMessage[]>([
    {
      id: crypto.randomUUID(),
      role: 'assistant',
      content:
        'I can help with standups, task summaries, planning, debugging ideas, and team handoff notes using the local workspace context.',
    },
  ]);
  const [status, setStatus] = useState('');
  const [progress, setProgress] = useState(0);
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const history = useMemo(
    () =>
      messages
        .filter(message => message.role !== 'assistant' || message.content.trim())
        .slice(-6)
        .map(message => ({
          role: message.role,
          content: message.content,
        })),
    [messages],
  );

  const askAssistant = async (nextPrompt?: string) => {
    const content = (nextPrompt ?? prompt).trim();
    if (!content || loading) return;

    const userMessage: AssistantMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content,
    };

    setMessages(prev => [...prev, userMessage]);
    setPrompt('');
    setLoading(true);
    setStatus(isModelLoaded() ? 'Thinking...' : 'Loading offline model...');
    setProgress(0);

    try {
      const ready = await ensureWebLLMReady((nextProgress, nextStatus) => {
        setProgress(nextProgress);
        setStatus(nextStatus);
      });

      if (!ready) {
        setMessages(prev => [
          ...prev,
          {
            id: crypto.randomUUID(),
            role: 'assistant',
            content:
              'Offline AI needs WebGPU support in this browser. Open the app in a recent Chrome or Edge build with WebGPU enabled.',
          },
        ]);
        return;
      }

      setStatus('Thinking...');

      const [recentMessages, tasks] = await Promise.all([getMessages(), getTasks()]);
      const reply = await chatWithWorkspaceAssistant({
        prompt: content,
        recentMessages,
        tasks,
        currentUser,
        peerCount,
        history,
      });

      setMessages(prev => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: reply,
        },
      ]);
    } catch (error) {
      setMessages(prev => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: `I hit an error while generating a reply: ${error instanceof Error ? error.message : 'Unknown error'}`,
        },
      ]);
    } finally {
      setLoading(false);
      setStatus('');
    }
  };

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-white/8 px-3 py-3">
        <div className="glass-input rounded-2xl p-3">
          <div className="flex items-center gap-2 text-sm text-white">
            <Bot size={15} className="text-neon" />
            AI Assistant
          </div>
          <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
            Runs locally in the browser and uses your stored tasks plus recent team chat as context.
          </p>
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          {SUGGESTIONS.map(suggestion => (
            <button
              key={suggestion.id}
              onClick={() => askAssistant(suggestion.prompt)}
              disabled={loading}
              className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-muted-foreground transition-all hover:border-neon/25 hover:text-white disabled:opacity-50"
            >
              {suggestion.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        <AnimatePresence initial={false}>
          {messages.map(message => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className={message.role === 'user' ? 'ml-8' : 'mr-8'}
            >
              <div className="mb-1 flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                {message.role === 'assistant' ? (
                  <>
                    <Sparkles size={12} className="text-neon" />
                    Assistant
                  </>
                ) : (
                  <>You</>
                )}
              </div>
              <div
                className={`rounded-2xl px-3 py-2.5 text-sm leading-relaxed ${
                  message.role === 'assistant'
                    ? 'glass-input text-foreground'
                    : 'bg-neon-muted text-foreground border border-neon/20'
                }`}
              >
                <p className="whitespace-pre-wrap break-words">{message.content}</p>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {loading && (
          <div className="glass-input rounded-2xl p-3">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Loader2 size={14} className="animate-spin text-neon" />
              <span>{status || 'Working...'}</span>
            </div>
            {progress > 0 && progress < 1 && (
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/8">
                <div
                  className="h-full rounded-full bg-[linear-gradient(90deg,rgba(31,211,198,0.7),rgba(255,154,92,0.9))] transition-all duration-300"
                  style={{ width: `${progress * 100}%` }}
                />
              </div>
            )}
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      <div className="border-t border-white/8 p-3">
        <div className="glass-input rounded-2xl p-2">
          <textarea
            value={prompt}
            onChange={event => setPrompt(event.target.value)}
            onKeyDown={event => {
              if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault();
                askAssistant();
              }
            }}
            rows={3}
            placeholder="Ask for planning help, a task summary, debugging ideas, or handoff notes..."
            className="w-full resize-none bg-transparent px-2 py-1 text-sm text-foreground placeholder:text-muted-foreground outline-none"
          />
          <div className="flex items-center justify-between px-2 pb-1 pt-2">
            <span className="text-[11px] text-muted-foreground">
              {isModelLoaded() ? 'Offline model ready' : 'Model loads on first request'}
            </span>
            <button
              onClick={() => askAssistant()}
              disabled={!prompt.trim() || loading}
              className="inline-flex items-center gap-2 rounded-full bg-neon px-3 py-1.5 text-xs font-semibold text-neon-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              <Send size={13} />
              Ask
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
