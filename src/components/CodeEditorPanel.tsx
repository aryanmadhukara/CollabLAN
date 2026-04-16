import { useState, useEffect, useRef, lazy, Suspense, useCallback } from 'react';
import { Code2, ChevronDown, Sparkles, Loader2, X } from 'lucide-react';
import { usePeerSync, type SyncMessage } from '@/lib/peer-sync';
import { ensureWebLLMReady, explainCode, isModelLoaded } from '@/lib/webllm';
import { motion, AnimatePresence } from 'framer-motion';

const Editor = lazy(() => import('@monaco-editor/react').then(m => ({ default: m.default })));

const LANGUAGES = [
  { id: 'javascript', label: 'JavaScript' },
  { id: 'python', label: 'Python' },
  { id: 'html', label: 'HTML' },
  { id: 'css', label: 'CSS' },
  { id: 'typescript', label: 'TypeScript' },
];

const DEFAULT_CODE: Record<string, string> = {
  javascript: `// CollabLAN - Shared Code Editor\n// Start coding here...\n\nfunction greet(name) {\n  return \`Hello, \${name}! Welcome to CollabLAN 🚀\`;\n}\n\nconsole.log(greet("Team Diva Coders"));\n`,
  python: `# CollabLAN - Shared Code Editor\n# Start coding here...\n\ndef greet(name):\n    return f"Hello, {name}! Welcome to CollabLAN 🚀"\n\nprint(greet("Team Diva Coders"))\n`,
  html: `<!-- CollabLAN - Shared Code Editor -->\n<!DOCTYPE html>\n<html lang="en">\n<head>\n  <title>CollabLAN</title>\n</head>\n<body>\n  <h1>Hello from CollabLAN!</h1>\n</body>\n</html>`,
  css: `/* CollabLAN - Shared Code Editor */\nbody {\n  background: #0d1117;\n  color: #c9d1d9;\n  font-family: 'Inter', sans-serif;\n}`,
  typescript: `// CollabLAN - Shared Code Editor\ninterface Team {\n  name: string;\n  members: string[];\n}\n\nconst divaCoders: Team = {\n  name: "Diva Coders",\n  members: ["Aryan M", "Krishitha CS", "Devika Mourya"],\n};\n\nconsole.log(\`Team: \${divaCoders.name}\`);`,
};

export default function CodeEditorPanel() {
  const [language, setLanguage] = useState('javascript');
  const [code, setCode] = useState(DEFAULT_CODE);
  const [showLangMenu, setShowLangMenu] = useState(false);
  const { broadcast, subscribe } = usePeerSync();
  const isRemoteUpdate = useRef(false);

  // AI state
  const [showAI, setShowAI] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiExplanation, setAiExplanation] = useState('');
  const [aiProgress, setAiProgress] = useState(0);
  const [aiStatus, setAiStatus] = useState('');
  const editorRef = useRef<unknown>(null);

  // Listen for remote code updates
  useEffect(() => {
    return subscribe((msg: SyncMessage) => {
      if (msg.type === 'code-update') {
        isRemoteUpdate.current = true;
        setCode(prev => ({
          ...prev,
          [msg.payload.language]: msg.payload.code,
        }));
      }
    });
  }, [subscribe]);

  const handleCodeChange = useCallback((val: string | undefined) => {
    if (isRemoteUpdate.current) {
      isRemoteUpdate.current = false;
      return;
    }
    const newCode = val || '';
    setCode(prev => ({ ...prev, [language]: newCode }));
    broadcast({ type: 'code-update', payload: { language, code: newCode } });
  }, [language, broadcast]);

  const handleEditorMount = (editor: unknown) => {
    editorRef.current = editor;
  };

  const handleExplainCode = async () => {
    // Get selected text from editor
    const editor = editorRef.current as { getModel: () => { getValueInRange: (r: unknown) => string } | null; getSelection: () => unknown } | null;
    let selection = '';
    if (editor) {
      const model = editor.getModel();
      const sel = editor.getSelection();
      if (model && sel) {
        selection = model.getValueInRange(sel);
      }
    }
    const codeToExplain = selection || code[language] || '';
    if (!codeToExplain.trim()) return;

    setShowAI(true);
    setAiLoading(true);
    setAiExplanation('');

    try {
      if (!isModelLoaded()) {
        setAiStatus('Loading AI model (first time only)...');
        const ok = await ensureWebLLMReady((progress, status) => {
          setAiProgress(progress);
          setAiStatus(status);
        });
        if (!ok) {
          setAiExplanation('⚠️ WebGPU is not supported in this browser. Try Chrome 113+ or Edge 113+ for offline AI features.');
          setAiLoading(false);
          return;
        }
      }

      setAiStatus('Thinking...');
      const explanation = await explainCode(codeToExplain, language);
      setAiExplanation(explanation);
    } catch (err) {
      setAiExplanation(`Error: ${err instanceof Error ? err.message : 'Failed to explain code'}`);
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div className="panel-card h-full">
      <div className="panel-header">
        <Code2 className="panel-header-icon" />
        <span>Code Editor</span>
        <span className="section-label hidden sm:inline">Live Snippet Workspace</span>
        <div className="ml-auto flex items-center gap-1.5">
          <button
            onClick={handleExplainCode}
            className="flex items-center gap-1 rounded-full border border-neon/20 bg-neon-muted px-2.5 py-1.5 text-xs text-neon transition-colors hover:bg-neon/20"
            title="Explain code with offline AI"
          >
            <Sparkles size={12} />
            <span className="hidden sm:inline">AI Explain</span>
          </button>
          <div className="relative">
            <button
              onClick={() => setShowLangMenu(!showLangMenu)}
              className="flex items-center gap-1 rounded-full border border-white/8 bg-white/5 px-2.5 py-1.5 text-xs text-accent-foreground transition-colors hover:bg-surface-hover"
            >
              {LANGUAGES.find(l => l.id === language)?.label}
              <ChevronDown size={12} />
            </button>
            {showLangMenu && (
              <div className="absolute right-0 top-full z-50 mt-1 min-w-[120px] rounded-2xl border border-white/10 bg-[rgba(14,22,37,0.94)] py-1 shadow-lg backdrop-blur-xl">
                {LANGUAGES.map(l => (
                  <button
                    key={l.id}
                    onClick={() => { setLanguage(l.id); setShowLangMenu(false); }}
                    className={`w-full text-left px-3 py-1.5 text-xs hover:bg-accent transition-colors ${
                      language === l.id ? 'text-neon' : 'text-foreground'
                    }`}
                  >
                    {l.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      <div className="panel-body relative">
        <Suspense fallback={
          <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
            Loading editor...
          </div>
        }>
          <Editor
            height="100%"
            language={language}
            value={code[language] || ''}
            onChange={handleCodeChange}
            onMount={handleEditorMount}
            theme="vs-dark"
            options={{
              fontSize: 13,
              fontFamily: "'JetBrains Mono', 'SF Mono', monospace",
              minimap: { enabled: false },
              padding: { top: 12 },
              scrollBeyondLastLine: false,
              smoothScrolling: true,
              cursorBlinking: 'smooth',
              cursorSmoothCaretAnimation: 'on',
              renderLineHighlight: 'gutter',
              lineNumbers: 'on',
              automaticLayout: true,
              tabSize: 2,
              wordWrap: 'on',
            }}
          />
        </Suspense>

        {/* AI Explanation Panel */}
        <AnimatePresence>
          {showAI && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="absolute bottom-0 left-0 right-0 max-h-[50%] overflow-y-auto border-t border-white/8 bg-[rgba(10,17,29,0.94)] p-3 backdrop-blur-xl"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Sparkles size={14} className="text-neon" />
                  <span className="text-xs font-medium text-neon">AI Code Explainer</span>
                  {!isModelLoaded() && !aiLoading && (
                    <span className="text-[10px] text-muted-foreground">(Offline — runs in browser)</span>
                  )}
                </div>
                <button onClick={() => setShowAI(false)} className="text-muted-foreground hover:text-foreground">
                  <X size={14} />
                </button>
              </div>
              {aiLoading ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Loader2 size={14} className="animate-spin text-neon" />
                    <span>{aiStatus}</span>
                  </div>
                  {aiProgress > 0 && aiProgress < 1 && (
                    <div className="h-1 bg-accent rounded-full overflow-hidden">
                      <div
                        className="h-full bg-neon rounded-full transition-all duration-300"
                        style={{ width: `${aiProgress * 100}%` }}
                      />
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-sm text-foreground/90 leading-relaxed whitespace-pre-wrap">
                  {aiExplanation}
                </p>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
