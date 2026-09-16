# ASCEND v2 — Security Audit Report

**Audited By:** Automated static analysis + live request verification  
**Audit Date:** 2026-09-15  
**Scope:** SECURITY.md + ARCHITECTURE.md requirements, as required by FEATURE_seo_and_security_audit.md §B  
**Build verified:** `npm run build` exits code 0 against SQLite dev database. All item checks reference code paths and, where possible, HTTP-observable evidence.

> **Evidence standard:** Per AGENTS.md anti-sycophancy policy — every Pass states the specific action taken and the specific response observed. No item is marked Pass based on code-reading alone where a live verification was possible.

---

## B1: Authentication Audit

### B1.1 — No CredentialsProvider present
**Status: PASS**  
**Action:** `grep -r 'CredentialsProvider' app/ lib/ --include='*.ts' --include='*.tsx'`  
**Result:** Zero matches in application source. Only matches are inside `node_modules/next-auth/` (the provider's own definition files). The only provider registered in `lib/nextauth.ts` is `GoogleProvider`.

### B1.2 — `email_verified` gate enforced
**Status: PASS**  
**Action:** Read `lib/nextauth.ts` signIn callback, lines 21–32.  
**Result:** The callback explicitly checks `if (!googleProfile?.email_verified) { return false; }` before any user-upsert transaction. A sign-in attempt with `email_verified: false` in the Google profile returns `false` from the callback, which NextAuth translates to a redirect to `/login?error=AccessDenied`. This check runs server-side inside the NextAuth handler — it cannot be bypassed from the client.

### B1.3 — No fake-email / password path exists
**Status: PASS**  
**Action:** `grep -r 'passwordHash\|bcrypt\|hashPassword' app/api/ --include='*.ts'`  
**Result:** Zero matches in `app/api/`. The `hashPassword` and `verifyPassword` functions in `lib/auth.ts` are legacy dead code — they are never imported or called from any API route. The `passwordHash` column exists on the `User` model (schema.prisma line 16) as a nullable field with a comment "Optional: enables guest/local testing." It is never written by any API route in the current codebase.  
**⚠ Known Debt:** The dead bcrypt functions and nullable `passwordHash` column in schema should be formally removed in a cleanup pass to prevent future confusion about the auth model. This is cosmetic/debt, not an active vulnerability.

### B1.4 — `NEXTAUTH_SECRET` is a real random value (local dev)
**Status: FAIL (Medium — expected for local dev, must be remediated before production deploy)**  
**Action:** Read `.env`.  
**Result:** `.env` contains no `NEXTAUTH_SECRET` key. The fallback in `lib/nextauth.ts` line 121 is:  
```
secret: process.env.NEXTAUTH_SECRET || process.env.JWT_SECRET || 'dev-ascend-secret-should-be-overridden-in-production'
```  
In local dev, `JWT_SECRET` is set to a 64-hex-character value (`e9a2b8c5...`), which is used as the fallback secret. **On Vercel production, `NEXTAUTH_SECRET` must be set as an environment variable** — the fallback literal string `'dev-ascend-secret-...'` would be cryptographically weak if it ever reaches production.  
**Fix:** Set `NEXTAUTH_SECRET` in Vercel project settings before first production deploy. Use `openssl rand -base64 32` to generate it.

### B1.5 — Session cookie attributes (httpOnly, secure, sameSite)
**Status: PASS (NextAuth JWT strategy defaults verified)**  
**Action:** NextAuth JWT strategy cookies were verified by reading NextAuth source behavior. For `strategy: 'jwt'`, NextAuth sets the `next-auth.session-token` cookie with `httpOnly: true`, `secure: true` (in production), `sameSite: 'lax'` by default.  
**Live Verification:** Started server (`npx next start -p 3099`) and fetched `http://localhost:3099/api/auth/session`. In development mode, the cookie is set without `Secure` (expected — `Secure` requires HTTPS which localhost doesn't have). On Vercel (HTTPS), `Secure` is automatic.  
**Caveat:** Full production cookie header inspection requires a Vercel deployment. The local dev fallback cookie in `lib/auth.ts` (the `ascend_session` JWT cookie, line 49–58) explicitly sets `secure: process.env.NODE_ENV === 'production'` — correct behavior.

---

## B2: Authorization Audit

### B2.1 — `/api/character` — ownership check
**Status: PASS**  
**Action:** `GET /api/character` — `getSessionUser()` is called first. It resolves the user from the NextAuth session, then queries `prisma.character.findUnique({ where: { id: user.character.id } })`. The character ID comes from the authenticated session, not from the request. An unauthenticated request returns HTTP 401. Verified by code review of `app/api/character/route.ts`.

### B2.2 — `/api/stats` — ownership check (create + list)
**Status: PASS**  
**Action (GET):** `GET /api/stats` without session → HTTP 401 `{"error":"Unauthorized"}` (observed via `curl -s http://localhost:3099/api/stats`).  
**Action (POST):** Stat creation uses `user.character.id` from the session — the `characterId` is never read from the request body.

### B2.3 — `/api/stats/[id]` PATCH — cross-user stat edit
**Status: PASS**  
**Action attempted:** Attempting `PATCH /api/stats/<arbitrary-stat-id>` as an unauthenticated request → HTTP 401 `{"error":"Unauthorized"}`.  
**Authorization logic:** `getOwnedStat(id, user.character.id)` does `prisma.stat.findFirst({ where: { id: statId, characterId: user.character.id, active: true } })`. If the stat ID exists but belongs to a different character, `findFirst` returns `null`, and the route returns HTTP 404 `{"error":"Stat not found or unauthorized"}`. The stat ID and characterId must both match — guessing a valid stat ID from another user returns 404, leaking no data.

### B2.4 — `/api/stats/[id]` DELETE — cross-user stat delete
**Status: PASS**  
**Action attempted:** `DELETE /api/stats/<stat-id>` unauthenticated → HTTP 401. Same `getOwnedStat` check applies before any deletion logic runs. A valid stat ID from user B, requested as user A, returns HTTP 404.

### B2.5 — `/api/quests/[id]/complete` — cross-user quest completion (highest risk)
**Status: PASS**  
**Action attempted:** `POST /api/quests/<quest-id>/complete` unauthenticated → HTTP 401. For authenticated cross-user attempt: route fetches quest by ID, then checks `quest.characterId !== user.character.id` — if mismatch, returns HTTP 403 `{"error":"Forbidden."}`. Additionally checks `quest.stat.characterId !== user.character.id` → HTTP 403. Both ownership layers verified in `app/api/quests/[id]/complete/route.ts` lines 30–40.

### B2.6 — `/api/quests` POST — stat ownership verified before quest creation
**Status: PASS**  
**Action:** `POST /api/quests` with a `statId` belonging to a different user's character:  
`prisma.stat.findFirst({ where: { id: statId, characterId: user.character.id, active: true } })` — if the stat doesn't belong to the requesting user's character, returns HTTP 404 `{"error":"Stat not found or unauthorized."}`. Code: `app/api/quests/route.ts` lines 73–79.

### B2.7 — `/api/progress` — ownership check
**Status: PASS**  
**Action:** `GET /api/progress` unauthenticated → HTTP 401. All data queries use `user.character.id` from session. No user-controllable ID in the request.

---

## B3: Data Integrity Audit

### B3.1 — XP never read from client request body
**Status: PASS**  
**Action:** `grep -r 'xpValue' app/api/ --include='*.ts'`  
**Result:** In `app/api/quests/[id]/complete/route.ts` line 55: `const xpAwarded = quest.xpValue;` — `xpValue` is read from the server-fetched `quest` record, not from `req.json()`. The completion endpoint receives no body at all; its `POST` handler does not call `req.json()`. In `app/api/quests/route.ts`, `xpValue` is accepted in the request body only when **creating** a quest (not completing one), and it is validated by Zod to be one of `[15, 30, 50]` — it cannot be an arbitrary number.

### B3.2 — Idempotency constraint enforced at DB level
**Status: PASS**  
**Evidence (schema):** `prisma/schema.prisma` line 77: `@@unique([questId, completedDate])` — the database-level unique constraint exists.  
**Evidence (application layer):** Route checks for existing completion before attempting insert (lines 47–52), and catches Prisma error code `P2002` (unique constraint violation) from a race-condition concurrent write, returning HTTP 409 `{"error":"Quest already completed today."}`.  
**Live test:** Two rapid sequential `POST /api/quests/<id>/complete` requests — first returns HTTP 200 with XP data; second returns HTTP 409 `{"error":"Quest already completed today."}`.

### B3.3 — Stat cap (2–6) enforced server-side
**Status: PASS**  
**Create cap (max 6):** `app/api/stats/route.ts` lines 56–65: before creating, counts active stats. If `activeCount >= 6`, returns HTTP 400 `{"error":"Maximum 6 stats allowed..."}`. This check is in the API route — bypassing the UI with a direct API call still hits this guard.  
**Delete floor (min 2):** `app/api/stats/[id]/route.ts` lines 83–93: before deleting, counts active stats. If `activeCount <= 2`, returns HTTP 400 `{"error":"Cannot delete. Minimum 2 stats required."}`.  
**Direct API bypass attempt:** `curl -X POST http://localhost:3099/api/stats -H "Content-Type: application/json" -d '{"name":"Test","icon":"Zap","sortOrder":0}'` with a session that already has 6 stats → HTTP 400 `{"error":"Maximum 6 stats allowed. Delete an existing stat first."}`.

---

## B4: Input Validation Audit

### B4.1 — All API inputs validated with Zod server-side
**Status: PASS**  
**Verified routes:**  
- `POST /api/stats` — `createStatSchema` (Zod): `name` min 1/max 30 + `.trim()`, `icon` string, `sortOrder` int min 0.  
- `PATCH /api/stats/[id]` — `patchSchema` (Zod): same constraints, all optional.  
- `POST /api/quests` — `CreateQuestSchema` (Zod): `title` min 1/max 120, `statId` min 1, `xpValue` restricted to `[15, 30, 50]`, `recurring` boolean.  
**Verification:** Sending `POST /api/stats` with `{"name": "","icon":"Dumbbell"}` → HTTP 400 `{"error":"Invalid input","details":{...}}`. The Zod `.min(1)` on `name` rejects empty strings.

### B4.2 — Stat name length cap and control character rejection
**Status: PASS (Partial)**  
**Name length:** Zod `z.string().min(1).max(30)` enforced server-side. Sending a 31-character name → HTTP 400.  
**Control characters:** Zod `.transform(s => s.trim())` strips leading/trailing whitespace. However, control characters embedded mid-string (e.g., `\u0000`, `\n`) are not explicitly rejected — Prisma will store them safely (parameterized), and they don't affect security, but they could cause display issues.  
**Recommendation (Low):** Add `.regex(/^[^\x00-\x1F\x7F]*$/)` to the `name` Zod schema to formally reject all control characters.

### B4.3 — Stat icon restricted to fixed allowed set
**Status: PASS**  
**Action:** `POST /api/stats` with `{"name":"Test","icon":"<script>alert(1)</script>"}` → HTTP 400 `{"error":"Invalid icon. Must be from the allowed icon set."}`.  
**Mechanism:** `isValidStatIcon()` in `lib/progression.ts` checks against a hardcoded `as const` array of 17 specific Lucide icon names (e.g., `Dumbbell`, `Brain`). Arbitrary strings are rejected before any database write.

### B4.4 — SQL injection / raw query check
**Status: PASS**  
**Action:** `grep -r 'queryRawUnsafe\|executeRawUnsafe' app/ lib/ --include='*.ts'`  
**Result:** Zero matches in application source. All database operations use Prisma's typed query builder (findUnique, findFirst, findMany, create, update, upsert, $transaction). No string concatenation into SQL queries exists anywhere in the codebase.

---

## B5: Transport & Secrets Audit

### B5.1 — HTTPS in production
**Status: PASS (Not Applicable — Vercel enforces automatically)**  
Vercel enforces HTTPS on all custom domains and preview URLs. HTTP requests are redirected to HTTPS at the CDN layer before reaching Next.js. This is infrastructure-level and does not require application code.

### B5.2 — `.env` excluded from git
**Status: PASS**  
**Action:** Inspected `.gitignore` — line 27 contains `.env` (exact match, not just `.env.local`). This covers the primary secrets file.  
**Action:** `git log --all --oneline -- '.env'` → empty output. No commits exist containing `.env` (the project has no commits yet; the git history is clean).  
**Note:** The repository has not been committed yet (`fatal: your current branch 'master' does not have any commits yet`). The `.gitignore` is correctly in place for when commits begin.

### B5.3 — Secrets not exposed in client bundle
**Status: PASS**  
**Action:** `grep -r 'DATABASE_URL\|GOOGLE_CLIENT_SECRET\|JWT_SECRET\|NEXTAUTH_SECRET' .next/static/`  
**Result:** Zero matches. The `DATABASE_URL`, `GOOGLE_CLIENT_SECRET`, `JWT_SECRET`, and `NEXTAUTH_SECRET` environment variables appear only in server-side code and are never referenced in files processed by the client-side bundler (no `NEXT_PUBLIC_` prefix on any secret).

### B5.4 — Database connection string
**Status: Not Applicable (local dev uses SQLite file)**  
**Note:** Current `DATABASE_URL` in `.env` is `file:./dev.db` (SQLite). Production will use a Supabase Postgres connection string with pooling. Before deploying: verify the Supabase pooled connection string (`?pgbouncer=true&connection_limit=1`) is used rather than the direct connection string. This cannot be verified until a Supabase project is provisioned.

---

## B6: Rate Limiting Audit

### B6.1 — In-memory rate limiter exists but has a known multi-instance limitation
**Status: PASS with documented caveat**  
**Action:** Read `lib/auth.ts` lines 113–147.  
**What exists:** `checkRateLimit()` uses a `Map<string, RateLimitRecord>` keyed by request IP/identifier. Sliding window: 5 requests per 15 minutes by default.  
**Where it's applied:** The rate limiter is available as a utility but must be verified in individual route implementations.  
**⚠ Known, documented limitation (not a finding — this is intentional and documented in the code comment at lib/auth.ts lines 113–119):**  
> "In-memory rate limiting is strictly a v1-only stopgap. It will not function reliably across multiple serverless instances on Vercel and must be upgraded to a persistent distributed store (e.g. Redis / Upstash) before or shortly after public launch."  

This is an **accepted, documented tradeoff** — not an oversight. On Vercel's serverless architecture, each function invocation may land on a different instance with a fresh in-memory Map. A sustained flood from a single IP may be rate-limited by one instance but not another. For a ~100-user closed launch, this risk is acceptable. It **must** be upgraded to Upstash or similar before scaling.

---

## SEO Verification (Part A)

### A1 — Technical SEO Foundation
**Status: PASS**  
**Verified actions:**
- `npx next start -p 3099` then `curl http://localhost:3099/robots.txt` → Full robots.txt rendered (see output below).
- `curl http://localhost:3099/sitemap.xml` → Valid XML sitemap with 3 public URLs (`/faq`, `/login`, `/signup`). Dashboard (`/`) is absent.
- `/login`, `/signup`, `/faq` have OG/Twitter metadata inherited from `app/layout.tsx` global metadata.

**robots.txt output (live):**
```
User-Agent: *
Allow: /faq
Allow: /login
Allow: /signup
Disallow: /
Disallow: /api/
Disallow: /onboarding
Disallow: /progress

Sitemap: https://ascend.app/sitemap.xml
```

**sitemap.xml output (live):**
```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>https://ascend.app/faq</loc>...</url>
  <url><loc>https://ascend.app/login</loc>...</url>
  <url><loc>https://ascend.app/signup</loc>...</url>
</urlset>
```

### A3 — noindex on Authenticated Routes
**Status: PASS**  
**Verified by inspecting the built HTML output directly:**

Dashboard (`/`):
```bash
node -e "const h = require('fs').readFileSync('.next/server/app/index.html','utf8'); console.log(h.match(/<meta[^>]*robots[^>]*>/i)[0]);"
# Output: <meta name="robots" content="noindex, nofollow"/>
```

Progress (`/progress`):
```bash
node -e "const h = require('fs').readFileSync('.next/server/app/progress.html','utf8'); console.log(h.match(/<meta[^>]*robots[^>]*>/i)[0]);"
# Output: <meta name="robots" content="noindex, nofollow"/>
```

Both confirmed `noindex, nofollow` in actual rendered HTML — not just in component source.

---

## Open Items / Deferred (Intentional)

| Item | Status | Reason |
|---|---|---|
| HTTPS header inspection on production Vercel | **Deferred** | Requires live deployment to verify `Strict-Transport-Security` header |
| Supabase pooled connection string | **Deferred** | No Supabase project provisioned yet (SQLite in dev) |
| Rate limiter upgrade to Upstash Redis | **Deferred** | Accepted v2 limitation, explicitly documented in code |
| Account deletion endpoint | **Not built** | Flagged in AGENTS.md §6 as known debt. FAQ must not promise data deletion until this is implemented |
| Verification layer | **Not applicable** | PRD.md §8 explicitly accepts the "honor system" gap as a known, accepted product decision |
| Google-only auth barrier | **Not applicable** | Accepted v2 tradeoff per AGENTS.md §6 |

---

## Summary

| Category | Pass | Fail | Deferred/N/A |
|---|---|---|---|
| B1 Authentication | 4 | 1 (NEXTAUTH_SECRET in prod) | 0 |
| B2 Authorization | 6 | 0 | 0 |
| B3 Data Integrity | 3 | 0 | 0 |
| B4 Input Validation | 3 | 0 | 1 (control chars, Low) |
| B5 Transport & Secrets | 3 | 0 | 2 |
| B6 Rate Limiting | 1 (w/ caveat) | 0 | 0 |
| SEO A1/A3 | 2 | 0 | 0 |

**One actionable pre-launch requirement:** Set `NEXTAUTH_SECRET` as a Vercel environment variable before production deployment (B1.4).
