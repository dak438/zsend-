'use client';

import React, { useState } from 'react';
import { signIn } from 'next-auth/react';
import { motion } from 'framer-motion';
import { Zap, ShieldCheck, ArrowRight } from 'lucide-react';

export default function SignupPage() {
  const [loading, setLoading] = useState(false);

  const handleGoogleSignUp = () => {
    setLoading(true);
    signIn('google', { callbackUrl: '/onboarding' });
  };

  return (
    <div className="relative min-h-screen bg-canvas flex items-center justify-center overflow-hidden px-4">
      {/* Radial glow */}
      <div
        className="pointer-events-none absolute inset-0 z-0"
        style={{
          background:
            'radial-gradient(ellipse 80% 60% at 50% -10%, rgba(139,92,246,0.18) 0%, rgba(99,102,241,0.08) 40%, transparent 70%)',
        }}
      />
      <div
        className="pointer-events-none absolute z-0"
        style={{
          bottom: '-10%',
          left: '-5%',
          width: '600px',
          height: '600px',
          background: 'radial-gradient(circle, rgba(6,182,212,0.08) 0%, transparent 60%)',
        }}
      />
      <div className="pointer-events-none absolute inset-0 z-0 auth-grid-pattern opacity-40" />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 w-full max-w-md"
      >
        {/* Logo */}
        <div className="flex items-center justify-center gap-2.5 mb-8">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-accent-violet to-accent-indigo flex items-center justify-center shadow-lg shadow-violet-500/25">
            <Zap className="w-5 h-5 text-white" fill="white" />
          </div>
          <span className="text-xl font-bold tracking-widest text-text-primary uppercase">ASCEND</span>
        </div>

        <div className="glass-card p-8 sm:p-9 border border-white/10 shadow-2xl rounded-[2rem]">
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-white/10 bg-white/5 text-[11px] font-mono text-text-muted mb-4 uppercase tracking-wider">
              <span className="w-2 h-2 rounded-full bg-accent-violet animate-pulse" />
              New Hunter Enrollment
            </div>
            <h1 className="text-2xl font-bold text-text-primary tracking-tight mb-2">
              Create Your Character
            </h1>
            <p className="text-text-secondary text-sm max-w-xs mx-auto">
              Enroll with Google to claim your hunter profile. You will customize your stats next.
            </p>
          </div>

          {/* Sole interactive element: Real Google OAuth */}
          <button
            type="button"
            onClick={handleGoogleSignUp}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 py-3.5 px-5 rounded-2xl border border-white/10 bg-surface-elevated hover:bg-surface hover:border-accent-violet/60 text-text-primary text-sm font-semibold transition-all duration-200 shadow-md group disabled:opacity-50"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-accent-violet border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>Sign up with Google</span>
                <ArrowRight className="w-4 h-4 text-text-muted group-hover:text-white group-hover:translate-x-0.5 transition-all" />
              </>
            )}
          </button>

          <div className="mt-8 pt-6 border-t border-white/5 space-y-2 text-center">
            <div className="flex items-center justify-center gap-1.5 text-xs text-text-muted font-mono">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Google Verified Identity Only</span>
            </div>
            <p className="text-[11px] text-text-muted">
              Already have an account? Simply click above to sign in.
            </p>
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-text-muted font-mono">
          HONOR SYSTEM // NO DECAY // YOUR STATS, YOUR RULES
        </p>
      </motion.div>
    </div>
  );
}
