'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Dumbbell, Swords, Brain, BookOpen, Briefcase, TrendingUp,
  HeartPulse, Flame, Zap, Target, Shield, Compass, Code,
  Sparkles, Cpu, Medal, Plus, Trash2, ChevronRight, X
} from 'lucide-react';

const ICON_MAP: Record<string, React.ReactNode> = {
  Dumbbell: <Dumbbell className="w-4 h-4" />,
  Swords: <Swords className="w-4 h-4" />,
  Brain: <Brain className="w-4 h-4" />,
  BookOpen: <BookOpen className="w-4 h-4" />,
  Briefcase: <Briefcase className="w-4 h-4" />,
  TrendingUp: <TrendingUp className="w-4 h-4" />,
  HeartPulse: <HeartPulse className="w-4 h-4" />,
  Flame: <Flame className="w-4 h-4" />,
  Zap: <Zap className="w-4 h-4" />,
  Target: <Target className="w-4 h-4" />,
  Shield: <Shield className="w-4 h-4" />,
  Compass: <Compass className="w-4 h-4" />,
  Code: <Code className="w-4 h-4" />,
  Sparkles: <Sparkles className="w-4 h-4" />,
  Cpu: <Cpu className="w-4 h-4" />,
  Medal: <Medal className="w-4 h-4" />,
};

const ALL_ICONS = Object.keys(ICON_MAP);

const ACCENT_COLORS = [
  'from-accent-indigo to-accent-violet',
  'from-accent-ember to-orange-500',
  'from-accent-cyan to-accent-indigo',
  'from-accent-emerald to-accent-cyan',
  'from-accent-amber to-accent-ember',
  'from-accent-violet to-accent-ember',
];

const DEFAULT_STATS = [
  { name: 'Strength', icon: 'Dumbbell' },
  { name: 'Intellect', icon: 'Brain' },
  { name: 'Business', icon: 'Briefcase' },
  { name: 'Vitality', icon: 'HeartPulse' },
];

interface StatDraft {
  id: string;
  name: string;
  icon: string;
}

interface IconPickerProps {
  current: string;
  onSelect: (icon: string) => void;
  onClose: () => void;
}

function IconPicker({ current, onSelect, onClose }: IconPickerProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.92 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.92 }}
      transition={{ duration: 0.18 }}
      className="absolute left-0 top-full mt-2 z-50 glass-card p-4 w-64 shadow-modal"
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs text-text-muted font-mono uppercase tracking-wider">Pick Icon</span>
        <button onClick={onClose} className="text-text-muted hover:text-text-primary transition-colors">
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
      <div className="grid grid-cols-4 gap-2">
        {ALL_ICONS.map((icon) => (
          <button
            key={icon}
            onClick={() => { onSelect(icon); onClose(); }}
            className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all duration-150 ${
              current === icon
                ? 'bg-accent-indigo/20 border border-accent-indigo text-accent-indigo'
                : 'border border-border-DEFAULT text-text-secondary hover:border-border-hover hover:text-text-primary bg-surface-subtle'
            }`}
            title={icon}
          >
            {ICON_MAP[icon]}
          </button>
        ))}
      </div>
    </motion.div>
  );
}

export default function OnboardingPage() {
  const router = useRouter();
  const [stats, setStats] = useState<StatDraft[]>(
    DEFAULT_STATS.map((s, i) => ({ id: `default-${i}`, name: s.name, icon: s.icon }))
  );
  const [pickerOpenId, setPickerOpenId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const MAX = 6;
  const MIN = 2;

  const addStat = () => {
    if (stats.length >= MAX) return;
    setStats(prev => [...prev, { id: `new-${Date.now()}`, name: '', icon: 'Target' }]);
  };

  const removeStat = (id: string) => {
    if (stats.length <= MIN) return;
    setStats(prev => prev.filter(s => s.id !== id));
  };

  const updateStat = (id: string, field: 'name' | 'icon', val: string) => {
    setStats(prev => prev.map(s => s.id === id ? { ...s, [field]: val } : s));
  };

  const handleFinish = async () => {
    const valid = stats.every(s => s.name.trim().length >= 1 && s.name.trim().length <= 30);
    if (!valid) {
      setError('All stat names must be between 1 and 30 characters.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      for (let i = 0; i < stats.length; i++) {
        const s = stats[i];
        const res = await fetch('/api/stats', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: s.name.trim(), icon: s.icon, sortOrder: i }),
        });
        if (!res.ok) {
          const d = await res.json();
          setError(d.error || 'Failed to save stats.');
          setLoading(false);
          return;
        }
      }
      router.push('/');
    } catch {
      setError('Connection failed. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-canvas flex items-center justify-center overflow-hidden py-12 px-4">
      {/* Background glow */}
      <div
        className="pointer-events-none absolute inset-0 z-0"
        style={{
          background:
            'radial-gradient(ellipse 70% 50% at 50% 0%, rgba(99,102,241,0.14) 0%, transparent 65%)',
        }}
      />
      <div className="pointer-events-none absolute inset-0 z-0 auth-grid-pattern opacity-30" />

      <motion.div
        initial={{ opacity: 0, y: 28 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 w-full max-w-lg"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-accent-indigo/30 bg-accent-indigo/10 text-accent-indigo text-xs font-mono tracking-widest mb-4">
            <Zap className="w-3 h-3" />
            STAT CONFIGURATION
          </div>
          <h1 className="text-3xl font-bold text-text-primary tracking-tight mb-2">
            Define Your Stats
          </h1>
          <p className="text-text-secondary text-sm max-w-sm mx-auto">
            Choose 2–6 life domains to track. These are the pillars your character will grow in.
          </p>
        </div>

        {/* Stat count badge */}
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs text-text-muted font-mono uppercase tracking-widest">
            {stats.length} of {MAX} stats
          </span>
          <div className="flex gap-1">
            {Array.from({ length: MAX }).map((_, i) => (
              <div
                key={i}
                className={`h-1 w-6 rounded-full transition-all duration-300 ${
                  i < stats.length ? 'bg-accent-indigo' : 'bg-surface-elevated'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Stats list */}
        <div className="glass-card p-5 mb-4">
          <AnimatePresence initial={false}>
            {stats.map((stat, idx) => (
              <motion.div
                key={stat.id}
                layout
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 16 }}
                transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                className="flex items-center gap-3 mb-3 last:mb-0"
              >
                {/* Color gradient pill */}
                <div
                  className={`w-8 h-8 rounded-lg bg-gradient-to-br ${ACCENT_COLORS[idx % ACCENT_COLORS.length]} flex items-center justify-center text-white shrink-0`}
                >
                  {ICON_MAP[stat.icon]}
                </div>

                {/* Name input */}
                <input
                  type="text"
                  value={stat.name}
                  onChange={(e) => updateStat(stat.id, 'name', e.target.value)}
                  placeholder="Stat name..."
                  maxLength={30}
                  className="flex-1 bg-surface-subtle border border-border-DEFAULT rounded-lg px-3 py-1.5 text-sm text-text-primary placeholder-text-muted focus:outline-none focus:border-accent-indigo transition-all min-w-0"
                />

                {/* Icon picker button */}
                <div className="relative">
                  <button
                    onClick={() => setPickerOpenId(pickerOpenId === stat.id ? null : stat.id)}
                    className="text-xs text-text-muted border border-border-DEFAULT px-2 py-1.5 rounded-lg hover:border-border-hover hover:text-text-primary transition-all font-mono"
                  >
                    Icon
                  </button>
                  <AnimatePresence>
                    {pickerOpenId === stat.id && (
                      <IconPicker
                        current={stat.icon}
                        onSelect={(icon) => updateStat(stat.id, 'icon', icon)}
                        onClose={() => setPickerOpenId(null)}
                      />
                    )}
                  </AnimatePresence>
                </div>

                {/* Remove button */}
                <button
                  onClick={() => removeStat(stat.id)}
                  disabled={stats.length <= MIN}
                  className="text-text-muted hover:text-accent-ember disabled:opacity-25 disabled:cursor-not-allowed transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Add stat */}
        {stats.length < MAX && (
          <motion.button
            layout
            onClick={addStat}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-dashed border-border-hover text-text-secondary hover:text-text-primary hover:border-accent-indigo/50 text-sm transition-all duration-200 mb-4"
          >
            <Plus className="w-4 h-4" />
            Add stat ({MAX - stats.length} remaining)
          </motion.button>
        )}

        {error && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-accent-ember text-xs font-mono mb-3 text-center"
          >
            {error}
          </motion.p>
        )}

        {/* Finish button */}
        <button
          onClick={handleFinish}
          disabled={loading || stats.length < MIN}
          className="w-full flex items-center justify-center gap-2 py-3 px-6 rounded-xl bg-accent-indigo hover:bg-indigo-500 text-white font-semibold text-sm transition-all duration-200 disabled:opacity-50"
        >
          {loading ? (
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <>
              Enter the System
              <ChevronRight className="w-4 h-4" />
            </>
          )}
        </button>

        <p className="mt-4 text-center text-xs text-text-muted">
          You can rename or reorder stats later from the dashboard.
        </p>
      </motion.div>
    </div>
  );
}
