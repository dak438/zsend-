'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Dumbbell, Swords, Brain, BookOpen, Briefcase, TrendingUp,
  HeartPulse, Flame, Zap, Target, Shield, Compass, Code,
  Sparkles, Cpu, Medal, CheckCircle2, Circle, Plus, RefreshCw,
  Layers, CheckCheck, ListFilter
} from 'lucide-react';

const ICON_MAP: Record<string, React.ElementType> = {
  Dumbbell, Swords, Brain, BookOpen, Briefcase, TrendingUp,
  HeartPulse, Flame, Zap, Target, Shield, Compass, Code,
  Sparkles, Cpu, Medal,
};

const XP_TIER_LABELS: Record<number, { label: string; color: string; badgeBg: string }> = {
  15: { label: 'Quick · 15 XP', color: 'text-emerald-400', badgeBg: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' },
  30: { label: 'Medium · 30 XP', color: 'text-amber-400', badgeBg: 'bg-amber-500/10 border-amber-500/20 text-amber-400' },
  50: { label: 'Major · 50 XP', color: 'text-rose-400', badgeBg: 'bg-rose-500/10 border-rose-500/20 text-rose-400' },
};

const STAT_ACCENT = [
  'from-accent-indigo to-accent-violet',
  'from-rose-500 to-orange-500',
  'from-cyan-500 to-blue-500',
  'from-emerald-500 to-teal-500',
  'from-amber-500 to-yellow-500',
  'from-purple-500 to-pink-500',
];

export interface QuestItem {
  id: string;
  title: string;
  xpValue: number;
  recurring: boolean;
  completedToday: boolean;
  statId: string;
  statName: string;
  statIcon: string;
}

interface QuestLogProps {
  quests: QuestItem[];
  onComplete: (questId: string) => Promise<void>;
  onCreateQuest: () => void;
}

type FilterType = 'all' | 'pending' | 'completed';

export default function QuestLog({ quests, onComplete, onCreateQuest }: QuestLogProps) {
  const [filter, setFilter] = useState<FilterType>('all');
  const [selectedStat, setSelectedStat] = useState<string | 'all'>('all');
  const [completing, setCompleting] = useState<Set<string>>(new Set());

  const handleComplete = async (questId: string) => {
    if (completing.has(questId)) return;
    setCompleting(prev => new Set(prev).add(questId));
    try {
      await onComplete(questId);
    } finally {
      setCompleting(prev => {
        const s = new Set(prev);
        s.delete(questId);
        return s;
      });
    }
  };

  const totalQuests = quests.length;
  const completedQuests = quests.filter(q => q.completedToday).length;
  const pendingQuests = totalQuests - completedQuests;
  const completionPercent = totalQuests > 0 ? Math.round((completedQuests / totalQuests) * 100) : 0;
  const xpEarnedToday = quests
    .filter(q => q.completedToday)
    .reduce((acc, q) => acc + q.xpValue, 0);

  // Distinct stats
  const distinctStats = useMemo(() => {
    const map = new Map<string, { id: string; name: string; icon: string }>();
    quests.forEach(q => {
      if (!map.has(q.statId)) {
        map.set(q.statId, { id: q.statId, name: q.statName, icon: q.statIcon });
      }
    });
    return Array.from(map.values());
  }, [quests]);

  // Filtered list
  const filteredQuests = useMemo(() => {
    return quests.filter(q => {
      if (filter === 'pending' && q.completedToday) return false;
      if (filter === 'completed' && !q.completedToday) return false;
      if (selectedStat !== 'all' && q.statId !== selectedStat) return false;
      return true;
    });
  }, [quests, filter, selectedStat]);

  return (
    <div className="glass-card h-full p-6 sm:p-7 flex flex-col justify-between border border-white/10 hover:border-white/20 bg-gradient-to-b from-[#12151b] to-[#0c0e12] rounded-[2rem]">
      {/* Header bar */}
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5 pb-5 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-accent-indigo to-accent-violet flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Zap className="w-5 h-5 text-white" fill="white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white tracking-tight">System Objectives</h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 uppercase tracking-wider">
                  Active
                </span>
              </div>
              <p className="text-xs text-text-muted font-mono mt-0.5">
                Daily protocol &middot; {completedQuests}/{totalQuests} cleared &middot; +{xpEarnedToday} XP earned
              </p>
            </div>
          </div>

          <button
            onClick={onCreateQuest}
            className="flex items-center gap-2 text-xs font-semibold text-white bg-gradient-to-r from-accent-indigo to-accent-violet hover:from-indigo-500 hover:to-violet-500 px-4 py-2.5 rounded-xl transition-all duration-200 shadow-md shadow-indigo-500/25 hover:shadow-indigo-500/40 shrink-0 self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>New Objective</span>
          </button>
        </div>

        {/* Filter controls & Progress strip */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
          {/* Status filter tabs */}
          <div className="inline-flex p-1 rounded-xl bg-black/40 border border-white/5 text-xs font-mono">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                filter === 'all'
                  ? 'bg-white/10 text-white font-medium shadow-sm'
                  : 'text-text-muted hover:text-white'
              }`}
            >
              All ({totalQuests})
            </button>
            <button
              onClick={() => setFilter('pending')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                filter === 'pending'
                  ? 'bg-white/10 text-white font-medium shadow-sm'
                  : 'text-text-muted hover:text-white'
              }`}
            >
              Pending ({pendingQuests})
            </button>
            <button
              onClick={() => setFilter('completed')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                filter === 'completed'
                  ? 'bg-white/10 text-white font-medium shadow-sm'
                  : 'text-text-muted hover:text-white'
              }`}
            >
              Completed ({completedQuests})
            </button>
          </div>

          {/* Stat Category Chips */}
          {distinctStats.length > 1 && (
            <div className="flex items-center gap-1.5 overflow-x-auto py-1 scrollbar-none">
              <button
                onClick={() => setSelectedStat('all')}
                className={`text-[10px] font-mono px-2.5 py-1 rounded-lg border transition-all ${
                  selectedStat === 'all'
                    ? 'border-accent-indigo bg-accent-indigo/15 text-white font-bold'
                    : 'border-white/5 bg-white/[0.02] text-text-muted hover:text-white'
                }`}
              >
                All Stats
              </button>
              {distinctStats.map(stat => (
                <button
                  key={stat.id}
                  onClick={() => setSelectedStat(stat.id)}
                  className={`text-[10px] font-mono px-2.5 py-1 rounded-lg border transition-all whitespace-nowrap ${
                    selectedStat === stat.id
                      ? 'border-accent-indigo bg-accent-indigo/15 text-white font-bold'
                      : 'border-white/5 bg-white/[0.02] text-text-muted hover:text-white'
                  }`}
                >
                  {stat.name}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Progress line */}
        <div className="mb-5">
          <div className="flex justify-between items-center text-[10px] font-mono text-text-muted mb-1.5">
            <span>Daily Completion Track</span>
            <span className="text-white font-bold">{completionPercent}%</span>
          </div>
          <div className="h-2 bg-black/40 border border-white/5 rounded-full overflow-hidden p-0.5">
            <motion.div
              className="h-full bg-gradient-to-r from-accent-indigo to-accent-violet rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${Math.max(completionPercent, totalQuests > 0 ? 3 : 0)}%` }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            />
          </div>
        </div>
      </div>

      {/* Quest list */}
      <div className="space-y-2.5 flex-1 overflow-y-auto max-h-[460px] pr-1">
        {filteredQuests.length === 0 ? (
          <div className="p-10 rounded-2xl border border-dashed border-white/10 text-center flex flex-col items-center justify-center my-4">
            <div className="w-12 h-12 rounded-2xl bg-white/[0.03] border border-white/5 flex items-center justify-center mb-3">
              <CheckCheck className="w-6 h-6 text-text-muted" />
            </div>
            <p className="text-sm text-white font-semibold mb-1">
              {filter === 'completed'
                ? 'No completed quests yet today'
                : filter === 'pending'
                ? 'All current quests cleared! Great work!'
                : 'No quests created yet'}
            </p>
            <p className="text-xs text-text-muted max-w-xs font-mono">
              {filter === 'all'
                ? 'Create custom quests mapped to your attributes to begin your ascent.'
                : 'Check back after daily reset or create new objectives.'}
            </p>
            {filter === 'all' && (
              <button
                onClick={onCreateQuest}
                className="mt-4 flex items-center gap-1.5 text-xs font-semibold text-white bg-accent-indigo hover:bg-indigo-500 px-4 py-2 rounded-xl transition-all shadow-md shadow-indigo-500/20"
              >
                <Plus className="w-4 h-4" />
                Add Your First Quest
              </button>
            )}
          </div>
        ) : (
          <AnimatePresence initial={false}>
            {filteredQuests.map((quest, qIdx) => {
              const IconComp = ICON_MAP[quest.statIcon] || Target;
              const tier = XP_TIER_LABELS[quest.xpValue] || {
                label: `+${quest.xpValue} XP`,
                color: 'text-text-muted',
                badgeBg: 'bg-white/5 border-white/10 text-text-muted',
              };
              const isCompleting = completing.has(quest.id);

              return (
                <motion.div
                  key={quest.id}
                  layout
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.25, delay: qIdx * 0.03 }}
                  onClick={() => !quest.completedToday && handleComplete(quest.id)}
                  className={`flex items-center gap-3.5 p-3.5 sm:p-4 rounded-2xl border transition-all duration-200 group ${
                    quest.completedToday
                      ? 'border-white/5 bg-white/[0.015] opacity-65'
                      : 'border-white/10 bg-white/[0.03] hover:bg-white/[0.07] hover:border-accent-indigo/40 cursor-pointer shadow-sm'
                  }`}
                >
                  {/* Completion checkmark button */}
                  <button
                    type="button"
                    disabled={quest.completedToday || isCompleting}
                    className="shrink-0 focus:outline-none"
                  >
                    {isCompleting ? (
                      <div className="w-5 h-5 border-2 border-accent-indigo/40 border-t-accent-indigo rounded-full animate-spin" />
                    ) : quest.completedToday ? (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: 'spring', stiffness: 450, damping: 22 }}
                      >
                        <CheckCircle2 className="w-5 h-5 text-accent-indigo" fill="rgba(99,102,241,0.2)" />
                      </motion.div>
                    ) : (
                      <Circle className="w-5 h-5 text-white/30 group-hover:text-accent-indigo group-hover:scale-110 transition-all" />
                    )}
                  </button>

                  {/* Stat Icon badge */}
                  <div className="w-7 h-7 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                    <IconComp className="w-3.5 h-3.5 text-white/70 group-hover:text-white transition-colors" />
                  </div>

                  {/* Quest Title & details */}
                  <div className="flex-1 min-w-0">
                    <div
                      className={`text-sm font-medium tracking-tight truncate ${
                        quest.completedToday ? 'line-through text-text-muted' : 'text-white'
                      }`}
                    >
                      {quest.title}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5 text-[10px] font-mono text-text-muted">
                      <span>{quest.statName}</span>
                      {quest.recurring && (
                        <span className="flex items-center gap-0.5 text-text-muted/80">
                          <RefreshCw className="w-2.5 h-2.5" /> Daily
                        </span>
                      )}
                    </div>
                  </div>

                  {/* XP Tier Badge */}
                  <div
                    className={`text-[10px] font-mono font-bold border rounded-lg px-2.5 py-1 shrink-0 ${tier.badgeBg}`}
                  >
                    +{quest.xpValue} XP
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
      </div>

      {/* Footer metadata */}
      <div className="pt-4 mt-3 border-t border-white/5 flex items-center justify-between text-[10px] font-mono text-text-muted">
        <span>Honor Mode: Immediate Server Award</span>
        <span>Daily Auto-Reset at 00:00</span>
      </div>
    </div>
  );
}
