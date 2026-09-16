import { describe, it, expect } from 'vitest';
import {
  getLocalDateString,
  getYesterdayDateString,
  calculateNewStreak,
} from '../lib/timezone';

describe('Timezone & Streak Logic (ARCHITECTURE.md §4 & §5, AGENTS.md §4)', () => {
  it('correctly handles timezone boundary cases (e.g. 11:58 PM local time)', () => {
    // 11:58 PM in Asia/Kolkata on 2026-09-13
    // UTC time: 2026-09-13 18:28:00 UTC (Kolkata is UTC+5:30)
    const lateNightDate = new Date('2026-09-13T18:28:00Z');
    const localDateStr = getLocalDateString('Asia/Kolkata', lateNightDate);
    expect(localDateStr).toBe('2026-09-13');

    // Meanwhile in America/New_York (UTC-4 in daylight saving):
    // 2026-09-13 18:28 UTC is 2:28 PM on 2026-09-13
    const nyDateStr = getLocalDateString('America/New_York', lateNightDate);
    expect(nyDateStr).toBe('2026-09-13');

    // 00:02 AM in Tokyo (UTC+9):
    // 2026-09-13 18:28 UTC is 2026-09-14 03:28 AM in Tokyo
    const tokyoDateStr = getLocalDateString('Asia/Tokyo', lateNightDate);
    expect(tokyoDateStr).toBe('2026-09-14');
  });

  it('correctly maintains streak when completed again on same day', () => {
    const today = '2026-09-13';
    const yesterday = '2026-09-12';

    // Already completed today
    const res = calculateNewStreak(today, today, yesterday, 5);
    expect(res.newStreak).toBe(5);
    expect(res.updated).toBe(false);
  });

  it('increments streak when completed on consecutive day', () => {
    const today = '2026-09-13';
    const yesterday = '2026-09-12';

    // Last completed was yesterday
    const res = calculateNewStreak(yesterday, today, yesterday, 5);
    expect(res.newStreak).toBe(6);
    expect(res.updated).toBe(true);
  });

  it('resets streak to 1 if missed more than one day or first time', () => {
    const today = '2026-09-13';
    const yesterday = '2026-09-12';

    // Last completed 3 days ago
    const resOld = calculateNewStreak('2026-09-10', today, yesterday, 14);
    expect(resOld.newStreak).toBe(1);
    expect(resOld.updated).toBe(true);

    // First completion ever (lastActiveDate is null)
    const resFirst = calculateNewStreak(null, today, yesterday, 0);
    expect(resFirst.newStreak).toBe(1);
    expect(resFirst.updated).toBe(true);
  });
});
