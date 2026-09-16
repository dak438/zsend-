'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, HelpCircle, Zap, Flame, Shield } from 'lucide-react';
import Navbar from '@/components/Navbar';

const FAQ_SECTIONS = [
  {
    section: 'How It Works',
    icon: Zap,
    color: 'text-accent-indigo',
    questions: [
      {
        q: 'What is ASCEND?',
        a: 'ASCEND is a life RPG — a habit tracker framed as a character progression system. Instead of a generic to-do list, you build a custom character with 2–6 stats that represent the life domains most important to you. Completing real-world tasks earns XP. XP raises your stat levels. Your average stat level determines your overall level and rank.',
      },
      {
        q: 'How does XP work?',
        a: 'Each quest has a fixed XP value: Small (15 XP) for quick wins under 10 minutes, Medium (30 XP) for ~45 minute sessions, and Large (50 XP) for serious hour-plus efforts. XP is awarded by the server — you cannot inflate it from the client.',
      },
      {
        q: 'How is my level calculated?',
        a: 'Each stat level = floor(sqrt(xp / 50)) + 1. Your overall character level = floor(average of all stat levels). With 4 stats at XP 0, 50, 800, 3600, you\'d be at levels 1, 2, 5, 10 — with an average of 4. This formula is intentionally simple and transparent.',
      },
      {
        q: 'What are the rank tiers?',
        a: 'E (Level 1–9) → D (10–19) → C (20–34) → B (35–49) → A (50–69) → S (70+). Ranks are purely cosmetic — they are a reflection of consistent long-term execution, not short-term grinding.',
      },
    ],
  },
  {
    section: 'Custom Stats',
    icon: Shield,
    color: 'text-accent-violet',
    questions: [
      {
        q: 'Can I create my own stats?',
        a: 'Yes — during onboarding you pick between 2 and 6 custom stats. You can name them anything (max 30 characters) and choose from 16 curated Lucide icons. You can rename or change icons later from the dashboard. Defaults are Strength, Intellect, Business, and Vitality.',
      },
      {
        q: 'Why is there a 2–6 stat limit?',
        a: 'This is a deliberate design constraint, not a limitation. Fewer than 2 stats makes the radar chart meaningless. More than 6 leads to stat dilution — your XP per stat shrinks so small that progress feels invisible. The 2–6 range keeps focus tight while allowing genuine customization.',
      },
      {
        q: 'Will deleting a stat delete my XP history?',
        a: 'No. Stats are soft-deleted — they are marked inactive but your historical XP and quest completions remain in the database. If you\'re building a progress chart, past completions will still appear in the data. Only currently active stats appear on the dashboard.',
      },
      {
        q: 'Can I have more than 6 stats in the future?',
        a: 'This cap is a fixed product decision for v2 and is not planned to change. If you have a strong case for why it should be different, raise it — but it is not an oversight or easy configuration change.',
      },
    ],
  },
  {
    section: 'Streaks & Honesty',
    icon: Flame,
    color: 'text-accent-ember',
    questions: [
      {
        q: 'How do streaks work?',
        a: 'Each stat and your character overall has an independent streak counter. A streak increments when you complete at least one quest in that stat category on a consecutive calendar day (in your timezone). Completing a second quest on the same day does not double your streak. Missing a day resets the streak to 0.',
      },
      {
        q: 'Is there stat decay?',
        a: 'No. There is no XP decay, stat decay, or penalty for missed days. XP is permanent. The only thing that resets is the streak counter. This is a deliberate design choice — ASCEND is a system for tracking real achievements, not for punishing life.',
      },
      {
        q: 'Can I lie and mark quests complete without doing them?',
        a: 'Yes. There is no verification layer. ASCEND operates on the Honor System. The only person you\'re cheating is your future self. The XP math and progression system are designed to be meaningful — inflating them with false completions defeats the entire point of the product.',
      },
      {
        q: 'Does timezone matter?',
        a: 'Yes. Quest completions and streaks are resolved against your local timezone, set at signup. If you complete a quest at 11:58 PM local time it counts as today\'s completion, not tomorrow\'s. This is computed server-side based on your stored timezone setting.',
      },
    ],
  },
  {
    section: 'Privacy & Account',
    icon: HelpCircle,
    color: 'text-accent-cyan',
    questions: [
      {
        q: 'What data do you store?',
        a: 'We store your Google profile email, name, avatar image URL, timezone, character progression data (levels, XP, streaks), custom stat configuration, quests, and daily quest completion records. We never handle or store passwords, financial data, or sensitive device information.',
      },
      {
        q: 'How is my account secured?',
        a: 'Authentication is handled exclusively via Google OAuth 2.0 with a hard verification gate (email_verified must be true). We never store or manage passwords. Your session is protected by 256-bit signed HTTP-only secure cookies.',
      },
      {
        q: 'Can I delete my account?',
        a: 'Account deletion is planned for a future update. If you need your account and data deleted immediately, please contact us directly. This is flagged as a known gap in v2.',
      },
      {
        q: 'Is ASCEND free?',
        a: 'Yes. ASCEND v2 is completely free. There are no paid tiers, no paywalls, and no feature limits beyond the 2–6 stat cap which is a design constraint, not a monetization gate.',
      },
    ],
  },
];

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-border-DEFAULT last:border-0">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-start justify-between gap-4 py-4 text-left group"
      >
        <span className={`text-sm font-medium transition-colors ${open ? 'text-text-primary' : 'text-text-secondary group-hover:text-text-primary'}`}>
          {q}
        </span>
        <motion.div
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="shrink-0 mt-0.5"
        >
          <ChevronDown className="w-4 h-4 text-text-muted" />
        </motion.div>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden"
          >
            <p className="pb-4 text-sm text-text-muted leading-relaxed">{a}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

const faqJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: FAQ_SECTIONS.flatMap(section =>
    section.questions.map(q => ({
      '@type': 'Question',
      name: q.q,
      acceptedAnswer: {
        '@type': 'Answer',
        text: q.a,
      },
    }))
  ),
};

export default function FAQPage() {
  return (
    <div className="min-h-screen bg-canvas relative">
      {/* Schema.org FAQPage Structured Data for Rich Results */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <div className="pointer-events-none fixed inset-0 z-0" style={{ background: 'radial-gradient(ellipse 60% 40% at 50% 0%, rgba(99,102,241,0.07) 0%, transparent 60%)' }} />
      <div className="pointer-events-none fixed inset-0 z-0 bento-dot-grid opacity-20" />

      <div className="relative z-10 flex flex-col min-h-screen">
        <Navbar />

        <main className="flex-1 max-w-3xl w-full mx-auto px-4 sm:px-6 py-10">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
            className="mb-10 text-center"
          >
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-accent-indigo/30 bg-accent-indigo/10 text-accent-indigo text-xs font-mono tracking-widest mb-4">
              <HelpCircle className="w-3 h-3" />
              FAQ
            </div>
            <h1 className="text-3xl font-black text-text-primary tracking-tight mb-2">Frequently Asked Questions</h1>
            <p className="text-text-muted text-sm max-w-md mx-auto">Everything you need to know about ASCEND's progression system, stats, streaks, and privacy.</p>
          </motion.div>

          {/* FAQ Sections */}
          <div className="space-y-5">
            {FAQ_SECTIONS.map((section, sIdx) => {
              const IconComp = section.icon;
              return (
                <motion.div
                  key={section.section}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: sIdx * 0.08, ease: [0.16, 1, 0.3, 1] }}
                  className="glass-card overflow-hidden"
                >
                  {/* Section header */}
                  <div className="flex items-center gap-3 px-6 py-4 border-b border-border-DEFAULT">
                    <div className={`w-7 h-7 rounded-lg bg-surface-elevated border border-border-DEFAULT flex items-center justify-center ${section.color}`}>
                      <IconComp className="w-3.5 h-3.5" />
                    </div>
                    <h2 className="text-sm font-bold text-text-primary">{section.section}</h2>
                    <span className="ml-auto text-[10px] font-mono text-text-muted">{section.questions.length} questions</span>
                  </div>

                  {/* Questions */}
                  <div className="px-6">
                    {section.questions.map((item) => (
                      <FAQItem key={item.q} q={item.q} a={item.a} />
                    ))}
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Footer note */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-center text-xs text-text-muted font-mono mt-10"
          >
            ASCEND v2 // HONOR SYSTEM // BETA
          </motion.p>
        </main>
      </div>
    </div>
  );
}
