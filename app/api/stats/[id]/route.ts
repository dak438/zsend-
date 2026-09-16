import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';
import { isValidStatIcon } from '@/lib/progression';
import { z } from 'zod';

const MIN_STATS = 2;

const patchSchema = z.object({
  name: z.string().min(1).max(30).transform(s => s.trim()).optional(),
  icon: z.string().optional(),
  sortOrder: z.number().int().min(0).optional(),
});

// Verify stat ownership helper
async function getOwnedStat(statId: string, characterId: string) {
  return prisma.stat.findFirst({
    where: { id: statId, characterId, active: true },
  });
}

// PATCH /api/stats/[id] — rename / change icon / reorder
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const user = await getSessionUser();
  if (!user || !user.character) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const stat = await getOwnedStat(id, user.character.id);
  if (!stat) {
    return NextResponse.json({ error: 'Stat not found or unauthorized' }, { status: 404 });
  }

  let body: unknown;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const parse = patchSchema.safeParse(body);
  if (!parse.success) {
    return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
  }

  const { name, icon, sortOrder } = parse.data;

  // Validate icon if being changed
  if (icon !== undefined && !isValidStatIcon(icon)) {
    return NextResponse.json({ error: 'Invalid icon key.' }, { status: 400 });
  }

  const updated = await prisma.stat.update({
    where: { id },
    data: {
      ...(name !== undefined && { name }),
      ...(icon !== undefined && { icon }),
      ...(sortOrder !== undefined && { sortOrder }),
    },
  });

  return NextResponse.json(updated);
}

// DELETE /api/stats/[id] — soft-delete (sets active: false)
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const user = await getSessionUser();
  if (!user || !user.character) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const stat = await getOwnedStat(id, user.character.id);
  if (!stat) {
    return NextResponse.json({ error: 'Stat not found or unauthorized' }, { status: 404 });
  }

  // Enforce minimum 2 active stats (ARCHITECTURE §2, SECURITY §4)
  const activeCount = await prisma.stat.count({
    where: { characterId: user.character.id, active: true },
  });

  if (activeCount <= MIN_STATS) {
    return NextResponse.json(
      { error: `Cannot delete. Minimum ${MIN_STATS} stats required.` },
      { status: 400 }
    );
  }

  // Soft-delete: set active = false so historical completions/charts remain intact
  await prisma.stat.update({
    where: { id },
    data: { active: false },
  });

  return NextResponse.json({ success: true });
}
