import { describe, it, expect } from 'vitest';
import {
  statLevel,
  xpForStatLevel,
  overallLevel,
  rankTier,
  getStatProgress,
  isValidStatIcon,
} from '../lib/progression';

describe('XP & Leveling Formulas (ARCHITECTURE.md §3 & AGENTS.md §4)', () => {
  it('correctly calculates statLevel matching exact example thresholds', () => {
    // Exact formula: statLevel(xp) = floor(sqrt(xp / 50)) + 1
    expect(statLevel(0)).toBe(1);
    expect(statLevel(49)).toBe(1);
    expect(statLevel(50)).toBe(2);
    expect(statLevel(51)).toBe(2);

    // Level 5 at 800 XP: sqrt(800 / 50) + 1 = sqrt(16) + 1 = 4 + 1 = 5
    expect(statLevel(799)).toBe(4);
    expect(statLevel(800)).toBe(5);
    expect(statLevel(801)).toBe(5);

    // Level 10 at 4050 XP: sqrt(4050 / 50) + 1 = sqrt(81) + 1 = 9 + 1 = 10
    expect(statLevel(4050)).toBe(10);
    expect(statLevel(4049)).toBe(9);
  });

  it('correctly calculates overall character level across variable stat counts (N = 2, 4, 6)', () => {
    // Boundary Case N = 2 (minimum allowed stats)
    expect(overallLevel([0, 0])).toBe(1);
    expect(overallLevel([800, 800])).toBe(5);
    // 1 stat at Lv 5 (800 XP), 1 stat at Lv 1 (0 XP) -> floor((5 + 1) / 2) = 3
    expect(overallLevel([800, 0])).toBe(3);

    // Default Case N = 4
    expect(overallLevel([0, 0, 0, 0])).toBe(1);
    expect(overallLevel([800, 800, 800, 800])).toBe(5);
    expect(overallLevel([800, 800, 800, 0])).toBe(4);

    // Boundary Case N = 6 (maximum allowed stats)
    expect(overallLevel([0, 0, 0, 0, 0, 0])).toBe(1);
    expect(overallLevel([800, 800, 800, 800, 800, 800])).toBe(5);
    // Five stats at level 5, one at level 1 -> (5*5 + 1) / 6 = 26 / 6 = 4.33 -> 4
    expect(overallLevel([800, 800, 800, 800, 800, 0])).toBe(4);
  });

  it('correctly assigns rank tiers based on overall level', () => {
    // Rank thresholds from ARCHITECTURE.md §3.3:
    // E: 1–9, D: 10–19, C: 20–34, B: 35–49, A: 50–69, S: 70+
    expect(rankTier(1)).toBe('E');
    expect(rankTier(9)).toBe('E');
    expect(rankTier(10)).toBe('D');
    expect(rankTier(19)).toBe('D');
    expect(rankTier(20)).toBe('C');
    expect(rankTier(34)).toBe('C');
    expect(rankTier(35)).toBe('B');
    expect(rankTier(49)).toBe('B');
    expect(rankTier(50)).toBe('A');
    expect(rankTier(69)).toBe('A');
    expect(rankTier(70)).toBe('S');
    expect(rankTier(100)).toBe('S');
  });

  it('calculates stat progress bar fill percentage smoothly', () => {
    const progress0 = getStatProgress(0);
    expect(progress0.currentLevel).toBe(1);
    expect(progress0.nextLevel).toBe(2);
    expect(progress0.progressPercent).toBe(0);

    const progress25 = getStatProgress(25);
    expect(progress25.currentLevel).toBe(1);
    expect(progress25.nextLevel).toBe(2);
    expect(progress25.progressPercent).toBe(50);

    const progress50 = getStatProgress(50);
    expect(progress50.currentLevel).toBe(2);
    expect(progress50.nextLevel).toBe(3);
    expect(progress50.progressPercent).toBe(0);
  });

  it('validates allowed Lucide icon catalog', () => {
    expect(isValidStatIcon('Dumbbell')).toBe(true);
    expect(isValidStatIcon('Brain')).toBe(true);
    expect(isValidStatIcon('Swords')).toBe(true);
    expect(isValidStatIcon('RandomMaliciousInput')).toBe(false);
  });
});
