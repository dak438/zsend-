'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

interface RadarStat {
  name: string;
  value: number; // 0-100 normalized percentage
  level: number;
  icon: string;
}

interface RadarChartProps {
  stats: RadarStat[];
  className?: string;
}

/**
 * Dynamic SVG polygon radar chart for 2-6 custom stats.
 * Inspired by @LegionWebDev/components/radar-chart on 21st.dev.
 */
export default function RadarChart({ stats, className = '' }: RadarChartProps) {
  const [animated, setAnimated] = useState(false);
  const size = 200;
  const center = size / 2;
  const maxRadius = center - 28;
  const levels = 4;
  const n = stats.length;

  useEffect(() => {
    const t = setTimeout(() => setAnimated(true), 200);
    return () => clearTimeout(t);
  }, []);

  if (n < 2) return null;

  // Calculate vertex positions for a regular n-gon
  const getVertex = (index: number, radius: number) => {
    const angle = (Math.PI * 2 * index) / n - Math.PI / 2;
    return {
      x: center + radius * Math.cos(angle),
      y: center + radius * Math.sin(angle),
    };
  };

  const polygonPoints = (radius: number) =>
    stats.map((_, i) => {
      const v = getVertex(i, radius);
      return `${v.x},${v.y}`;
    }).join(' ');

  const dataPoints = stats.map((s, i) => {
    const r = ((animated ? s.value : 0) / 100) * maxRadius;
    return getVertex(i, Math.max(r, 4));
  });

  const dataPolygon = dataPoints.map(p => `${p.x},${p.y}`).join(' ');

  return (
    <div className={`flex flex-col items-center ${className}`}>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="overflow-visible"
      >
        <defs>
          <radialGradient id="radarFill" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="rgba(99,102,241,0.4)" />
            <stop offset="100%" stopColor="rgba(139,92,246,0.15)" />
          </radialGradient>
          <radialGradient id="radarGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="rgba(99,102,241,0.2)" />
            <stop offset="100%" stopColor="transparent" />
          </radialGradient>
        </defs>

        {/* Background grid rings */}
        {Array.from({ length: levels }).map((_, l) => (
          <polygon
            key={l}
            points={polygonPoints(((l + 1) / levels) * maxRadius)}
            fill="none"
            stroke="rgba(255,255,255,0.06)"
            strokeWidth="1"
          />
        ))}

        {/* Axis lines from center to each vertex */}
        {stats.map((_, i) => {
          const outer = getVertex(i, maxRadius);
          return (
            <line
              key={i}
              x1={center}
              y1={center}
              x2={outer.x}
              y2={outer.y}
              stroke="rgba(255,255,255,0.06)"
              strokeWidth="1"
            />
          );
        })}

        {/* Glow under data polygon */}
        <polygon
          points={dataPolygon}
          fill="url(#radarGlow)"
          className="transition-all duration-700"
          style={{ filter: 'blur(6px)' }}
        />

        {/* Animated data polygon fill */}
        <motion.polygon
          points={dataPolygon}
          fill="url(#radarFill)"
          stroke="rgba(99,102,241,0.8)"
          strokeWidth="1.5"
          strokeLinejoin="round"
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          style={{ transformOrigin: `${center}px ${center}px` }}
        />

        {/* Vertex dots */}
        {dataPoints.map((p, i) => (
          <motion.circle
            key={i}
            cx={p.x}
            cy={p.y}
            r={3}
            fill="#6366f1"
            stroke="rgba(255,255,255,0.3)"
            strokeWidth="1"
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, delay: 0.5 + i * 0.05 }}
          />
        ))}

        {/* Axis labels */}
        {stats.map((stat, i) => {
          const labelRadius = maxRadius + 18;
          const v = getVertex(i, labelRadius);
          const anchor = v.x < center - 5 ? 'end' : v.x > center + 5 ? 'start' : 'middle';
          return (
            <text
              key={i}
              x={v.x}
              y={v.y}
              textAnchor={anchor}
              dominantBaseline="middle"
              fontSize="9"
              fill="rgba(156,163,175,0.9)"
              fontFamily="var(--font-sans)"
            >
              {stat.name.length > 7 ? stat.name.slice(0, 7) + '…' : stat.name}
            </text>
          );
        })}
      </svg>

      {/* Level legend below chart */}
      <div className="flex flex-wrap gap-x-3 gap-y-1 justify-center mt-2">
        {stats.map((stat, i) => (
          <div key={i} className="flex items-center gap-1">
            <div className="w-1.5 h-1.5 rounded-full bg-accent-indigo" />
            <span className="text-[10px] text-text-muted font-mono">
              {stat.name} <span className="text-text-secondary">Lv{stat.level}</span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
