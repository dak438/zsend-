import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getLocalDateString } from '@/lib/timezone';

export async function GET(req: NextRequest) {
  const user = await getSessionUser();
  if (!user || !user.character) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const range = searchParams.get('range') || '7d';

  const todayDate = new Date();
  let daysBack = 7;
  if (range === '30d') daysBack = 30;
  if (range === 'all') daysBack = 90;

  // Get user's active stats to build dynamic series
  const activeStats = await prisma.stat.findMany({
    where: { characterId: user.character.id, active: true },
    orderBy: { sortOrder: 'asc' },
  });

  // Fetch all completions with quest→stat relation
  const completions = await prisma.questCompletion.findMany({
    where: { characterId: user.character.id },
    include: {
      quest: {
        select: {
          xpValue: true,
          statId: true,
          stat: { select: { id: true, name: true, icon: true } },
        },
      },
    },
    orderBy: { completedDate: 'asc' },
  });

  // Build date range map
  const dateMap: Record<string, Record<string, number> & { total: number }> = {};
  for (let i = daysBack - 1; i >= 0; i--) {
    const d = new Date(todayDate.getTime() - i * 24 * 60 * 60 * 1000);
    const dStr = getLocalDateString(user.timezone, d);
    const entry: Record<string, number> = { total: 0 };
    activeStats.forEach(s => { entry[s.id] = 0; });
    dateMap[dStr] = entry as Record<string, number> & { total: number };
  }

  // Aggregate XP per stat per day
  for (const comp of completions) {
    const d = comp.completedDate;
    const sid = comp.quest.statId;
    if (dateMap[d] && sid) {
      if (dateMap[d][sid] !== undefined) {
        dateMap[d][sid] += comp.quest.xpValue;
      }
      dateMap[d].total += comp.quest.xpValue;
    }
  }

  // Flatten to array with stat names as keys
  const statIdToName: Record<string, string> = {};
  activeStats.forEach(s => { statIdToName[s.id] = s.name; });

  const timeline = Object.entries(dateMap).map(([date, data]) => {
    const row: Record<string, number | string> = { date, total: data.total };
    activeStats.forEach(s => {
      row[s.name] = data[s.id] || 0;
    });
    return row;
  });

  // Aggregate totals per stat
  const totals: Record<string, number> = { total: 0 };
  activeStats.forEach(s => { totals[s.name] = 0; });

  for (const comp of completions) {
    const sid = comp.quest.statId;
    const statName = statIdToName[sid];
    if (statName !== undefined) {
      totals[statName] = (totals[statName] || 0) + comp.quest.xpValue;
      totals.total += comp.quest.xpValue;
    }
  }

  return NextResponse.json({
    range,
    timeline,
    totals,
    stats: activeStats.map(s => ({ id: s.id, name: s.name, icon: s.icon })),
  });
}
