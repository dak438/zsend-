# FEATURE: SEO Setup + Full Security Audit

This file covers two distinct workstreams — SEO and Security. They're combined here because both are pre-launch hardening passes, but they should be executed and reported on separately. Do not let SEO work distract from or get mixed into security findings.

---

## PART A: SEO

### Context
This is a public SaaS product about to launch to ~100 users, with growth beyond that cohort a stated goal. Basic SEO hygiene should exist before launch, not be retrofitted after. This is a Next.js 14 App Router project — use its built-in metadata APIs, don't hand-roll `<head>` tags.

### Task A1: Technical SEO Foundation
- Implement Next.js App Router's `metadata` export (or `generateMetadata` for dynamic routes) on every public-facing page — landing page, login, FAQ, and any other unauthenticated route. Authenticated app pages (dashboard, quest log) do not need SEO metadata and should instead be marked `noindex` (see A3).
- Required metadata per public page: `title`, `description`, canonical `url`, Open Graph tags (`og:title`, `og:description`, `og:image`, `og:type`), and Twitter Card tags.
- Generate a proper `sitemap.xml` (Next.js supports this via `app/sitemap.ts`) covering only public, indexable routes.
- Generate a `robots.txt` (via `app/robots.ts`) that allows indexing of public pages and explicitly disallows crawling of authenticated routes (`/dashboard`, `/api/*`, etc.).

### Task A2: Content-Level SEO
- Landing page needs a real, human-readable value proposition in its title/description/H1 — not generic placeholder copy. Coordinate actual copy with the product owner rather than inventing final marketing language; a reasonable draft is acceptable but should be flagged as "draft copy, confirm before launch."
- FAQ page structured data: implement `FAQPage` JSON-LD schema (schema.org) so FAQ entries are eligible for rich results in search — this is a genuine SEO win for a page that's already static content, low effort for real payoff.
- Ensure all images have meaningful `alt` text — particularly any icons/screenshots on the landing page.

### Task A3: noindex Authenticated Routes
- Every route requiring auth (dashboard, quest log, progress view, settings) must have `robots: { index: false, follow: false }` in its metadata, or be blocked via `robots.txt`. A user's personal progress data should never be indexable, both for SEO hygiene (thin/duplicate content) and for privacy (this overlaps with Part B — flag it as a joint SEO/privacy finding, not just an SEO nicety).

### SEO Verification
- Run the built production build and inspect generated `sitemap.xml` and `robots.txt` output directly (not just the source code) to confirm they render correctly.
- Spot-check that authenticated pages actually carry `noindex` in their rendered HTML `<head>`, not just in the component source.

---

## PART B: Full Security Audit

### Context
This is a pre-launch audit against the specs already established in SECURITY.md and ARCHITECTURE.md — the goal is to verify those requirements were actually implemented correctly, not to re-derive requirements from scratch. Treat every SECURITY.md clause as a checklist item to test, not just read.

### Task B1: Authentication Audit
- Confirm the Google OAuth fix (see FEATURE_google_auth_fix.md, if completed prior to this audit) is fully in place: no Credentials provider present, no fake-email path exists, `email_verified` is checked.
- Confirm `NEXTAUTH_SECRET` is a real random production value, not a placeholder or a value reused from local dev.
- Confirm session cookies are `httpOnly`, `secure`, `sameSite=lax` — inspect actual response headers in production, don't just trust NextAuth defaults without verifying.

### Task B2: Authorization Audit (highest priority — this is where real damage happens)
For every API route that touches `Character`, `Stat`, `Quest`, or `QuestCompletion` data:
- Confirm the route checks `session.user.id` against the resource's ownership chain before any read or write.
- Specifically attempt (in a test or staging environment, with two real test accounts) to access, edit, or delete User B's `statId` or `questId` while authenticated as User A. This must fail with 403/404, not succeed or leak data.
- Confirm this was tested for **every** object type — `Stat` is the newest addition (v2) and the most likely to have an authorization gap since it didn't exist when earlier authorization logic was written.

### Task B3: Data Integrity Audit
- Confirm `xpValue` is never read from client request bodies anywhere in the codebase — grep for any place the completion endpoint might trust a client-submitted XP number instead of the server-side `Quest.xpValue` lookup.
- Confirm the `@@unique([questId, completedDate])` constraint is enforced at the database level (attempt a completion twice in rapid succession / concurrently and confirm the second attempt fails cleanly with a 409, not a race-condition double-write).
- Confirm the 2–6 stat cap (PRD.md §4.1) is enforced server-side on both create and delete — attempt to bypass it via a direct API call, not just through the UI.

### Task B4: Input Validation Audit
- Confirm all API inputs are validated with Zod (or equivalent) server-side, not just client-side form validation.
- Confirm stat `name` fields reject control characters and enforce a length cap (SECURITY.md).
- Confirm stat `icon` values are restricted to the fixed allowed set, not arbitrary strings.
- Attempt basic injection payloads against text fields (quest titles, stat names) and confirm Prisma's parameterization handles them safely — confirm no raw SQL string concatenation exists anywhere in the codebase (`grep` for `$queryRawUnsafe`, `$executeRawUnsafe`, or manual string-built SQL).

### Task B5: Transport & Secrets Audit
- Confirm HTTPS is enforced in production (should be automatic on Vercel — verify, don't assume).
- Confirm `.env` and any secret files are in `.gitignore` and were never committed to the repository's history (check `git log` for accidental commits of `.env`, not just the current state).
- Confirm the Supabase `DATABASE_URL` uses the pooled connection string, and confirm the Supabase database password is not exposed in any client-side bundle (check built JS output, not just source).

### Task B6: Rate Limiting Audit
- Confirm the in-memory rate limiter on write-heavy routes (quest completion, stat creation) is actually functioning as intended — and explicitly document its known limitation (does not persist across Vercel's multiple serverless instances) rather than reporting it as "done" without caveat.

### Security Audit Deliverable
Produce a findings report structured as:
- **Pass:** requirement met, how it was verified.
- **Fail:** requirement not met, severity (Critical/High/Medium/Low), and recommended fix.
- **Not applicable / deferred:** anything explicitly out of scope per SECURITY.md §8, listed so it's clear it was considered and intentionally not built, not simply missed.

Do not mark anything "Pass" without an actual verification step performed — no self-reported confidence without evidence, per this project's standing anti-sycophancy expectations.
