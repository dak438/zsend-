'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, TrendingUp, X } from 'lucide-react';
import { RankType } from '@/lib/progression';

interface LevelUpModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: {
    overallLeveledUp?: boolean;
    rankPromoted?: boolean;
    statLeveledUp?: boolean;
    newOverallLevel?: number;
    newRank?: RankType;
    statName?: string;
    newStatLevel?: number;
    xpGained?: number;
  };
}

const RANK_COLORS: Record<string, string> = {
  E: 'text-text-muted', D: 'text-accent-emerald', C: 'text-accent-cyan',
  B: 'text-accent-amber', A: 'text-accent-violet', S: 'text-accent-ember',
};

export default function LevelUpModal({ isOpen, onClose, data }: LevelUpModalProps) {
  const isRankUp = data.rankPromoted && data.newRank;
  const isOverallLevelUp = data.overallLeveledUp && data.newOverallLevel;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-canvas/85 backdrop-blur-sm z-50"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.85, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.85, y: 30 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div className="glass-card p-8 w-full max-w-sm shadow-modal text-center relative overflow-hidden">
              {/* Background glow pulse */}
              <div
                className="pointer-events-none absolute inset-0 rounded-[20px]"
                style={{
                  background: isRankUp
                    ? 'radial-gradient(ellipse 80% 60% at 50% 20%, rgba(244,63,94,0.15) 0%, transparent 70%)'
                    : 'radial-gradient(ellipse 80% 60% at 50% 20%, rgba(99,102,241,0.15) 0%, transparent 70%)',
                }}
              />

              <button
                onClick={onClose}
                className="absolute top-4 right-4 w-7 h-7 rounded-lg flex items-center justify-center text-text-muted hover:text-text-primary border border-border-DEFAULT hover:border-border-hover transition-all"
              >
                <X className="w-3.5 h-3.5" />
              </button>

              <div className="relative z-10">
                {/* Icon */}
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 260, damping: 20, delay: 0.15 }}
                  className={`w-16 h-16 rounded-2xl mx-auto mb-5 flex items-center justify-center ${
                    isRankUp
                      ? 'bg-accent-ember/10 border border-accent-ember/30'
                      : 'bg-accent-indigo/10 border border-accent-indigo/30'
                  }`}
                >
                  {isRankUp ? (
                    <TrendingUp className="w-7 h-7 text-accent-ember" />
                  ) : (
                    <Zap className="w-7 h-7 text-accent-indigo" fill="rgba(99,102,241,0.3)" />
                  )}
                </motion.div>

                {/* Title */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <div className="text-[10px] font-mono text-text-muted uppercase tracking-[0.2em] mb-2">
                    {isRankUp ? 'RANK PROMOTION' : isOverallLevelUp ? 'LEVEL UP' : 'STAT LEVEL UP'}
                  </div>

                  {isRankUp && data.newRank && (
                    <p className="text-4xl font-black mb-1">
                      RANK{' '}
                      <span className={RANK_COLORS[data.newRank] || 'text-text-primary'}>
                        {data.newRank}
                      </span>
                    </p>
                  )}

                  {isOverallLevelUp && (
                    <p className="text-4xl font-black text-text-primary mb-1">
                      LEVEL <span className="text-accent-indigo">{data.newOverallLevel}</span>
                    </p>
                  )}

                  {data.statLeveledUp && data.statName && (
                    <p className="text-sm text-text-secondary mt-2">
                      <span className="text-text-primary font-semibold">{data.statName}</span>
                      {data.newStatLevel && (
                        <> reached <span className="text-accent-cyan font-semibold">Level {data.newStatLevel}</span></>
                      )}
                    </p>
                  )}

                  {data.xpGained && (
                    <p className="text-xs font-mono text-text-muted mt-3">
                      +{data.xpGained} XP earned
                    </p>
                  )}
                </motion.div>

                <motion.button
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  onClick={onClose}
                  className="mt-6 w-full py-2.5 rounded-xl bg-surface-elevated border border-border-hover hover:border-accent-indigo/50 text-sm font-semibold text-text-primary transition-all duration-200"
                >
                  Continue
                </motion.button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
