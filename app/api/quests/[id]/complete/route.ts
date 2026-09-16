import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getLocalDateString, getYesterdayDateString, calculateNewStreak } from '@/lib/timezone';
import { statLevel, overallLevel, rankTier } from '@/lib/progression';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: questId } = await params;
  const user = await getSessionUser();
  if (!user || !user.character) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!questId) {
    return NextResponse.json({ error: 'Quest ID required.' }, { status: 400 });
  }

  // 1. Fetch quest and verify ownership (SECURITY §3)
  const quest = await prisma.quest.findUnique({
    where: { id: questId },
    include: {
      stat: true,
    },
  });

  if (!quest) return NextResponse.json({ error: 'Quest not found.' }, { status: 404 });
  if (quest.characterId !== user.character.id) {
    return NextResponse.json({ error: 'Forbidden.' }, { status: 403 });
  }
  if (!quest.active) {
    return NextResponse.json({ error: 'Quest is no longer active.' }, { status: 400 });
  }

  // Also verify stat ownership (SECURITY §3 — new in v2)
  if (quest.stat.characterId !== user.character.id) {
    return NextResponse.json({ error: 'Forbidden: stat does not belong to you.' }, { status: 403 });
  }

  // 2. Timezone-aware date resolution (ARCHITECTURE §5)
  const todayStr = getLocalDateString(user.timezone);
  const yesterdayStr = getYesterdayDateString(user.timezone);

  // 3. Idempotency check (SECURITY §4 — also enforced by DB unique constraint)
  const existingCompletion = await prisma.questCompletion.findUnique({
    where: { questId_completedDate: { questId, completedDate: todayStr } },
  });
  if (existingCompletion) {
    return NextResponse.json({ error: 'Quest already completed today.' }, { status: 409 });
  }

  // 4. XP from server record only — never from client (SECURITY §4)
  const xpAwarded = quest.xpValue;
  const statId = quest.statId;
  const characterId = user.character.id;

  try {
    const result = await prisma.$transaction(async (tx) => {
      // Re-fetch character + all active stats in transaction for consistency
      const char = await tx.character.findUnique({
        where: { id: characterId },
        include: { stats: { where: { active: true } } },
      });
      if (!char) throw new Error('Character not found.');

      // Re-fetch target stat for current XP and streak
      const targetStat = await tx.stat.findUnique({ where: { id: statId } });
      if (!targetStat) throw new Error('Stat not found.');

      const oldStatXp = targetStat.xp;
      const oldStatLevel = statLevel(oldStatXp);

      // Compute old overall level from all active stat XPs
      const allStatXps = char.stats.map((s: { xp: number }) => s.xp);
      const oldOverallLevel = overallLevel(allStatXps);
      const oldRank = rankTier(oldOverallLevel);

      // --- Record completion ---
      await tx.questCompletion.create({
        data: { questId, characterId, completedDate: todayStr },
      });

      // Deactivate one-off quests after completion
      if (!quest.recurring) {
        await tx.quest.update({ where: { id: questId }, data: { active: false } });
      }

      // --- Calculate new streaks ---
      const { newStreak: newOverallStreak } = calculateNewStreak(
        char.lastActiveDate, todayStr, yesterdayStr, char.overallStreak
      );
      const { newStreak: newStatStreak } = calculateNewStreak(
        targetStat.lastActiveDate, todayStr, yesterdayStr, targetStat.streak
      );

      // --- Update stat XP and streak ---
      const newStatXp = oldStatXp + xpAwarded;
      await tx.stat.update({
        where: { id: statId },
        data: {
          xp: newStatXp,
          streak: newStatStreak,
          lastActiveDate: todayStr,
        },
      });

      // --- Update character overall streak ---
      await tx.character.update({
        where: { id: characterId },
        data: {
          overallStreak: newOverallStreak,
          lastActiveDate: todayStr,
        },
      });

      // --- Compute new levels for response ---
      const newStatLevel = statLevel(newStatXp);
      const updatedStatXps = char.stats.map((s: { id: string; xp: number }) => s.id === statId ? newStatXp : s.xp);
      const newOverallLevel = overallLevel(updatedStatXps);
      const newRank = rankTier(newOverallLevel);

      return {
        xpGained: xpAwarded,
        newStatXp,
        newStatLevel,
        statLeveledUp: newStatLevel > oldStatLevel,
        statName: targetStat.name,
        newOverallLevel,
        oldOverallLevel,
        overallLeveledUp: newOverallLevel > oldOverallLevel,
        newRank,
        oldRank,
        rankPromoted: newRank !== oldRank,
        newOverallStreak,
        newStatStreak,
      };
    });

    return NextResponse.json(result);
  } catch (err: any) {
    if (err?.code === 'P2002') {
      // Unique constraint violation — duplicate completion attempt (race condition)
      return NextResponse.json({ error: 'Quest already completed today.' }, { status: 409 });
    }
    console.error('Quest completion error:', err);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
