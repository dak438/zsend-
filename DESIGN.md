# DESIGN.md — [Product Name TBD: working title "ASCEND"] (v2 — Public Launch)

## 1. Design Philosophy

This is not a to-do app with a game skin. The UI must feel like a **status window from a progression RPG** — the player is checking their character sheet, not their planner. Every screen should answer one question first: "how strong am I right now, and what do I do next."

Reference tone: Solo Leveling's System UI (dark, cold, authoritative, faintly glowing) — but this is an **original visual identity**, not a reproduction of the show's specific UI chrome, iconography, or wordmarks. No direct copying of the anime's logo, font, or "System" branding language. Build something that evokes the same feeling through our own palette and type system.

## 2. Color Palette (Locked — provided by user)

| Token | Hex | Role |
|---|---|---|
| `--bg-void` | `#02041B` | Primary background. Near-black navy. |
| `--bg-panel` | `#221B52` | Card/panel background, elevated surfaces. |
| `--accent-violet` | `#553F85` | Secondary accent, borders, inactive stat bars, mid-tone UI chrome. |
| `--accent-ember` | `#F94546` | Primary accent. XP gain, level-up, active states, CTAs, streak fire. Used sparingly — this is the "system alert" color. |
| `--text-frost` | `#D6DFE6` | Primary text and icon color on dark backgrounds. |

Derived tokens (compute, don't invent new base hues):
- `--bg-void-90`: `#02041B` at 90% opacity, for modal scrims.
- `--accent-ember-glow`: `#F94546` at 40% opacity + blur, for glow/shadow effects on level-up.
- `--border-subtle`: `#553F85` at 30% opacity, for card borders and dividers.
- `--text-muted`: `#D6DFE6` at 55% opacity, for secondary/meta text.

**Banned:** Do not introduce green for "success" or yellow for "warning" — this is a 5-color system. Success/completion states use `--accent-ember`. Do not use pure white `#FFFFFF` or pure black `#000000` anywhere.

## 3. Typography

- **Display/Headers (Level, Rank, Stat names):** A geometric, slightly condensed sans with mechanical/technical character — e.g. **Chakra Petch**, **Orbitron**, or **Rajdhani** (Google Fonts, free, no licensing friction). Uppercase, wide letter-spacing (0.05–0.1em) for headers.
- **Body/UI text:** A clean, highly legible sans — **Inter** or **IBM Plex Sans**. Do not use Orbitron/Chakra Petch for body copy — it kills readability at small sizes.
- **Numerals (XP, stat values, level counters):** Tabular/monospace numerals so numbers don't jitter on update — use the display font's numeral set if tabular, otherwise **JetBrains Mono** for numbers only.

Banned defaults: no Arial, no default system-ui stack as the *primary* display font, no Roboto.

## 4. Core Visual Metaphor: The Status Window

The central UI pattern, used on the dashboard, is a **stat panel** — not a dashboard widget grid.

**Changed for v2:** stat count is now variable (2–6 per user, see PRD.md §4.1), not fixed at 4. The panel must render gracefully at any count in that range:

```
┌─────────────────────────────────────┐
│  RANK: [E / D / C / B / A / S]       │
│  LEVEL 14              [XP BAR]      │
├─────────────────────────────────────┤
│  [icon] Exercise     ████████░░  62  │
│  [icon] Study         ██████░░░░  48  │
│  [icon] Business      █████████░  81  │
│  [icon] Health        ███░░░░░░░  30  │
│  [icon] (user stat 5, if present)    │
│  [icon] (user stat 6, if present)    │
└─────────────────────────────────────┘
```

- Bars scale to fit 2–6 rows without the panel feeling sparse at 2 or cramped at 6 — use consistent row height and let panel height grow/shrink, don't compress row height to force a fixed panel size.
- Stat icon comes from the fixed Lucide icon set the user picked at creation (see §8.1) — never a free-text or uploaded image, to preserve visual consistency across users' otherwise-arbitrary stat names.
- Stat bars fill left-to-right, `--accent-violet` for the track, `--accent-ember` for the filled portion.
- On XP gain: bar fill animates over 400–600ms with an ease-out curve, plus a brief `--accent-ember-glow` pulse at the leading edge of the fill.
- On level-up: full-screen (or panel-scoped) brief flash/glow treatment + a "LEVEL UP" system-style banner. This should feel earned, not cute — restrained motion, not confetti.

### 4.1 Onboarding: Stat Setup Screen (new in v2)

A dedicated screen between signup and first dashboard view. Same visual language as the status window (dark panel, technical typography), but framed as configuration rather than progress:

- Shows 4 suggested default stats (Strength, Intellect, Business, Vitality) as pre-filled, editable rows — each with a name field and an icon picker.
- User can: accept as-is, rename any, delete any (down to the 2-minimum), add new ones (up to the 6-maximum) via an "add stat" row.
- A visible counter ("4 of 6 stats") so the cap isn't a surprise error message — communicate the boundary proactively in the UI, not just via a rejected API call.
- Icon picker: a small fixed grid of Lucide icons (sword, book, briefcase, leaf, flame, dumbbell, brain, target, etc. — curate ~12–16 options, don't expose the entire Lucide library) styled per §6.

## 5. Layout & Spacing

- 8px base spacing unit. All padding/margin values are multiples of 8 (8, 16, 24, 32, 48, 64).
- Panels: `border-radius: 4px` (sharp, technical — not soft/rounded). Banned: `border-radius` above 8px anywhere except avatar/profile images.
- Panel borders: 1px solid `--border-subtle`, optionally with a faint inset glow on active/focused panels.
- Grid: 12-column responsive grid, dashboard uses a 2-column layout on desktop (stat panel left, quest log right), single-column stack on mobile browser.

## 6. Iconography

- Line icons, 1.5–2px stroke weight, no filled/glyph-style icons except for rank badges.
- Stat category icons: sword/fist (Exercise-STR), book/brain (Study-INT), briefcase/chart (Entrepreneurship-BIZ), leaf/flame (Health-VIT). Use a consistent icon set (e.g. Lucide) — do not mix icon libraries.

## 7. Motion Principles

- Fast, purposeful, not decorative. Standard transition: 200–300ms ease-out for UI state changes, 400–600ms for XP/level events.
- No bouncing, no elastic easing, no particle confetti. This is a "system," not a party popper. Restraint = perceived seriousness of the tool.
- Streak counter: subtle ember-glow pulse on the flame icon when a streak is active (7+ days), static otherwise.

## 8. FAQ Page (new in v2)

Standard static content page — does not need the "status window" game chrome. Use the same dark palette and typography for brand consistency, but a simpler, readable layout: standard heading/paragraph/accordion pattern, not a stat panel. This is the one screen in the product where "feels like a game" should yield to "feels like a normal SaaS page a new user can scan quickly to decide if they trust the product."

## 9. What This Is Not

- Not skeuomorphic fantasy UI (no parchment textures, no medieval fonts, no "RPG inventory" clutter).
- Not a habit-tracker-with-a-coat-of-paint — no pastel colors, no rounded-friendly-app aesthetic, no illustrations of cute characters.
- Not a literal Solo Leveling UI clone — no blue-specific holographic gradient, no direct copy of the show's "System" wordmark or panel chrome. Ours is ember-red/void-navy, original.

## Open Questions (resolve before Kimi/DeepSeek build)
- Logo/wordmark for the product — none specified yet. Placeholder: text-only wordmark in display font until designed.
- Rank badge iconography (E through S rank) — resolved for v1 build as text-only badges (`[RANK E]` style); custom icon design remains a future task, not blocking.
- Product name — still "ASCEND" as a working placeholder.
