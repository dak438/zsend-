# AGENTS.md — [Working Title: ASCEND] (v2 — Public Launch)

## Purpose of This Document

Instructions for the AI coding agent(s) building this project (e.g. Kimi for frontend, DeepSeek for backend/non-frontend — matching Daksh's established Zolkiv workflow). Read DESIGN.md, PRD.md, ARCHITECTURE.md, and SECURITY.md in full before writing any code. This file governs *how* to work, not *what* to build — the other four docs are the source of truth for requirements.

## 1. Document Priority Order

If specs conflict, resolve in this order: SECURITY.md > ARCHITECTURE.md > PRD.md > DESIGN.md. Security and data-integrity constraints are non-negotiable; visual polish is the most flexible layer.

## 2. Do Not Invent Silently

The following must NOT be decided unilaterally by the coding agent — if a gap is found in these areas, stop and flag it rather than guessing:
- XP formula or leveling curve (fixed in ARCHITECTURE.md §3 — do not "improve" the pacing without sign-off).
- Rank tier thresholds (ARCHITECTURE.md §3.3).
- Whether stat decay exists (it does not — PRD.md §8 is an explicit, deliberate decision, not an oversight to "fix").
- Color palette or typography choices outside what's specified in DESIGN.md.
- Auth provider/strategy beyond what ARCHITECTURE.md §1 specifies (Google OAuth only — do not add email/password "as a convenience," it was explicitly cut from v2 scope).
- The 2–6 custom stat cap (PRD.md §4.1, ARCHITECTURE.md §2) — do not raise, lower, or remove this limit without sign-off, even if it seems like an easy UX win to make it unlimited.
- The fixed icon set for stat customization (DESIGN.md §4.1) — do not allow free-text icon input or image upload.

## 3. Build Order (Recommended)

1. Prisma schema + migrations against **Supabase Postgres directly** (ARCHITECTURE.md §1.1 — no SQLite step in v2).
2. Google OAuth end-to-end via NextAuth before any game-mechanic features — nothing else matters if accounts don't work. Verify redirect URIs work in both local dev and the Vercel preview/production domains before moving on.
3. Custom Stat CRUD (create/rename/delete with 2–6 cap enforcement server-side) — build and test this in isolation before wiring it into onboarding UI, since the cap logic is easy to get subtly wrong (off-by-one on the boundary checks).
4. Onboarding flow (default stat suggestions → user customization → finish) per DESIGN.md §4.1.
5. Character + Quest data model CRUD (API routes first, no UI yet) — validate XP/leveling math with unit tests before building UI on top of it. Quest creation now requires a valid, owned `statId` — test the ownership check explicitly (SECURITY.md §3).
6. Dashboard UI (status panel rendering 2–6 stat rows, quest list) per DESIGN.md §4.
7. Completion flow + streak logic — this is the highest-risk logic (see SECURITY.md §4), test the unique-constraint idempotency explicitly.
8. Progress view / charts (must handle variable stat count, not assume 4 series).
9. FAQ page (static content, DESIGN.md §8).
10. Polish pass: motion (DESIGN.md §7), empty states, error states.

## 4. Testing Expectations

- Unit tests for the XP/level formula (ARCHITECTURE.md §3) — verify against the example thresholds given (Level 2 at 50 XP, Level 5 at 800 XP, Level 10 at 3,600 XP), including the N-stat average with N = 2 and N = 6 (the boundary cases), not just N = 4.
- Test the streak logic across a timezone boundary case (completion at 11:58 PM local time) — this is the most likely source of an embarrassing bug. Test this independently for both overall streak AND per-stat streak (per the earlier fix — do not regress this).
- Test that the completion endpoint rejects a second completion of the same recurring quest on the same day (idempotency, SECURITY.md §4).
- Test that a user cannot fetch, edit, or complete another user's quest OR stat by guessing/passing a different `characterId`/`questId`/`statId` (authorization, SECURITY.md §3 — `statId` is a new object type in v2 and needs the same coverage `Quest` already had).
- Test the 2–6 stat cap at both boundaries: creating a 7th stat is rejected; deleting down to 1 stat is rejected; creating a 2nd stat (from 1, e.g. during onboarding) and deleting to exactly 2 both succeed.
- Test Google OAuth sign-in creates a `Character` with the correct default/onboarding state on first login, and does NOT create a duplicate `User` record on subsequent logins (match on Google's `sub`/`googleId`, not email alone, to handle edge cases).

## 5. What "Done" Looks Like for v2

A user can: sign in with Google → complete onboarding by accepting/customizing 2–6 stats → create quests under their own stats → complete quests daily → watch XP bars fill and level up → see a rank badge update → view a 7/30/all-time progress chart per stat → edit/add/remove stats later within the cap → have their streak (overall and per-stat) persist correctly across days and timezones → read the FAQ page. Nothing beyond PRD.md §4 scope is required for v2 sign-off — resist scope creep into §5's explicitly-excluded features (verification, social, notifications, non-Google auth) even if they seem quick to add.

## 6. Known Debt to Flag on Handoff

- Mobile is browser-only for v2; do not build PWA manifest/service worker unless explicitly requested later.
- No verification layer exists yet — if this ships publicly, expect users to note the "I can just lie" gap. This is a known, accepted limitation (PRD.md §8), not a bug report to act on without a product decision first.
- **Account deletion is not yet speced** (SECURITY.md §8) — if the FAQ page promises data deletion, the feature needs to exist before launch, not after. Flag this gap explicitly rather than either building an ad-hoc deletion flow or silently letting the FAQ overpromise.
- Google-only auth means any user without a Google account cannot sign up — accepted tradeoff for v2 simplicity/security, flagged as a possible v3 limitation if signup numbers show this is a real barrier.

## 7. Communication Back to Daksh

If during build any of the "do not invent silently" items (§2) need a decision, stop and ask rather than shipping a guess — matching Daksh's standing workflow preference (see PRD/DESIGN handoff pattern from prior Zolkiv projects).
