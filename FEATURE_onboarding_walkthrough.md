# FEATURE: First-Login Interactive Onboarding Walkthrough

## Context

This is distinct from the **stat-setup onboarding** already specced in DESIGN.md §4.1 (the screen where a new user picks/customizes their 2–6 stats). That screen is configuration. This feature is **product education** — after stat setup is complete and the user lands on their real dashboard for the first time, they need a guided tour explaining what they're looking at and how to use it, since the game-UI metaphor (status window, XP bars, rank badges) is not self-explanatory to someone who's never seen this product before.

These two onboarding pieces run back-to-back on first login: stat setup → interactive walkthrough → normal app use.

## Requirements

### 1. Trigger Condition
- The walkthrough runs automatically the first time a user reaches the dashboard after completing stat setup — add an `hasSeenWalkthrough: Boolean @default(false)` field to the `User` model (or `Character`, whichever is more natural given the existing schema) so it never re-triggers on subsequent logins.
- Must be skippable at any point (a visible "Skip" control), and must be re-triggerable manually later — add a "Show tutorial again" option somewhere reachable (e.g. a settings menu or a `?` help icon in the header), since users who skip it on day one may want it later.

### 2. Format: Tooltip/Highlight Walkthrough (Interactive)
Implement as a sequential, spotlighted tooltip tour over the real dashboard UI — not a separate slideshow/modal sequence disconnected from the actual interface. The user should be looking at their real (likely near-empty) dashboard with specific elements highlighted and explained in order, so what they learn maps directly to what they'll actually use.

Suggested library: a lightweight React tour library (e.g. `react-joyride` or similar) that supports spotlighting a DOM element, dimming the rest of the screen, and advancing through a defined step sequence with "Next / Back / Skip" controls. Confirm license compatibility and bundle size before adding a dependency — if a suitable lightweight option isn't available, a hand-built version using absolute-positioned tooltips + a dim overlay is acceptable and keeps bundle size down.

### 3. Step Sequence (content to cover — exact copy can be refined, but every concept below must be covered by some step)

1. **Welcome step** (no spotlight, centered modal): brief welcome, one line on what the product is ("track your real-life progress like an RPG character"), and a "Let's take a quick look" CTA to start the tour.
2. **Rank & Level:** spotlight the rank badge + level number. Explain: your overall level is the average of all your stat levels — so leveling up means growing across all your stats, not just one.
3. **Stat bars:** spotlight the stat panel. Explain: each stat tracks XP from tasks (quests) tied to that area of your life. Bars fill as you complete quests.
4. **Quest log:** spotlight the quest list/create-quest control. Explain: this is where you add and complete your daily tasks — completing a quest gives XP to its linked stat.
5. **Streaks:** spotlight the streak counter(s). Explain: consecutive days with at least one completed quest builds your streak — missing a day resets the streak but never removes XP you've already earned (this directly reflects the no-decay design decision in PRD.md §8, and is worth stating plainly since it's a deliberate kindness in the design, not an oversight).
6. **Progress view:** spotlight the nav link to the progress/chart page. Explain: this is where you can see your history over time and spot which stat you've been neglecting.
7. **Closing step** (centered modal, no spotlight): "You're set — go complete your first quest." CTA to dismiss and start using the app for real.

### 4. Visual Style
Must match DESIGN.md's existing system — dark void/panel backgrounds, ember accent for highlighted elements/CTAs, Chakra Petch for step headers, Inter for body copy. Do not let a third-party tour library's default styling (often light-mode, rounded, generic) ship unstyled — override its theme to match the existing palette tokens (`--bg-void`, `--bg-panel`, `--accent-ember`, `--accent-violet`, `--text-frost`). An unstyled default-theme tour library will look like a bug, not a feature, given how deliberate the rest of the visual system is.

### 5. Edge Cases to Handle
- User resizes browser or is on a smaller viewport mid-tour — spotlight positioning must recalculate, not break/misalign.
- User has fewer than 4 stats (down to the 2-minimum) — the stat-bar spotlight step must work correctly regardless of how many stat rows actually exist, not assume a fixed 4.
- User navigates away or refreshes mid-tour — decide and implement one consistent behavior (resume where they left off, or restart from step 1) rather than leaving this undefined; restart-from-step-1 is the simpler and acceptable default unless there's a reason to persist tour position.

## Do Not Invent Silently
- Exact copy/wording for each step is not locked — a reasonable draft is fine, but flag it as draft copy for the product owner to review before launch, same as landing page copy in the SEO file.
- Do not add analytics/tracking on tour completion/skip rates unless explicitly requested — out of scope for this feature unless asked for separately.

## Verification Plan
1. Sign up as a genuinely new test user, complete stat setup, confirm the walkthrough triggers automatically on first dashboard load.
2. Complete the full tour, confirm each step highlights the correct real element (not a mocked/placeholder screenshot).
3. Refresh the app or log out and back in — confirm the tour does NOT re-trigger automatically for a user who already completed or skipped it.
4. Locate and use the "show tutorial again" control — confirm it manually re-triggers the tour correctly.
5. Test with a test account configured to have only 2 stats and another with 6 stats — confirm the stat-bar step works correctly at both boundaries.
6. Test on a narrow/mobile-width browser viewport — confirm spotlight positioning holds up (mobile app/PWA is out of scope, but mobile *browser* access is in scope per PRD.md, so this tour must not break there).
