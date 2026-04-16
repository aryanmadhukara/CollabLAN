import { useMemo, useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { motion } from 'framer-motion';
import { ChevronDown, Download, Layers3, LogOut, Sparkles, UserRound, Users, Wifi, Zap } from 'lucide-react';
import Whiteboard from './Whiteboard';
import CodeEditorPanel from './CodeEditorPanel';
import BottomLeftPanel from './BottomLeftPanel';
import ProgressTracker from './ProgressTracker';
import ConnectionStatus from './ConnectionStatus';
import { PeerProvider } from '@/lib/peer-sync';
import { clearStoredAuthToken, getStoredAuthProfile } from '@/lib/auth';

export default function CollabLANApp() {
  const navigate = useNavigate();
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);
  const profile = useMemo(() => getStoredAuthProfile(), []);
  const displayName = profile?.name || profile?.email || 'My Account';

  async function handleLogout() {
    clearStoredAuthToken();
    setIsAccountMenuOpen(false);
    await navigate({
      to: '/login',
      replace: true,
    });
  }

  return (
    <PeerProvider>
      <div className="dashboard-shell">
        <div className="pixel-moon left-[7%] top-[5%] hidden lg:block" />
        <div className="pixel-star right-[14%] top-[8%] hidden lg:block" />
        <div className="pixel-cloud left-[28%] top-[10%] hidden xl:block" />
        <div className="pixel-cloud right-[22%] top-[19%] hidden xl:block" />
        <div className="relative z-10 flex min-h-screen flex-col px-4 py-4 sm:px-6 sm:py-6">
          <motion.header
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            className="pixel-window mx-auto flex w-full max-w-[1600px] flex-col items-start justify-between gap-4 px-4 py-4 sm:px-6 lg:flex-row"
          >
            <div className="max-w-3xl">
              <div className="hero-chip">
                <Sparkles size={14} />
                Press Start To Collaborate
              </div>

              <div className="mt-4 flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center bg-[#ffe55c] neon-glow">
                  <Zap size={22} className="text-neon" />
                </div>
                <div>
                  <h1 className="pixel-heading text-xl text-white sm:text-2xl">
                    <span className="neon-text">Collab</span>LAN
                  </h1>
                  <p className="mt-3 max-w-2xl text-[1.1rem] leading-5 text-[#d4efff]">
                    Build together in a cozy retro world with shared code, chat, tasks, whiteboard notes, and offline AI help.
                  </p>
                </div>
              </div>

              <div className="mt-6 flex flex-wrap gap-3">
                <div className="metric-pill">
                  <span className="metric-value">4 zones</span>
                  <span className="metric-label">Party screens for teamwork</span>
                </div>
                <div className="metric-pill">
                  <span className="metric-value">P2P sync</span>
                  <span className="metric-label">LAN play with no cloud</span>
                </div>
                <div className="metric-pill">
                  <span className="metric-value">AI guide</span>
                  <span className="metric-label">Browser side helper mode</span>
                </div>
              </div>
            </div>

            <div className="flex w-full shrink-0 flex-col gap-3 lg:min-w-[330px] lg:max-w-[360px]">
              <div className="flex justify-end">
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setIsAccountMenuOpen(prev => !prev)}
                    className="pixel-button flex items-center gap-2 px-3 py-2 text-[0.5rem] transition-all"
                  >
                    <UserRound size={14} />
                    <span className="max-w-[140px] truncate">{displayName}</span>
                    <ChevronDown size={14} className={isAccountMenuOpen ? 'rotate-180 transition-transform' : 'transition-transform'} />
                  </button>

                  {isAccountMenuOpen && (
                    <div className="pixel-window absolute right-0 top-full z-20 mt-3 min-w-[220px] p-3">
                      <div className="section-label">Account</div>
                      <div className="mt-2 text-[1rem] text-[#dff7ff]">{displayName}</div>
                      {profile?.email && (
                        <div className="text-[0.95rem] text-[#a9d6f5]">{profile.email}</div>
                      )}
                      <button
                        type="button"
                        onClick={() => void handleLogout()}
                        className="mt-3 flex w-full items-center justify-center gap-2 border-4 border-[#0f1736] bg-[#ffe55c] px-3 py-2 font-display text-[0.5rem] uppercase text-[#1d2c58] shadow-[4px_4px_0_#ff5438] transition-all hover:-translate-x-[1px] hover:-translate-y-[1px]"
                      >
                        <LogOut size={14} />
                        Log Out
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="metric-pill min-w-0">
                  <span className="section-label">Mode</span>
                  <div className="mt-1 flex items-center gap-2 text-[1rem] text-[#17244d]">
                    <Layers3 size={14} className="text-neon" />
                    Pixel Lobby
                  </div>
                </div>
                <div className="metric-pill min-w-0">
                  <span className="section-label">Network</span>
                  <div className="mt-1 flex items-center gap-2 text-[1rem] text-[#17244d]">
                    <Wifi size={14} className="text-neon" />
                    LAN Ready
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-end gap-2">
                <button className="pixel-button flex items-center gap-2 px-4 py-3 text-[0.55rem] transition-all">
                  <Download size={14} />
                  Start
                </button>
                <div className="pixel-window p-1.5">
                  <ConnectionStatus />
                </div>
              </div>

              <div className="pixel-window p-4">
                <div className="section-label">Session Pulse</div>
                <div className="mt-2 flex items-center gap-2 text-[1rem] text-[#dff7ff]">
                  <Users size={15} className="text-neon" />
                  Team is ready for quests, handoffs, and live edits
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
                className="min-h-[340px] xl:col-span-5"
              >
                <Whiteboard />
              </motion.div>

              <motion.div
                initial={{ opacity: 0, scale: 0.98, y: 8 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.35, delay: 0.16 }}
                className="min-h-[340px] xl:col-span-7 xl:row-span-2"
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
            className="pixel-window mx-auto mt-4 flex w-full max-w-[1600px] flex-col items-start justify-between gap-1 px-4 py-3 text-[1rem] text-[#d8f6ff] sm:flex-row sm:items-center sm:px-5"
          >
            <span>Diva Coders • Aryan M • Krishitha CS • Devika Mourya</span>
            <span>TechFlix 2026 • WebRTC P2P + WebLLM AI</span>
          </motion.footer>
        </div>
      </div>
    </PeerProvider>
  );
}
