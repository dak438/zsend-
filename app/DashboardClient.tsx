'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Zap, Plus, Settings2, Flame, Clock, ShieldCheck,
  TrendingUp, Activity, Sparkles, Trophy
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import {
  CharacterSheet,
  HunterDossierCard,
  StatEquilibriumCard,
  StatMatrixCard
} from '@/components/StatusWindow';
import QuestLog, { QuestItem } from '@/components/QuestLog';
import CreateQuestModal from '@/components/CreateQuestModal';
import LevelUpModal from '@/components/LevelUpModal';
import ManageStatsModal from '@/components/ManageStatsModal';
import OnboardingWalkthrough from '@/components/OnboardingWalkthrough';

interface Stat {
  id: string;
  name: string;
  icon: string;
  xp: number;
  streak: number;
  active: boolean;
}

export default function DashboardClient() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<{ id: string; email: string; name?: string; timezone: string } | null>(null);
  const [character, setCharacter] = useState<CharacterSheet | null>(null);
  const [allStats, setAllStats] = useState<Stat[]>([]);
  const [quests, setQuests] = useState<QuestItem[]>([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isManageStatsOpen, setIsManageStatsOpen] = useState(false);
  const [isWalkthroughOpen, setIsWalkthroughOpen] = useState(false);
  const [levelUpData, setLevelUpData] = useState<any>(null);
  const [isLevelUpModalOpen, setIsLevelUpModalOpen] = useState(false);
  const [isLeveledUpAnimation, setIsLeveledUpAnimation] = useState(false);
  const [resetCountdown, setResetCountdown] = useState<string>('');

  // Daily reset countdown calculator
  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date();
      const tomorrow = new Date(now);
      tomorrow.setHours(24, 0, 0, 0);
      const diffMs = tomorrow.getTime() - now.getTime();
      const hours = Math.floor(diffMs / (1000 * 60 * 60));
      const mins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      setResetCountdown(`${hours}h ${mins}m`);
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 60000);
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    try {
      const meRes = await fetch('/api/auth/me');
      if (!meRes.ok) {
        router.push('/login');
        return;
      }
      const meData = await meRes.json();
      setUser(meData.user);

      const charRes = await fetch('/api/character');
      if (charRes.ok) {
        const charData = await charRes.json();
        // Redirect to onboarding if user has not configured custom stats yet
        if (!charData.stats || charData.stats.length === 0) {
          router.push('/onboarding');
          return;
        }
        setCharacter(charData);
        if (charData.hasSeenWalkthrough === false) {
          setIsWalkthroughOpen(true);
        }
      }

      const questsRes = await fetch('/api/quests');
      if (questsRes.ok) {
        const qData = await questsRes.json();
        setQuests(qData.quests || []);
      }

      const statsRes = await fetch('/api/stats');
      if (statsRes.ok) {
        const sData = await statsRes.json();
        setAllStats(sData.stats || []);
      }
    } catch (err) {
      console.error('Dashboard load error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCompleteQuest = async (questId: string) => {
    const res = await fetch(`/api/quests/${questId}/complete`, { method: 'POST' });
    const data = await res.json();
    if (!res.ok) {
      alert(data.error || 'Failed to complete quest.');
      return;
    }

    if (data.overallLeveledUp || data.rankPromoted || data.statLeveledUp) {
      setLevelUpData(data);
      setIsLevelUpModalOpen(true);
      setIsLeveledUpAnimation(true);
      setTimeout(() => setIsLeveledUpAnimation(false), 2000);
    }
    await loadData();
  };

  // Calculations
  const totalXp = useMemo(() => {
    if (!character?.stats) return 0;
    return character.stats.reduce((sum, s) => sum + s.currentXp, 0);
  }, [character]);

  const completedTodayCount = useMemo(() => {
    return quests.filter(q => q.completedToday).length;
  }, [quests]);

  if (loading) {
    return (
      <div className="min-h-screen bg-canvas flex items-center justify-center">
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background: 'radial-gradient(ellipse 60% 40% at 50% 40%, rgba(99,102,241,0.12) 0%, transparent 70%)',
          }}
        />
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center gap-3"
        >
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-accent-indigo to-accent-violet flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <Zap className="w-6 h-6 text-white" fill="white" />
          </div>
          <div className="flex gap-1 mt-2">
            {[0, 1, 2].map(i => (
              <motion.div
                key={i}
                className="w-1.5 h-1.5 rounded-full bg-accent-indigo"
                animate={{ opacity: [0.3, 1, 0.3] }}
                transition={{ duration: 1.2, delay: i * 0.2, repeat: Infinity }}
              />
            ))}
          </div>
          <span className="text-xs font-mono text-text-muted uppercase tracking-widest mt-1">
            Loading Hunter Telemetry...
          </span>
        </motion.div>
      </div>
    );
  }

  if (!character) return null;

  return (
    <div className="min-h-screen bg-canvas relative text-text-primary selection:bg-accent-indigo selection:text-white">
      {/* Background Ambient Spotlights inspired by 21st.dev bento-product-features */}
      <div
        className="pointer-events-none fixed inset-0 z-0"
        style={{
          background:
            'radial-gradient(ellipse 80% 50% at 50% -10%, rgba(99,102,241,0.12) 0%, rgba(139,92,246,0.04) 40%, transparent 70%)',
        }}
      />
      <div
        className="pointer-events-none fixed bottom-0 right-0 z-0 w-[600px] h-[600px]"
        style={{
          background:
            'radial-gradient(circle, rgba(244,63,94,0.06) 0%, transparent 70%)',
        }}
      />
      <div className="pointer-events-none fixed inset-0 z-0 bento-dot-grid opacity-25" />

      <div className="relative z-10 flex flex-col min-h-screen">
        <Navbar
          userEmail={user?.email}
          timezone={user?.timezone}
          overallStreak={character.overallStreak}
          rank={character.rank}
          level={character.overallLevel}
          onOpenWalkthrough={() => setIsWalkthroughOpen(true)}
        />

        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
          {/* ============================================================== */}
          {/* 1. TELEMETRY COMMAND STRIP (Bento Header)                     */}
          {/* ============================================================== */}
          <section className="glass-card p-5 sm:p-6 border border-white/10 bg-gradient-to-r from-[#12151b]/90 via-[#0e1015]/90 to-[#12151b]/90 rounded-[2rem] shadow-xl">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
              {/* Left: Hunter Identity & Beacon */}
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-accent-indigo via-accent-violet to-accent-ember flex items-center justify-center font-black text-lg text-white shadow-md shadow-indigo-500/20">
                    {user?.name ? user.name.charAt(0).toUpperCase() : 'H'}
                  </div>
                  <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-[#12151b] animate-pulse" />
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="text-base sm:text-lg font-bold text-white tracking-tight">
                      {user?.name || user?.email?.split('@')[0] || 'Hunter'}
                    </h1>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-accent-indigo/10 border border-accent-indigo/20 text-accent-indigo uppercase font-bold tracking-wider">
                      Rank {character.rank}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-text-muted font-mono mt-0.5">
                    <span className="flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                      Honor Mode Online
                    </span>
                    <span>&middot;</span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-text-muted" />
                      Reset in {resetCountdown}
                    </span>
                  </div>
                </div>
              </div>

              {/* Center: Quick Telemetry Metric Badges */}
              <div className="grid grid-cols-3 gap-2.5 sm:gap-3 lg:max-w-md w-full">
                {/* Metric 1: Quests Cleared */}
                <div className="p-3 rounded-2xl border border-white/5 bg-white/[0.02] flex flex-col justify-center">
                  <span className="text-[10px] font-mono text-text-muted uppercase tracking-wider">Cleared</span>
                  <div className="text-sm sm:text-base font-bold text-white tabular-nums">
                    {completedTodayCount} <span className="text-xs text-text-muted font-normal">/ {quests.length}</span>
                  </div>
                </div>

                {/* Metric 2: Streak */}
                <div id="tour-streak" className="p-3 rounded-2xl border border-white/5 bg-white/[0.02] flex flex-col justify-center">
                  <span className="text-[10px] font-mono text-text-muted uppercase tracking-wider">Day Streak</span>
                  <div className="flex items-center gap-1 text-sm sm:text-base font-bold text-orange-400 tabular-nums">
                    <Flame className="w-4 h-4" fill="currentColor" />
                    <span>{character.overallStreak}d</span>
                  </div>
                </div>

                {/* Metric 3: Total XP */}
                <div className="p-3 rounded-2xl border border-white/5 bg-white/[0.02] flex flex-col justify-center">
                  <span className="text-[10px] font-mono text-text-muted uppercase tracking-wider">Total XP</span>
                  <div className="text-sm sm:text-base font-bold text-accent-indigo tabular-nums truncate">
                    {totalXp} XP
                  </div>
                </div>
              </div>

              {/* Right: Quick Action Controls */}
              <div className="flex items-center gap-2.5 self-start lg:self-auto shrink-0">
                <button
                  onClick={() => setIsManageStatsOpen(true)}
                  className="flex items-center gap-1.5 text-xs font-mono text-text-muted hover:text-white px-3.5 py-2.5 rounded-xl border border-white/10 hover:border-white/20 bg-white/[0.02] hover:bg-white/[0.06] transition-all uppercase tracking-wider"
                >
                  <Settings2 className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Manage</span> Stats
                </button>
                <button
                  onClick={() => setIsCreateModalOpen(true)}
                  className="flex items-center gap-2 text-xs font-semibold text-white bg-gradient-to-r from-accent-indigo to-accent-violet hover:from-indigo-500 hover:to-violet-500 px-4 py-2.5 rounded-xl transition-all duration-200 shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40"
                >
                  <Plus className="w-4 h-4" />
                  <span>New Quest</span>
                </button>
              </div>
            </div>
          </section>

          {/* ============================================================== */}
          {/* 2. THE ASYMMETRIC BENTO PRODUCT FEATURES MATRIX                */}
          {/* ============================================================== */}

          {/* ROW 1: Hunter Dossier (Span 4) + Quest Command Hub (Span 8) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-6 items-stretch">
            {/* Bento Card 1: 3D Glare Hunter Dossier Card */}
            <div id="tour-rank-level" className="lg:col-span-4 flex flex-col">
              <HunterDossierCard
                character={character}
                isLeveledUpAnimation={isLeveledUpAnimation}
              />
            </div>

            {/* Bento Card 2: Quest Command Hub */}
            <div id="tour-quest-log" className="lg:col-span-8 flex flex-col">
              <QuestLog
                quests={quests}
                onComplete={handleCompleteQuest}
                onCreateQuest={() => setIsCreateModalOpen(true)}
              />
            </div>
          </div>

          {/* ROW 2: Stat Equilibrium Radar (Span 4) + Attributes Matrix (Span 8) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-6 items-stretch">
            {/* Bento Card 3: Radar Equilibrium Polygon */}
            <div className="lg:col-span-4 flex flex-col">
              <StatEquilibriumCard stats={character.stats || []} />
            </div>

            {/* Bento Card 4: Core Attributes Matrix */}
            <div id="tour-stat-matrix" className="lg:col-span-8 flex flex-col">
              <StatMatrixCard
                stats={character.stats || []}
                onManageStats={() => setIsManageStatsOpen(true)}
              />
            </div>
          </div>
        </main>
      </div>

      {/* Modals */}
      <CreateQuestModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreated={loadData}
        stats={allStats.filter(s => s.active)}
      />

      <ManageStatsModal
        isOpen={isManageStatsOpen}
        onClose={() => setIsManageStatsOpen(false)}
        stats={allStats}
        onUpdated={loadData}
      />

      <LevelUpModal
        isOpen={isLevelUpModalOpen}
        onClose={() => setIsLevelUpModalOpen(false)}
        data={levelUpData || {}}
      />

      {/* Interactive 7-Step Spotlight Onboarding Walkthrough */}
      <OnboardingWalkthrough
        isOpen={isWalkthroughOpen}
        onClose={() => setIsWalkthroughOpen(false)}
        onFinish={loadData}
      />
    </div>
  );
}
