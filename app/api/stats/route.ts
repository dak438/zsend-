import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';
import { isValidStatIcon } from '@/lib/progression';
import { z } from 'zod';

const MAX_STATS = 6;
const MIN_STATS = 2;

const createStatSchema = z.object({
  name: z.string().min(1).max(30).transform(s => s.trim()),
  icon: z.string(),
  sortOrder: z.number().int().min(0).optional().default(0),
});

// GET /api/stats — list all active stats for current user
export async function GET(req: NextRequest) {
  const user = await getSessionUser();
  if (!user || !user.character) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const stats = await prisma.stat.findMany({
    where: { characterId: user.character.id, active: true },
    orderBy: { sortOrder: 'asc' },
  });

  return NextResponse.json({ stats });
}

// POST /api/stats — create a new custom stat
export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user || !user.character) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: unknown;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const parse = createStatSchema.safeParse(body);
  if (!parse.success) {
    return NextResponse.json({ error: 'Invalid input', details: parse.error.flatten() }, { status: 400 });
  }

  const { name, icon, sortOrder } = parse.data;

  // Validate icon
  if (!isValidStatIcon(icon)) {
    return NextResponse.json({ error: 'Invalid icon. Must be from the allowed icon set.' }, { status: 400 });
  }

  // Enforce max 6 active stats (ARCHITECTURE §2, SECURITY §4)
  const activeCount = await prisma.stat.count({
    where: { characterId: user.character.id, active: true },
  });

  if (activeCount >= MAX_STATS) {
    return NextResponse.json(
      { error: `Maximum ${MAX_STATS} stats allowed. Delete an existing stat first.` },
      { status: 400 }
    );
  }

  const stat = await prisma.stat.create({
    data: {
      characterId: user.character.id,
      name,
      icon,
      sortOrder,
    },
  });

  return NextResponse.json(stat, { status: 201 });
}
