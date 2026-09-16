'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import Navbar from '@/components/Navbar';
import ProgressChart from '@/components/ProgressChart';
import { BarChart2, Zap } from 'lucide-react';

const RANGES = [
  { label: '7 days', value: '7d' },
  { label: '30 days', value: '30d' },
  { label: 'All time', value: 'all' },
];

interface StatMeta { id: string; name: string; icon: string; }
interface DataPoint { date: string; total: number; [key: string]: number | string; }

export default function ProgressPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [character, setCharacter] = useState<any>(null);
  const [range, setRange] = useState('7d');
  const [timeline, setTimeline] = useState<DataPoint[]>([]);
  const [totals, setTotals] = useState<Record<string, number>>({});
  const [stats, setStats] = useState<StatMeta[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const meRes = await fetch('/api/auth/me');
      if (!meRes.ok) { router.push('/login'); return; }
      const { user: u } = await meRes.json();
      setUser(u);
      const charRes = await fetch('/api/character');
      if (charRes.ok) setCharacter(await charRes.json());
      setLoading(false);
    })();
  }, []);

  useEffect(() => {
    (async () => {
      const res = await fetch(`/api/progress?range=${range}`);
      if (res.ok) {
        const d = await res.json();
        setTimeline(d.timeline || []);
        setTotals(d.totals || {});
        setStats(d.stats || []);
      }
    })();
  }, [range]);

  if (loading) {
    return (
      <div className="min-h-screen bg-canvas flex items-center justify-center">
        <div className="flex items-center gap-2 text-text-muted font-mono text-xs">
          <div className="w-4 h-4 border-2 border-accent-indigo/40 border-t-accent-indigo rounded-full animate-spin" />
          Loading...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-canvas relative">
      <div className="pointer-events-none fixed inset-0 z-0" style={{ background: 'radial-gradient(ellipse 60% 40% at 50% 0%, rgba(99,102,241,0.07) 0%, transparent 60%)' }} />
      <div className="pointer-events-none fixed inset-0 z-0 bento-dot-grid opacity-20" />
      <div className="relative z-10 flex flex-col min-h-screen">
        <Navbar userEmail={user?.email} overallStreak={character?.overallStreak} rank={character?.rank} level={character?.overallLevel} />
        <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }} className="mb-6">
            <div className="flex items-center gap-2 mb-1">
              <BarChart2 className="w-5 h-5 text-accent-indigo" />
              <h1 className="text-xl font-bold text-text-primary">Progress Report</h1>
            </div>
            <p className="text-sm text-text-muted">XP earned per stat over time.</p>
          </motion.div>

          <div className="flex gap-2 mb-6">
            {RANGES.map(r => (
              <button key={r.value} onClick={() => setRange(r.value)}
                className={`text-xs font-mono px-3 py-1.5 rounded-lg border transition-all duration-150 ${range === r.value ? 'bg-accent-indigo/10 border-accent-indigo/40 text-accent-indigo' : 'border-border-DEFAULT text-text-muted hover:border-border-hover hover:text-text-primary'}`}>
                {r.label}
              </button>
            ))}
          </div>

          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }} className="glass-card p-6 mb-6">
            <h2 className="text-xs font-mono text-text-muted uppercase tracking-widest mb-5">XP Timeline</h2>
            {timeline.length > 0 && stats.length > 0 ? (
              <ProgressChart timeline={timeline} stats={stats} />
            ) : (
              <div className="flex flex-col items-center h-40 justify-center">
                <Zap className="w-8 h-8 text-text-muted opacity-30 mb-3" />
                <p className="text-sm text-text-muted">No data yet. Complete quests to see progress.</p>
              </div>
            )}
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }} className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {stats.map(s => (
              <div key={s.id} className="glass-card p-4">
                <p className="text-xs font-mono text-text-muted uppercase tracking-wider mb-1">{s.name}</p>
                <p className="text-2xl font-black tabular-nums text-text-primary">{totals[s.name] || 0}</p>
                <p className="text-[10px] font-mono text-text-muted mt-0.5">XP</p>
              </div>
            ))}
            <div className="glass-card p-4">
              <p className="text-xs font-mono text-text-muted uppercase tracking-wider mb-1">Total</p>
              <p className="text-2xl font-black tabular-nums text-accent-indigo">{totals.total || 0}</p>
              <p className="text-[10px] font-mono text-text-muted mt-0.5">XP earned</p>
            </div>
          </motion.div>
        </main>
      </div>
    </div>
  );
}
