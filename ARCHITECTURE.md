# ARCHITECTURE.md — [Working Title: ASCEND] (v2 — Public Launch)

## 1. Stack

- **Framework:** Next.js 14 (App Router), TypeScript strict mode.
- **Styling:** Tailwind CSS, custom theme tokens matching DESIGN.md palette (configure as `theme.extend.colors` — do not hardcode hex values inline in components).
- **Database (v2):** **Postgres via Supabase**, free tier. This is the primary and only database target for v2 — not a future migration, not a fallback. See §1.1.
- **ORM:** Prisma, `provider = "postgresql"`, connected to Supabase's connection string directly.
- **Auth:** **Google OAuth only**, via NextAuth.js (Auth.js) with the Google provider. No Credentials provider, no password storage, no email verification flow — removed entirely from v2 scope. See SECURITY.md §2 for the security implications of this choice (mostly positive: no password liability).
- **Charts (Progress View):** Recharts or a hand-rolled SVG chart (consistent with Stratum precedent — hand-coded SVG is acceptable and matches prior product decisions if bundle size matters).
- **Deployment target:** Vercel. This is now a clean pairing — Vercel (serverless, stateless) + Supabase (persistent Postgres) is the standard, well-supported combination. The SQLite-on-Vercel incompatibility that drove earlier versions of this doc no longer applies.

### 1.1 Database: Supabase Postgres (Changed from v1's SQLite plan)

v1 planned SQLite-locally-then-migrate. v2 skips that entirely: **build against Supabase Postgres from day one.** Reasoning:

- ~100 real public users means real concurrent writes — SQLite's file-lock model was already flagged as unsuitable for this exact scenario.
- Supabase's free tier (500MB database, 50,000 monthly active users on their auth product — though we're using NextAuth, not Supabase Auth, for the Google OAuth flow, so only the DB limits matter) comfortably covers a 100-user launch.
- Building against Postgres from the start avoids any migration risk entirely — there is no "swap the provider later" step to get wrong.

**Directive to coding agent:** Prisma schema uses `provider = "postgresql"` from the first commit. `DATABASE_URL` comes from Supabase's connection pooler string (use the pooled connection, not the direct connection, for serverless compatibility with Vercel — Supabase documents this distinction, use the pooler).

## 2. Data Model (Prisma schema, conceptual)

**Major v2 change:** `Stat` moves from a fixed enum (STR/INT/BIZ/VIT) to a user-defined table. This is the core schema rework requested for custom stats.

```prisma
model User {
  id           String   @id @default(cuid())
  email        String   @unique       // populated from Google profile, not user-entered
  googleId     String   @unique       // Google's sub claim, for OAuth account linking
  name         String?
  image        String?                // Google profile picture, optional use in UI
  createdAt    DateTime @default(now())
  timezone     String   @default("Asia/Kolkata") // for daily reset logic, see §5
  character    Character?
}

model Character {
  id             String   @id @default(cuid())
  userId         String   @unique
  user           User     @relation(fields: [userId], references: [id])
  overallStreak  Int      @default(0)
  lastActiveDate String?  // "YYYY-MM-DD" in user's timezone, for overall streak calc
  stats          Stat[]
  quests         Quest[]
  completions    QuestCompletion[]
}

model Stat {
  id              String   @id @default(cuid())
  characterId     String
  character       Character @relation(fields: [characterId], references: [id])
  name            String    // user-defined, e.g. "STR" or "Exercise" or whatever they type — capped length, see SECURITY.md
  icon            String    // key into a fixed Lucide icon set (see DESIGN.md) — not free text/upload
  xp              Int       @default(0)
  streak          Int       @default(0)
  lastActiveDate  String?   // per-stat streak tracking, "YYYY-MM-DD"
  sortOrder       Int       @default(0) // preserves user's chosen display order on dashboard
  active          Boolean   @default(true) // soft-delete, see §3.2 "Mid-use stat changes"
  createdAt       DateTime  @default(now())
  quests          Quest[]

  @@index([characterId])
}

model Quest {
  id          String   @id @default(cuid())
  characterId String
  character   Character @relation(fields: [characterId], references: [id])
  statId      String
  stat        Stat     @relation(fields: [statId], references: [id])
  title       String
  xpValue     Int
  recurring   Boolean  @default(true) // daily recurring vs one-off
  active      Boolean  @default(true) // soft-delete flag
  createdAt   DateTime @default(now())
  completions QuestCompletion[]
}

model QuestCompletion {
  id            String   @id @default(cuid())
  questId       String
  quest         Quest    @relation(fields: [questId], references: [id])
  characterId   String
  character     Character @relation(fields: [characterId], references: [id])
  completedAt   DateTime @default(now())
  completedDate String   // "YYYY-MM-DD" in user's local timezone — see §5. Enables unique constraint per day.

  @@unique([questId, completedDate]) // prevents double-completing a recurring quest same day
}
```

**Cap enforcement:** the 2–6 stat limit (PRD.md §4.1) is NOT a database constraint (Postgres/Prisma don't cleanly enforce "array length between 2 and 6" at the schema level) — it must be enforced in application logic on every stat-create and stat-delete API call. Attempting to delete a stat that would bring the count below 2, or create one that would exceed 6, must return a 400 with a clear error, checked server-side regardless of what the client UI already prevents.

## 3. XP & Leveling Formula (must be exact — do not let coding agent invent this)

### 3.1 Per-stat level
```
statLevel(xp) = floor(sqrt(xp / 50)) + 1
```
This gives a standard RPG-feeling curve: early levels come fast (encourages early engagement), later levels require exponentially more XP (makes high levels feel earned). Example thresholds:
- Level 1: 0 XP
- Level 2: 50 XP
- Level 5: 800 XP
- Level 10: 3,600 XP

### 3.2 Overall Character Level (Changed for v2: variable stat count)
```
overallLevel = floor( sum(statLevel(stat.xp) for stat in character.stats) / character.stats.length )
```
Same principle as v1 — simple average of all stat levels, floored, so neglecting any one stat drags the average down. The formula itself didn't need to change for custom stats, since it was already written generically enough (average across N stats) — but this is now explicitly N-dependent rather than hardcoded to 4, and this must be computed dynamically from the actual `stats` relation, not assumed to be length 4 anywhere in the code.

**Balance note (why the 2–6 cap matters here):** because this is an average, stat *count* doesn't directly advantage or disadvantage a user's overall level — a user with 2 stats and a user with 6 stats both need proportionally the same effort-per-stat to reach a given overall level. The cap exists for UI/UX sanity (dashboard layout, onboarding complexity) more than for formula fairness, but extremely low counts (1 stat) would make overall level meaningless as a "balance across life" signal, which is why the floor is 2, not 1.

**Mid-use stat changes:** if a user adds or removes a stat after onboarding, `overallLevel` recalculates on the next read using whatever stats currently exist — there is no retroactive rewrite of historical XP or past level-up records. Removing a stat should soft-delete it (add an `active` boolean to `Stat`, mirroring `Quest`) rather than hard-delete, so historical `QuestCompletion` data and progress charts remain intact.

### 3.3 Rank Tiers (cosmetic, driven by overallLevel)
| Rank | Level Range |
|---|---|
| E | 1–9 |
| D | 10–19 |
| C | 20–34 |
| B | 35–49 |
| A | 50–69 |
| S | 70+ |

These thresholds are a first pass — adjust only with explicit sign-off, not silently during build, since pacing affects how motivating the system feels.

## 4. Streak Logic

- `completedDate` stored as `YYYY-MM-DD` string in the **user's local timezone** (from `User.timezone`), not UTC — a quest completed at 11:58 PM must count for that calendar day, not roll into the next.
- Daily job (or on-request calculation, no cron needed for v1) checks: if `lastActiveDate` is exactly yesterday relative to today (user's timezone) → increment streak. If today → no-op (already counted). If older than yesterday → reset streak to 1 on next completion.
- Per-stat streaks: same logic, scoped to completions within that stat only.

## 5. Timezone Handling

- Capture `User.timezone` at signup via browser `Intl.DateTimeFormat().resolvedOptions().timeZone`, store it, allow editing in settings.
- All "day boundary" logic (daily quest reset, streak calculation) uses this stored timezone, not server time. This avoids the classic bug where a quest resets at the wrong hour for the user.

## 6. API Routes (Next.js App Router conventions)

- `GET/POST /api/auth/[...nextauth]` — NextAuth's Google OAuth flow (signin, callback, signout), no custom signup/login routes needed.
- `GET /api/character` — current user's character + stats + level/rank computed server-side
- `POST /api/stats` — create a new custom stat (name, icon, sortOrder) — server-side enforces the 2–6 cap (§2) and per-user name/length limits (SECURITY.md)
- `PATCH /api/stats/:id` — rename/re-icon/reorder an existing stat
- `DELETE /api/stats/:id` — soft-delete a stat (sets `active: false`) — server-side blocks this if it would bring the user below 2 active stats
- `GET /api/quests` — today's quest list with completion status
- `POST /api/quests` — create new quest, now requires a valid `statId` owned by the requesting user's character (not a fixed enum value)
- `POST /api/quests/:id/complete` — mark complete (writes QuestCompletion, recalculates XP/streak server-side — never trust client-submitted XP values)
- `GET /api/progress?range=7d|30d|all` — historical XP data for charts, grouped by the user's actual stat set (variable length, not fixed 4)

**Critical:** XP awarding and level calculation happen server-side only, on the completion endpoint. Never accept XP values from the client — this is the one place "honor system" (user can lie about *doing* the task) must not become "exploit system" (user can fabricate arbitrary XP via API manipulation).

**Also critical (new in v2):** every `statId` and `questId` passed to any endpoint must be verified server-side as belonging to the authenticated user's character before any read or write — this was already required in v1, but custom stats add a new object type (`Stat`) that needs the same ownership check as `Quest` and `QuestCompletion` already require.

## 7. Non-Goals (Architecture-level)

- No real-time sync/websockets needed for v2 — single-user-per-character, no collaborative features.
- No background job scheduler required for v2 — streak/reset logic can be computed on-read (lazy evaluation) rather than requiring a cron job, since each user's day boundary differs by timezone anyway.
- No Supabase Auth, Supabase Realtime, or Supabase Storage — Supabase is used strictly as a Postgres host here. Auth is NextAuth+Google, not Supabase's own auth product. Don't let the coding agent pull in Supabase's client SDK or auth helpers by default — it's unnecessary surface area for this architecture.
