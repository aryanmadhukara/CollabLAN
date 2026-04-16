import { motion } from 'framer-motion';
import { Download, Layers3, Sparkles, Users, Wifi, Zap } from 'lucide-react';
import Whiteboard from './Whiteboard';
import CodeEditorPanel from './CodeEditorPanel';
import BottomLeftPanel from './BottomLeftPanel';
import ProgressTracker from './ProgressTracker';
import ConnectionStatus from './ConnectionStatus';
import { PeerProvider } from '@/lib/peer-sync';

export default function CollabLANApp() {
  return (
    <PeerProvider>
      <div className="dashboard-shell">
        <div className="relative z-10 flex min-h-screen flex-col px-4 py-4 sm:px-6 sm:py-6">
          <motion.header
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            className="mx-auto flex w-full max-w-[1600px] flex-col items-start justify-between gap-4 rounded-[1.75rem] border border-white/10 bg-white/5 px-4 py-4 shadow-[0_30px_80px_rgba(3,8,20,0.26)] backdrop-blur-xl sm:px-6 lg:flex-row"
          >
            <div className="max-w-3xl">
              <div className="hero-chip">
                <Sparkles size={14} />
                Offline-first team workspace
              </div>

              <div className="mt-4 flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-neon/10 neon-glow">
                  <Zap size={22} className="text-neon" />
                </div>
                <div>
                  <h1 className="font-display text-2xl font-semibold tracking-tight text-white sm:text-3xl">
                    <span className="neon-text">Collab</span>LAN
                  </h1>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Whiteboard, code, chat, files, and task tracking in one cinematic workspace.
                  </p>
                </div>
              </div>

              <div className="mt-6 flex flex-wrap gap-3">
                <div className="metric-pill">
                  <span className="metric-value">4</span>
                  <span className="metric-label">Realtime collaboration zones</span>
                </div>
                <div className="metric-pill">
                  <span className="metric-value">P2P</span>
                  <span className="metric-label">LAN sync without cloud dependency</span>
                </div>
                <div className="metric-pill">
                  <span className="metric-value">AI</span>
                  <span className="metric-label">Browser-side code help and guidance</span>
                </div>
              </div>
            </div>

            <div className="flex w-full shrink-0 flex-col gap-3 lg:min-w-[330px] lg:max-w-[360px]">
              <div className="grid grid-cols-2 gap-3">
                <div className="metric-pill min-w-0">
                  <span className="section-label">Mode</span>
                  <div className="mt-1 flex items-center gap-2 text-sm text-white">
                    <Layers3 size={14} className="text-neon" />
                    Workspace View
                  </div>
                </div>
                <div className="metric-pill min-w-0">
                  <span className="section-label">Network</span>
                  <div className="mt-1 flex items-center gap-2 text-sm text-white">
                    <Wifi size={14} className="text-neon" />
                    Local Sync
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-end gap-2">
                <button className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-medium text-muted-foreground transition-all hover:-translate-y-0.5 hover:bg-white/10 hover:text-white">
                  <Download size={14} />
                  Export
                </button>
                <div className="rounded-full border border-white/10 bg-white/5 p-1.5">
                  <ConnectionStatus />
                </div>
              </div>

              <div className="rounded-[1.4rem] border border-white/10 bg-[linear-gradient(135deg,rgba(31,211,198,0.16),rgba(255,255,255,0.04))] p-4">
                <div className="section-label">Session Pulse</div>
                <div className="mt-2 flex items-center gap-2 text-sm text-white">
                  <Users size={15} className="text-neon" />
                  Ready for live edits, handoff notes, and shared file drops
                </div>
              </div>
            </div>
          </motion.header>

          <div className="mx-auto mt-4 flex w-full max-w-[1600px] flex-1 min-h-0">
            <div className="dashboard-grid grid-cols-1 xl:grid-cols-12 auto-rows-fr w-full min-h-0">
              <motion.div
                initial={{ opacity: 0, scale: 0.98, y: 8 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.35, delay: 0.1 }}
                className="min-h-[340px] xl:col-span-7 xl:row-span-2"
              >
                <Whiteboard />
              </motion.div>

              <motion.div
                initial={{ opacity: 0, scale: 0.98, y: 8 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.35, delay: 0.16 }}
                className="min-h-[340px] xl:col-span-5"
              >
                <CodeEditorPanel />
              </motion.div>

              <motion.div
                initial={{ opacity: 0, scale: 0.98, y: 8 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.35, delay: 0.22 }}
                className="min-h-[300px] xl:col-span-5"
              >
                <ProgressTracker />
              </motion.div>

              <motion.div
                initial={{ opacity: 0, scale: 0.98, y: 8 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.35, delay: 0.28 }}
                className="min-h-[300px] xl:col-span-7"
              >
                <BottomLeftPanel />
              </motion.div>
            </div>
          </div>

          <motion.footer
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.55 }}
            className="mx-auto mt-4 flex w-full max-w-[1600px] flex-col items-start justify-between gap-1 rounded-[1.4rem] border border-white/8 bg-white/4 px-4 py-3 text-[11px] text-muted-foreground backdrop-blur-md sm:flex-row sm:items-center sm:px-5"
          >
            <span>Diva Coders • Aryan M • Krishitha CS • Devika Mourya</span>
            <span>TechFlix 2026 • WebRTC P2P + WebLLM AI</span>
          </motion.footer>
        </div>
      </div>
    </PeerProvider>
  );
}
