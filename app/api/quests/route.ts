import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getLocalDateString } from '@/lib/timezone';
import { z } from 'zod';

const CreateQuestSchema = z.object({
  title: z.string().min(1).max(120).transform(s => s.trim()),
  statId: z.string().min(1),
  xpValue: z.number().int().refine(v => [15, 30, 50].includes(v), { message: 'XP value must be 15, 30, or 50.' }),
  recurring: z.boolean().default(true),
});

export async function GET() {
  const user = await getSessionUser();
  if (!user || !user.character) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const todayStr = getLocalDateString(user.timezone);

  // Fetch all active quests with their stat info
  const quests = await prisma.quest.findMany({
    where: { characterId: user.character.id, active: true },
    include: {
      stat: { select: { id: true, name: true, icon: true, active: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  // Fetch today's completions for this character
  const todayCompletions = await prisma.questCompletion.findMany({
    where: { characterId: user.character.id, completedDate: todayStr },
    select: { questId: true },
  });
  const completedIds = new Set(todayCompletions.map(c => c.questId));

  // Filter out quests whose stat is now inactive (soft-deleted), include stat info
  const decoratedQuests = quests
    .filter(q => q.stat.active)
    .map(q => ({
      id: q.id,
      title: q.title,
      xpValue: q.xpValue,
      recurring: q.recurring,
      completedToday: completedIds.has(q.id),
      statId: q.stat.id,
      statName: q.stat.name,
      statIcon: q.stat.icon,
    }));

  return NextResponse.json({ todayDate: todayStr, quests: decoratedQuests });
}

export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user || !user.character) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: unknown;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const parsed = CreateQuestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
  }

  const { title, statId, xpValue, recurring } = parsed.data;

  // Verify stat ownership (SECURITY §3 — new v2 surface)
  const stat = await prisma.stat.findFirst({
    where: { id: statId, characterId: user.character.id, active: true },
  });
  if (!stat) {
    return NextResponse.json({ error: 'Stat not found or unauthorized.' }, { status: 404 });
  }

  const quest = await prisma.quest.create({
    data: {
      characterId: user.character.id,
      statId,
      title,
      xpValue,
      recurring,
      active: true,
    },
  });

  return NextResponse.json({ quest }, { status: 201 });
}
