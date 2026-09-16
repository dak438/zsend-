'use client';

import React from 'react';
import { motion, Variants } from 'framer-motion';
import {
  Dumbbell, Swords, Brain, BookOpen, Briefcase, TrendingUp,
  HeartPulse, Flame, Zap, Target, Shield, Compass, Code,
  Sparkles, Cpu, Medal, Settings2, Activity
} from 'lucide-react';
import { RankType } from '@/lib/progression';
import GlareCard from '@/components/ui/GlareCard';
import RadarChart from '@/components/ui/RadarChart';

const ICON_MAP: Record<string, React.ElementType> = {
  Dumbbell, Swords, Brain, BookOpen, Briefcase, TrendingUp,
  HeartPulse, Flame, Zap, Target, Shield, Compass, Code,
  Sparkles, Cpu, Medal,
};

const RANK_COLORS: Record<RankType, { badge: string; glow: string; text: string }> = {
  E: { badge: 'border-white/10 bg-white/5 text-text-muted', glow: 'rgba(150,150,150,0.1)', text: 'text-text-muted' },
  D: { badge: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400', glow: 'rgba(16,185,129,0.2)', text: 'text-emerald-400' },
  C: { badge: 'border-cyan-500/30 bg-cyan-500/10 text-cyan-400', glow: 'rgba(6,182,212,0.2)', text: 'text-cyan-400' },
  B: { badge: 'border-amber-500/30 bg-amber-500/10 text-amber-400', glow: 'rgba(245,158,11,0.2)', text: 'text-amber-400' },
  A: { badge: 'border-violet-500/30 bg-violet-500/10 text-violet-400', glow: 'rgba(139,92,246,0.25)', text: 'text-violet-400' },
  S: { badge: 'border-rose-500/40 bg-rose-500/15 text-rose-400 shadow-[0_0_15px_rgba(244,63,94,0.3)]', glow: 'rgba(244,63,94,0.3)', text: 'text-rose-400' },
};

const STAT_ACCENT_COLORS = [
  { bg: 'from-accent-indigo to-accent-violet', bar: 'bg-accent-indigo', glow: 'rgba(99,102,241,0.35)', border: 'border-accent-indigo/30' },
  { bg: 'from-rose-500 to-orange-500', bar: 'bg-rose-500', glow: 'rgba(244,63,94,0.35)', border: 'border-rose-500/30' },
  { bg: 'from-cyan-500 to-blue-500', bar: 'bg-cyan-500', glow: 'rgba(6,182,212,0.35)', border: 'border-cyan-500/30' },
  { bg: 'from-emerald-500 to-teal-500', bar: 'bg-emerald-500', glow: 'rgba(16,185,129,0.35)', border: 'border-emerald-500/30' },
  { bg: 'from-amber-500 to-yellow-500', bar: 'bg-amber-500', glow: 'rgba(245,158,11,0.35)', border: 'border-amber-500/30' },
  { bg: 'from-purple-500 to-pink-500', bar: 'bg-purple-500', glow: 'rgba(168,85,247,0.35)', border: 'border-purple-500/30' },
];

export interface StatInfo {
  id: string;
  name: string;
  icon: string;
  currentLevel: number;
  nextLevel: number;
  currentXp: number;
  xpIntoCurrentLevel: number;
  xpRangeForLevel: number;
  progressPercent: number;
  streak: number;
  lastActiveDate: string | null;
}

export interface CharacterSheet {
  id: string;
  overallLevel: number;
  rank: RankType;
  overallStreak: number;
  lastActiveDate: string | null;
  hasSeenWalkthrough?: boolean;
  stats: StatInfo[];
}

const itemVariant: Variants = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.16, 1, 0.3, 1] } },
};

/**
 * Bento Component 1: Hunter Dossier Card (3D Glare)
 */
export function HunterDossierCard({
  character,
  isLeveledUpAnimation,
}: {
  character: CharacterSheet;
  isLeveledUpAnimation?: boolean;
}) {
  const stats = character.stats || [];
  const avgProgress = stats.length > 0
    ? Math.round(stats.reduce((a, s) => a + s.progressPercent, 0) / stats.length)
    : 0;

  const rankStyle = RANK_COLORS[character.rank] || RANK_COLORS.E;

  return (
    <motion.div variants={itemVariant} className="h-full">
      <GlareCard
        className={`h-full p-6 sm:p-7 flex flex-col justify-between transition-all duration-500 border border-white/10 hover:border-white/20 bg-gradient-to-b from-[#13161c] to-[#0d0f13] ${
          isLeveledUpAnimation ? 'level-up-flash' : ''
        }`}
        glareColor={rankStyle.glow}
      >
        {/* Dot grid texture background */}
        <div className="absolute inset-0 rounded-[20px] bento-dot-grid opacity-30 pointer-events-none" />

        <div className="relative z-10 flex items-start justify-between">
          <div>
            {/* Rank badge */}
            <div
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-mono font-bold tracking-widest mb-3.5 shadow-sm ${rankStyle.badge}`}
            >
              <span className="opacity-80">RANK</span>
              <span className="text-sm font-black leading-none">{character.rank}</span>
            </div>

            {/* Level */}
            <div className="flex items-baseline gap-2.5">
              <span className="text-5xl sm:text-6xl font-black text-white tabular-nums tracking-tight leading-none drop-shadow-md">
                {character.overallLevel}
              </span>
              <div className="flex flex-col">
                <span className="text-text-muted text-[11px] font-mono uppercase tracking-widest font-semibold">HUNTER</span>
                <span className="text-accent-indigo text-xs font-mono uppercase tracking-widest font-bold">LEVEL</span>
              </div>
            </div>
          </div>

          {/* Streak Flame Counter */}
          <div className="flex flex-col items-end">
            <div className="flex items-center gap-1 px-3 py-1.5 rounded-xl border border-white/10 bg-white/[0.03]">
              <Flame
                className={`w-5 h-5 ${
                  character.overallStreak >= 7
                    ? 'text-accent-ember streak-flame-active drop-shadow-[0_0_8px_rgba(244,63,94,0.6)]'
                    : character.overallStreak > 0
                    ? 'text-orange-400'
                    : 'text-text-muted'
                }`}
                fill={character.overallStreak > 0 ? 'currentColor' : 'none'}
              />
              <span className="text-xl font-black tabular-nums text-white leading-none">
                {character.overallStreak}
              </span>
            </div>
            <span className="text-[10px] font-mono text-text-muted uppercase tracking-wider mt-1.5">
              Day Streak
            </span>
          </div>
        </div>

        {/* Overall XP Progress */}
        <div className="relative z-10 mt-6 pt-5 border-t border-white/5">
          <div className="flex justify-between items-center text-xs font-mono mb-2">
            <span className="text-text-muted tracking-wider uppercase text-[10px]">Rank Progression</span>
            <span className="text-white font-bold">{avgProgress}%</span>
          </div>
          <div className="h-2 bg-black/40 border border-white/5 rounded-full overflow-hidden p-0.5">
            <motion.div
              className="h-full bg-gradient-to-r from-accent-indigo via-accent-violet to-accent-ember rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${Math.max(avgProgress, 3)}%` }}
              transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
            />
          </div>
          <div className="flex justify-between items-center text-[10px] font-mono text-text-muted mt-2">
            <span>Current Tier</span>
            <span>Next Tier: {character.rank === 'S' ? 'MAX' : 'Level Up'}</span>
          </div>
        </div>
      </GlareCard>
    </motion.div>
  );
}

/**
 * Bento Component 2: Stat Equilibrium Radar Chart Card
 */
export function StatEquilibriumCard({
  stats,
}: {
  stats: StatInfo[];
}) {
  const radarStats = stats.map(s => ({
    name: s.name,
    value: s.progressPercent,
    level: s.currentLevel,
    icon: s.icon,
  }));

  // Determine balance archetype
  const levels = stats.map(s => s.currentLevel);
  const minL = Math.min(...(levels.length ? levels : [1]));
  const maxL = Math.max(...(levels.length ? levels : [1]));
  const variance = maxL - minL;
  const balanceLabel = variance <= 1 ? 'Balanced Polymath' : variance <= 3 ? 'Adaptable Build' : 'Specialist Focus';

  return (
    <motion.div variants={itemVariant} className="h-full">
      <div className="glass-card h-full p-6 flex flex-col justify-between border border-white/10 hover:border-white/20 bg-gradient-to-b from-[#12151b] to-[#0c0e12]">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-accent-cyan" />
            <span className="text-xs font-mono font-bold text-text-primary uppercase tracking-widest">
              Equilibrium
            </span>
          </div>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-accent-cyan/10 border border-accent-cyan/20 text-accent-cyan uppercase tracking-wider">
            {balanceLabel}
          </span>
        </div>

        {/* Radar Graphic */}
        <div className="flex-1 flex items-center justify-center py-2">
          {stats.length >= 2 ? (
            <RadarChart stats={radarStats} />
          ) : (
            <div className="text-center py-8 text-xs text-text-muted font-mono">
              Need at least 2 active stats for equilibrium mapping.
            </div>
          )}
        </div>

        <div className="pt-3 border-t border-white/5 flex items-center justify-between text-[10px] font-mono text-text-muted">
          <span>{stats.length} of 6 Attributes Mapped</span>
          <span className="text-white font-medium">Dynamic Mesh</span>
        </div>
      </div>
    </motion.div>
  );
}

/**
 * Bento Component 3: Custom Stats Matrix Grid Card
 */
export function StatMatrixCard({
  stats,
  onManageStats,
}: {
  stats: StatInfo[];
  onManageStats?: () => void;
}) {
  return (
    <motion.div variants={itemVariant} className="h-full">
      <div className="glass-card h-full p-6 border border-white/10 hover:border-white/20 bg-gradient-to-b from-[#12151b] to-[#0c0e12] flex flex-col justify-between">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Target className="w-4 h-4 text-accent-indigo" />
            <span className="text-xs font-mono font-bold text-text-primary uppercase tracking-widest">
              Core Attributes
            </span>
          </div>
          <button
            onClick={onManageStats}
            className="flex items-center gap-1.5 text-[11px] font-mono text-text-muted hover:text-white px-2.5 py-1 rounded-lg border border-white/10 hover:border-white/20 bg-white/[0.02] hover:bg-white/[0.06] transition-all uppercase tracking-wider"
          >
            <Settings2 className="w-3.5 h-3.5" />
            Manage
          </button>
        </div>

        {/* Grid of custom stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 flex-1 items-start">
          {stats.map((stat, idx) => {
            const IconComp = ICON_MAP[stat.icon] || Target;
            const accent = STAT_ACCENT_COLORS[idx % STAT_ACCENT_COLORS.length];

            return (
              <div
                key={stat.id}
                className="p-3.5 rounded-2xl border border-white/10 bg-white/[0.02] hover:bg-white/[0.05] hover:border-white/20 transition-all duration-200 flex flex-col justify-between"
              >
                <div className="flex items-center justify-between mb-2.5">
                  <div className="flex items-center gap-2.5">
                    <div className={`w-8 h-8 rounded-xl bg-gradient-to-br ${accent.bg} flex items-center justify-center shrink-0 shadow-sm`}>
                      <IconComp className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white truncate max-w-[100px] sm:max-w-[120px]">
                        {stat.name}
                      </div>
                      <div className="text-[10px] font-mono text-text-muted">
                        Lv. {stat.currentLevel}
                      </div>
                    </div>
                  </div>

                  {stat.streak > 0 && (
                    <div className="flex items-center gap-0.5 text-[10px] font-mono text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded-md border border-amber-500/20">
                      <Flame className="w-3 h-3 text-amber-400" fill="currentColor" />
                      <span>{stat.streak}d</span>
                    </div>
                  )}
                </div>

                {/* Progress bar */}
                <div>
                  <div className="flex justify-between text-[10px] font-mono text-text-muted mb-1">
                    <span>{stat.xpIntoCurrentLevel}/{stat.xpRangeForLevel} XP</span>
                    <span className="font-semibold text-white">{stat.progressPercent}%</span>
                  </div>
                  <div className="h-1.5 bg-black/40 border border-white/5 rounded-full overflow-hidden">
                    <motion.div
                      className={`h-full ${accent.bar} rounded-full`}
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.max(stat.progressPercent, 4)}%` }}
                      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-[10px] font-mono text-text-muted">
          <span>Formula: floor(sqrt(XP/50)) + 1</span>
          <span>No Stat Decay</span>
        </div>
      </div>
    </motion.div>
  );
}

/**
 * Default composite StatusWindow wrapper (for backwards-compatibility)
 */
export default function StatusWindow({
  character,
  isLeveledUpAnimation,
  onManageStats,
}: {
  character: CharacterSheet;
  isLeveledUpAnimation?: boolean;
  onManageStats?: () => void;
}) {
  return (
    <div className="flex flex-col gap-4">
      <HunterDossierCard character={character} isLeveledUpAnimation={isLeveledUpAnimation} />
      <StatEquilibriumCard stats={character.stats || []} />
      <StatMatrixCard stats={character.stats || []} onManageStats={onManageStats} />
    </div>
  );
}
