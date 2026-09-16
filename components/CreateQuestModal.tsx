'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Dumbbell, Swords, Brain, BookOpen, Briefcase, TrendingUp,
  HeartPulse, Flame, Zap, Target, Shield, Compass, Code,
  Sparkles, Cpu, Medal, X, ChevronDown
} from 'lucide-react';

const ICON_MAP: Record<string, React.ElementType> = {
  Dumbbell, Swords, Brain, BookOpen, Briefcase, TrendingUp,
  HeartPulse, Flame, Zap, Target, Shield, Compass, Code,
  Sparkles, Cpu, Medal,
};

const XP_TIERS = [
  { label: 'Small', value: 15, desc: '10 min stretch, flashcards', color: 'border-accent-emerald/40 bg-accent-emerald/5 text-accent-emerald' },
  { label: 'Medium', value: 30, desc: '45 min workout, 1hr study', color: 'border-accent-amber/40 bg-accent-amber/5 text-accent-amber' },
  { label: 'Large', value: 50, desc: 'Cold call session, full leg day', color: 'border-accent-ember/40 bg-accent-ember/5 text-accent-ember' },
];

interface Stat {
  id: string;
  name: string;
  icon: string;
}

interface CreateQuestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: () => void;
  stats: Stat[];
}

export default function CreateQuestModal({ isOpen, onClose, onCreated, stats }: CreateQuestModalProps) {
  const [title, setTitle] = useState('');
  const [statId, setStatId] = useState(stats[0]?.id || '');
  const [xpValue, setXpValue] = useState(30);
  const [recurring, setRecurring] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !statId) return;
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/quests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: title.trim(), statId, xpValue, recurring }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to create quest.');
        return;
      }
      setTitle('');
      setXpValue(30);
      setRecurring(true);
      onCreated();
      onClose();
    } catch {
      setError('Connection failed.');
    } finally {
      setLoading(false);
    }
  };

  const selectedStat = stats.find(s => s.id === statId);
  const IconComp = selectedStat ? (ICON_MAP[selectedStat.icon] || Target) : Target;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-canvas/80 backdrop-blur-sm z-40"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 20 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div className="w-full max-w-md glass-card p-6 shadow-modal">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold text-text-primary tracking-tight">New Quest</h2>
                <button
                  onClick={onClose}
                  className="w-8 h-8 rounded-lg border border-border-DEFAULT flex items-center justify-center text-text-muted hover:text-text-primary hover:border-border-hover transition-all"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Quest title */}
                <div>
                  <label className="block text-xs font-mono text-text-muted uppercase tracking-widest mb-1.5">
                    Quest Title
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    placeholder="e.g. 45-minute workout session"
                    maxLength={120}
                    required
                    className="w-full bg-surface-subtle border border-border-DEFAULT rounded-xl px-4 py-2.5 text-sm text-text-primary placeholder-text-muted focus:outline-none focus:border-accent-indigo focus:ring-1 focus:ring-accent-indigo/30 transition-all"
                  />
                </div>

                {/* Stat selector */}
                <div>
                  <label className="block text-xs font-mono text-text-muted uppercase tracking-widest mb-1.5">
                    Stat Category
                  </label>
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center text-text-muted">
                      <IconComp className="w-4 h-4" />
                    </div>
                    <select
                      value={statId}
                      onChange={e => setStatId(e.target.value)}
                      className="w-full bg-surface-subtle border border-border-DEFAULT rounded-xl pl-10 pr-10 py-2.5 text-sm text-text-primary focus:outline-none focus:border-accent-indigo transition-all appearance-none cursor-pointer"
                    >
                      {stats.map(s => (
                        <option key={s.id} value={s.id} className="bg-surface-DEFAULT">
                          {s.name}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none" />
                  </div>
                </div>

                {/* XP Tier */}
                <div>
                  <label className="block text-xs font-mono text-text-muted uppercase tracking-widest mb-2">
                    Effort Tier
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {XP_TIERS.map(tier => (
                      <button
                        key={tier.value}
                        type="button"
                        onClick={() => setXpValue(tier.value)}
                        className={`p-3 rounded-xl border text-left transition-all duration-150 ${
                          xpValue === tier.value ? tier.color : 'border-border-DEFAULT bg-surface-subtle text-text-muted hover:border-border-hover'
                        }`}
                      >
                        <div className="text-xs font-bold mb-0.5">{tier.label}</div>
                        <div className="text-[10px] font-mono">{tier.value} XP</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Recurring toggle */}
                <div className="flex items-center justify-between py-3 px-4 bg-surface-subtle rounded-xl border border-border-DEFAULT">
                  <div>
                    <p className="text-sm font-medium text-text-primary">Daily recurring</p>
                    <p className="text-xs text-text-muted">Resets each day at midnight</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setRecurring(!recurring)}
                    className={`w-10 h-5.5 rounded-full transition-all duration-200 relative ${recurring ? 'bg-accent-indigo' : 'bg-surface-elevated border border-border-hover'}`}
                    style={{ height: '22px', width: '40px' }}
                  >
                    <span
                      className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all duration-200 ${recurring ? 'left-5' : 'left-0.5'}`}
                    />
                  </button>
                </div>

                {error && (
                  <p className="text-accent-ember text-xs font-mono">{error}</p>
                )}

                <button
                  type="submit"
                  disabled={loading || !title.trim()}
                  className="w-full py-2.5 rounded-xl bg-accent-indigo hover:bg-indigo-500 text-white text-sm font-semibold transition-all duration-200 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : 'Create Quest'}
                </button>
              </form>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
