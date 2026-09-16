import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST() {
  const user = await getSessionUser();
  if (!user || !user.character) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  await prisma.character.update({
    where: { id: user.character.id },
    data: { hasSeenWalkthrough: true },
  });

  return NextResponse.json({ success: true });
}
