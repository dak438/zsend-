# SECURITY.md — [Working Title: ASCEND] (v2 — Public Launch)

## 1. Threat Model Summary

Public-facing (~100 users at launch), Google OAuth only, stores personal habit/progress data (not financial or medical-grade sensitive, but still personal) in Supabase Postgres. Primary risks: session/token handling around the OAuth flow, XP/progress tampering via API manipulation, ownership-check gaps on the new custom-`Stat` object type, and standard web app vulnerabilities (injection, session hijacking). This is not a high-value target for sophisticated attackers, but "low sophistication required to break it" is not an acceptable bar — build it correctly the first time.

## 2. Authentication (Changed for v2: Google OAuth only)

- **No passwords are stored, ever** — Google OAuth via NextAuth handles identity entirely. This removes the entire password-hashing/reset/breach-liability surface that v1's plan required. This is a net security improvement, not just a convenience choice.
- NextAuth session strategy: JWT-based sessions are recommended for this scale (no session table needed in Postgres, simpler ops). Session cookie must be `httpOnly`, `secure`, `sameSite=lax` — NextAuth defaults to this correctly; do not override.
- `NEXTAUTH_SECRET` must be freshly generated (32+ random bytes) for this project specifically.
- Google OAuth client ID/secret stored in environment variables, never committed. Configure the OAuth consent screen and authorized redirect URIs correctly for both local dev (`localhost`) and the production Vercel domain — a common source of "works locally, breaks in prod" bugs.
- No login rate-limiting needed for the auth flow itself (Google handles brute-force protection on their end) — rate limiting now only matters on write-heavy API routes (quest completion, stat creation), to prevent a compromised or malicious session from spamming the database. A simple in-memory limiter is acceptable for v1 traffic (~100 users) but will not function correctly across Vercel's multiple serverless instances — flag for upgrade to Redis/Upstash if usage grows past this launch cohort.

## 3. Authorization

- Every API route that touches Character/Stat/Quest/Completion data must verify the requesting user owns that resource (check `session.user.id` against the record's `userId`/`characterId` chain) — never trust a client-supplied `characterId`, `statId`, or `questId` without ownership verification server-side.
- **New in v2:** the `Stat` model is a new attack surface that didn't exist in v1's fixed-enum design. Specifically test: can User A read, edit, or complete a quest tied to User B's `statId` by guessing/enumerating IDs? Ownership must be checked on every `Stat` and `Quest` route, not assumed safe because IDs are cuids (unguessable IDs are defense in depth, not a substitute for an authorization check).
- No admin panel in v2 scope — if one is added later, it needs its own separate auth tier, not a flag on the regular user model.

## 4. Data Integrity (the "honor system exploit" risk)

This app already accepts a UX-level honesty gap (user can lie about *doing* a task — see PRD §8, accepted tradeoff). The architecture must NOT also allow a technical exploit on top of that:

- **XP values are never accepted from the client.** The `xpValue` used on completion comes from the `Quest` record already stored server-side, looked up by `questId` — not from the request body.
- **Completion idempotency:** the `@@unique([questId, completedDate])` constraint (see ARCHITECTURE.md §2) prevents a user from spamming the complete endpoint to farm XP multiple times for the same daily quest. Enforce this at the database level, not just in application logic — a race condition in app-level checks is exploitable.
- Validate all quest creation input server-side (XP value within allowed tiers — 15/30/50, or a sane capped range if custom values are allowed; title length limits; `statId` must exist AND belong to the requesting user's character — no longer a fixed enum check, so this must be a real database lookup, not a static validation list) — never trust client-side validation alone.
- **New in v2 — custom stat abuse:** validate stat `name` (reasonable length cap, e.g. 30 chars, strip/reject control characters) and `icon` (must be one of the fixed allowed icon keys, not free text — see ARCHITECTURE.md §2 note on this). Enforce the 2–6 stat count cap server-side on both create and delete, regardless of what the client UI already prevents — this is a business-logic constraint, and business-logic constraints belong on the server.

## 5. Input Validation & Injection

- Use Prisma's parameterized queries throughout (default behavior) — no raw SQL string concatenation anywhere.
- Sanitize/escape all user-generated text (quest titles) before rendering — Next.js/React escapes by default, but confirm no `dangerouslySetInnerHTML` is used on user content.
- Validate all API inputs with a schema library (Zod recommended, pairs cleanly with TypeScript + Prisma) rather than manual if-checks.

## 6. Transport & Environment

- HTTPS enforced in production (Vercel/Railway/Fly.io all provide this by default — confirm no mixed-content issues).
- Environment variables (DB connection string, NextAuth secret, etc.) via `.env`, never committed to git. Confirm `.gitignore` includes `.env*` before first commit.
- `NEXTAUTH_SECRET` (or equivalent JWT signing secret) must be a properly random 32+ byte value, generated fresh for this project — not reused from another project, not a placeholder left in from scaffolding.

## 7. Database: Supabase Postgres (Resolved in v2 — no longer a migration risk)

v1 flagged SQLite-on-Vercel as a data-loss risk requiring migration before public launch. v2 resolves this by building directly against Supabase Postgres from the start (ARCHITECTURE.md §1.1) — there is no longer a migration step to get wrong. Remaining Supabase-specific security notes:

- Use Supabase's connection pooler string for `DATABASE_URL` (required for serverless/Vercel compatibility), not the direct connection string.
- Supabase project's database password / connection string is a secret — store in Vercel's environment variables, never in the repo.
- Row-Level Security (RLS) is a Supabase feature for direct client-to-DB access patterns — **not used here**, since all DB access goes through Prisma on the server side (Next.js API routes), not directly from the browser. Do not enable or rely on RLS as a security layer; the authorization checks in §3 are what actually protect this data.

## 8. Out of Scope for v2 (documented, not forgotten)

- No GDPR/data-export tooling required at current scale, but store data in a way that doesn't make future export/deletion painful (avoid denormalizing user data across untracked tables).
- No 2FA in v2 — moot anyway, since Google OAuth means Google's own account security (including their 2FA) is the actual auth boundary.
- No dependency/vulnerability scanning pipeline required for v2, but run `npm audit` before first public deploy at minimum.
- Account deletion flow: not explicitly speced yet — flag as a pre-launch gap. A public SaaS product with real users should have a way to delete an account and its data (FAQ.md will likely promise this — see PRD.md §4.8 — so the feature needs to actually exist before the FAQ claims it does).
