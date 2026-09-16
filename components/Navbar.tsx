'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Zap, Flame, LogOut, BarChart2, HelpCircle, Menu, X } from 'lucide-react';
import { RankType } from '@/lib/progression';

const RANK_COLORS: Record<RankType, string> = {
  E: 'text-text-muted', D: 'text-accent-emerald', C: 'text-accent-cyan',
  B: 'text-accent-amber', A: 'text-accent-violet', S: 'text-accent-ember',
};

import { signOut } from 'next-auth/react';

interface NavbarProps {
  userEmail?: string;
  timezone?: string;
  overallStreak?: number;
  rank?: RankType;
  level?: number;
  onOpenWalkthrough?: () => void;
}

export default function Navbar({
  userEmail,
  overallStreak = 0,
  rank = 'E',
  level = 1,
  onOpenWalkthrough,
}: NavbarProps) {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    setLoggingOut(true);
    await fetch('/api/auth/logout', { method: 'POST' });
    await signOut({ callbackUrl: '/login' });
  };

  return (
    <header className="sticky top-0 z-30 border-b border-border-DEFAULT bg-canvas/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between gap-4">
        {/* Logo */}
        <a href="/" className="flex items-center gap-2 group">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-accent-indigo to-accent-violet flex items-center justify-center group-hover:shadow-glare transition-all duration-200">
            <Zap className="w-3.5 h-3.5 text-white" fill="white" />
          </div>
          <span className="text-sm font-bold tracking-widest text-text-primary uppercase hidden sm:block">ASCEND</span>
        </a>

        {/* Center: Rank + Level */}
        <div className="flex items-center gap-2">
          <span className={`text-xs font-mono font-bold border rounded px-2 py-0.5 border-border-DEFAULT ${RANK_COLORS[rank]}`}>
            {rank}
          </span>
          <span className="text-xs font-mono text-text-muted tabular-nums">Lv {level}</span>
        </div>

        {/* Right: Streak, Nav links, Avatar */}
        <div className="flex items-center gap-3">
          {/* Streak indicator */}
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-surface-elevated border border-border-DEFAULT">
            <Flame
              className={`w-3.5 h-3.5 ${overallStreak >= 7 ? 'text-accent-ember streak-flame-active' : 'text-text-muted'}`}
              fill={overallStreak >= 7 ? 'rgba(244,63,94,0.2)' : 'none'}
            />
            <span className="text-xs font-mono tabular-nums text-text-secondary">{overallStreak}</span>
          </div>

          {/* Nav links — desktop */}
          <div className="hidden md:flex items-center gap-1">
            <a
              id="tour-nav-progress"
              href="/progress"
              className="flex items-center gap-1.5 text-xs font-mono text-text-muted hover:text-text-primary px-2.5 py-1.5 rounded-lg hover:bg-surface-elevated transition-all"
            >
              <BarChart2 className="w-3.5 h-3.5" />
              Progress
            </a>
            <a
              href="/faq"
              className="flex items-center gap-1.5 text-xs font-mono text-text-muted hover:text-text-primary px-2.5 py-1.5 rounded-lg hover:bg-surface-elevated transition-all"
            >
              <HelpCircle className="w-3.5 h-3.5" />
              FAQ
            </a>
            {onOpenWalkthrough && (
              <button
                onClick={onOpenWalkthrough}
                className="flex items-center gap-1.5 text-xs font-mono text-accent-indigo hover:text-white px-2.5 py-1.5 rounded-lg hover:bg-accent-indigo/10 border border-accent-indigo/20 transition-all"
                title="Show tutorial again"
              >
                <HelpCircle className="w-3.5 h-3.5" />
                Tutorial
              </button>
            )}
          </div>

          {/* Logout */}
          <button
            onClick={handleLogout}
            disabled={loggingOut}
            className="hidden sm:flex items-center gap-1.5 text-xs font-mono text-text-muted hover:text-accent-ember px-2.5 py-1.5 rounded-lg hover:bg-surface-elevated border border-transparent hover:border-border-DEFAULT transition-all"
          >
            <LogOut className="w-3.5 h-3.5" />
            {loggingOut ? '...' : 'Exit'}
          </button>

          {/* Mobile menu toggle */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden w-8 h-8 rounded-lg border border-border-DEFAULT flex items-center justify-center text-text-muted hover:text-text-primary transition-all"
          >
            {menuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="md:hidden bg-canvas/95 backdrop-blur-xl border-t border-border-DEFAULT px-4 py-3 space-y-1"
        >
          <a href="/progress" className="flex items-center gap-2 text-sm text-text-secondary hover:text-text-primary px-3 py-2.5 rounded-xl hover:bg-surface-elevated transition-all">
            <BarChart2 className="w-4 h-4" /> Progress
          </a>
          <a href="/faq" className="flex items-center gap-2 text-sm text-text-secondary hover:text-text-primary px-3 py-2.5 rounded-xl hover:bg-surface-elevated transition-all">
            <HelpCircle className="w-4 h-4" /> FAQ
          </a>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 text-sm text-accent-ember px-3 py-2.5 rounded-xl hover:bg-surface-elevated transition-all w-full text-left"
          >
            <LogOut className="w-4 h-4" /> Sign out
          </button>
        </motion.div>
      )}
    </header>
  );
}
