export type RankType = 'E' | 'D' | 'C' | 'B' | 'A' | 'S';

/**
 * Exact Per-Stat Level formula specified in ARCHITECTURE.md §3.1:
 * statLevel(xp) = floor(sqrt(xp / 50)) + 1
 *
 * Threshold examples:
 * - Level 1: 0 XP
 * - Level 2: 50 XP
 * - Level 5: 800 XP
 * - Level 10: 3,600 XP
 */
export function statLevel(xp: number): number {
  if (xp < 0) return 1;
  return Math.floor(Math.sqrt(xp / 50)) + 1;
}

/**
 * Returns minimum XP required to achieve a given stat level:
 * xp = (level - 1)^2 * 50
 */
export function xpForStatLevel(level: number): number {
  if (level <= 1) return 0;
  return Math.pow(level - 1, 2) * 50;
}

/**
 * Returns detailed progress data for a stat XP value:
 * - Current level
 * - Next level
 * - XP required to reach next level from current level
 * - Percentage fill (0 to 100)
 */
export function getStatProgress(xp: number) {
  const currentLevel = statLevel(xp);
  const nextLevel = currentLevel + 1;
  const currentLevelBaseXp = xpForStatLevel(currentLevel);
  const nextLevelRequiredXp = xpForStatLevel(nextLevel);
  const xpIntoCurrentLevel = Math.max(0, xp - currentLevelBaseXp);
  const xpRangeForLevel = nextLevelRequiredXp - currentLevelBaseXp;
  const progressPercent = Math.min(100, Math.max(0, (xpIntoCurrentLevel / xpRangeForLevel) * 100));

  return {
    currentLevel,
    nextLevel,
    currentXp: xp,
    xpIntoCurrentLevel,
    xpRangeForLevel,
    progressPercent: Math.round(progressPercent * 10) / 10,
  };
}

/**
 * Exact Overall Character Level formula specified in ARCHITECTURE.md §3.2:
 * overallLevel = floor( sum(statLevel(stat.xp) for stat in character.stats) / character.stats.length )
 * Supports dynamic 2-6 custom stats.
 */
export function overallLevel(statXps: number[]): number {
  if (!statXps || statXps.length === 0) return 1;
  const totalLevels = statXps.reduce((sum, xp) => sum + statLevel(xp), 0);
  return Math.floor(totalLevels / statXps.length);
}

/**
 * Rank Tiers specified in ARCHITECTURE.md §3.3:
 * - E: 1–9
 * - D: 10–19
 * - C: 20–34
 * - B: 35–49
 * - A: 50–69
 * - S: 70+
 */
export function rankTier(level: number): RankType {
  if (level >= 70) return 'S';
  if (level >= 50) return 'A';
  if (level >= 35) return 'B';
  if (level >= 20) return 'C';
  if (level >= 10) return 'D';
  return 'E';
}

/**
 * Fixed curated Lucide icons allowed for Custom Stats (PRD §4.1, ARCHITECTURE §2, DESIGN §4.1)
 */
export const ALLOWED_STAT_ICONS = [
  'Dumbbell',
  'Swords',
  'Brain',
  'BookOpen',
  'Briefcase',
  'TrendingUp',
  'HeartPulse',
  'Flame',
  'Zap',
  'Target',
  'Shield',
  'Compass',
  'Code',
  'Sparkles',
  'Cpu',
  'Medal',
] as const;

export type AllowedStatIcon = typeof ALLOWED_STAT_ICONS[number];

export function isValidStatIcon(icon: string): icon is AllowedStatIcon {
  return ALLOWED_STAT_ICONS.includes(icon as AllowedStatIcon);
}

/**
 * 4 Suggested default stats for new user onboarding (PRD §4.1)
 */
export const DEFAULT_SUGGESTED_STATS: Array<{
  name: string;
  icon: AllowedStatIcon;
  sortOrder: number;
  description: string;
}> = [
    {
      name: 'Strength',
      icon: 'Dumbbell',
      sortOrder: 0,
      description: 'Physical training, workouts, mobility & discipline',
    },
    {
      name: 'Intellect',
      icon: 'Brain',
      sortOrder: 1,
      description: 'Deep work, study, reading & knowledge acquisition',
    },
    {
      name: 'Business',
      icon: 'Briefcase',
      sortOrder: 2,
      description: 'Entrepreneurship, coding, career & financial execution',
    },
    {
      name: 'Vitality',
      icon: 'HeartPulse',
      sortOrder: 3,
      description: 'Sleep, recovery, nutrition, hydration & wellness',
    },
  ];
