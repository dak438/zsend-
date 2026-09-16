'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Zap, ArrowRight, ArrowLeft, X, Shield, Sparkles,
  Trophy, Flame, CheckCircle, BarChart2, Compass
} from 'lucide-react';

export interface WalkthroughStep {
  targetId?: string; // DOM id to spotlight, undefined for centered modal
  title: string;
  badge: string;
  description: string;
  subtext?: string;
  icon: React.ElementType;
}

const STEPS: WalkthroughStep[] = [
  {
    title: 'Welcome to ASCEND',
    badge: 'System Initialization',
    description:
      'Transform your daily execution into a real-life character progression system. Instead of a generic to-do list, your life is framed as an RPG character with custom stats.',
    subtext: 'Let\'s take a 60-second tour of your new command center.',
    icon: Zap,
  },
  {
    targetId: 'tour-rank-level',
    title: 'Rank & Overall Level',
    badge: 'Character Progression',
    description:
      'Your overall character level is the exact average of all your active stat levels. Leveling up requires holistic growth across all your life domains — you cannot achieve S-Rank by neglecting other stats.',
    subtext: 'Ranks range from E (Novice) up to S (National Level).',
    icon: Trophy,
  },
  {
    targetId: 'tour-stat-matrix',
    title: 'Core Attributes Matrix',
    badge: 'Custom Attributes',
    description:
      'Each custom attribute tracks XP earned from real-world execution. As you complete quests, your progress bar fills and raises your attribute level via the formula: floor(sqrt(XP / 50)) + 1.',
    subtext: 'You can customize, rename, or manage your 2–6 stats anytime.',
    icon: Shield,
  },
  {
    targetId: 'tour-quest-log',
    title: 'System Objectives (Quests)',
    badge: 'Daily Execution',
    description:
      'This is your daily command hub. Add and complete daily recurring habits or one-off challenges. Completing an objective instantly awards 15, 30, or 50 XP to its linked attribute.',
    subtext: 'Filter by pending, completed, or specific attributes.',
    icon: CheckCircle,
  },
  {
    targetId: 'tour-streak',
    title: 'Honor Streaks // No Stat Decay',
    badge: 'Streak Integrity',
    description:
      'Executing at least one quest per day builds your streak. If you miss a day, your streak resets, but you NEVER lose earned XP. Stat decay does not exist in ASCEND — your progress is permanent.',
    subtext: 'Daily reset occurs at midnight in your local timezone.',
    icon: Flame,
  },
  {
    targetId: 'tour-nav-progress',
    title: 'Progress Analytics',
    badge: 'Trajectory View',
    description:
      'Access the Progress view anytime from the navigation bar to inspect 7-day, 30-day, and all-time visual trajectory curves across each of your custom attributes.',
    subtext: 'Identify imbalances and see which areas need attention.',
    icon: BarChart2,
  },
  {
    title: 'System Initialized & Ready',
    badge: 'Ready For Deployment',
    description:
      'You are now fully equipped. Claim your first daily objective, earn XP, and begin your ascent.',
    subtext: 'You can re-open this guide anytime via the Tutorial button in the header.',
    icon: Sparkles,
  },
];

interface OnboardingWalkthroughProps {
  isOpen: boolean;
  onClose: () => void;
  onFinish?: () => void;
}

export default function OnboardingWalkthrough({
  isOpen,
  onClose,
  onFinish,
}: OnboardingWalkthroughProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [spotlightRect, setSpotlightRect] = useState<DOMRect | null>(null);

  const step = STEPS[currentStep];
  const isFirst = currentStep === 0;
  const isLast = currentStep === STEPS.length - 1;

  // Measure spotlight target bounding box
  const updateSpotlight = useCallback(() => {
    if (!step.targetId) {
      setSpotlightRect(null);
      return;
    }

    const el = document.getElementById(step.targetId);
    if (el) {
      const rect = el.getBoundingClientRect();
      setSpotlightRect(rect);
      // Scroll into view gently if off-screen
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    } else {
      setSpotlightRect(null);
    }
  }, [step.targetId]);

  useEffect(() => {
    if (!isOpen) return;
    updateSpotlight();

    window.addEventListener('resize', updateSpotlight);
    window.addEventListener('scroll', updateSpotlight, true);
    return () => {
      window.removeEventListener('resize', updateSpotlight);
      window.removeEventListener('scroll', updateSpotlight, true);
    };
  }, [isOpen, currentStep, updateSpotlight]);

  const handleNext = async () => {
    if (isLast) {
      await handleComplete();
    } else {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleSkip = async () => {
    await handleComplete();
  };

  const handleComplete = async () => {
    try {
      await fetch('/api/character/walkthrough', { method: 'POST' });
    } catch {}
    onClose();
    if (onFinish) onFinish();
  };

  if (!isOpen) return null;

  const IconComp = step.icon;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 overflow-hidden font-sans">
        {/* Dim Overlay */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/80 backdrop-blur-[2px] transition-all duration-300"
        />

        {/* Dynamic Spotlight Cutout Hole */}
        {spotlightRect && (
          <motion.div
            initial={false}
            animate={{
              top: Math.max(0, spotlightRect.top - 8),
              left: Math.max(0, spotlightRect.left - 8),
              width: spotlightRect.width + 16,
              height: spotlightRect.height + 16,
            }}
            transition={{ type: 'spring', stiffness: 350, damping: 30 }}
            className="absolute rounded-3xl pointer-events-none border-2 border-accent-indigo shadow-[0_0_0_9999px_rgba(0,0,0,0.8),0_0_30px_rgba(99,102,241,0.5)] z-40"
          />
        )}

        {/* Modal / Tooltip Card */}
        <div className="relative z-50 h-full w-full flex items-center justify-center p-4 sm:p-6 pointer-events-none">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, scale: 0.95, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -16 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="pointer-events-auto w-full max-w-lg rounded-[2rem] border border-white/15 bg-[#12141a]/95 backdrop-blur-2xl shadow-2xl p-6 sm:p-8 text-white relative overflow-hidden"
          >
            {/* Ambient inner glow */}
            <div
              className="pointer-events-none absolute -top-24 -left-24 w-48 h-48 rounded-full"
              style={{ background: 'radial-gradient(circle, rgba(99,102,241,0.25) 0%, transparent 70%)' }}
            />

            {/* Header: Badge & Skip Button */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-accent-indigo to-accent-violet flex items-center justify-center shadow-md shadow-indigo-500/20">
                  <IconComp className="w-4 h-4 text-white" />
                </div>
                <span className="text-[11px] font-mono uppercase tracking-widest text-accent-indigo font-bold px-2.5 py-0.5 rounded-full bg-accent-indigo/10 border border-accent-indigo/20">
                  {step.badge}
                </span>
              </div>

              <button
                onClick={handleSkip}
                className="text-xs font-mono text-text-muted hover:text-white px-2.5 py-1 rounded-lg hover:bg-white/5 transition-colors uppercase tracking-wider"
              >
                Skip Tour
              </button>
            </div>

            {/* Step Title & Content */}
            <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-white mb-3">
              {step.title}
            </h3>

            <p className="text-text-secondary text-sm leading-relaxed mb-4">
              {step.description}
            </p>

            {step.subtext && (
              <div className="p-3 rounded-xl border border-white/10 bg-white/[0.03] text-xs font-mono text-text-muted mb-6 flex items-start gap-2">
                <Compass className="w-4 h-4 text-accent-cyan shrink-0 mt-0.5" />
                <span>{step.subtext}</span>
              </div>
            )}

            {/* Navigation footer */}
            <div className="flex items-center justify-between pt-4 border-t border-white/10">
              {/* Step indicator dots */}
              <div className="flex items-center gap-1.5">
                {STEPS.map((_, idx) => (
                  <div
                    key={idx}
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      idx === currentStep
                        ? 'w-6 bg-accent-indigo'
                        : idx < currentStep
                        ? 'w-2 bg-white/40'
                        : 'w-2 bg-white/15'
                    }`}
                  />
                ))}
                <span className="text-[10px] font-mono text-text-muted ml-2">
                  {currentStep + 1}/{STEPS.length}
                </span>
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-2">
                {!isFirst && (
                  <button
                    onClick={handleBack}
                    className="flex items-center gap-1 text-xs font-mono text-text-muted hover:text-white px-3 py-2 rounded-xl border border-white/10 hover:border-white/20 bg-white/[0.02] hover:bg-white/[0.06] transition-all"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Back</span>
                  </button>
                )}

                <button
                  onClick={handleNext}
                  className="flex items-center gap-2 text-xs font-semibold text-white bg-gradient-to-r from-accent-indigo to-accent-violet hover:from-indigo-500 hover:to-violet-500 px-4 py-2.5 rounded-xl transition-all shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40"
                >
                  <span>{isLast ? 'Begin Ascension' : 'Next Step'}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </AnimatePresence>
  );
}
