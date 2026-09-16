/**
 * Timezone & Streak utilities per ARCHITECTURE.md §4 & §5
 *
 * Ensures all "day boundary" logic (daily quest reset, streak calculation)
 * uses the user's stored timezone, avoiding issues where late-night completions
 * (e.g. 11:58 PM local time) roll into the incorrect day.
 */

/**
 * Returns "YYYY-MM-DD" for a given date in the specified IANA timezone.
 * Falls back to "Asia/Kolkata" or UTC if an invalid timezone is provided.
 */
export function getLocalDateString(timezone: string, date: Date = new Date()): string {
  try {
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    return formatter.format(date); // en-CA produces YYYY-MM-DD format
  } catch {
    // Fallback if timezone string is invalid
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Kolkata',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    return formatter.format(date);
  }
}

/**
 * Computes yesterday's date string "YYYY-MM-DD" relative to the current local time in that timezone.
 */
export function getYesterdayDateString(timezone: string, date: Date = new Date()): string {
  // Move back 24 hours in local time
  const yesterday = new Date(date.getTime() - 24 * 60 * 60 * 1000);
  return getLocalDateString(timezone, yesterday);
}

/**
 * Evaluates the new streak value based on the user's last active date string.
 *
 * - If lastActiveDate === today: already completed today, streak remains unchanged.
 * - If lastActiveDate === yesterday: consecutive day completion, streak increments by 1.
 * - Otherwise (null or older than yesterday): streak resets to 1.
 */
export function calculateNewStreak(
  lastActiveDate: string | null,
  todayStr: string,
  yesterdayStr: string,
  currentStreak: number
): { newStreak: number; updated: boolean } {
  if (lastActiveDate === todayStr) {
    // Already marked active today; streak already counted
    return { newStreak: Math.max(1, currentStreak), updated: false };
  }

  if (lastActiveDate === yesterdayStr) {
    // Consecutive day
    return { newStreak: currentStreak + 1, updated: true };
  }

  // Missed day or first completion ever -> reset to 1
  return { newStreak: 1, updated: true };
}
