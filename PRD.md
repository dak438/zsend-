# PRD.md — [Working Title: ASCEND] (v2 — Public Launch, ~100 users)

## 1. Problem Statement

Daksh (and by extension, the target user) is executing across multiple unrelated life domains simultaneously — physical training, academic study, entrepreneurship, health, or whatever domains matter to that specific user — with no unified way to see whether they're actually progressing or just busy. Existing habit trackers are flat: a checkbox has the same weight every day forever, and there's no sense of accumulated identity or "growth." This product reframes daily execution as **stat growth on a character**, so consistency compounds into a visible, motivating sense of becoming stronger — not just a longer checkmark streak.

## 2. Target User (v2 — public launch, ~100 users)

Primary: self-directed individuals (students, early founders, self-improvement-focused people) running multiple simultaneous life-improvement tracks who respond to game-like progression systems more than plain habit trackers. Public SaaS product — users sign up independently, not gated to Daksh's specific life domains. This is the reason stats moved from fixed to user-defined in v2 (see §4.1).

## 3. Core User Story

> "I define the stats that matter to my life. Every day, I complete tasks tied to those stats. Each completed task gives XP to the matching stat. My character levels up and ranks up over time. I can see, at a glance, which areas of my life I'm actually investing in and which I'm neglecting."

## 4. Scope — v2 (Public Launch, ~100 users)

### 4.1 Custom Stats (changed from v1's fixed 4)

**This is the central v2 change.** Stats are no longer hardcoded STR/INT/BIZ/VIT — each user defines their own during onboarding.

- **Count:** minimum 2, maximum 6 stats per user (hard cap — see ARCHITECTURE.md §2 for the reasoning: this bounds both UI complexity and game-balance skew in the overall-level formula).
- **Onboarding:** new users are shown 4 suggested defaults (Strength/Exercise, Intellect/Study, Business/Entrepreneurship, Vitality/Health) which they can accept as-is, rename, delete, or replace. They can also skip defaults entirely and build from scratch, as long as they end with 2–6 stats before finishing onboarding.
- **Per-stat fields:** name (user-defined string, capped length), icon (chosen from a fixed Lucide icon set — not free-form upload, to keep visual consistency per DESIGN.md), XP (server-tracked, same mechanics as v1).
- **Editing after onboarding:** users can rename/re-icon existing stats and add/remove stats later (within the 2–6 cap), but changing stat count mid-use recalculates leveling  going forward — it does not retroactively rewrite history (see ARCHITECTURE.md §3 for exact behavior).

### 4.2 Quests (Tasks)
- User creates tasks under one of the 4 stat categories.
- Each task has: title, stat category, XP value (default suggested value based on effort tier — see 4.2.1), frequency (one-off vs. daily recurring).
- Recurring daily quests reset each day at local midnight (see Architecture for timezone handling).
- Marking a quest complete is **honor-system** — a single tap/click, no proof required. This is a deliberate v1 decision (see Section 8, Non-Goals).

**4.2.1 Effort tiers (suggested XP, user can override):**
- Small (15 XP) — e.g. "10 min stretch," "review flashcards"
- Medium (30 XP) — e.g. "45 min workout," "1hr study block"
- Large (50 XP) — e.g. "cold call session," "full leg day"

### 4.3 Leveling System
- XP accumulates per-stat AND rolls up into an overall Character Level.
- Per-stat level formula and overall level formula: see ARCHITECTURE.md §4 for exact curve (must be specified numerically before build, not left to the coding agent to invent).
- Rank tiers (E, D, C, B, A, S) are cosmetic milestones tied to overall Character Level, not a separate system — e.g. E: Lv 1–9, D: Lv 10–19, etc. (exact thresholds in ARCHITECTURE.md).

### 4.4 Streaks
- Per-stat streak counter: consecutive days with at least one completed quest in that stat.
- Overall streak: consecutive days with at least one completed quest in ANY stat.
- **No XP decay or stat loss on missed days** (deliberate — see Section 8). Missing a day breaks the streak counter only; it does not reduce accumulated XP or level.

### 4.5 Dashboard (Home Screen)
- Status-window panel: current level, rank, XP bar to next level, 4 stat bars with current values.
- Today's quest list, grouped by stat, with complete/incomplete toggle.
- Current streak (overall + per-stat) visible at a glance.

### 4.6 Progress View
- Historical view: XP gained over time per stat (line/bar chart), so the user can see which life area they're neglecting.
- Simple date-range filter (7 days / 30 days / all-time).

### 4.7 Auth & Accounts
- **Google OAuth only** (v2 — changed from v1's email/password plan). No password storage, no password reset flow, no email verification flow — Google handles identity. See SECURITY.md and ARCHITECTURE.md for implementation.
- Each user has one character (one set of 2–6 custom stats, per §4.1). No multi-character support in v2.

### 4.8 FAQ Page
- Static content page, standard SaaS pattern: what is this product, how does XP/leveling work, is my data private, can I change my stats later, is it free, how do I delete my account.
- No dynamic/CMS-driven FAQ needed at this scale — hardcoded content in the codebase is fine, editable via a future admin tool if the product grows.

## 5. Explicitly Out of Scope for v2

- Task verification (photos, timers, fitness API integration) — flagged as a known limitation, not a missing feature. See Section 8.
- Stat decay or XP penalties for missed days.
- Social features: friends, leaderboards, guilds, sharing progress publicly.
- Mobile native app / PWA install — mobile browser access only for v2.
- Notifications/reminders (push, email digest).
- Boss battles, quests-with-narrative, or other literal RPG-quest-content — this is a stat tracker with RPG presentation, not a game with a storyline.
- Non-Google auth methods (email/password, other OAuth providers) — may be reconsidered in v3 if Google-only proves too limiting for signups.

## 6. Success Metrics (v2)

- Successful onboarding (account creation → stat setup → first quest completion) for the ~100-user launch cohort without major drop-off at the stat-customization step specifically, since that's new, untested UX.
- Day-7 retention of signed-up users (does the game-ification actually outperform a plain habit tracker for retention).
- Zero data-loss incidents post-Supabase migration (this was the whole point of moving off SQLite — treat any data loss as a launch-blocking severity issue, not a bug ticket).

## 7. Future Considerations (v3+, not built now)

- Lightweight verification layer (photo-on-demand for exercise, integration with Google Fit/Strava for automatic XP).
- Additional auth providers or email/password as a fallback if Google-only limits signups.
- Possible reintroduction of consequence mechanics (decay) IF paired with a verification layer — the two must ship together, not separately (see Section 8).
- Admin-editable FAQ / CMS if content needs to change frequently.

## 8. Known Tradeoff: Honor System + No Decay

This combination was chosen deliberately after evaluating the alternative (honor system + decay), which creates a perverse incentive to falsely mark tasks complete to avoid stat loss. v1 accepts a weaker accountability mechanism (streaks only, no punishment) in exchange for not rewarding dishonesty. This is a conscious limitation, not an oversight — do not "fix" this during build by unilaterally adding decay back in.
