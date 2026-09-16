'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Dumbbell, Swords, Brain, BookOpen, Briefcase, TrendingUp,
  HeartPulse, Flame, Zap, Target, Shield, Compass, Code,
  Sparkles, Cpu, Medal, X, Plus, Trash2, GripVertical
} from 'lucide-react';

const ICON_MAP: Record<string, React.ElementType> = {
  Dumbbell, Swords, Brain, BookOpen, Briefcase, TrendingUp,
  HeartPulse, Flame, Zap, Target, Shield, Compass, Code,
  Sparkles, Cpu, Medal,
};

const ALL_ICONS = Object.keys(ICON_MAP);

interface Stat {
  id: string;
  name: string;
  icon: string;
  xp: number;
  streak: number;
  active: boolean;
}

interface ManageStatsModalProps {
  isOpen: boolean;
  onClose: () => void;
  stats: Stat[];
  onUpdated: () => void;
}

export default function ManageStatsModal({ isOpen, onClose, stats, onUpdated }: ManageStatsModalProps) {
  const [pickerOpenId, setPickerOpenId] = useState<string | null>(null);
  const [localStats, setLocalStats] = useState<Stat[]>([]);
  const [addName, setAddName] = useState('');
  const [addIcon, setAddIcon] = useState('Target');
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState('');

  React.useEffect(() => {
    if (isOpen) setLocalStats(stats.filter(s => s.active));
  }, [isOpen, stats]);

  const activeCount = localStats.length;
  const MIN = 2;
  const MAX = 6;

  const handleRename = async (id: string, name: string) => {
    setLoading(id);
    try {
      const res = await fetch(`/api/stats/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });
      if (!res.ok) { const d = await res.json(); setError(d.error || 'Update failed.'); }
    } catch { setError('Connection failed.'); }
    finally { setLoading(null); }
  };

  const handleChangeIcon = async (id: string, icon: string) => {
    setLoading(id);
    try {
      await fetch(`/api/stats/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ icon }),
      });
    } catch {}
    finally { setLoading(null); }
  };

  const handleDelete = async (id: string) => {
    if (activeCount <= MIN) return;
    setLoading(id);
    try {
      const res = await fetch(`/api/stats/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setLocalStats(prev => prev.filter(s => s.id !== id));
        onUpdated();
      } else {
        const d = await res.json();
        setError(d.error || 'Delete failed.');
      }
    } catch { setError('Connection failed.'); }
    finally { setLoading(null); }
  };

  const handleAdd = async () => {
    if (!addName.trim() || activeCount >= MAX) return;
    setLoading('add');
    try {
      const res = await fetch('/api/stats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: addName.trim(), icon: addIcon, sortOrder: activeCount }),
      });
      const d = await res.json();
      if (!res.ok) { setError(d.error || 'Create failed.'); return; }
      setLocalStats(prev => [...prev, d]);
      setAddName('');
      setAddIcon('Target');
      onUpdated();
    } catch { setError('Connection failed.'); }
    finally { setLoading(null); }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-canvas/80 backdrop-blur-sm z-40"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 20 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div className="w-full max-w-md glass-card p-6 shadow-modal max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h2 className="text-lg font-bold text-text-primary">Manage Stats</h2>
                  <p className="text-xs text-text-muted font-mono mt-0.5">{activeCount} / {MAX} active</p>
                </div>
                <button onClick={onClose} className="w-8 h-8 rounded-lg border border-border-DEFAULT flex items-center justify-center text-text-muted hover:text-text-primary transition-all">
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Stat count bar */}
              <div className="flex gap-1 mb-5">
                {Array.from({ length: MAX }).map((_, i) => (
                  <div key={i} className={`flex-1 h-1 rounded-full transition-all ${i < activeCount ? 'bg-accent-indigo' : 'bg-surface-elevated'}`} />
                ))}
              </div>

              {/* Existing stats */}
              <div className="space-y-2 mb-5">
                <AnimatePresence initial={false}>
                  {localStats.map((stat) => {
                    const IconComp = ICON_MAP[stat.icon] || Target;
                    return (
                      <motion.div
                        key={stat.id}
                        layout
                        initial={{ opacity: 0, x: -12 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 12 }}
                        transition={{ duration: 0.2 }}
                        className="flex items-center gap-3 p-3 bg-surface-elevated rounded-xl border border-border-DEFAULT"
                      >
                        <GripVertical className="w-4 h-4 text-text-muted shrink-0 cursor-grab" />

                        {/* Icon button */}
                        <div className="relative">
                          <button
                            onClick={() => setPickerOpenId(pickerOpenId === stat.id ? null : stat.id)}
                            className="w-8 h-8 rounded-lg bg-surface-subtle border border-border-DEFAULT flex items-center justify-center text-text-secondary hover:border-border-hover transition-all"
                          >
                            <IconComp className="w-4 h-4" />
                          </button>
                          <AnimatePresence>
                            {pickerOpenId === stat.id && (
                              <motion.div
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                className="absolute left-0 top-10 z-50 glass-card p-3 w-52 shadow-modal"
                              >
                                <div className="grid grid-cols-4 gap-1.5">
                                  {ALL_ICONS.map(icon => {
                                    const Ic = ICON_MAP[icon];
                                    return (
                                      <button
                                        key={icon}
                                        onClick={() => {
                                          setLocalStats(prev => prev.map(s => s.id === stat.id ? { ...s, icon } : s));
                                          handleChangeIcon(stat.id, icon);
                                          setPickerOpenId(null);
                                        }}
                                        className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all ${stat.icon === icon ? 'bg-accent-indigo/20 border border-accent-indigo text-accent-indigo' : 'border border-border-DEFAULT text-text-muted hover:border-border-hover'}`}
                                      >
                                        <Ic className="w-3.5 h-3.5" />
                                      </button>
                                    );
                                  })}
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>

                        {/* Name input */}
                        <input
                          type="text"
                          defaultValue={stat.name}
                          maxLength={30}
                          onBlur={(e) => {
                            const newName = e.target.value.trim();
                            if (newName && newName !== stat.name) handleRename(stat.id, newName);
                          }}
                          className="flex-1 bg-transparent text-sm text-text-primary focus:outline-none border-b border-transparent focus:border-border-hover transition-all min-w-0 pb-0.5"
                        />

                        {/* XP */}
                        <span className="text-[10px] font-mono text-text-muted tabular-nums shrink-0">{stat.xp} XP</span>

                        {/* Delete */}
                        <button
                          onClick={() => handleDelete(stat.id)}
                          disabled={activeCount <= MIN || loading === stat.id}
                          className="text-text-muted hover:text-accent-ember disabled:opacity-25 disabled:cursor-not-allowed transition-colors"
                        >
                          {loading === stat.id ? (
                            <div className="w-3.5 h-3.5 border border-text-muted border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <Trash2 className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>

              {/* Add new stat */}
              {activeCount < MAX && (
                <div className="p-4 rounded-xl border border-dashed border-border-hover bg-surface-subtle">
                  <p className="text-xs font-mono text-text-muted uppercase tracking-widest mb-3">Add New Stat</p>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={addName}
                      onChange={e => setAddName(e.target.value)}
                      placeholder="Stat name..."
                      maxLength={30}
                      className="flex-1 bg-surface-elevated border border-border-DEFAULT rounded-lg px-3 py-2 text-sm text-text-primary placeholder-text-muted focus:outline-none focus:border-accent-indigo transition-all"
                    />
                    <button
                      onClick={handleAdd}
                      disabled={!addName.trim() || loading === 'add'}
                      className="px-3 py-2 bg-accent-indigo hover:bg-indigo-500 rounded-lg text-white disabled:opacity-50 transition-all"
                    >
                      {loading === 'add' ? (
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <Plus className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
              )}

              {error && <p className="text-accent-ember text-xs font-mono mt-3">{error}</p>}

              <button
                onClick={onClose}
                className="w-full mt-4 py-2.5 rounded-xl bg-surface-elevated border border-border-hover text-sm font-semibold text-text-primary hover:border-accent-indigo/40 transition-all"
              >
                Done
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
