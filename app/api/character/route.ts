import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { overallLevel, rankTier, getStatProgress } from '@/lib/progression';

export async function GET() {
  const user = await getSessionUser();
  if (!user || !user.character) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Fetch character with active stats
  const char = await prisma.character.findUnique({
    where: { id: user.character.id },
    include: {
      stats: {
        where: { active: true },
        orderBy: { sortOrder: 'asc' },
      },
    },
  });

  if (!char) {
    return NextResponse.json({ error: 'Character not found' }, { status: 404 });
  }

  // Build stat info array for all active stats
  const statInfos = char.stats.map((stat) => {
    const prog = getStatProgress(stat.xp);
    return {
      id: stat.id,
      name: stat.name,
      icon: stat.icon,
      currentLevel: prog.currentLevel,
      nextLevel: prog.nextLevel,
      currentXp: prog.currentXp,
      xpIntoCurrentLevel: prog.xpIntoCurrentLevel,
      xpRangeForLevel: prog.xpRangeForLevel,
      progressPercent: prog.progressPercent,
      streak: stat.streak,
      lastActiveDate: stat.lastActiveDate,
    };
  });

  // Dynamic overall level based on all active stat XP values (ARCHITECTURE §3.2)
  const statXps = char.stats.map((s) => s.xp);
  const curOverallLevel = overallLevel(statXps);
  const curRank = rankTier(curOverallLevel);

  return NextResponse.json({
    id: char.id,
    overallLevel: curOverallLevel,
    rank: curRank,
    overallStreak: char.overallStreak,
    lastActiveDate: char.lastActiveDate,
    hasSeenWalkthrough: char.hasSeenWalkthrough,
    stats: statInfos,
  });
}
