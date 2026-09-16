'use client';

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';

interface StatMeta {
  id: string;
  name: string;
  icon: string;
}

interface DataPoint {
  date: string;
  total: number;
  [statName: string]: number | string;
}

interface ProgressChartProps {
  timeline: DataPoint[];
  stats: StatMeta[];
  className?: string;
}

const STAT_COLORS = [
  '#6366f1', // indigo
  '#f43f5e', // ember
  '#06b6d4', // cyan
  '#10b981', // emerald
  '#f59e0b', // amber
  '#8b5cf6', // violet
];

export default function ProgressChart({ timeline, stats, className = '' }: ProgressChartProps) {
  const width = 600;
  const height = 200;
  const padL = 36;
  const padR = 16;
  const padT = 16;
  const padB = 32;
  const chartW = width - padL - padR;
  const chartH = height - padT - padB;

  const maxXp = useMemo(() => {
    const totals = timeline.map(d => d.total as number);
    return Math.max(...totals, 1);
  }, [timeline]);

  const xScale = (i: number) => padL + (i / Math.max(timeline.length - 1, 1)) * chartW;
  const yScale = (v: number) => padT + chartH - (v / maxXp) * chartH;

  const buildPath = (statName: string) => {
    if (timeline.length === 0) return '';
    return timeline.map((d, i) => {
      const v = (d[statName] as number) || 0;
      return `${i === 0 ? 'M' : 'L'}${xScale(i).toFixed(1)},${yScale(v).toFixed(1)}`;
    }).join(' ');
  };

  const buildArea = (statName: string) => {
    if (timeline.length === 0) return '';
    const linePts = timeline.map((d, i) =>
      `${xScale(i).toFixed(1)},${yScale((d[statName] as number) || 0).toFixed(1)}`
    ).join(' L ');
    return `M ${xScale(0).toFixed(1)},${yScale(0).toFixed(1)} L ${linePts} L ${xScale(timeline.length - 1).toFixed(1)},${yScale(0).toFixed(1)} Z`;
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    const [, m, d] = dateStr.split('-');
    return `${parseInt(m)}/${parseInt(d)}`;
  };

  const tickStep = Math.ceil(timeline.length / 7);
  const tickIndices = timeline.map((_, i) => i).filter(i => i % tickStep === 0);
  const yTicks = [0, Math.round(maxXp * 0.5), maxXp];

  return (
    <div className={`w-full ${className}`}>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-auto overflow-visible"
        preserveAspectRatio="none"
      >
        <defs>
          {stats.map((s, idx) => (
            <linearGradient key={s.id} id={`grad-${s.id}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={STAT_COLORS[idx % STAT_COLORS.length]} stopOpacity="0.2" />
              <stop offset="100%" stopColor={STAT_COLORS[idx % STAT_COLORS.length]} stopOpacity="0" />
            </linearGradient>
          ))}
        </defs>

        {yTicks.map(v => (
          <g key={v}>
            <line x1={padL} y1={yScale(v)} x2={padL + chartW} y2={yScale(v)} stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
            <text x={padL - 4} y={yScale(v)} dominantBaseline="middle" textAnchor="end" fontSize="8" fill="rgba(156,163,175,0.7)">{v}</text>
          </g>
        ))}

        {tickIndices.map(i => (
          <text key={i} x={xScale(i)} y={padT + chartH + 14} textAnchor="middle" fontSize="8" fill="rgba(156,163,175,0.7)">
            {formatDate(timeline[i]?.date || '')}
          </text>
        ))}

        {stats.map((s, idx) => (
          <path key={`area-${s.id}`} d={buildArea(s.name)} fill={`url(#grad-${s.id})`} />
        ))}

        {stats.map((s, idx) => (
          <motion.path
            key={`line-${s.id}`}
            d={buildPath(s.name)}
            fill="none"
            stroke={STAT_COLORS[idx % STAT_COLORS.length]}
            strokeWidth="1.5"
            strokeLinejoin="round"
            strokeLinecap="round"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ duration: 1, delay: idx * 0.12, ease: 'easeOut' }}
          />
        ))}

        {stats.map((s, idx) =>
          timeline.map((d, i) => {
            const v = (d[s.name] as number) || 0;
            if (v === 0) return null;
            return (
              <circle key={`dot-${s.id}-${i}`} cx={xScale(i)} cy={yScale(v)} r="2.5"
                fill={STAT_COLORS[idx % STAT_COLORS.length]} opacity="0.8" />
            );
          })
        )}
      </svg>

      <div className="flex flex-wrap gap-3 mt-3 justify-center">
        {stats.map((s, idx) => (
          <div key={s.id} className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full" style={{ background: STAT_COLORS[idx % STAT_COLORS.length] }} />
            <span className="text-[11px] font-mono text-text-muted">{s.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
